const validate = require('uuid-validate')
const AWSDynamodb = require('aws-sdk/clients/dynamodb')
let dynamodb = new AWSDynamodb()
const tableName = 'bk_addresses'  // TODO move to config

exports.handle = function (e, ctx) {
  if (validate(e.headers['x-user-id'], 4) === false) {
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
        S: e.headers['x-user-id']
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
