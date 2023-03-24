###  NFT contracts

how to do a quick test

#### install hardhat prerequisites 
Node version 16.*, then:
```bash
npm install 
```
#### set up env variables
create .env file from .env.sample

#### start unit tests

```bash
npx hardhat test
```

#### deploy all contracts on localhost network


1. start hardhat node

```bash
npx hardhat node
```
2.  deploy contracts

```bash
 npx hardhat run --network localhost scripts/deployAll.js
```

3.  verify challenge

```bash
 npx hardhat verify --network localhost <CONTRACT_ADDRESS> <CHALLENGE_Token_ADDRESS>
```

4.  verify collection (ERC1155)

```bash
 npx hardhat verify --network localhost <CONTRACT_ADDRESS> 'Bullz Collection' 'BULLZ'
```

5.  verify exchange (multiple)

```bash
 npx hardhat verify --network localhost <CONTRACT_ADDRESS>
```

#### deploy specific contract

```bash
 npx hardhat run --network localhost scripts/deploy{contact_name}.js
```