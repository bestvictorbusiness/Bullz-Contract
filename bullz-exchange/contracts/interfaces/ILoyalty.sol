// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.12;

/// @title Loyalty for Non-fungible token
/// @notice Manage
interface ILoyalty {
    /**
     * @notice loyalty program
     * @dev Get loyalty percentage
     * @param collection The NFT collection address
     * @param assetId the NFT asset identifier
     */
    function getLoyalty(
        address collection,
        uint256 assetId,
        address right_holder
    ) external view returns (uint256);

    /**
     * @notice loyalty program
     * @dev Check loyalty existence
     * @param collection The NFT collection address
     * @param assetId the NFT asset identifier
     */
    function isInLoyalty(address collection, uint256 assetId)
        external
        view
        returns (bool);

    event AddLoyalty(
        address collection,
        uint256 assetId,
        address right_holder,
        uint256 percent
    );
}
