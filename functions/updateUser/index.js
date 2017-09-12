const AWS_dynamodb = require('aws-sdk/clients/dynamodb')
let dynamodb = new AWS_dynamodb()

exports.handle = function (e, ctx) {
  if (e.body && e.body._t && e.body.locale && e.body.coins && Array.isArray(e.body.coins) && e.body.coins.length === 2 && e.body.coins[0] !== e.body.coins[1]) {
    dynamodb.updateItem({
      TableName: 'bk_users', // TODO move to config
      Key: {
        userhash: {
          S: e.userhash
        }
      },
      Expected: {
        userhash: {
          Value: { S: e.userhash },
          Exists: true
        }
      },
      AttributeUpdates: {
        _t: {
          Action: 'PUT',
          Value: {
            S: e.body._t
          }
        },
        locale: {
          Action: 'PUT',
          Value: {
            S: e.body.locale
          }
        },
        coins: {
          Action: 'PUT',
          Value: {
            SS: e.body.coins
          }
        }
      },
      ReturnValues: 'ALL_NEW',
      ReturnConsumedCapacity: 'NONE'
    }, (err, result) => {
      if (err) {
        console.log(err)
        if (err.code === 'ConditionalCheckFailedException') {
          return ctx.fail('userhash not found')
        }
        return ctx.fail('invalid userdata supplied')
      }
      ctx.succeed({
        _id: result.Attributes._id.S,
        _t: result.Attributes._t.S,
        locale: result.Attributes.locale.S,
        coins: result.Attributes.coins.SS
      })
    })
  } else {
    ctx.fail('invalid userdata supplied')
  }
}
