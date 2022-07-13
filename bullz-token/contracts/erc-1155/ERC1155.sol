pragma solidity >=0.4.22 <0.9.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ERC1155Openzeppelin is ERC1155, Ownable {

    constructor() public ERC1155("https://token-info.com/api/item/{id}.json") {
    }

    function awardItem(uint256 newItemId, uint256 amount, bytes memory data) public returns (uint256) {
        _mint(_msgSender(), newItemId, amount, data);
        return newItemId;
    }
    function setURI(string memory uri) onlyOwner() public returns (string memory){
        _setURI(uri);
        return uri;
    }
}
