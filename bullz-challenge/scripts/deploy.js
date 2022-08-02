async function main() {
  const BulkAirDrop = await ethers.getContractFactory("BulkAirDrop");
  const ExchangeChallenge = await ethers.getContractFactory("ExchangeChallenge");

  // Start deployment, returning a promise that resolves to a contract object
  // console.log("Deployment starting for BulkAirDrop");
  // const bulkAirDrop = await BulkAirDrop.deploy();
  // await bulkAirDrop.deployed();
  // console.log("BulkAirDrop Contract deployed to address:", bulkAirDrop.address);

  console.log("Deployment starting for ExchangeChallenge");
// token address in rinkeby: 0x838bca7f3949299c9eb15d3e982406e2cdbedaf2
// token address in goerly: 0x5BEbB7574b26f340485c2207F8a5370Eed4e4587
// token address in polygon: 0x63b7b22c8caf991c3b08036a013c85ef1bb4e7f1
// token address in BSC: 0x5BEbB7574b26f340485c2207F8a5370Eed4e4587

  const exchangeChallenge = await ExchangeChallenge.deploy('0x5BEbB7574b26f340485c2207F8a5370Eed4e4587');
  await exchangeChallenge.deployed();
  console.log("ExchangeChallenge Contract deployed to address:", exchangeChallenge.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
