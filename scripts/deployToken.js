async function main() {

  const ERC1155Openzeppelin = await ethers.getContractFactory("ERC1155Openzeppelin");
  console.log("Deployment starting for ERC1155Openzeppelin");
  const erc1155Openzeppelin = await ERC1155Openzeppelin.deploy('Bullz Collection', 'BULLZ');
  await erc1155Openzeppelin.deployed();
  console.log("ERC1155Openzeppelin Contract deployed to address:", erc1155Openzeppelin.address);

  // const ERC721Openzeppelin = await ethers.getContractFactory("ERC721Openzeppelin");
  // console.log("Deployment starting for ERC721Openzeppelin");
  // const erc721Openzeppelin = await ERC721Openzeppelin.deploy('baSEURI');
  // await erc721Openzeppelin.deployed();
  // console.log("ERC721Openzeppelin Contract deployed to address:", erc721Openzeppelin.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
