const AWS_dynamodb = require('aws-sdk/clients/dynamodb');
let dynamodb = new AWS_dynamodb();

exports.handle = function(e, ctx) {
  if(e.body && e.body.created && e.body.locale && e.body.crrncs) {
    dynamodb.updateItem({
      TableName: "bk_users", //TODO move to config
      Key: {
        hashemail: {
          S: e.hashemail
        }
      },
      AttributeUpdates: {
        created: {
          Action: "PUT",
          Value: {
            S: e.body.created
          }
        },
        locale: {
          Action: "PUT",
          Value: {
            S: e.body.locale
          }
        },
        crrncs: {
          Action: "PUT",
          Value: {
            S: e.body.crrncs
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
        created: result.Attributes.created.S,
        locale: result.Attributes.locale.S,
        crrncs: result.Attributes.crrncs.S
      });
    });
  } else {
    ctx.fail("error params");
  }
};
