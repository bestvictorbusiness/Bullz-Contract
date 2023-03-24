// SPDX-License-Identifier: MIT
pragma solidity 0.8.0;

interface IBulkAirdrop {
    function bulkAirdropNFT(
        address collection,
        uint256 nftId,
        address[] calldata _recipients
    ) external returns (bool);

    event BulkAirdrop(
        address owner,
        address collection,
        uint256 nftId,
        address[] _recipients
    );
}
