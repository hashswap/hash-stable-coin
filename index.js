/* To run the curl request to get Rhine Pegel level at Kaub station at noon of a given date
[..]/rhine_gauge/$ yarn start
  yarn run v1.22.5
  $ node app.js
  Listening on port 8080!
# in a different terminal
[..]/rhine_gauge/$ curl -X POST -H "content-type:application/json" "http://localhost:8080/" --data '{ "id": 0, "data": { "requestId": 0} }'
  {"jobRunID":0,"data":[{"timestamp":"2021-02-23T12:00:00+01:00","value":256}, ...,
  ....,{"timestamp":"2021-02-24T13:45:00+01:00","value":247}],"result":256,"statusCode":200}
*/
const { round } = require('lodash');
const { Requester, Validator } = require('@chainlink/external-adapter')

// Define custom error scenarios for the API.
// Return true for the adapter to retry.
const customError = (data) => {
  if (data.Response === 'Error') return true
  return false
}

// Define custom parameters to be used by the adapter.
// Extra parameters can be stated in the extra object,
// with a Boolean value indicating whether or not they
// should be required.
const customParams = {
  base: ['base', 'from', 'coin'],
  quote: ['quote', 'to', 'market'],
  endpoint: false
}

const createRequest = (input, callback) => {
  console.log(` ====> Request: = `);
  console.log(JSON.stringify(input));

  const validator = new Validator(callback, input, customParams)
  const jobRunID = validator.validated.id
  const endpoint = validator.validated.data.endpoint || 'price'  
  const url = `https://min-api.cryptocompare.com/data/${endpoint}`
  const fsym = validator.validated.data.base.toUpperCase()
  const tsyms = validator.validated.data.quote.toUpperCase()

 
  const params = {
    fsym,
    tsyms
  }

  // This is where you would add method and headers
  // you can add method like GET or POST and add it to the config
  // The default is GET requests
  // method = 'get' 
  // headers = 'headers.....'
  const config = {
    url,
    params
  }

  // The Requester allows API calls be retry in case of timeout
  // or connection failure
  Requester.request(config, customError)
    .then(response => {

      response.data.result = Requester.validateResultNumber(response.data, [tsyms])
      callback(response.status, Requester.success(jobRunID, response))
      // FMB: Take the result and send it to Zilliqa oracle contract
      const level = response.data.result;
      return level;
    })
}

// This allows the function to be exported for testing
// or for running in express
module.exports.createRequest = createRequest
