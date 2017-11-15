const validate = require('uuid-validate')
const AWSDynamodb = require('aws-sdk/clients/dynamodb')
const tableName = 'bk_users'  // TODO move to config
let dynamodb = new AWSDynamodb()

exports.handle = function (e, ctx) {
  if (validate(e.headers['x-user-id'], 4) === false) {
    return ctx.fail('Invalid userid supplied')
  }
  if (!e.body || !e.body.data || e.body._id !== e.headers['x-user-id']) {
    ctx.fail('Invalid request body')
  }

  dynamodb.putItem({
    TableName: tableName,
    Item: {
      _id: {
        S: e.headers['x-user-id']
      },
      data: {
        M: {
          addData: {
            S: e.body.data.addData
          },
          tagSize: {
            N: e.body.data.tagSize.toString()
          },
          cypher: {
            L: e.body.data.cypher.map(i => { return {'N': i.toString()} })
          },
          iv: {
            L: e.body.data.iv.map(i => { return {'N': i.toString()} })
          }
        }
      }
    },
    ReturnValues: 'NONE',
    ReturnConsumedCapacity: 'NONE'
  }, (err, result) => {
    if (err) {
      console.log(err)
      return ctx.fail('Invalid userdata supplied')
    }
    ctx.succeed()
  })
}
