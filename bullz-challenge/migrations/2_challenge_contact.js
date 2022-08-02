const ExchangeChallenge = artifacts.require("ExchangeChallenge");

module.exports = function (deployer) {
  deployer.deploy(ExchangeChallenge, '0x79636b0b187220F3420a131F989a83f6eFe7bEA7');
};
