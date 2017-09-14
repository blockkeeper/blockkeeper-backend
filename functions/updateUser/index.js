const validate = require('uuid-validate')
const AWSDynamodb = require('aws-sdk/clients/dynamodb')
const tableName = 'bk_users'  // TODO move to config
let dynamodb = new AWSDynamodb()

exports.handle = function (e, ctx) {
  if (validate(e.userid, 4) === false) {
    return ctx.fail('Invalid userid supplied')
  }
  if (!e.body || !e.body.data) {
    ctx.fail('Invalid request body')
  }

  // if there is a userhash, we want to create a new user
  if (e.body.userhash) {
    // check for existing _id
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
      Select: 'COUNT'
    }, (err, result) => {
      if (err) {
        console.log(err)
        return ctx.fail('Error')
      }
      if (result && result.Count !== 0) {
        return ctx.fail('Userid exists')
      }
      dynamodb.putItem({
        TableName: tableName,
        Item: {
          userhash: {
            S: e.body.userhash
          },
          _id: {
            S: e.userid
          },
          data: {
            S: e.body.data
          }
        },
        Expected: {
          _id: {
            Exists: false
          },
          userhash: {
            Exists: false
          }
        },
        ReturnValues: 'NONE',
        ReturnConsumedCapacity: 'NONE'
      }, (err, result) => {
        if (err) {
          console.log(err)
          if (err.code === 'ConditionalCheckFailedException') {
            return ctx.fail('Userhash exists')
          }
          return ctx.fail('Invalid userdata supplied')
        }
        ctx.succeed()
      })
    })
  } else {
  // update existing user by _id
  // but first get user cause _id is a GSI
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
      Select: 'SPECIFIC_ATTRIBUTES',
      AttributesToGet: [
        'userhash'
      ]
    }, (err, result) => {
      if (err) {
        console.log(err)
        return ctx.fail('Error')
      }
      if (result && result.Count === 0) {
        return ctx.fail('Userid not found')
      } else if (result && result.Count > 1) {
        return ctx.fail('Error')
      }

      // userhash is fine so do the insert now
      dynamodb.updateItem({
        TableName: tableName,
        Key: {
          userhash: {
            S: result.Items[0].userhash.S
          }
        },
        Expected: {
          _id: {
            Value: { S: e.userid },
            Exists: true
          },
          userhash: {
            Value: { S: result.Items[0].userhash.S },
            Exists: true
          }
        },
        AttributeUpdates: {
          data: {
            Action: 'PUT',
            Value: {
              S: e.body.data
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
    })
  }
}
