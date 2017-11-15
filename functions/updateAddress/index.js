const validate = require('uuid-validate')
const AWSDynamodb = require('aws-sdk/clients/dynamodb')
let dynamodb = new AWSDynamodb()
const tscTypesAllowed = ['hd', 'std', 'man']

exports.handle = function (e, ctx) {
  if (validate(e.headers['x-user-id'], 4) === false) {
    return ctx.fail('Invalid userid supplied')
  }
  if (validate(e.addressid, 4) === false) {
    return ctx.fail('Invalid adressid supplied')
  }
  if (
      !e.body ||
      !e.body.data ||
      !e.body.type ||
      !e.body.tscs ||
      tscTypesAllowed.indexOf(e.body.type) === -1 ||
      Array.isArray(e.body.tscs) === false ||
      e.body.tscs.length > 100
    ) {
    return ctx.fail('Invalid body supplied')
  }
  const updates = {
    data: {
      Action: 'PUT',
      Value: {
        M: {
          addData: {S: e.body.data.addData},
          tagSize: {N: e.body.data.tagSize.toString()},
          cypher: {L: e.body.data.cypher.map(i => { return {'N': i.toString()} })},
          iv: {L: e.body.data.iv.map(i => { return {'N': i.toString()} })}
        }
      }
    },
    type: {
      Action: 'PUT',
      Value: {
        S: e.body.type
      }
    }
  }
  if (e.body.tscs.length > 0) {
    updates.tscs = {
      Action: 'PUT',
      Value: {
        L: e.body.tscs.map(i => {
          return {
            M: {
              addData: {S: i.addData},
              tagSize: {N: i.tagSize.toString()},
              cypher: {L: i.cypher.map(i => { return {'N': i.toString()} })},
              iv: {L: i.iv.map(i => { return {'N': i.toString()} })}
            }

          }
        })
      }
    }
  }
  dynamodb.updateItem({
    TableName: 'bk_addresses', // TODO move to config
    Key: {
      _id: {
        S: e.addressid
      },
      userid: {
        S: e.headers['x-user-id']
      }
    },
    AttributeUpdates: updates,
    ReturnValues: 'ALL_NEW',
    ReturnConsumedCapacity: 'NONE'
  }, (err, result) => {
    if (err) {
      console.log(err)
      return ctx.fail('Error')
    }
    ctx.succeed()
  })
}
