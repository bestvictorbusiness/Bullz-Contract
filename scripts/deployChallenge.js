const utilityToken = '0x5BEbB7574b26f340485c2207F8a5370Eed4e4587'; //ETH goerli
// const utilityToken = '0x5BEbB7574b26f340485c2207F8a5370Eed4e4587'; //bsc test
// const utilityToken = '0x63b7b22c8caf991c3b08036a013c85ef1bb4e7f1'; //poly test
async function main() {
  try {
    const ExchangeChallenge = await ethers.getContractFactory("ExchangeChallenge");
    console.log("Deployment starting for ExchangeChallenge");  
    const exchangeChallenge = await ExchangeChallenge.deploy(utilityToken);
    // console.log('exchangeChallenge', exchangeChallenge);
    await exchangeChallenge.deployed();
    console.log("ExchangeChallenge Contract deployed to address:", exchangeChallenge.address);
  } catch (exception) {
    console.log('exception', exception);
  }
}


main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
