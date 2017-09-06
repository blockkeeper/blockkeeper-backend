const validate = require('uuid-validate')
const AWS_dynamodb = require('aws-sdk/clients/dynamodb')
let dynamodb = new AWS_dynamodb()

exports.handle = function (e, ctx) {
  if (validate(e.userid, 4) !== true) {
    return ctx.fail('invalid userid supplied')
  }
  if (validate(e.addressid, 4) !== true) {
    return ctx.fail('invalid addressid supplied')
  }
  dynamodb.getItem({
    TableName: 'bk_addresses', // TODO move to config
    Key: {
      _id: {
        S: e.addressid
      },
      userid: {
        S: e.userid
      }
    },
    ReturnConsumedCapacity: 'NONE'
  }, (err, result) => {
    if (err) {
      console.log(err)
      return ctx.fail('error')
    }
    if (!result || !result.Item) {
      return ctx.fail('address not found')
    }
    ctx.succeed({
      _id: result.Item._id.S,
      data: result.Item.data.S,
      tscs: result.Item.tscs.SS
    })
  })
}
