// SPDX-License-Identifier: MIT

pragma solidity >=0.6.9 <0.8.13;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract TestERC721 is ERC721 {
    constructor()ERC721("TEST", "TEST721"){

    }
    function mint(address to, uint assetId) external {
        _mint(to, assetId);
    }
}
