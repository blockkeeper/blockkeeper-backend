const cmcApiEndpoint = 'https://api.coinmarketcap.com/v1/global/';
const got = require('got');
const allowedConverts = ["AUD", "BRL", "CAD", "CHF", "CLP", "CNY", "CZK", "DKK", "EUR", "GBP", "HKD", "HUF", "IDR", "ILS", "INR", "JPY", "KRW", "MXN", "MYR", "NOK", "NZD", "PHP", "PKR", "PLN", "RUB", "SEK", "SGD", "THB", "TRY", "TWD", "ZAR"];


exports.handle = function(e, ctx) {
  const reqParams = {
    timeout: 1300,
    retries: 2,
    json: true
  };
  if(e.convert && allowedConverts.indexOf(e.convert) !== -1) {
    reqParams.query = {
      convert: e.convert
    };
  }

  got(cmcApiEndpoint, reqParams).then(response => {
    ctx.succeed(response.body);
  }).catch(error => {
  	console.log(JSON.stringify(error));
    ctx.fail("error");
  });

};
