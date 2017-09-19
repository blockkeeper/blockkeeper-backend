const AWSDynamodb = require('aws-sdk/clients/dynamodb')
let dynamodb = new AWSDynamodb()
const tableName = 'bk_rates'
const got = require('got')
const parallel = require('async/parallel')
const retry = require('async/retry')
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
    retries: 3,
    json: true
  }).then(response => {
    if (response.body && response.body.Response === 'Error') { // crazy api, returns http status 200 with error...
      console.log(response.body)
      return cb(errormessage)
    }
    cb(null, response.body)
  }).catch(error => {
    cb(null, error)
  })
}
const doInsert = function (row, cb) {
  dynamodb.putItem({
    TableName: tableName,
    Item: {
      pair: {
        S: row.pair
      },
      rate: {
        N: row.rate.toString()
      },
      ts: {
        N: Math.floor(Date.now() / 1000).toString()
      }

    },
    ReturnValues: 'NONE',
    ReturnConsumedCapacity: 'NONE'
  }, (err) => {
    cb(err)
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
      return ctx.fail(err)
    }
    const insertStacker = []
    results.forEach((body) => {
      fsyms.forEach((coin) => {
        for (const key of Object.keys(body[coin])) {
          insertStacker.push((cb) => {
            retry(3, (callback) => {
              doInsert({
                pair: coin + '_' + key,
                rate: body[coin][key]
              }, callback)
            }, cb)
          })
        }
      })
    })
    parallel(insertStacker, (err) => {
      if (err) {
        console.log(err)
        return ctx.fail()
      } else {
        ctx.succeed()
      }
    })
  })
}
