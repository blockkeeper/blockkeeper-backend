const got = require('got');
const allowedConverts = ["AUD", "BRL", "CAD", "CHF", "CLP", "CNY", "CZK", "DKK", "EUR", "GBP", "HKD", "HUF", "IDR", "ILS", "INR", "JPY", "KRW", "MXN", "MYR", "NOK", "NZD", "PHP", "PKR", "PLN", "RUB", "SEK", "SGD", "THB", "TRY", "TWD", "ZAR"];
const allowedCurrencies = ["bitcoin", "ethereum", "bitcoin-cash", "ripple", "litecoin", "nem", "dash", "iota", "monero", "ethereum-classic", "neo", "omisego"];

exports.handle = function(e, ctx) {
  let cmcApiEndpoint = 'https://api.coinmarketcap.com/v1/ticker/';
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
  if(e.limit && Number.isInteger(e.limit) && e.limit > 0) {
    if(reqParams.query) {
      reqParams.query.limit = e.limit;
    } else {
      reqParams.limit = {
        limit: e.limit
      };
    }
  }
  if(e.currency && allowedCurrencies.indexOf(e.currency) !== -1) {
    cmcApiEndpoint = cmcApiEndpoint + e.currency;
  }

  got(cmcApiEndpoint, reqParams).then(response => {
    ctx.succeed(response.body);
  }).catch(error => {
  	console.log(JSON.stringify(error));
    ctx.fail("error");
  });

};
