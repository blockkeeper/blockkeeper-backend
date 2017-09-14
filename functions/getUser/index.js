const AWSDynamodb = require('aws-sdk/clients/dynamodb')
let dynamodb = new AWSDynamodb()
const tableName = 'bk_users'  // TODO move to config

exports.handle = function (e, ctx) {
  if (e.userhash && e.userhash.length <= 1) { // TODO do more checks
    return ctx.fail('Userhash invalid')
  }
  dynamodb.getItem({
    TableName: tableName,
    Key: {
      userhash: {
        S: e.userhash
      }
    },
    AttributesToGet: [
      '_id',
      'data'
    ],
    ReturnConsumedCapacity: 'NONE'
  }, (err, result) => {
    if (err) {
      console.log(err)
      return ctx.fail('Error')
    }
    if (!result || !result.Item) {
      return ctx.fail('User not found')
    }
    ctx.succeed({
      _id: result.Item._id.S,
      data: result.Item.data.S
    })
  })
}
