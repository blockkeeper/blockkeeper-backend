const uuidv4 = require('uuid/v4')
const AWS_dynamodb = require('aws-sdk/clients/dynamodb')
let dynamodb = new AWS_dynamodb()

exports.handle = function (e, ctx) {
  if (!e.body || !e.body.userhash || !e.body._t || !e.body.locale || !e.body.coins || Array.isArray(e.body.coins) !== true || e.body.coins.length !== 2) {
    return ctx.fail('invalid userdata supplied')
  }
  const user = {
    userhash: {
      S: e.body.userhash
    },
    _id: {
      S: uuidv4()
    },
    _t: {
      S: e.body._t
    },
    locale: {
      S: e.body.locale
    },
    coins: {
      SS: e.body.coins
    }
  }
  dynamodb.putItem({
    TableName: 'bk_users', // TODO move to config
    Item: user,
    Expected: {
      userhash: {
        Exists: false
      },
      _id: {
        Exists: false
      }
    },
    ReturnConsumedCapacity: 'NONE',
    ReturnItemCollectionMetrics: 'NONE'
  }, (err) => {
    if (err) {
      console.log(user)
      console.log(err)
      if (err.code === 'ConditionalCheckFailedException') {
        return ctx.fail('userhash exists')
      }
      return ctx.fail('error')
    }
    ctx.succeed({
      _id: user._id.S,
      _t: user._t.S,
      locale: user.locale.S,
      coins: user.coins.SS
    })
  })
}
