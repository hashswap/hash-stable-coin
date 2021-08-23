const { round } = require('lodash');
//const { Requester, Validator } = require('@chainlink/external-adapter')
const { Zilliqa } = require('@zilliqa-js/zilliqa')
const {  getPubKeyFromPrivateKey } = require('@zilliqa-js/crypto')
const { BN, Long, units, bytes } = require('@zilliqa-js/util');
const { hexAddress,hashAddress, husdAddress} = require("./contracts.json");
var request = require('request');
// set up zilliqa bc
const zilliqa = new Zilliqa('https://dev-api.zilliqa.com');
let pvKey = '5d99e6eb161b5a693934dacc6bd54d87d89bbb43ebda9d95f9cadcd322fcc862';
zilliqa.wallet.addByPrivateKey(pvKey);
const hex = zilliqa.contracts.at(hexAddress);
//const hash = zilliqa_chain.contracts.at(hashAddress);
const husd = zilliqa.contracts.at(husdAddress);


async function runCode(dat) {
    try {
        const state = await hex.getState();

        var headers = {
            'content-type': 'application/json'
        };
        
        var dataString = '{ "id": 0, "data": { "from": "ZIL", "to": "USD" } }';
        
        var options = {
            url: 'http://localhost:8080/',
            method: 'POST',
            headers: headers,
            body: dataString
        };
        
        request(options, callback);

        async function callback(error, response, body) {
            if (!error && response.statusCode == 200) {
                var zilusd = JSON.parse(body).result;

                let j = 1;

                for (var i = 0; i < Object.keys(state['pools']).length; i++){
                    // look for the entry with a matching `code` value
                    if (Object.keys(state['pools'])[i] == hashAddress){
                        j = i;
                        break
                    }
                }
                
                
                let y = Object.values(state['pools'])[j]['arguments'];

                let hashZil = y[0]/y[1];

                new_rate = round(hashZil * zilusd * 1000000);
                dat.rate = new_rate;
                console.log('new rate = ',dat.rate,' = (hashZil) ',hashZil,' * (zilusd) ',zilusd);

                // call husd
                const args = [
                    { vname: 'recipient', type: 'ByStr20',  value: `${dat.address}` },
                    { vname: 'non',       type: 'Uint128',  value: `${dat.nonce}` },
                    { vname: 'hashHusd',  type: 'Uint128',  value: `${dat.rate}` },
                    { vname: 'direction',  type: 'String',  value: `${dat.direction}` },
                ];
                const attempts = Long.fromNumber(50);
                
                const callTx = await husd.call(
                    'ResumeTransfer',
                    args,
                    { version : bytes.pack(333,1),
                      amount  : new BN(0),
                      gasPrice: units.toQa('3000', units.Units.Li),
                      gasLimit: Long.fromNumber(8000),
                      pubKey  : getPubKeyFromPrivateKey(pvKey), },
                        attempts, 1000, false,
                );
                console.log('receipt :', JSON.stringify(callTx.txParams, null, 4));
                    }
                }
      }catch (err) {
        console.log(err);
      }
    
    }
    
module.exports = {runCode};
