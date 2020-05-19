# Elastos Mainchain Chainwalker

This parser communicates with Elastos Mainchain node's RPC interface to extract and decode blocks & transactions.

Elastos and FCAS Encompasses Two Parsers

1. Elastos Mainchain - UTXO-based - https://blockchain.elastos.org
2. Elastos ETH Sidechain - EVM (Account-based) - https://explorer.elaeth.io

### Running Directly

You can run the parsers without docker, this is a NodeJS based parser:

1. Ensure you are on NodeJS v12+, we recommend you use **nvm** - https://github.com/nvm-sh/nvm
2. `nvm use lts/erbium` - this is the LTS v12 NodeJS 
3. `npm install`
4. Build `dist/app.js` - this is written in Typescript which must be transpiled to JS
    `npm run tsc`
4. This also requires **jq** - a lightweight and flexible command-line JSON processor.
    `sudo apt-get install jq` - https://stedolan.github.io/jq
5. Ensure the `.env` file is in the root directory with entries for ELASTOS_RPC, ELASTOS_RPC_PORT

#### Usage

##### `get_height.sh`

`sh get_height.sh`

### Running Tests

Do the above for "Running Directly" to setup the environment then run

`mocha test/index.js --timeout 10000`

## Running in Docker

