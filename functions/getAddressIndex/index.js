const AWS_dynamodb = require('aws-sdk/clients/dynamodb');
let dynamodb = new AWS_dynamodb();

exports.handle = function(e, ctx) {
  if(e.userid) {
    const queryParameter = {
      TableName: 'bk_addresses', //TODO move to config
      IndexName: 'userid-index',
      KeyConditions: {
        userid: {
          ComparisonOperator: 'EQ',
          AttributeValueList: [
            { S: e.userid}
          ]
        }
      },
      AttributesToGet: [
        'id',
        'data',
        'tscs'
      ],
      ReturnConsumedCapacity: 'NONE'
    };
    if(e.lastkey && e.lastkey !== '') {
      queryParameter.ExclusiveStartKey = {
        id: { S: e.lastkey },
        userid: { S: e.userid }
      };
    }
    dynamodb.query(queryParameter, (err, result) => {
      if(err) {
        console.log(err);
        return ctx.fail("error");
      }
      if(!result || result.Count === 0) {
        return ctx.fail('not found');
      }
      const formatResult = {
          adresses: result.Items.map((obj) => {
            return {
              id: obj.id.S,
              data: obj.data.S,
              tscs: obj.tscs.SS
            };
          })
      };
      if(result.LastEvaluatedKey) {
        formatResult.lastkey = result.LastEvaluatedKey.id.S;
      }
      ctx.succeed(formatResult);
    });
  } else {
    ctx.fail('error params');
  }
};
