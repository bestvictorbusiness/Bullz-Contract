const utilityToken = '0x5BEbB7574b26f340485c2207F8a5370Eed4e4587'; //Goerli
// const utilityToken = '0x5BEbB7574b26f340485c2207F8a5370Eed4e4587'; //BSC
// const utilityToken = '0x63b7b22c8caf991c3b08036a013c85ef1bb4e7f1'; //Poly
// const utilityToken = '0x5bebb7574b26f340485c2207f8a5370eed4e4587'; //Fuji avalanche
// const utilityToken = '0x5BEbB7574b26f340485c2207F8a5370Eed4e4587'; //ARbtest

// const utilityToken = '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9'; //ARBMAIN

const primaryToken = '0xB7fF000273faf6cdD98C524689e15258f250B656'; //WOM token goerli
// const primaryToken = '0xdF06C163A91C8B63bb0bEd452a174234d736883d'; //WOM token BSC
// const primaryToken = '0x515cea0e9d7F8c297bB9E832DFAcdb82CA8D8d37'; //WOM token poly
// const primaryToken = '0xb54A2a3059A419Db76EC7833f69CA80e80A5e884'; //WOM token avalanche
// const primaryToken = '0x5BEbB7574b26f340485c2207F8a5370Eed4e4587'; //USDT token arbitrum

function toSuccess(result){
    console.log(`\x1b[33m${result} \x1b[0m`);
}
async function main() {

    // deploy NFT Tokens
    // const ERC1155Openzeppelin = await ethers.getContractFactory("ERC1155Openzeppelin");
    // console.log('\n', '-----------------------Deployment starting for ERC1155Openzeppelin');
    // const erc1155Openzeppelin = await ERC1155Openzeppelin.deploy('Bullz Collection', 'BULLZ');
    // await erc1155Openzeppelin.deployed();
    // toSuccess('ERC1155Openzeppelin Contract deployed to address:'+ erc1155Openzeppelin.address);
  
    // const ERC721Openzeppelin = await ethers.getContractFactory('ERC721Openzeppelin');
    // console.log('\n', '-----------------------Deployment starting for ERC721Openzeppelin');
    // const erc721Openzeppelin = await ERC721Openzeppelin.deploy('baSEURI');
    // await erc721Openzeppelin.deployed();
    // toSuccess('ERC721Openzeppelin Contract deployed to address:'+ erc721Openzeppelin.address);

    // deploy Loyalty
    // console.log('\n-----------------------Deployment starting for Loyalty');
    // const Loyalty = await ethers.getContractFactory('Loyalty');
    // const loyalty = await Loyalty.deploy();
    // await loyalty.deployed();
    // toSuccess('Loyalty Contract deployed to address:'+ loyalty.address);

    // deploy ERC20 token
    // console.log('\n', '-----------------------Deployment starting fro ERC20');
    // const TestERC20 =  await ethers.getContractFactory('TestERC20');
    // const erc20 = await TestERC20.deploy();
    // await erc20.deployed();
    // toSuccess('Erc20 Contract deployed to address:'+ erc20.address);
    
    
    // deploy challenge
    const ExchangeChallenge = await ethers.getContractFactory('ExchangeChallenge');
    console.log('\n', '-----------------------Deployment starting for ExchangeChallenge');  
    const exchangeChallenge = await ExchangeChallenge.deploy(utilityToken, primaryToken);
    await exchangeChallenge.deployed();
    toSuccess('ExchangeChallenge: '+ exchangeChallenge.address);

    //Deploy nft exchanges
    // const BullzSingleExchange = await ethers.getContractFactory('BullzSingleExchange');
    // const BullzMultipleExchange = await ethers.getContractFactory('BullzMultipleExchange');
  
    // Start deployment, returning a promise that resolves to a contract object
    // console.log('\n', '-----------------------Deployment starting for BullzExchange');
    // const bullzSingleExchange = await BullzSingleExchange.deploy(loyalty.address);
    // await bullzSingleExchange.deployed();
    // toSuccess('BullzSingleExchange Contract deployed to address:'+ bullzSingleExchange.address);
  
    // console.log('\n', '-----------------------Deployment starting for BullzMultipleExchange');
    // const bullzMultipleExchange = await BullzMultipleExchange.deploy();
    // await bullzMultipleExchange.deployed();
    // toSuccess('BullzMultipleExchange Contract deployed to address:'+ bullzMultipleExchange.address);

  }
  
  main()
    .then(() => process.exit(0)
    .catch((error) => {
      console.error(error);
      process.exit(1);
    }));
  