// SPDX-License-Identifier: MIT

pragma solidity ^0.8.12;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract ERC721Validator {
    bytes4 constant _INTERFACE_ID_ERC721 = 0x80ac58cd;

    function _requireERC721(address _nftAddress)
        internal
        view
        returns (IERC721)
    {
        require(
            IERC721(_nftAddress).supportsInterface(_INTERFACE_ID_ERC721),
            "The NFT contract has an invalid ERC721 implementation"
        );

        return IERC721(_nftAddress);
    }
}
