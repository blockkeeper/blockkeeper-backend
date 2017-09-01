const uuidv4 = require('uuid/v4');
const AWS_dynamodb = require('aws-sdk/clients/dynamodb');
let dynamodb = new AWS_dynamodb();

exports.handle = function(e, ctx) {
  if(!e.body || !e.body.hashemail || !e.body.created || !e.body.locale || !e.body.crrncs) {
    return ctx.fail("error params");
  }

  if(e.body.hashemail && e.body.hashemail.length > 10) {
    const user = {
      hashemail: {
        S: e.body.hashemail
      },
      id: {
        S: uuidv4()
      },
      created: {
        S: e.body.created
      },
      locale: {
        S: e.body.locale
      },
      crrncs: {
        S: e.body.crrncs
      }
    };
    dynamodb.putItem({
      TableName: "bk_users", //TODO move to config
      Item: user,
      Expected: {
        hashemail: {
          Exists: false
        },
        id: {
          Exists: false
        }
      },
      ReturnConsumedCapacity: 'NONE',
      ReturnItemCollectionMetrics: 'NONE'
    }, (err) => {
      if(err) {
        console.log(user);
        console.log(err);
        return ctx.fail("error");
      }
      ctx.succeed({
        id: user.id.S,
        created: user.created.S,
        locale: user.locale.S,
        crrncs: user.crrncs.S
      });
    });
  } else {
    ctx.fail("error params");
  }
};
