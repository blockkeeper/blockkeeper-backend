const got = require('got')
const parallel = require('async/parallel')
const fsyms = [ 'BTC', 'ETH', 'DASH', 'LTC' ]
// api breaks if we use all tsyms parameter in one call
// const tsyms = [ 'AUD', 'BRL', 'CAD', 'CHF', 'CLP', 'CNY', 'CZK', 'DKK', 'EUR', 'GBP', 'HKD', 'HUF', 'IDR', 'ILS', 'INR', 'JPY', 'KRW', 'MXN', 'MYR', 'NOK', 'NZD', 'PHP', 'PKR', 'PLN', 'RUB', 'SEK', 'SGD', 'THB', 'TRY', 'TWD', 'ZAR' ]
const tsyms1 = ['AUD', 'BRL', 'CAD', 'CHF', 'CLP', 'CNY', 'CZK', 'DKK', 'EUR', 'GBP', 'HKD', 'HUF', 'IDR', 'ILS', 'INR', 'JPY', 'KRW', 'MXN', 'MYR', 'NOK', 'NZD']
const tsyms2 = ['PHP', 'PKR', 'PLN', 'RUB', 'SEK', 'SGD', 'THB', 'TRY', 'TWD', 'ZAR']
const errormessage = 'Cryptocompare api response error'
const doRequest = function (tsymsCut, cb) {
  const apiEndpoint = 'https://min-api.cryptocompare.com/data/pricemulti?extraParams=blockkeeper&fsyms=' + fsyms.join(',') + '&tsyms=' + [].concat(fsyms, tsymsCut).join(',')
  got(apiEndpoint, {
    timeout: 1900,
    retries: 2,
    json: true
  }).then(response => {
    if (response.body && response.body.Response === 'Error') { // crazy api, returns http status 200 with error...
      console.log(response.body)
      return cb(errormessage)
    }
    cb(null, response)
  }).catch(error => {
    cb(null, error)
  })
}
exports.handle = function (e, ctx) {
  // TODO remove second call if api behavior changes
  parallel([
    function (cb) {
      doRequest(tsyms1, cb)
    },
    function (cb) {
      doRequest(tsyms2, cb)
    }
  ], function (err, results) {
    if (err) {
      console.log(err)
      return ctx.fail(errormessage)
    }
    const apiResult = {
      _t: new Date().toISOString(),
      pairs: {},
      error: false
    }
    results.forEach((response) => {
      if (response.body && response.body.Response === 'Error') { // crazy api, returns http status 200 with error...
        console.log(response.body)
        apiResult.error = true
      }
      fsyms.forEach((coin) => {
        for (const key of Object.keys(response.body[coin])) {
          apiResult.pairs[coin + '_' + key] = response.body[coin][key]
        }
      })
    })
    apiResult.error === true ? ctx.fail(errormessage) : ctx.succeed(apiResult)
  })
}
