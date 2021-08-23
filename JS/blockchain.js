const fs = require('fs');

const { BN, Long, bytes, units } = require('@zilliqa-js/util');
const { Zilliqa } = require('@zilliqa-js/zilliqa');
const zilliqa = new Zilliqa('https://dev-api.zilliqa.com');
const {
  toBech32Address,
  getAddressFromPrivateKey,
  getPubKeyFromPrivateKey } = require('@zilliqa-js/crypto');


const chainId = 333; // chainId of the developer testnet
const msgVersion = 1; // current msgVersion

//const {privateKeys, server} = require('./0_secrets_ceres.json');
const {privateKeys, server} = require('./0_secrets.json');

// chain setup on ceres locally run isolated server, see https://dev.zilliqa.com/docs/dev/dev-tools-ceres/. Keys and wallet setup
const s = () =>
{
  let setup = {
    //"zilliqa": new Zilliqa('https://dev-api.zilliqa.com'),
    "zilliqa": new Zilliqa(server.api),
    "VERSION": bytes.pack(server.chainId, server.msgVersion),
    "priv_keys": privateKeys,

  };
  setup["addresses"] = [];
  setup["pub_keys"] = [];
  setup.priv_keys.forEach( item => {
    setup.zilliqa.wallet.addByPrivateKey(item);// add key to wallet
    setup.addresses.push(getAddressFromPrivateKey(item)); // compute and store address
    setup.pub_keys.push(getPubKeyFromPrivateKey(item)); // compute and store public key
  });
  return setup;
}
const setup = s();
exports.setup = setup;

// will use same tx settings for all tx's
const tx_setting = {
  "gas_price": units.toQa('3000', units.Units.Li),
};

/* ---------------------------------------------------------------------------------------------------------------------------
utility functions
--------------------------------------------------------------------------------------------------------------------------- */
// read a file and return contents as a string
function read(f)
{
  t = fs.readFileSync(f, 'utf8', (err,txt) => {
    if (err) throw err;
  });
  return t;
}

// deploy a smart contract whose code is in a file with given init arguments
async function deploy_from_file(path, init, tx_settings, hardcode = {})
{
  var code = read(path);
  for(var k in hardcode){ code = code.replace(k, hardcode[k]); }
 
  console.log(code);

  const contract = setup.zilliqa.contracts.new(code, init);
  return contract.deploy(
    { version: setup.VERSION, gasPrice: tx_setting.gas_price, gasLimit: tx_settings.gas_limit, },
    tx_settings.attempts, tx_settings.timeoute, false
  );
}

// call a smart contract's transition with given args and an amount to send from a given public key
async function sc_call(sc, transition, args = [], tx_settings, amt = new BN(0), caller_pub_key = setup.pub_keys[0])
{
  return sc.call(
    transition,
    args,
    { version: setup.VERSION, amount: amt, gasPrice: tx_setting.gas_price,
      gasLimit: tx_settings.gas_limit, pubKey: caller_pub_key, },
    tx_settings.attempts, tx_settings.timeout, true,
  );
}

exports.deploy_from_file = deploy_from_file;
exports.sc_call = sc_call;
