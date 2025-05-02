import 'dotenv/config';

import os from "os";
import { join } from "path";
import { prettyJson } from "@agentic-profile/common";
import { postJson } from "@agentic-profile/auth";

(async ()=>{

    try {
        // create account # 2, which will be the account represented/billed for user/2/agent-chats
        const payload = {
            options: { uid: 2 },        // force to uid=2
            fields: {
                name: "Eric Portman",   // #2 in the Prisoner ;)
                credit: 10              // $10
            }
        };
        const config = {
            headers: {
                Authorization: `Bearer ${process.env.ADMIN_TOKEN}`,
            },
        };

        const port = process.env.PORT || 3003;
        const { data } = await postJson(
            `http://localhost:${port}/accounts`,
            payload,
            config
        );

        console.log( "Created local account uid=2 to act as peer in agentic chat", prettyJson( data ));
    } catch (error) {
        console.error( "Failed to create global profile", error );
    }
})();
