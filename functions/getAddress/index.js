const validate = require('uuid-validate')
const AWSDynamodb = require('aws-sdk/clients/dynamodb')
let dynamodb = new AWSDynamodb()

exports.handle = function (e, ctx) {
  if (validate(e.headers['x-user-id'], 4) !== true) {
    return ctx.fail('Invalid userid supplied')
  }
  if (validate(e.addressid, 4) !== true) {
    return ctx.fail('Invalid addressid supplied')
  }
  dynamodb.getItem({
    TableName: 'bk_addresses', // TODO move to config
    Key: {
      _id: {
        S: e.addressid
      },
      userid: {
        S: e.headers['x-user-id']
      }
    },
    ReturnConsumedCapacity: 'NONE'
  }, (err, result) => {
    if (err) {
      console.log(err)
      return ctx.fail('Error')
    }
    if (!result || !result.Item) {
      return ctx.fail('Address not found')
    }
    if (result.Item.tscs === undefined) { // tscs not required
      result.Item.tscs = {
        L: []
      }
    }
    ctx.succeed({
      _id: result.Item._id.S,
      data: {
        addData: result.Item.data.M.addData.S,
        tagSize: parseInt(result.Item.data.M.tagSize.N),
        cypher: result.Item.data.M.cypher.L.map(i => { return parseInt(i.N) }),
        iv: result.Item.data.M.iv.L.map(i => { return parseInt(i.N) })
      },
      type: result.Item.type.S,
      tscs: result.Item.tscs.L.map(i => {
        return {
          addData: i.M.addData.S,
          tagSize: parseInt(i.M.tagSize.N),
          cypher: i.M.cypher.L.map(i => { return parseInt(i.N) }),
          iv: i.M.iv.L.map(i => { return parseInt(i.N) })
        }
      })
    })
  })
}
