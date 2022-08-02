const YaaasExchangeMultiple = artifacts.require("YaaasMultipleExchange");

module.exports = function (deployer) {
  deployer.deploy(YaaasExchangeMultiple);
};
