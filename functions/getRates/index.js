const AWSDynamodb = require('aws-sdk/clients/dynamodb')
let dynamodb = new AWSDynamodb()
const tableName = 'bk_rates'  // TODO move to config
const scanRates = (dynamoRates, lastKey, cb) => {
  const queryParameter = {
    TableName: tableName,
    AttributesToGet: [
      'pair',
      'rate'
    ],
    Select: 'SPECIFIC_ATTRIBUTES',
    ReturnConsumedCapacity: 'NONE'
  }
  if (lastKey) {
    queryParameter.ExclusiveStartKey = lastKey
  }
  dynamodb.scan(queryParameter, (err, result) => {
    if (err) {
      return cb(err)
    }
    if (result.LastEvaluatedKey) {
      scanRates(
        [].concat(dynamoRates, result.Items),
        result.LastEvaluatedKey,
        cb
      )
    } else {
      cb(null, [].concat(dynamoRates, result.Items))
    }
  })
}

exports.handle = function (e, ctx) {
  scanRates([], null, (err, dynamoRates) => {
    if (err) {
      console.log(err)
      return ctx.fail()
    } else {
      const apiResult = {
        _t: new Date().toISOString(),
        pairs: {}
      }
      dynamoRates.forEach((i) => {
        apiResult.pairs[i.pair.S] = Number(i.rate.N)
      })
      ctx.succeed(apiResult)
    }
  })
}
