// SPDX-License-Identifier: MIT
pragma solidity 0.8.0;
/**
 * @dev contract to manage NFT challenges
 */
import "./interfaces/IBulkAirdrop.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BulkAirDrop is IBulkAirdrop, Ownable {
    mapping(address => bool) whitelistedAddresses;

    constructor() {
        whitelistedAddresses[_msgSender()] = true;
    }

    function addUser(address _addressToWhitelist) public onlyOwner {
        whitelistedAddresses[_addressToWhitelist] = true;
    }

    function removeUser(address _addressToRemove) public onlyOwner {
        whitelistedAddresses[_addressToRemove] = false;
    }

    function verifyUser(address _whitelistedAddress)
        public
        view
        returns (bool)
    {
        bool userIsWhitelisted = whitelistedAddresses[_whitelistedAddress];
        return userIsWhitelisted;
    }

    modifier isWhitelisted(address _address) {
        require(whitelistedAddresses[_address], "You need to be whitelisted");
        _;
    }

    function bulkAirdropNFT(
        address _collection,
        uint256 _assetId,
        address[] calldata _recipients
    ) external override isWhitelisted(_msgSender()) returns (bool) {
        IERC1155 nftCollection = IERC1155(_collection);
        uint256 recipientCount = _recipients.length;
        require(
            nftCollection.balanceOf(_msgSender(), _assetId) >= recipientCount,
            "Insufficient token balance"
        );

        for (uint256 i = 0; i < recipientCount; i++) {
            nftCollection.safeTransferFrom(
                _msgSender(),
                _recipients[i],
                _assetId,
                1,
                ""
            );
        }
        emit BulkAirdrop(_msgSender(), _collection, _assetId, _recipients);
        return true;
    }
}
