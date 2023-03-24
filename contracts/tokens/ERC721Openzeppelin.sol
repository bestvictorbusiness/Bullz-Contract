// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0 || ^0.8.1;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "../loyalties/Loyalty.sol";

contract ERC721Openzeppelin is ERC721, Loyalty {
    string baseURI;

    constructor(string memory _nbaseURI) ERC721("BULLZ TOKEN", "IYS") {
        baseURI = _nbaseURI;
    }

    function awardItem(
        uint256 newItemId,
        uint256 loyaltyPercent,
        uint256 resaleStatus
    ) public returns (uint256) {
        _mint(_msgSender(), newItemId);
        addLoyalty(newItemId, _msgSender(), loyaltyPercent, resaleStatus);
        return newItemId;
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return baseURI;
    }

    function setBaseURI(string memory newBaseURI) external {
        baseURI = newBaseURI;
    }
}
