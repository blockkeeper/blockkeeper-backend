const async = require('async')
const validate = require('uuid-validate')
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
    if (err) return cb(err)
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
  async.parallel([(cb) => {
    scanRates([], null, (err, dynamoRates) => {
      if (err) return cb(err)
      const apiResult = {
        _t: new Date().toISOString(),
        pairs: {}
      }
      dynamoRates.forEach((i) => {
        apiResult.pairs[i.pair.S] = Number(i.rate.N)
      })
      cb(null, apiResult)
    })
  }, (cb) => {
    // do analytics table update
    if (validate(e.headers['x-user-id'], 4) === false) return cb()
    dynamodb.updateItem({
      TableName: 'bk_analytics',
      Key: {
        userid: {
          S: e.headers['x-user-id']
        }
      },
      AttributeUpdates: {
        lastTs: {
          Action: 'ADD',
          Value: {
            NS: [
              (new Date().setHours(0, 0, 0, 0) / 1000).toString()
            ]
          }
        }
      },
      ReturnConsumedCapacity: 'NONE',
      ReturnItemCollectionMetrics: 'NONE',
      ReturnValues: 'NONE'
    }, (err) => {
      // ignore error
      if (err) console.log(err)
      cb()
    })
  }], (err, res) => {
    if (err) {
      console.log(err)
      ctx.fail()
    } else {
      ctx.succeed(res[0])
    }
  })
}
