async function main() {

    const Loyalty = await ethers.getContractFactory("Loyalty");

    // Start deployment, returning a promise that resolves to a contract object
    console.log("Deployment starting for Loyalty");
    const loyalty = await Loyalty.deploy();
    await loyalty.deployed();
    console.log("Loyalty Contract deployed to address:", loyalty.address);
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
  