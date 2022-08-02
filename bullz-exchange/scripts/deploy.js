async function main() {

  const YaaasExchange = await ethers.getContractFactory("YaaasExchange");
  const YaaasExchangeMultiple = await ethers.getContractFactory("YaaasExchangeMultiple");

  // Start deployment, returning a promise that resolves to a contract object
  console.log("Deployment starting for YaaasExchange");
  const yaaasExchange = await YaaasExchange.deploy();
  await yaaasExchange.deployed();
  console.log("YaaasExchange Contract deployed to address:", yaaasExchange.address);

  console.log("Deployment starting for YaaasExchangeMultiple");
  const yaaasExchangeMultiple = await YaaasExchangeMultiple.deploy();
  await yaaasExchangeMultiple.deployed();
  console.log("YaaasExchangeMultiple Contract deployed to address:", yaaasExchangeMultiple.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
