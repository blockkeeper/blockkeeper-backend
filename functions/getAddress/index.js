const AWS_dynamodb = require('aws-sdk/clients/dynamodb');
let dynamodb = new AWS_dynamodb();

exports.handle = function(e, ctx) {
  if(e.userid && e.addressid) {
    dynamodb.getItem({
      TableName: "bk_addresses", //TODO move to config
      Key: {
        id: {
          S: e.addressid
        },
        userid: {
          S: e.userid
        }
      },
      ReturnConsumedCapacity: 'NONE'
    }, (err, result) => {
      if(err) {
        console.log(err);
        return ctx.fail("error");
      }
      if(!result || !result.Item) {
        return ctx.fail("not found");
      }
      ctx.succeed({
        id: result.Item.id.S,
        data: result.Item.data.S,
        tscs: result.Item.tscs.SS
      });
    });
  } else {
    ctx.fail("error params");
  }
};
