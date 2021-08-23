# Hashswap Stable Coin (HUSD)

`hash-stable` is a mono repo which is solely dedicated to support the stable coin **HUSD** part of the Hashswap project.

## Core
The infrastructure is based on two node servers, the first (reference: **EXT**) is setup using the [External Adapter](https://github.com/thodges-gh/CL-EA-NodeJS-Template) package (dependent on [Chainlink-JS](https://github.com/smartcontractkit/chainlink)) which enables requesting an currency exchange API which feeds to a requester. The second (reference: **INT**) is a [event log subscription](https://dev.zilliqa.com/docs/dev/dev-tools-websockets/#subscribe-event-log) using [Zilliqa-JS](https://github.com/Zilliqa/Zilliqa-JavaScript-Library).

## Method
For each currency conversion, the *HUSD* contract emits an event which triggers the request within the subscription server **EXT** fetching the external rate *zilUsd*.This is followed by computation of *hashZil* which is done by computing the price from the (ZIL, HASH) pool in [ZilSwap (testnet)](https://viewblock.io/zilliqa/address/zil1rf3dm8yykryffr94rlrxfws58earfxzu5lw792?network=testnet) 

The stable coin is achieved by converting `HASH -> HUSD` computed as `HUSD = HASH * (hashZil * zilUSD)` (for `HUSD -> HASH` conversion it is simply divided by the rate)

* **hashZil** is  price of 1 HASH expressed in ZIL.
* **ZilUsd**  is  price of 1 ZIL expressed in USD.

## Operation
* `deploy.js` deploys the contracts HASH and HUSD on the testnet and then pool is setup on [ZilSwap (testnet)](https://viewblock.io/zilliqa/address/zil1rf3dm8yykryffr94rlrxfws58earfxzu5lw792?network=testnet) by using `IncreaseAllowance` and `AddLiquidity` mechanisms of HASH and ZILSWAP respectively.

* `yarn` and `yarn start` are used to start up the **EXT** server.

* `node subscriber.js` is used to start the **INT** server. This completes the setup.

* Any participant can then convert `HASH -> HUSD` by transferring HASH to HUSD account using the HASH contract `Transfer` transition. This sends a request to HUSD contract which triggers the process described in the *Method* section above.

* similarly `HUSD -> HASH` conversion can be done by calling the HUSD contract `Transfer` transition and transferring to HASH.



