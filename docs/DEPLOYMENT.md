# Deploying the contract

There's no upgrade mechanism on `ajo-circle` — redeploying always produces a
**new contract id**, and every circle that existed under the old id is
orphaned (still queryable at the old id if you keep the RPC/network the
same, but the frontend needs to point at the new one to create or interact
with anything new). Budget for that before redeploying against real usage.

## Prerequisites

- [`stellar` CLI](https://developers.stellar.org/docs/tools/developer-tools) installed
- A funded Stellar account to deploy from (testnet: fund via
  [the Stellar Lab](https://lab.stellar.org/account/fund?network=testnet)
  or `stellar keys generate --fund`)

## Build and test first

```bash
cd contracts
cargo test --workspace
cd ajo-circle
stellar contract build
```

Produces `contracts/target/wasm32v1-none/release/ajo_circle.wasm`.

## Deploy

```bash
stellar keys generate deployer --network testnet --fund

stellar contract deploy \
  --wasm target/wasm32v1-none/release/ajo_circle.wasm \
  --source deployer \
  --network testnet
```

This prints the new contract id.

## Point the frontend at it

Set `NEXT_PUBLIC_AJO_CONTRACT_ID` in `frontend/.env.local` to the new id,
then restart the dev server (`rm -rf frontend/.next` first if it was
already running — Next.js can serve a stale build with the old env value
baked in otherwise).

For mainnet, also update `NEXT_PUBLIC_STELLAR_RPC_URL` and
`NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE`, and `NEXT_PUBLIC_NATIVE_TOKEN_ID`
to mainnet's native XLM SAC address — it differs from testnet's.

## If `stellar keys ... --fund` or `stellar contract deploy` fail to reach the network

Some sandboxed/containerized environments have a broken TLS trust store for
compiled Rust binaries specifically, while `fetch`/`curl` from other
runtimes on the same machine work fine against the same hosts. If
`stellar`'s own network calls fail with a generic connection error but
`curl https://soroban-testnet.stellar.org` (or the equivalent in Node)
succeeds, that's almost certainly what's happening — it's an environment
quirk, not a problem with the contract or the deploy target.

Workaround: do the upload + create-contract calls directly against RPC with
`@stellar/stellar-sdk` instead of going through the `stellar` binary:

```js
import fs from "node:fs";
import { Keypair, TransactionBuilder, Networks, BASE_FEE, Operation, rpc, Address } from "@stellar/stellar-sdk";

const server = new rpc.Server("https://soroban-testnet.stellar.org");
const kp = Keypair.fromSecret(DEPLOYER_SECRET);

async function submit(tx) {
  const sim = await server.simulateTransaction(tx);
  const prepared = rpc.assembleTransaction(tx, sim).build();
  prepared.sign(kp);
  const sent = await server.sendTransaction(prepared);
  let result = await server.getTransaction(sent.hash);
  while (result.status === "NOT_FOUND") {
    await new Promise((r) => setTimeout(r, 1500));
    result = await server.getTransaction(sent.hash);
  }
  return result;
}

const account = await server.getAccount(kp.publicKey());
const wasm = fs.readFileSync("target/wasm32v1-none/release/ajo_circle.wasm");

const uploadTx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: Networks.TESTNET })
  .addOperation(Operation.uploadContractWasm({ wasm }))
  .setTimeout(60)
  .build();
const { returnValue: wasmHashScVal } = await submit(uploadTx);
const wasmHash = wasmHashScVal.bytes();

const account2 = await server.getAccount(kp.publicKey());
const createTx = new TransactionBuilder(account2, { fee: BASE_FEE, networkPassphrase: Networks.TESTNET })
  .addOperation(Operation.createCustomContract({ address: new Address(kp.publicKey()), wasmHash }))
  .setTimeout(60)
  .build();
const { returnValue: addressScVal } = await submit(createTx);
console.log("CONTRACT_ID:", Address.fromScAddress(addressScVal.address()).toString());
```

This is exactly what `stellar contract deploy` does under the hood — same
two operations, same network calls — just issued from a runtime whose TLS
stack happens to work in that environment. It's not a different or less
trustworthy deployment path, only a different HTTP client making the same
requests.
