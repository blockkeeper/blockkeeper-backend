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

  const stack = []
  const hour = []
  const week = []
  const month = []
  const quater = []
  const halfyear = []
  const year = []
  const startHourly = moment().subtract(2, 'days')
  const startWeek = moment().subtract(1, 'week')
  const startMonth = moment().subtract(1, 'month')
  const startQuater = moment().subtract(3, 'month')
  const startHalfyear = moment().subtract(6, 'month')
  const startYear = moment().subtract(1, 'year')
  const end = moment()
  const apiRes = {}

  // last 48 hours
  while (startHourly.isBefore(end)) {
    hour.push(startHourly.startOf('hour').format('X'))
    startHourly.add(1, 'hour')
  }
  // last 7 days + today -> 8 entries
  while (startWeek.isBefore(end)) {
    week.push(startWeek.startOf('day').format('X'))
    startWeek.add(1, 'day')
  }
  // last month + today
  while (startMonth.isBefore(end)) {
    month.push(startMonth.startOf('day').format('X'))
    startMonth.add(1, 'day')
  }
  // last quater + today
  while (startQuater.isBefore(end)) {
    quater.push(startQuater.startOf('day').format('X'))
    startQuater.add(1, 'day')
  }
  // last half year + today -> 7 entries
  while (startHalfyear.isBefore(end)) {
    halfyear.push(startHalfyear.startOf('day').format('X'))
    startHalfyear.add(1, 'month')
  }
  // last year + today -> 13 entries
  while (startYear.isBefore(end)) {
    year.push(startYear.startOf('day').format('X'))
    startYear.add(1, 'month')
  }

  for (let c of coins) {
    const pair = `${c}_${c === e.coin ? e.seccoin : e.coin}`

    stack.push(getHistory('hourly', hourlyTableName, pair, hour))
    stack.push(getHistory('weekly', dailyTableName, pair, week))
    stack.push(getHistory('monthly', dailyTableName, pair, month))
    stack.push(getHistory('quaterly', dailyTableName, pair, quater))
    stack.push(getHistory('halfyearly', dailyTableName, pair, halfyear))
    stack.push(getHistory('yearly', dailyTableName, pair, year))
  }
  const rawData = await Promise.all(stack)
  for (let r of rawData) {
    if (apiRes[r.type] && apiRes[r.type][r.pair]) {
      throw ctx.fail('rawData broken') // should never happen
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
