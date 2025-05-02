# Demonstration of Enhancing A2A with the Agentic Profile

The Agentic Profile is a thin layer over A2A, MCP, and other HTTP protocols, and provides:

- Globally unique - user and business scoped - agent identity
- Decentralized authentication

The A2A service, agent, and command line interface were derived from Googles code: https://github.com/google/A2A.git


## Why do we need user and business scoped agent identity?

Identity is essential for digital communication between parties because it establishes trust, accountability, and context — without which meaningful, secure interaction is nearly impossible.

Current agent protocols focus on individual agent identity, which while accomplishing the communications goal, does not establish trust and accountability which derive from clear relationships with the people or business the agent represents.

For example, you trust an employee of a bank because they are in the bank building, behind the counter, and wearing a company nametag.


### How does the Agentic Profile solve this?

The Agentic Profile provides the digital equivalent of how we judge employees, by using a verifiable document provided by the person or business, and declaring all the agents that represent the person or business.

For example the business at the DNS domain matchwise.ai can have a "chat-agent", which combined becomes matchwise.ai#chat-agent.  [Concensys](https://consensys.io/) helped create the [DID specification](https://www.w3.org/TR/did-1.0/) which has a URI format that results in did:web:matchwise.ai#chat-agent.  DID documents (what you find using the did:web:matchwise.ai URI) provides a list of HTTP services, which are equivalent to agents.  The Agentic Profile simply lists the agents in the DID document services. 

With the Agentic Profile, the person or business is the first class citizen, and all the agents that represent them are clearly defined.


### How does A2A fit in?

Very easily.  For each DID document service/agent, we specify the "type" as "A2A" and use the serviceEndpoint to reference the agent.json file.


## Why do we need decentralized authentication?

Most agent authentication is done using shared keys and HTTP Authorization headers.  While this is easy to implement, it is very insecure.

Another popular option is OAuth, but that has another host of problems including dramatically increasing the attack surface and the challenges of making sure both agents agree on the same authentication service provider.


### How does the Agentic Profile solve this?

Public key cryptography, which is used extensively for internet communication, is ideal for decentralized authentication.  It is very easy to publish an agents public key via the Agentic Profile, and then the agent can use its secret key to authenticate.  JSON Web Tokens + EdDSA are mature and widely used standards, and the ones Agentic Profile uses.

With great options like JWT+EdDSA, centralized authentication systems like OAuth are unecessary.


## Quick overview of this project

This project provides:

- a Node service using Express to demonstrate two A2A agents, and one REST agent
- a command line interface (CLI) to interact with the A2A agents
- scripts to interact with the REST agent

The server code has the following parts:

- a2a/
    - agents/
        - coder/ - An A2A programming assistant/agent
    - client/
        - card - Agent Card utilities, including a resolver
        - client - A2A client
        - json-rpc - JSON RPC implementation with Agentic Profile support
    - service/ - Express A2A endpoint handler
    - cli
- chat/ - A REST chat agent that uses the Agentic Profile
- storage/ - In Memory implementation of the storage interface
- billing - Supports billing of users for agent use
- routes - Provides useful endpoints like /status and /storage for debugging 


## Quickstart

The easiest way to run this demo is locally.

1. Requirements.  Make sure these are installed:

    - [git](https://github.com/git-guides/install-git)
    - [yarn](https://yarnpkg.com/getting-started/install)
    - [node](https://nodejs.org/en/download)

2. From the shell, clone this repository and switch to the project directory.

    ```bash
    git clone git@github.com:agentic-profile/agentic-profile-express-a2a.git
    cd agentic-profile-express-a2a
    ```

3. Download dependencies

    ```bash
    yarn
    ```

4. Run the server

    ```bash
    yarn dev
    ```

## Finish Configuring the Node Server

1. Copy the file example.env to .env

    ```bash
    $ cp example.env .env
    ```

2. Edit the .env file.

    To enable admin features.  Uncomment ADMIN_TOKEN and choose a password, for example:

    ```
    ADMIN_TOKEN=<yoursecret>
    ```

    Add your Gemini API key (required to use the coder A2A agent).  [Get a Gemini API key](https://ai.google.dev/gemini-api/docs/api-key)

    ```
    GEMINI_API_KEY=<your Gemini API key>
    ```

3. Restart the server

    ```
    yarn dev
    ```

4. Make sure an admin feature works.  From the command line try:

    ```
    $ curl -H "Authorization: Bearer yoursecret" http://localhost:3003/storage
    ```

    Or from the browser:

    http://localhost:3003/storage?auth=yoursecret


## Test the different A2A agents

1. Make sure the server is started:

    ```
    yarn dev
    ```

2. Fron a different terminal window, start the A2A client with the default agent that doesnt require authentication

    ```bash
    yarn a2a:cli
    ```

3. Type in a prompt for the A2A client, such as "Write a program that says Hello world!"

4. For each of the following examples, open a new terminal window. For examples with authentication skip to step #5

    Start the A2A client using the agent card, but still no authentication

    ```bash
    yarn a2a:cli -p http://localhost:3003/agents/coder/
    ```

    Start the A2A client using the Agentic Profile, but still no authentication

    ```bash
    yarn a2a:cli -p did:web:localhost%3A3003:agents:coder#a2a-coder
    ```

    Start the A2A client with the well-known agent and no authentication

    ```bash
    yarn a2a:cli -p http://localhost:3003/
    ```

    Start the A2A client with the well-known agentic profile and no authentication

    ```bash
    yarn a2a:cli -p did:web:localhost%3A3003#a2a-coder
    ```

5. In order to use authentication, you must create an agentic profile and keys to authenticate with.

    ```
    node scripts/create-global-agentic-profile
    ```

    The above script creates a new agentic profile on the test.agenticprofile.ai server, and also stores
    a copy in your filesystem at ~/.agentic/iam/global-me

6. Examples using Agentic Profile authentication

    Start the A2A client with an Agentic Profile and authentication

    ```bash
    yarn a2a:cli -p did:web:localhost%3A3003:users:2:coder#a2a-coder -u "#agent-chat"
    ```

    Start the A2A client with the well-known Agentic Profile and authentication

    ```bash
    yarn a2a:cli -i "global-me" -p did:web:localhost%3A3003#a2a-coder
    ```


## Testing a global Agentic Profile with a locally running agentic chat service (Not using A2A)

A global agentic profile is available from anywhere on the internet.  The "did:web" variant DID documents are
available via HTTPS which is used in the example below.  We use the "test.agenticprofile.ai" domain for
hosting temporary profiles for teating.


1. Make sure you have finished configuring the Node Server from above...

2. Make sure the local server is started at http://localhost:3003

    ```
    yarn dev
    ```

3. Create a local user (which will be charged for their agent use!)

    ```
    node scripts/create-local-user-2
    ```

4. Create a global demo agentic profile with public and private keys

    ```
    node scripts/create-global-agentic-profile
    ```

    You can review the results in your ~/.agentic/iam/global-me directory...

5. Use CURL to (try to) send a chat message:

    ```
    curl -X PUT http://localhost:3003/users/2/agent-chats
    ```

    Since you did not provide an Agentic authorization token, the server responded with a challenge similar to:

    {
        "type": "agentic-challenge/0.3",
        "challenge": {
            "id": 1,
            "secret": "sA3xFXBp-9v8I0syAhcWcglgoRrTmj2UAiRmFpzpzbw"
        }
    }

6. Send a chat message.  This script automatically handles the challenge and generates an authorization token from the global agentic profile in step #4.

    ```
    node scripts/send-chat-message
    ```
