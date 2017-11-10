const validate = require('uuid-validate')
const AWSDynamodb = require('aws-sdk/clients/dynamodb')
let dynamodb = new AWSDynamodb()
const tableName = 'bk_users'  // TODO move to config

exports.handle = function (e, ctx) {
  if (validate(e.userid, 4) === false || e.userid !== e.headers['x-user-id']) {
    return ctx.fail('Invalid userid supplied')
  }
  if (!e.body || !e.body._id || !e.body.userhash || e.body._id !== e.userid) {
    ctx.fail('Invalid request body')
  }
  dynamodb.deleteItem({
    TableName: tableName,
    Key: {
      userhash: {
        S: e.body.userhash
      }
    },
    Expected: {
      _id: {
        Value: { S: e.userid },
        Exists: true
      },
      userhash: {
        Value: { S: e.body.userhash },
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
