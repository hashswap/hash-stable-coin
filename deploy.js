const { BN, Long, bytes, units } = require('@zilliqa-js/util');
const { Zilliqa } = require('@zilliqa-js/zilliqa');
const {
  toBech32Address,
  getAddressFromPrivateKey,
} = require('@zilliqa-js/crypto');

const zilliqa = new Zilliqa('https://dev-api.zilliqa.com');

// These are set by the core protocol, and may vary per-chain.
// You can manually pack the bytes according to chain id and msg version.
// For more information: https://apidocs.zilliqa.com/?shell#getnetworkid

const chainId = 333; // chainId of the developer testnet
const msgVersion = 1; // current msgVersion
const VERSION = bytes.pack(chainId, msgVersion);

// Populate the wallet with an account
const privateKey =
  '5d99e6eb161b5a693934dacc6bd54d87d89bbb43ebda9d95f9cadcd322fcc862';

zilliqa.wallet.addByPrivateKey(privateKey);

const address = getAddressFromPrivateKey(privateKey);
console.log(`My account address is: ${address}`);
console.log(`My account bech32 address is: ${toBech32Address(address)}`);


const fs = require('fs');
// read a file and return contents as a string
function read(f)
{
  t = fs.readFileSync(f, 'utf8', (err,txt) => {
    if (err) throw err;
  });
  return t;
}

async function testBlockchain() {
  try {
    var m = JSON.parse(fs.readFileSync('contracts.json').toString());

    // Get Balance
    const balance = await zilliqa.blockchain.getBalance(address);
    // Get Minimum Gas Price from blockchain
    const minGasPrice = await zilliqa.blockchain.getMinimumGasPrice();

    // Account balance (See note 1)
    console.log(`Your account balance is:`);
    console.log(balance.result);
    console.log(`Current Minimum Gas Price: ${minGasPrice.result}`);
    const myGasPrice = units.toQa('3000', units.Units.Li); // Gas Price that will be used by all transactions
    console.log(`My Gas Price ${myGasPrice.toString()}`);
    const isGasSufficient = myGasPrice.gte(new BN(minGasPrice.result)); // Checks if your gas price is less than the minimum gas price
    console.log(`Is the gas price sufficient? ${isGasSufficient}`);


      //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Deploy Hash ---------------------------------------------------------------------------
    console.log('\n');
    console.log('Deploying Hash');

    // read file and replace  address
    const code2 = read('./scillacodes/Hash.scilla');
    // init
    const tokenName = 'Hash';
    const symbol = 'HASH';
    const decimals = '10';
    const init_supply = '1000000000000000000';

    const init2 =  [
        // this parameter is mandatory for all init arrays
        {
          vname: '_scilla_version',
          type: 'Uint32',
          value: '0',
        },
        {
          vname: 'contract_owner',
          type: 'ByStr20',
          value: `${address}`,
        },
        {
            vname: 'name',
            type: 'String',
            value: `${tokenName}`,
        },
        {
            vname: 'symbol',
            type: 'String',
            value: `${symbol}`,
        },
        {
            vname: 'decimals',
            type: 'Uint32',
            value: `${decimals}`,
        },
        {
            vname: 'init_supply',
            type: 'Uint128',
            value: `${init_supply}`,
        },                 
      ];

   // Instance of class Contract
   const contract2 = zilliqa.contracts.new(code2, init2);

   // Deploy the contract.
   // Also notice here we have a default function parameter named toDs as mentioned above.
   // A contract can be deployed at either the shard or at the DS. Always set this value to false.
   const [deployTx2, hash] = await contract2.deploy(
     {
       version: VERSION,
       gasPrice: myGasPrice,
       gasLimit: Long.fromNumber(20000),
     },
     33,
     1000,
     false,
   );

   // Introspect the state of the underlying transaction
   console.log(`Deployment Transaction ID: ${deployTx2.id}`);
   console.log(`Deployment Transaction Receipt:`);
   console.log(deployTx2.txParams.receipt);   
   // Get the deployed contract address
   console.log('The contract address is : ',hash.address);

   console.log('\n'); 
  

   m.hashAddress = hash.address;  

   //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Deploy Husd ---------------------------------------------------------------------------
    console.log('\n');
    console.log('Deploying Husd');

    // read file and replace  address
    const code3 = read('./scillacodes/Husd.scilla').replace('0xb358680dce1f43da6b271e5322644bcfdc769b8e', hash.address);;
    // init 
    const tokenName1 = 'Husd';
    const symbol1 = 'HUSD';
    const decimals1 = '10';
    const init_supply1 = '1000000000000000000';

    const init3 =  [
        // this parameter is mandatory for all init arrays
        {
          vname: '_scilla_version',
          type: 'Uint32',
          value: '0',
        },
        {
          vname: 'contract_owner',
          type: 'ByStr20',
          value: `${address}`,
        },       
        {
            vname: 'name',
            type: 'String',
            value: `${tokenName1}`,
        },
        {
            vname: 'symbol',
            type: 'String',
            value: `${symbol1}`,
        },
        {
            vname: 'decimals',
            type: 'Uint32',
            value: `${decimals1}`,
        },
        {
            vname: 'init_supply',
            type: 'Uint128',
            value: `${init_supply1}`,
        },                
      ];

   // Instance of class Contract
   const contract3 = zilliqa.contracts.new(code3, init3);

   // Deploy the contract.
   // Also notice here we have a default function parameter named toDs as mentioned above.
   // A contract can be deployed at either the shard or at the DS. Always set this value to false.
   const [deployTx3, husd] = await contract3.deploy(
     {
       version: VERSION,
       gasPrice: myGasPrice,
       gasLimit: Long.fromNumber(20000),
     },
     33,
     1000,
     false,
   );

   // Introspect the state of the underlying transaction
   console.log(`Deployment Transaction ID: ${deployTx3.id}`);
   console.log(`Deployment Transaction Receipt:`);
   console.log(deployTx3.txParams.receipt);   
   // Get the deployed contract address
   console.log('The contract address is : ',husd.address);

   console.log('\n');   


   m.husdAddress = husd.address;

   fs.writeFileSync('contracts.json', JSON.stringify(m));

   console.log('All contracts launched\n')
   
      // sethusd address
      console.log('Calling Husd transition registerWithHash');
      const callTx = await husd.call(
         'registerWithHash',
         [],
         {
           // amount, gasPrice and gasLimit must be explicitly provided
           version: VERSION,
           amount: new BN(0),
           gasPrice: myGasPrice,
           gasLimit: Long.fromNumber(8000),
         },
         33,
         1000,
         false,
       );  
       // Retrieving the transaction receipt (See note 2)
       console.log(JSON.stringify(callTx.receipt, null, 4));
           //Get the contract state
       console.log('Getting Hash state...');
       const state = await hash.getState();
       console.log('The state of the Hash:');
       console.log(JSON.stringify(state, null, 4));  

    } catch (err) {
    console.log(err);
  }
}

testBlockchain();