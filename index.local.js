import 'dotenv/config';
import express from "express";

import { handleAgentChatMessage } from "@agentic-profile/chat";
import {
    agentHooks,
    setAgentHooks
} from "@agentic-profile/common";
import {
    app,
    asyncHandler,
    resolveAgentSession as agentSessionResolver
} from "@agentic-profile/express-common";

import { coderAgent } from "./dist/a2a/agents/coder/index.js";
import { A2AService } from "./dist/a2a/service/service.js";
import { errorHandler } from "./dist/a2a/service/error.js";
import {
    ensureCreditBalance,
    generateChatReply,
    InMemoryStorage,
    commonRoutes
} from './dist/index.js';

// --- Expose /www directory for static files ---
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use("/", express.static(
    join(__dirname, "www")
));

// --- Set up Agentic Profile hooks ---
const port = process.env.PORT || 3003;
const TESTING_DID_PATH = `web:localhost%3A${port}:iam`;
setAgentHooks({
    generateChatReply,
    storage: new InMemoryStorage(),
    createUserAgentDid: (uid) => {
        console.log( "Using deprecated createUserAgentDid()", uid );
        return `did:${process.env.AP_DID_PATH ?? TESTING_DID_PATH}:${uid}`
    },
    resolveUserAgenticProfileDid: async (uid) => {
        return `did:${process.env.AP_DID_PATH ?? TESTING_DID_PATH}:${uid}`  // document path with no fragment   
    },
    ensureCreditBalance,
    handleAgentChatMessage
});

// --- Useful common endpoints like server status, storage debugging ---
app.use("/", commonRoutes({
    status: { name: "Testing Agentic Profile with A2A" }
}));


//==== Example 1: A2A agent with no authentication ====
const a2aService1 = new A2AService( coderAgent, {} );
app.use("/agents/coder", a2aService1.routes() );


//==== Example 2: A2A agent with authentication ====
const a2aService2 = new A2AService( coderAgent, { agentSessionResolver } );
app.use("/users/:uid/coder", a2aService2.routes() );


// Basic error handler for a2a services
app.use( errorHandler );


//==== Example 3: Agentic Profile REST agent with authentication ====
app.put( "/users/:uid/agent-chats", asyncHandler( async (req, res ) => {
    const { uid } = req.params;

    const agentSession = await agentSessionResolver( req, res );
    if( !agentSession )
        // A 401 has been issued with a challenge, or an auth Error has been thrown
        return;

    const result = await agentHooks().handleAgentChatMessage({
        uid,
        envelope: req.body, // as ChatMessageEnvelope
        agentSession
    });
    res.json( result );
}));


app.listen(port, () => {
    console.info(`Agentic Profile Express listening on http://localhost:${port}`);
});