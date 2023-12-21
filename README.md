# README

Building a grants DAO based on the [ExecutorDAO](https://github.com/MarvinJanssen/executor-dao/tree/main/contracts), as part of the Hiro Hacks Hackathon.

:warning: This is mostly a proof-of-concept of some of the key concepts behind implementing a DAO with a web interface on Stacks. Code was written in a rush due to time contraints, so it's obviously not for use in production.

In this repo, you'll find the set of smart contracts for the Grants DAO, an API server and a front-end server, to support interactions with the DAO. There's a single use case implemented: creating and submitting a proposal for appreciation via an UI.

To have this project running on your own environment, you'll need two env variables:

```
AUTH_TOKEN=
SUPABASE_KEY=
```

There's support for .env files built-in.

It is also a requirement that you setup a database on Supabase (schema provided in the [supabase schema file](./supabase-schema.sql)) and a chainhook, based on the example [chainhook](./chainhook.json).

There aren't any kind of authentication checks implemented. For a POC of how authentication could look like, have a look at [the friend.tech clone](https://github.com/vicnicius/friend-tech-stx) that was also built as part of the hackathon.

To run the project:

1. Start the back-end server:

```
yarn server:start
```

2. Start the front-end server in local dev mode:

```
yarn dev
```

3. Expose the back-end server externally and setup a chainhook like in the example, replacing the host with your own.

That's it.

To test the example use case:

1. Navigate to the application and connect your wallet.
2. Go to Submit Proposal, fill in the details and submit; This will deploy a new proposal-contract to testnet.
3. After your proposal was deployed, you should be able to see it in the /proposals page. There's a functionality to refresh the proposal status to check when it's confirmed in an anchor block.
4. You can submit a confirmed proposal for appreciation from the UI as well.
5. The chainhook we setup should be able to listen and update proposals based on events, but that bit is missing due to lack of time.
