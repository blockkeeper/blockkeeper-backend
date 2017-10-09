const validate = require('uuid-validate')
const AWSDynamodb = require('aws-sdk/clients/dynamodb')
let dynamodb = new AWSDynamodb()
const tableName = 'bk_users'  // TODO move to config

exports.handle = function (e, ctx) {
  if (validate(e.userid, 4) !== true) {
    return ctx.fail('Userid invalid')
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
    AttributesToGet: [
      '_id',
      'data'
    ]
  }, (err, result) => {
    if (err || result.Count > 1) {
      console.log(err || JSON.stringify(result))
      return ctx.fail('Error')
    }
    if (!result || result.Count === 0) {
      return ctx.fail('User not found')
    }
    ctx.succeed({
      _id: result.Items[0]._id.S,
      data: result.Items[0].data.S
    })
  })
}
