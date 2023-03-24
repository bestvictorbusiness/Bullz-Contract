const loyaltyAddress = "0x6613CB6eDd48650d7FeEc4cD0E368120ada9178b";

async function main() {
  
  const BullzSingleExchange = await ethers.getContractFactory("BullzSingleExchange");
  const BullzMultipleExchange = await ethers.getContractFactory("BullzMultipleExchange");

  // Start deployment, returning a promise that resolves to a contract object
  // console.log("Deployment starting for BullzExchange");
  // const bullzSingleExchange = await BullzSingleExchange.deploy(loyaltyAddress);
  // await bullzSingleExchange.deployed();
  // console.log("BullzSingleExchange Contract deployed to address:", bullzSingleExchange.address);

  console.log("Deployment starting for BullzMultipleExchange");
  const bullzMultipleExchange = await BullzMultipleExchange.deploy(loyaltyAddress);
  await bullzMultipleExchange.deployed();
  console.log("BullzMultipleExchange Contract deployed to address:", bullzMultipleExchange.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
