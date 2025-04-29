import 'dotenv/config';
import express from "express";

import { coderAgent } from "./dist/a2a/agents/coder/index.js";
import { A2AServer } from "./dist/a2a/server/server.js";

/*
import {
    handleAgentChatMessage
//} from "./dist/chat/simple.js";
} from "@agentic-profile/chat";
*/
import {
    setAgentHooks
} from "@agentic-profile/common";
import { app } from "@agentic-profile/express-common";

import {
    ensureCreditBalance,
    //generateChatReply,
    InMemoryStorage,
    commonRoutes
} from './dist/index.js';

import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use("/", express.static(
    join(__dirname, "www")
));

const port = process.env.PORT || 3003;
const TESTING_DID_PATH = `web:localhost%3A${port}:iam`;
setAgentHooks({
    //generateChatReply,
    storage: new InMemoryStorage(),
    createUserAgentDid: (uid) => {
        console.log( "Using deprecated createUserAgentDid()", uid );
        return `did:${process.env.AP_DID_PATH ?? TESTING_DID_PATH}:${uid}`
    },
    resolveUserAgenticProfileDid: async (uid) => {
        return `did:${process.env.AP_DID_PATH ?? TESTING_DID_PATH}:${uid}`  // document path with no fragment   
    },
    ensureCreditBalance,
    //handleAgentChatMessage
});

app.use("/", commonRoutes({
    status: { name: "Testing Agentic Profile with A2A" }
}));

// Mount A2A agent
const a2aService = new A2AServer( coderAgent, {} );
app.use("/", a2aService.routes() );

app.listen(port, () => {
    console.info(`Agentic Profile Express listening on http://localhost:${port}`);
});