const AWS_dynamodb = require('aws-sdk/clients/dynamodb');
let dynamodb = new AWS_dynamodb();

exports.handle = function(e, ctx) {
  if(e.body && e.body.data && e.body.tscs) {
    dynamodb.updateItem({
      TableName: "bk_addresses", //TODO move to config
      Key: {
        id: {
          S: e.addressid
        },
        userid: {
          S: e.userid
        }
      },
      AttributeUpdates: {
        data: {
          Action: "PUT",
          Value: {
            S: e.body.data
          }
        },
        tscs: {
          Action: "PUT",
          Value: {
            SS: e.body.tscs
          }
        }
      },
      ReturnValues: "ALL_NEW",
      ReturnConsumedCapacity: "NONE"
    }, (err, result) => {
      if(err) {
        console.log(err);
        return ctx.fail("error");
      }
      ctx.succeed({
        id: result.Attributes.id.S,
        data: result.Attributes.data.S,
        tscs: result.Attributes.tscs.SS
      });
    });
  } else {
    ctx.fail("error params");
  }
};
