const async = require('async')
const AWSDynamodb = require('aws-sdk/clients/dynamodb')
let dynamodb = new AWSDynamodb()
const tableName = 'bk_addresses'  // TODO move to config
const queryAddressIds = (userId, addressIds, lastKey, cb) => {
  const queryParameter = {
    TableName: tableName,
    IndexName: 'userid-index',
    KeyConditions: {
      userid: {
        ComparisonOperator: 'EQ',
        AttributeValueList: [
            { S: userId }
        ]
      }
    },
    AttributesToGet: [
      '_id',
      'userid'
    ],
    ReturnConsumedCapacity: 'NONE'
  }
  if (lastKey) {
    queryParameter.ExclusiveStartKey = lastKey
  }
  dynamodb.query(queryParameter, (err, result) => {
    if (err) {
      return cb(err)
    }
    if (result.LastEvaluatedKey) {
      queryAddressIds(
        userId,
        [].concat(addressIds, result.Items),
        result.LastEvaluatedKey,
        cb
      )
    } else {
      cb(null, [].concat(addressIds, result.Items))
    }
  })
}

exports.handle = function (e, ctx, cb) {
  const queryStack = []
  e.Records.forEach((user) => {
    // console.log('User: ', JSON.stringify(user, null, 2))
    if (user.eventName === 'REMOVE') {
      queryStack.push((cb) => {
        queryAddressIds(user.dynamodb.OldImage._id.S, [], null, cb)
      })
    }
  })
  if (queryStack.length === 0) {
    return cb()
  }
  async.parallel(queryStack, function (err, queryResult) {
    if (err) {
      console.log(err)
      cb(err)
    } else {
      const flatResult = [].concat.apply([], queryResult)
      if (flatResult.length === 0) {
        return cb()
      }
      async.each(flatResult, function (deleteAddress, cb) {
        dynamodb.deleteItem({
          TableName: tableName,
          Key: deleteAddress,
          ReturnConsumedCapacity: 'NONE',
          ReturnItemCollectionMetrics: 'NONE',
          ReturnValues: 'NONE'
        }, cb)
      }, (err) => {
        if (err) {
          console.log(err)
          cb(err)
        } else {
          cb()
        }
      })
    }
  })
}
