const moment = require('moment')
const AWSDynamodb = require('aws-sdk/clients/dynamodb')
let dynamodb = new AWSDynamodb()
const hourlyTableName = 'bk_history_hour'
const dailyTableName = 'bk_history_day'
const fiat = ['AUD', 'CAD', 'EUR', 'GBP', 'USD']
const coins = [ 'BTC', 'ETH', 'DASH', 'LTC' ]
const allowedPrimaryCoins = ['BTC'].concat(fiat)
const allowedSecCoins = coins.concat(fiat)

async function getHistory (type, table, pair, ts) {
  const res = await dynamodb.batchGetItem({
    RequestItems: {
      [table]: {
        Keys: ts.map((h) => {
          return {
            pair: {
              S: pair
            },
            ts: {
              N: h.toString()
            }
          }
        }),
        AttributesToGet: [
          'ts',
          'avg'
        ],
        ConsistentRead: false
      }
    },
    ReturnConsumedCapacity: 'NONE'
  }).promise()

  return {
    type: type,
    pair: pair,
    data: res.Responses[table].map((r) => {
      return [
        parseInt(r.ts.N),
        parseFloat(r.avg.N)
      ]
    }).sort((a, b) => {
      return a[0] - b[0]
    })
  }
}

exports.handle = async function (e, ctx) {
  // check selected user coins
  if (allowedPrimaryCoins.indexOf(e.coin) === -1) return ctx.fail('Invalid coin')
  if (allowedSecCoins.indexOf(e.seccoin) === -1) return ctx.fail('Invalid seccoin')

  const apiRes = {}
  const stack = []
  const hour = []
  const year = []
  const end = moment()
  const startHourly = moment().subtract(2, 'days')
  // const startYear = moment().subtract(1, 'year')
  const startYear = moment().subtract(499, 'days')

  // last 48 hours
  while (startHourly.isBefore(end)) {
    hour.push(startHourly.startOf('hour').format('X'))
    startHourly.add(1, 'hour')
  }
  while (startYear.isSameOrBefore(end, 'day')) {
    year.push(startYear.startOf('day').format('X'))
    startYear.add(1, 'day')
  }

  for (let c of coins) {
    const pair = `${c}_${c === e.coin ? e.seccoin : e.coin}`

    stack.push(getHistory('hourly', hourlyTableName, pair, hour))

    // dynamodb batchGetItem max size per call is 100 items
    stack.push(getHistory('daily', dailyTableName, pair, year.slice(0, 100)))
    stack.push(getHistory('daily', dailyTableName, pair, year.slice(100, 200)))
    stack.push(getHistory('daily', dailyTableName, pair, year.slice(200, 300)))
    stack.push(getHistory('daily', dailyTableName, pair, year.slice(300, 400)))
    stack.push(getHistory('daily', dailyTableName, pair, year.slice(400, 500)))
  }

  const rawData = await Promise.all(stack)

  for (let r of rawData) {
    if (apiRes[r.type] && apiRes[r.type][r.pair]) {
      apiRes[r.type][r.pair] = apiRes[r.type][r.pair].concat(r.data)
    } else if (apiRes[r.type]) {
      apiRes[r.type][r.pair] = r.data
    } else {
      apiRes[r.type] = {
        [r.pair]: r.data
      }
    }
  }
  ctx.succeed(apiRes)
}
