import {
    AgenticProfile,
    pruneFragmentId,
    webDidToUrl
} from "@agentic-profile/common";
import { getJson } from "@agentic-profile/auth";

import { AgentCard } from "../schema.js";
//import { RpcError } from "./json-rpc.js";

export interface AgentContext {
    profileUrl?: string,
    agenticProfile?: AgenticProfile,
    agentCardUrl: string,
    agentCard: AgentCard  
}

/*

export interface AgentCardOptions {
    fetchImpl: typeof fetch
} 
export interface AgentCardResult {
	card: AgentCard,
	cardUrl: string
}
*/

/*
 * Fetch the agent card
 *  - if URL is DID protocol, fetch agentic profile, then resolve agent from service[]
 *  - if URL is HTTP/HTTPS then fetch agent card from:
 *      - existing URL if it ends with "/agent.json"
 *      - /.well-known/agent.json if the URL pathname is "/"
 *      - the agent.json in the same directory as the agent endpoint
 */
export async function resolveAgent( agentUrl: string ): Promise<AgentContext> {
    let profileUrl: string | undefined;
    let agenticProfile: AgenticProfile | undefined;

    let url = new URL( agentUrl );
    if( url.protocol === "did" ) {
        // ensure we have the fragment id to find te agent
        const { fragmentId } = pruneFragmentId( agentUrl );
        if( !fragmentId )
            throw new Error(`Agentic profile DID is missing the fragment to resolve the agent ${agentUrl}`);

        // fetch the DID document/agentic profile
        profileUrl = webDidToUrl( agentUrl );
        ({ data: agenticProfile } = await getJson( profileUrl! ));

        // find agent
        const agent = agenticProfile!.service?.find(e=>e.id === fragmentId);
        if( !agent )
            throw new Error(`Failed to find agent ${fragmentId} from agentic profile at ${profileUrl}`);
        if( agent.type?.toLowerCase() !== "A2A" )
            throw new Error(`Agent type is not A2A, instead it is ${agent.type}`);

        agentUrl = Array.isArray( agent.serviceEndpoint ) ? agent.serviceEndpoint[0] as string : agent.serviceEndpoint as string;
        if( !agentUrl )
            throw new Error(`Agent ${fragmentId} from ${profileUrl} is missing the serviceEndpoint`);
        url = new URL( agentUrl );
    }

    // fixup agentUrl for agent card
    let agentCardUrl: string;
    if( url.pathname.endsWith("/agent.json") ) {
        agentCardUrl = url.toString();
    } else if( url.pathname === "/" ) {
        agentCardUrl = new URL("/.well-known/agent.json", agentUrl).toString();    
    } else {
        // try to find agent card in same directory as agent service endpoint
        agentCardUrl = new URL("agent.json",agentUrl).toString();
    }

    const { data: agentCard } = await getJson( agentCardUrl );

    return {
        profileUrl,
        agenticProfile,
        agentCardUrl,
        agentCard
    };
}

/**
 * Retrieves the AgentCard.
 * Note: The standard A2A protocol doesn't define a JSON-RPC method for this.
 * This implementation fetches it from a hypothetical '/agent-card' endpoint
 * on the same server, assuming it's provided out-of-band.
 * Caches the result after the first successful fetch.
 *
// @ts-ignore - Protocol defines sync, but client needs async fetch.
export async function agentCard( url: string, { fetchImpl = fetch }: AgentCardOptions ): Promise<AgentCardResult> {
	/*
    if (this.cachedAgentCard) {
        return this.cachedAgentCard;
    }*

    // Assumption: Server exposes the card at a simple GET endpoint.
    // Adjust this URL/method if the server provides the card differently.
    const cardUrl = `${url}/agent.json`; // Or just this.baseUrl if served at root

    try {
        const response = await fetchImpl(cardUrl, {
            method: "GET",
            headers: {
                Accept: "application/json",
            },
        });

        if (!response.ok) {
            throw new Error(
                `HTTP error ${response.status} fetching agent card from ${cardUrl}: ${response.statusText}`
            );
        }

        const card = await response.json();
        // TODO: Add validation using a Zod schema or similar if available
        //this.cachedAgentCard = card as AgentCard;
        return {
        	card,
        	cardUrl
        }
    } catch (error) {
        console.error("Failed to fetch or parse agent card:", error);
        throw new RpcError(
            -32603, // Use literal value for ErrorCodeInternalError
            `Could not retrieve agent card: ${
                error instanceof Error ? error.message : String(error)
            }`,
            error
        );
    }
}
*/

/**
 * Optional: Checks if the server likely supports optional methods based on agent card.
 * This is a client-side heuristic and might not be perfectly accurate.
 * @param card Agent card to check
 * @param capability The capability to check (e.g., 'streaming', 'pushNotifications').
 * @returns A promise resolving to true if the capability is likely supported.
 */
export function supports( card: AgentCard, capability: "streaming" | "pushNotifications"): boolean {
    switch (capability) {
        // Check boolean flags directly on the capabilities object
        case "streaming":
            return !!card.capabilities?.streaming; // Use optional chaining and boolean conversion
        case "pushNotifications":
            return !!card.capabilities?.pushNotifications; // Use optional chaining and boolean conversion
        default:
            return false;
    }
}