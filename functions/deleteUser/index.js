const validate = require('uuid-validate')
const AWSDynamodb = require('aws-sdk/clients/dynamodb')
let dynamodb = new AWSDynamodb()
const tableName = 'bk_users'  // TODO move to config

exports.handle = function (e, ctx) {
  if (validate(e.userid, 4) === false) {
    return ctx.fail('Invalid userid supplied')
  }
  dynamodb.query({
    TableName: tableName,
    IndexName: '_id-index',
    KeyConditions: {
      _id: {
        ComparisonOperator: 'EQ',
        AttributeValueList: [
          { S: e.userid }
        ]
      }
    },
    Select: 'SPECIFIC_ATTRIBUTES',
    AttributesToGet: [
      'userhash'
    ]
  }, (err, result) => {
    if (err) {
      console.log(err)
      return ctx.fail('Error')
    }
    if (result && result.Count === 0) {
      return ctx.fail('Userid not found')
    }
    dynamodb.deleteItem({
      TableName: tableName,
      Key: {
        userhash: {
          S: result.Items[0].userhash.S
        }
      },
      ReturnConsumedCapacity: 'NONE',
      ReturnItemCollectionMetrics: 'NONE',
      ReturnValues: 'NONE'
    }, (err, result) => {
      if (err) {
        console.log(err)
        return ctx.fail('Error')
      }
      ctx.succeed()
    })
  })
}
