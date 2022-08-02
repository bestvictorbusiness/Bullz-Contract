/**
 * @type import('hardhat/config').HardhatUserConfig
 */
 require("dotenv").config();
 require("@nomiclabs/hardhat-ethers");
 require("@nomiclabs/hardhat-etherscan");
 const { PRIVATE_KEY, POLYSCAN_API_KEY, ETHERSCAN_API_KEY } = process.env;
 module.exports = {
   defaultNetwork: "mumbai",
   networks: {
    hardhat: {},
    mumbai:{
      url: 'https://rpc-mumbai.maticvigil.com',
      accounts: [`0x${PRIVATE_KEY}`],
    },
    bsctestnet:{
      url: 'https://data-seed-prebsc-1-s1.binance.org:8545',
      accounts: [`0x${PRIVATE_KEY}`],
    },
    rinkeby: {
      url: `https://rinkeby.infura.io/v3/29f0131a60c4424bb401b8834c78585f`,
      accounts: [`0x${PRIVATE_KEY}`],
    },
    goerli: {
      url: `https://eth-goerli.alchemyapi.io/v2/iN-PGlLtC7flU86i-tx2WaGkp3Nz-J2_`,
      accounts: [`0x${PRIVATE_KEY}`],
    }
   },
   etherscan: {
    apiKey: {
      rinkeby: ETHERSCAN_API_KEY,
      polygonMumbai: POLYSCAN_API_KEY,
      goerli:ETHERSCAN_API_KEY
    },
    // Your API key for Etherscan
    // Obtain one at https://etherscan.io/
    // apiKey: `${POLYSCAN_API_KEY}`
  }
 };
 