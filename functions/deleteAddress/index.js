const validate = require('uuid-validate')
const AWSDynamodb = require('aws-sdk/clients/dynamodb')
let dynamodb = new AWSDynamodb()
const tableName = 'bk_addresses'  // TODO move to config

exports.handle = function (e, ctx) {
  if (validate(e.userid, 4) === false || e.userid !== e.headers['x-user-id']) {
    return ctx.fail('Invalid userid supplied')
  }
  if (validate(e.addressid, 4) === false) {
    return ctx.fail('Invalid addressid supplied')
  }
  dynamodb.deleteItem({
    TableName: tableName,
    Key: {
      _id: {
        S: e.addressid
      },
      userid: {
        S: e.userid
      }
    },
    Expected: {
      _id: {
        Value: { S: e.addressid },
        Exists: true
      },
      userid: {
        Value: { S: e.userid },
        Exists: true
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
}
