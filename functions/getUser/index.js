const validate = require('uuid-validate')
const AWSDynamodb = require('aws-sdk/clients/dynamodb')
let dynamodb = new AWSDynamodb()
const tableName = 'bk_users'  // TODO move to config

exports.handle = function (e, ctx) {
  if (validate(e.headers['x-user-id'], 4) !== true) {
    return ctx.fail('Userid invalid')
  }

  dynamodb.getItem({
    TableName: tableName,
    Key: {
      _id: {
        S: e.headers['x-user-id']
      }
    },
    AttributesToGet: [
      'data'
    ]
  }, (err, result) => {
    if (err) {
      console.log(err || JSON.stringify(result))
      return ctx.fail('Error')
    }
    if (!result || !result.Item) {
      return ctx.fail('User not found')
    }
    ctx.succeed({
      _id: e.headers['x-user-id'],
      data: {
        addData: result.Item.data.M.addData.S,
        tagSize: parseInt(result.Item.data.M.tagSize.N),
        cypher: result.Item.data.M.cypher.L.map(i => { return parseInt(i.N) }),
        iv: result.Item.data.M.iv.L.map(i => { return parseInt(i.N) })
      }
    })
  })
}
