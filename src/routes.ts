import express, {
    Response,
    Request
} from "express";
/*
import {
    ChatHooks,
    ChatMessageEnvelope
} from "@agentic-profile/chat";
*/
import {
    agentHooks,
    CommonHooks,
    prettyJson
} from "@agentic-profile/common";
import {
    asyncHandler,
    baseUrl,
    isAdmin,
    //resolveAgentSession
} from "@agentic-profile/express-common";

import { CreateAccount } from "./storage/models.js";


export interface Status {
    name?: string,
    version?: number[]
}

export interface CommonRouteOptions {
    status?: Status,
}

export function commonRoutes( { status = {} }: CommonRouteOptions ) {
    var router = express.Router();

    // simple status page, also used for server health
    const runningSince = new Date();
    router.get( "/status", function( req: Request, res: Response ) {
        res.json({ name:"Agentic Profile Node Service", version:[1,0,0], ...status, started:runningSince, url:baseUrl(req) }); 
    });

    router.get( "/storage", asyncHandler( async (req: Request, res: Response) => {
        if( !isAdmin( req ) )
            throw new Error( "/storage only available to admins" );

        const data = await agentHooks<CommonHooks>().storage.dump();
        res.status(200)
            .set('Content-Type', 'application/json')
            .send( prettyJson(data) ); // make easier to read ;)
    }));

    router.post( "/accounts", asyncHandler( async (req: Request, res: Response) => {
        if( !isAdmin( req ) )
            throw new Error( "POST /accounts only available to admins" );

        const { storage } = agentHooks<Storage>();
        const account = await storage.createAccount( req.body as CreateAccount );
        res.json({ account });
    }));

    /* For a third-party agent to post a message to the agent of the given uid
    // If no authorization is provided, or it is expired, then a challenge is issued
    router.put( "/users/:uid/agent-chats", asyncHandler( async (req: Request, res: Response) => {
        const { uid } = req.params;

        const agentSession = await resolveAgentSession( req, res );
        if( !agentSession )
            // A 401 has been issued with a challenge, or an auth error has been thrown
            return;

        const result = await agentHooks<ChatHooks>().handleAgentChatMessage({
            uid,
            envelope: req.body as ChatMessageEnvelope, 
            agentSession
        });
        res.json( result );
    }));
    */

    console.log( "Open routes are ready" );
    return router;
}