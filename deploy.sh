#!/bin/bash

for ARGUMENT in "$@"
do
   KEY=$(echo $ARGUMENT | cut -f1 -d=)

   KEY_LENGTH=${#KEY}
   VALUE="${ARGUMENT:$KEY_LENGTH+1}"

   export "$KEY"="$VALUE"
done

echo $network

cd challenge-contract
yarn install
npx hardhat compile
npx hardhat --network $network run scripts/deploy.js
cd ..


cd tokens
yarn install
npx hardhat compile
npx hardhat --network $network run scripts/deploy.js
cd ..


# cd bullz-exchange
# yarn install
# npx hardhat compile
# npx hardhat --network $network run scripts/deploy.js
# cd ..

