const AWS_dynamodb = require('aws-sdk/clients/dynamodb');
let dynamodb = new AWS_dynamodb();

exports.handle = function(e, ctx) {
  //TODO do some validations
  if(e.id && e.id.length >= 25) {
    dynamodb.getItem({
      TableName: "bk_users", //TODO move to config
      Key: {
        id: {
          S: e.id
        }
      }
    }, (err, result) => {
      if(err) {
        console.log(err);
        return ctx.fail("error");
      }
      if(result && !result.Item) {
        return ctx.fail("not found");
      }
      ctx.succeed({
        _id: result.Item.id.S,
        created: result.Item.created.S,
        locale: result.Item.locale.S,
        crrncs: result.Item.crrncs.SS,
        depots: result.Item.depots.SS,
      });
    });
  } else {
    ctx.fail("error params");
  }
};
