const AWSDynamodb = require('aws-sdk/clients/dynamodb')
let dynamodb = new AWSDynamodb()
const got = require('got')
const moment = require('moment')
const fsyms = [ 'BTC', 'ETH', 'DASH', 'LTC' ]
const tsyms = [ 'AUD', 'CAD', 'EUR', 'GBP', 'USD', 'BTC' ]
const types = {
  hour: {
    tableName: 'bk_history_hour',
    apiPath: 'histohour',
    apiLimit: 24
  },
  day: {
    tableName: 'bk_history_day',
    apiPath: 'histoday',
    apiLimit: 31
  }
}

function timeout (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function insertHistory (type, f, t) {
  const resp = await got(`https://min-api.cryptocompare.com/data/${type.apiPath}?fsym=${f}&tsym=${t}&limit=${type.apiLimit}&toTs=${moment().unix()}&extraParams=bk_history`, {json: true})
  await timeout(100)
  if (resp.body && resp.body.Response === 'Success' && resp.body.Data && resp.body.Data.length > 0) {
    const stacker = []
    for (let row of resp.body.Data) {
      stacker.push(dynamodb.putItem({
        TableName: type.tableName,
        Item: {
          pair: {
            S: `${f}_${t}`
          },
          ts: {
            N: row.time.toString()
          },
          low: {
            N: row.low.toString()
          },
          high: {
            N: row.high.toString()
          },
          open: {
            N: row.open.toString()
          },
          close: {
            N: row.close.toString()
          },
          avg: {
            N: parseFloat(((row.low + row.high) / 2).toFixed(t === 'BTC' ? 6 : 2)).toString()
          }
        },
        ReturnValues: 'NONE',
        ReturnConsumedCapacity: 'NONE'
      }).promise())
    }
    await Promise.all(stacker)
  }
}

exports.handle = async (e, ctx) => {
  for (let f of fsyms) {
    for (let t of tsyms) {
      if (f === t) continue
      try {
        await insertHistory(types.hour, f, t)
        await insertHistory(types.day, f, t)
      } catch (e) {
        ctx.fail(e)
      }
    }
  }
  ctx.succeed()
}
