const got = require('got')
const fsyms = [ 'BTC', 'ETH', 'DASH', 'LTC' ]
const tsyms = [
  // 'AUD', 'BRL', 'CAD', 'CHF', 'CLP', 'CNY', 'CZK', 'DKK', 'EUR', 'GBP', 'HKD', 'HUF', 'IDR', 'ILS', 'INR', 'JPY', 'KRW', 'MXN', 'MYR', 'NOK', 'NZD', 'PHP', 'PKR', 'PLN', 'RUB', 'SEK', 'SGD', 'THB', 'TRY', 'TWD', 'ZAR'
  'USD', 'EUR', 'CHF', 'CAD', 'SGD', 'GBP', 'RUB'
]
const cmcApiEndpoint = 'https://min-api.cryptocompare.com/data/pricemulti?extraParams=blockkeeper&fsyms=' + fsyms.join(',') + '&tsyms=' + fsyms.concat(tsyms).join(',')

exports.handle = function (e, ctx) {
  got(cmcApiEndpoint, {
    timeout: 1900,
    retries: 2,
    json: true
  }).then(response => {
    if (response.body && response.body.Response === 'Error') { // crazy api, returns http status 200 with error...
      console.log(response.body)
      return ctx.fail('cryptocompare api response error')
    }
    const apiResult = {
      _t: new Date().toISOString(),
      pairs: {}
    }
    fsyms.forEach((coin) => {
      for (const key of Object.keys(response.body[coin])) {
        apiResult.pairs[coin + '_' + key] = response.body[coin][key]
      }
    })
    ctx.succeed(apiResult)
  }).catch(error => {
  	console.log(error)
    ctx.fail('cryptocompare api error')
  })
}
