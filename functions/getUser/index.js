const AWS_dynamodb = require('aws-sdk/clients/dynamodb')
let dynamodb = new AWS_dynamodb()

exports.handle = function (e, ctx) {
  if (e.userhash && e.userhash.length > 1) { // TODO do more checks
    dynamodb.getItem({
      TableName: 'bk_users', // TODO move to config
      Key: {
        userhash: {
          S: e.userhash
        }
      },
      ReturnConsumedCapacity: 'NONE'
    }, (err, result) => {
      if (err) {
        console.log(err)
        return ctx.fail('error')
      }
      if (!result || !result.Item) {
        return ctx.fail('user not found')
      }
      ctx.succeed({
        _id: result.Item._id.S,
        _t: result.Item._t.S,
        locale: result.Item.locale.S,
        coins: result.Item.coins.SS
      })
    })
  } else {
    ctx.fail('userhash invalid')
  }
}
