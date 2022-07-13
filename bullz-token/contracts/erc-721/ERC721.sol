pragma solidity >=0.4.22 <0.9.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract ERC721Openzeppelin is ERC721 {

    constructor() ERC721("Bullz Token", "BULLZ") public {
    
    }
    function awardItem(uint256 newItemId, address holder, string memory tokenURI) public returns (uint256) {
        _mint(holder, newItemId);
        _setTokenURI(newItemId, tokenURI);
        return newItemId;
    }
}
