#!/bin/bash
for ARGUMENT in "$@"
do
   KEY=$(echo $ARGUMENT | cut -f1 -d=)

   KEY_LENGTH=${#KEY}
   VALUE="${ARGUMENT:$KEY_LENGTH+1}"

   export "$KEY"="$VALUE"
done

cd challenge-contract
# REPLACE THE ADDRESS WITH DEPLOYED BulkAirDrop ADDRESS
# npx hardhat verify --network $network 0x6f05392d91Bc5d0B532ff0AAD9663530565B0c1C
# REPLACE THE ADDRESS WITH DEPLOYED ExchangeChallenge ADDRESS, SECOND ADDRESS WILL BE FIXED AS ARGUMENT
# token address in rinkeby: 0x838bca7f3949299c9eb15d3e982406e2cdbedaf2
# token address in goerly: 0x5BEbB7574b26f340485c2207F8a5370Eed4e4587
# token address in polygon: 0x63b7b22c8caf991c3b08036a013c85ef1bb4e7f1
# token address in BSC: 0x5BEbB7574b26f340485c2207F8a5370Eed4e4587
npx hardhat verify --network $network 0xCd4459FF1fA575a4b7f71eA155a62C01b63Cad3a 0x5BEbB7574b26f340485c2207F8a5370Eed4e4587
cd ..

cd tokens
# REPLACE THE ADDRESS WITH DEPLOYED ERC721Openzeppelin ADDRESS
# npx hardhat verify --network $network 0xf0efEF6D363160379756bA8702a0B699e0358918
# REPLACE THE ADDRESS WITH DEPLOYED ERC1155Openzeppelin ADDRESS
npx hardhat verify --network $network 0x39a348c47108D0089e7bB4bcA286bDFE5FeCC7FE 'Bullz Collection' 'BULLZ'
cd ..

# cd bullz-exchange
# # REPLACE THE ADDRESS WITH DEPLOYED BullzExchange ADDRESS
# npx hardhat verify --network $network 0x921380D77Ba618F0370922Fe3434F33E9ab3c06D
# # REPLACE THE ADDRESS WITH DEPLOYED BullzExchangeMultiple ADDRESS
# npx hardhat verify --network $network 0x171666096807292b6912A19B1DF579ae1ED06B3B
# cd ..