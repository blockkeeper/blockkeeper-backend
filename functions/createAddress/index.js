const uuidv4 = require('uuid/v4');
const AWS_dynamodb = require('aws-sdk/clients/dynamodb');
let dynamodb = new AWS_dynamodb();

exports.handle = function(e, ctx) {
  console.log(JSON.stringify(e));
  if(!e.body || !e.body.data || !e.body.tscs) {
    return ctx.fail("error params");
  }
  const address = {
    id: {
      S: uuidv4()
    },
    userid: {
      S: e.userid
    },
    data: {
      S: e.body.data
    },
    tscs: {
      SS: e.body.tscs
    }
  };
  dynamodb.putItem({
    TableName: "bk_addresses", //TODO move to config
    Item: address,
    Expected: {
      id: {
        Exists: false
      },
      userid: {
        Exists: false
      }
    },
    ReturnConsumedCapacity: 'NONE',
    ReturnItemCollectionMetrics: 'NONE'
  }, (err) => {
    if(err) {
      console.log(err);
      return ctx.fail("error");
    }
    ctx.succeed({
      id: address.id.S,
      data: address.data.S,
      tscs: address.tscs.SS
    });
  });
};
