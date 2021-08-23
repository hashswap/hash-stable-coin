const { round } = require('lodash');
const { Requester, Validator } = require('@chainlink/external-adapter')
const { Zilliqa } = require('@zilliqa-js/zilliqa')
const {  getPubKeyFromPrivateKey } = require('@zilliqa-js/crypto')
const { BN, Long, units, bytes } = require('@zilliqa-js/util');
const { husdAddress, hexAddress} = require("./contracts.json");
var request = require('request');
const { StatusType, MessageType} = require('@zilliqa-js/subscriptions');
const {runCode} = require('./test.js');

// set up zilliqa bc
const zilliqa_chain = new Zilliqa('https://dev-api.zilliqa.com');
let pvKey = '5d99e6eb161b5a693934dacc6bd54d87d89bbb43ebda9d95f9cadcd322fcc862';
zilliqa_chain.wallet.addByPrivateKey(pvKey);
const version = bytes.pack(333,1);
const hex = zilliqa_chain.contracts.at(hexAddress);
const husd = zilliqa_chain.contracts.at(husdAddress);

  


 // Code that listens to websocket and updates welcome message when getHello() gets called.
 async function eventLogSubscription() {

  const zilliqa = new Zilliqa('https://dev-api.zilliqa.com');
  const subscriber = zilliqa.subscriptionBuilder.buildEventLogSubscriptions(
    'wss://dev-ws.zilliqa.com',
    {
      // smart contract address you want to listen on  
      addresses: [
        '0x343BBDb08664903fD33bA675Ab541893bcF9987B',
      ],
    },
  );

    subscriber.emitter.on(StatusType.SUBSCRIBE_EVENT_LOG, (event) => {
      
      // if subscribe success, it will echo the subscription info
      console.log('get SubscribeEventLog echo : ', event);
    });
    
    subscriber.emitter.on(MessageType.EVENT_LOG, (event) => {
      
      console.log('get new event log: ', JSON.stringify(event));
      // updating the msg when a new event log is received related to MakeTransfer() transition
      
      if(event.hasOwnProperty("value")){
        if(event.value[0].event_logs[0]._eventname =="MakeTransfer"){
          const data = {
              address: event.value[0].event_logs[0].params[0].value,
              nonce: event.value[0].event_logs[0].params[1].value,
              direction: event.value[0].event_logs[0].params[2].value,
              rate:1,
            }
          runCode(data);
        }
      }
    });

    subscriber.emitter.on(MessageType.UNSUBSCRIBE, (event) => {
      //if unsubscribe success, it will echo the unsubscription info
      console.log('get unsubscribe event: ', event);
    });

    await subscriber.start();
}
eventLogSubscription();