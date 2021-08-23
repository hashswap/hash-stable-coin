
///////////////////////////////////////////////////////////////////
//TO DEPLOY ALL CONTRACTS OF HASH AND STABLE COIN HUSD AND LINK THEM WITH EACH OTHER
//TO CREATE A HASH-ZIL POOL IN DEX OF ZILSWAP 
//Deploy Hash
//Deploy Husd
///////////////////////////////////////////////////////////////////
const fs = require('fs');
const { Zilliqa } = require('@zilliqa-js/zilliqa');
const { BN, Long, units, bytes } = require('@zilliqa-js/util');
const {
    getAddressFromPrivateKey,
    getPubKeyFromPrivateKey } = require('@zilliqa-js/crypto');
const {privateKeys, server}  = require('./0_secrets.json');
var CONTRACTS = {};
CONTRACTS['DEX'] = '0x1a62dd9c84b0c8948cb51fc664ba143e7a34985c';  

    let setup = {
        "zilliqa": new Zilliqa(server.api),
        "VERSION": bytes.pack(server.chainId, server.msgVersion),
        "priv_keys": privateKeys,
        "addresses": [],
        "pub_keys": [],
    };
    setup.priv_keys.forEach( item => {
        setup.zilliqa.wallet.addByPrivateKey(item);// add key to wallet
        setup.addresses.push(getAddressFromPrivateKey(item)); // compute and store address
        setup.pub_keys.push(getPubKeyFromPrivateKey(item)); // compute and store public key
    });

    const base_tx_settings = {
        "gas_price": units.toQa('3000', units.Units.Li),
        "gas_limit": Long.fromNumber(50000),
        "attempts": Long.fromNumber(33),
        "timeout": 1000,
    };



    // read a file and return contents as a string
    function read(f)
    {
        t = fs.readFileSync(f, 'utf8', (err,txt) => {
            if (err) throw err;
        });
        return t;
    }

// deploy a smart contract whose code is in a file with given init arguments
async function deploy_from_file(path, init, gas = base_tx_settings.gas_limit, hardcode = {}, tx_settings = base_tx_settings)
{
    var code = read(path);
    for(var k in hardcode){ code = code.replace(k, hardcode[k]); }

        const contract = setup.zilliqa.contracts.new(code, init);
    return contract.deploy(
        { version: setup.VERSION, gasPrice: tx_settings.gas_price, gasLimit: gas, },
        tx_settings.attempts, tx_settings.timeoute, false
        );
}


async function sc_call(sc, transition, args = [], 
    caller_pub_key = setup.pub_keys[0], gas = base_tx_settings.gas_limit, 
    amt = new BN(0), tx_settings = base_tx_settings 
    )
{
    return sc.call(
        transition,
        args,
        { version: setup.VERSION, amount: amt, gasPrice: tx_settings.gas_price,
            gasLimit: gas, pubKey: caller_pub_key, },
            tx_settings.attempts, tx_settings.timeout, true,
            );
}


async function increaseAllowance(tokenAddress, contractAddress, senderPubKey, amount){

    console.log(contractAddress);
    console.log("test111111111111111111");

    var Token = setup.zilliqa.contracts.at(tokenAddress);
    var transition = 'IncreaseAllowance';
    var args = [
    { vname: 'spender', type: 'ByStr20', value: contractAddress },
    { vname: 'amount', type: 'Uint128', value: amount.toString() },
    ];
    var gas = Long.fromNumber(20000);
    

    console.log("test111111111111111111");
    var tx = await sc_call(Token, transition, args, senderPubKey, gas);
    
    
    /*console.log("test111111111111111111");
    console.log("tx.receipt:\n",tx.receipt);
    var st = await Token.getState();
    console.log(st);
    console.log("test111111111111111111");
    */
}

function consoleLog( title, output1, array1, array2){

    console.log("++++++++++++++++++++++++++++++++++++");
    console.log("++++++++++++++++++++++++++++++++++++");
    console.log("--------  ",title," START ----");
    console.log("++++++++++++++++++++++++++++++++++++");
    console.log("++++++++++++++++++++++++++++++++++++");
    
    console.log(output1);

    console.log("#####################################");
    console.log("#########          2        #########");
    console.log("#####################################");
        
    console.dir(array1, { depth: null }); 

    console.log("#####################################");
    console.log("###########      3       ############");
    console.log("#####################################");
    
    console.dir(array2, { depth: null }); 

    console.log("------------------------------------");
    console.log("------------------------------------");
    console.log("-------- ", title, " END    ----");
    console.log("------------------------------------");
    console.log("------------------------------------");

}




async function run()
{

        //MARKET PARTICIPANTS PUBLIC KEYS
        const owner = setup.pub_keys[0];
        const influencer1 = setup.pub_keys[1];
        const influencer2 = setup.pub_keys[2];
        const influencer3 = setup.pub_keys[3];
        const sponsor1 = setup.pub_keys[4];
        const sponsor2 = setup.pub_keys[5];
        const trader1 = setup.pub_keys[6];
        const trader2 = setup.pub_keys[7];
        const trader3 = setup.pub_keys[8];

        //MARKET PARTICIPANTS PUBLIC KEYS
        const owner_Address = setup.addresses[0];
        const influencer1_Address = setup.addresses[1];
        const influencer2_Address = setup.addresses[2];
        const influencer3_Address = setup.addresses[3];
        const sponsor1_Address = setup.addresses[4];
        const sponsor2_Address = setup.addresses[5];
        const trader1_Address = setup.addresses[6];
        const trader2_Address = setup.addresses[7];
        const trader3_Address = setup.addresses[8];

        //CORE CONTRACTS 
        //var DEX = setup.zilliqa.contracts.at(CONTRACTS.DEX);
       
        //TX SETTINGS : ONLY WHEN REQUIRED
        const tx_settings = {
            "gas_price": units.toQa('3000', units.Units.Li),
            "gas_limit": Long.fromNumber(50000),
            "attempts": Long.fromNumber(33),
            "timeout": 1000,
        };

        //GAS LIMIT: ONLY WHEN REQUIRED
        var gas = Long.fromNumber(50000);
        

    ////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////
    // 1. Deploy DEX.scilla
    ////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////

    var contractFolder = '../Scilla';
    contractName = 'DEX';
    contractFilePath = contractFolder + '/' + contractName + '.scilla';
    
    hardcode = {};

    initial_owner = owner_Address;
    initial_fee = '30';
    
    init = [ 
        { vname: '_scilla_version', type: 'Uint32', value: '0'},
        { vname: 'initial_owner', type: 'ByStr20', value: initial_owner},
        { vname: 'initial_fee', type: 'Uint256', value: initial_fee },
    ];

    [tx, sc] = await deploy_from_file(contractFilePath, init, gas, hardcode);
    console.log(contractName,"contract deployed @ ", sc.address);

    CONTRACTS[contractName] = sc.address;  

    ////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////
    // 2. Deploy Hash.scilla
    ////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////

    var contractFolder = '../Scilla';
    contractName = 'Hash';
    contractFilePath = contractFolder + '/' + contractName + '.scilla';
    
    hardcode = {};

    contract_owner = owner_Address;
    tokenName = 'Hash';
    symbol = 'HASH';
    decimals = '10';
    init_supply = '1000000000000000000';
    
    init = [ 
        { vname: '_scilla_version', type: 'Uint32', value: '0'},
        { vname: 'contract_owner', type: 'ByStr20', value: contract_owner},
        { vname: 'name', type: 'String', value: tokenName },
        { vname: 'symbol', type: 'String', value: symbol },
        { vname: 'decimals', type: 'Uint32', value: decimals },
        { vname: 'init_supply', type: 'Uint128', value: init_supply },
    ];

    [tx, sc] = await deploy_from_file(contractFilePath, init, gas, hardcode);
    console.log(contractName,"contract deployed @ ", sc.address);

    CONTRACTS[contractName] = sc.address;  

    ////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////
    // 3. Deploy Husd.scilla
    ////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////

    var contractFolder = '../Scilla';
    contractName = 'Husd';
    contractFilePath = contractFolder + '/' + contractName + '.scilla';
    
    hardcode = {};
    hardcode["0xb358680dce1f43da6b271e5322644bcfdc769b8e"] = CONTRACTS['Hash'];
    
    contract_owner = owner_Address;
    tokenName = 'Husd';
    symbol = 'HUSD';
    decimals = '10';
    init_supply = '1000000000000000000';
    
    init = [ 
        { vname: '_scilla_version', type: 'Uint32', value: '0'},
        { vname: 'contract_owner', type: 'ByStr20', value: contract_owner},
        { vname: 'name', type: 'String', value: tokenName },
        { vname: 'symbol', type: 'String', value: symbol },
        { vname: 'decimals', type: 'Uint32', value: decimals },
        { vname: 'init_supply', type: 'Uint128', value: init_supply },
    ];

    [tx, sc] = await deploy_from_file(contractFilePath, init, gas, hardcode);
    console.log(contractName,"contract deployed @ ", sc.address);

    CONTRACTS[contractName] = sc.address;  

    ////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////
    // 4. Call "RegisterWithHash" in HUSD
    // -  Called by Owner
    ////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////
   
    
    var Husd = setup.zilliqa.contracts.at(CONTRACTS.Husd);
    var transition = 'RegisterWithHash';
    var args = [
    ];
    var gas = Long.fromNumber(50000);
    var tx = await sc_call(Husd, transition, args, owner, gas, amt);
    consoleLog("TRANSACTION LOG ", tx.receipt, "", "");

    var Hash = setup.zilliqa.contracts.at(CONTRACTS.Hash);
    var st = await Hash.getState();
    consoleLog( "HASH STATE ", st, st.balances, st.pools);
    
    var st = await Husd.getState();
    consoleLog( "HUSD STATE ", st, st.balances, st.pools);
    
    ////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////
    // 5. Call "AddLiquidity" to DEX
    // -  Called by Owner
    // -  Traders also need to call "IncreaseAllowance" from HUSD
    ////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////
   
    var amt = new BN(6000000000000000);
    var min_lp = 1;
    var husd_amount = 20000;
    
    await increaseAllowance(CONTRACTS.Husd, CONTRACTS.DEX, owner, husd_amount);
    
    var DEX = setup.zilliqa.contracts.at(CONTRACTS.DEX);
    var transition = 'AddLiquidity';
    var args = [
    { vname: 'token_address', type: 'ByStr20', value: CONTRACTS['Husd'] },
    { vname: 'min_contribution_amount', type: 'Uint128', value: min_lp.toString() },
    { vname: 'max_token_amount', type: 'Uint128', value: husd_amount.toString() },
    { vname: 'deadline_block', type: 'BNum', value: '5000000000' },
    ];
    var gas = Long.fromNumber(50000);
    var tx = await sc_call(DEX, transition, args, owner, gas, amt);
    consoleLog("TRANSACTION LOG ", tx.receipt, "", "");

    var st = await DEX.getState();
    consoleLog( "DEX STATE ", st, st.balances, st.pools);
    
   
    ////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////
    // CREATE JSON FILES CONTAINING ALL INFLUENCER TOKEN ADDRESSES
    ////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////
    const data = JSON.stringify(CONTRACTS);

    try {
        fs.writeFileSync('0_contracts.json', data);
        console.log("JSON data is saved.");
    } catch (error) {
        console.error(err);
    }
    ////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////

  }

  run();
