/** @type import('hardhat/config').HardhatUserConfig */
require("@nomiclabs/hardhat-waffle");
require("dotenv").config();
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
require('solidity-coverage');
const { PRIVATE_KEY, POLYSCAN_API_KEY, ETHERSCAN_API_KEY, BSC_API_KEY, FUJI_API_KEY, POLY_RPC_URL, BSC_RPC_URL, ETH_RCP_URL, AVAL_RPC_URL, ARB_RPC_URL, ARB_API_KEY } = process.env;
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.0",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1000,
          }},
      },
      {
        version: "0.8.1",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1000,
          }},
      },
    ],
  },
  networks: {
    hardhat: {},
    polygon:{
      url: POLY_RPC_URL,
      accounts: [`0x${PRIVATE_KEY}`],
    },
    binance:{
      url: BSC_RPC_URL,
      accounts: [`0x${PRIVATE_KEY}`],
    },
    ethereum: {
      url: ETH_RCP_URL,
      accounts: [`0x${PRIVATE_KEY}`],
    },
    avalanche: {
      url: AVAL_RPC_URL,
      accounts: [`0x${PRIVATE_KEY}`],
    },
    arbitrum: {
      url: ARB_RPC_URL,
      accounts: [`0x${PRIVATE_KEY}`],
    }
   },
   etherscan: {
    apiKey: {
      rinkeby: ETHERSCAN_API_KEY,
      polygonMumbai: POLYSCAN_API_KEY,
      goerli:ETHERSCAN_API_KEY,
      bscTestnet:BSC_API_KEY,
      avalancheFujiTestnet: FUJI_API_KEY,
      arbitrumGoerli: ARB_API_KEY,
      mainnet: ETHERSCAN_API_KEY,
      polygon: POLYSCAN_API_KEY,
      bsc:BSC_API_KEY,
      avalanche: FUJI_API_KEY,
      arbitrumOne: ARB_API_KEY,
    }
  }
};
extendEnvironment((hre) => {
  const Web3 = require("web3");
  hre.Web3 = Web3;
  hre.web3 = new Web3(hre.network.provider);
});