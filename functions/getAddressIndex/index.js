const validate = require('uuid-validate')
const AWS_dynamodb = require('aws-sdk/clients/dynamodb')
let dynamodb = new AWS_dynamodb()

exports.handle = function (e, ctx) {
  if (validate(e.userid, 4) !== true) {
    return ctx.fail('userid invalid')
  }
  if (e.lastkey && validate(e.lastkey, 4) !== true) {
    return ctx.fail('lastkey invalid')
  }
  const queryParameter = {
    TableName: 'bk_addresses', // TODO move to config
    IndexName: 'userid-index',
    KeyConditions: {
      userid: {
        ComparisonOperator: 'EQ',
        AttributeValueList: [
            { S: e.userid }
        ]
      }
    },
    AttributesToGet: [
      '_id',
      'data',
      'tscs'
    ],
    ReturnConsumedCapacity: 'NONE'
  }
  if (e.lastkey) {
    queryParameter.ExclusiveStartKey = {
      _id: { S: e.lastkey },
      userid: { S: e.userid }
    }
  }
  dynamodb.query(queryParameter, (err, result) => {
    if (err) {
      console.log(err)
      return ctx.fail('error')
    }
    if (!result || result.Count === 0) {
      return ctx.fail('addresses not found')
    }
    const formatResult = {
      addresses: result.Items.map((obj) => {
        return {
          _id: obj._id.S,
          data: obj.data.S,
          tscs: obj.tscs.SS
        }
      })
    }
    if (result.LastEvaluatedKey) {
      formatResult.lastkey = result.LastEvaluatedKey._id.S
    }
    ctx.succeed(formatResult)
  })
}
