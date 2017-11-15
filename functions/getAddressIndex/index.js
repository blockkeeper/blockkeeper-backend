const validate = require('uuid-validate')
const AWSDynamodb = require('aws-sdk/clients/dynamodb')
let dynamodb = new AWSDynamodb()

exports.handle = function (e, ctx) {
  if (validate(e.headers['x-user-id'], 4) !== true) {
    return ctx.fail('Userid invalid')
  }
  if (e.lastkey && validate(e.lastkey, 4) !== true) {
    return ctx.fail('Lastkey invalid')
  }
  const queryParameter = {
    TableName: 'bk_addresses', // TODO move to config
    IndexName: 'userid-index',
    KeyConditions: {
      userid: {
        ComparisonOperator: 'EQ',
        AttributeValueList: [
            { S: e.headers['x-user-id'] }
        ]
      }
    },
    AttributesToGet: [
      '_id',
      'data',
      'type',
      'tscs'
    ],
    ReturnConsumedCapacity: 'NONE'
  }
  if (e.lastkey) {
    queryParameter.ExclusiveStartKey = {
      _id: { S: e.lastkey },
      userid: { S: e.headers['x-user-id'] }
    }
  }
  dynamodb.query(queryParameter, (err, result) => {
    if (err) {
      console.log(err)
      return ctx.fail('Error')
    }
    if (!result || result.Count === 0) {
      return ctx.fail('Addresses not found')
    }
    const formatResult = {
      addresses: result.Items.map((obj) => {
        if (obj.tscs === undefined) { // tscs not required
          obj.tscs = {
            L: []
          }
        }
        return {
          _id: obj._id.S,
          data: {
            addData: obj.data.M.addData.S,
            tagSize: parseInt(obj.data.M.tagSize.N),
            cypher: obj.data.M.cypher.L.map(i => { return parseInt(i.N) }),
            iv: obj.data.M.iv.L.map(i => { return parseInt(i.N) })
          },
          type: obj.type.S,
          tscs: obj.tscs.L.map(i => {
            return {
              addData: i.M.addData.S,
              tagSize: parseInt(i.M.tagSize.N),
              cypher: i.M.cypher.L.map(i => { return parseInt(i.N) }),
              iv: i.M.iv.L.map(i => { return parseInt(i.N) })
            }
          })
        }
      })
    }

    if (result.LastEvaluatedKey) {
      formatResult.lastkey = result.LastEvaluatedKey._id.S
    }

    ctx.succeed(formatResult)
  })
}
