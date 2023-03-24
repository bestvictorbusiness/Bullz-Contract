// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

/**
 * @dev contract to manage NFT challenges
 */
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

import "./interfaces/INFTChallenge.sol";
import "./Challenge.sol";

abstract contract NFTChallenge is Challenge, ERC1155Holder, INFTChallenge {
    mapping(bytes32 => Challenge) public challenges; // marketplace challenges
    using Counters for Counters.Counter;
    Counters.Counter private _challengeIdCounter;

    constructor(address token) {
        setMarketToken(token);
    }

    function addChallenge(
        address collection,
        uint256 assetId,
        uint256 amount,
        uint256 airdropStartAt,
        uint256 airdropEndAt,
        uint256 eventIdAddChallenge
    ) external override {
        _addChallenge(
            collection,
            assetId,
            amount,
            airdropStartAt,
            airdropEndAt,
            eventIdAddChallenge
        );
    }

    /**
     * @dev Save new challenge
     * @param collection ERC1155 collection
     * @param assetId the NFT identifer
     * @param amount the amount in airdrop
     * @param airdropStartAt airdrop start date
     * @param airdropEndAt airdrop start date
     * @param eventIdAddChallenge a tracking id used to sync db
     */
    function _addChallenge(
        address collection,
        uint256 assetId,
        uint256 amount,
        uint256 airdropStartAt,
        uint256 airdropEndAt,
        uint256 eventIdAddChallenge
    ) internal returns (bytes32) {
        require(
            collection != address(0),
            "Challenge Exchange: Collection address not valid"
        );
        require(
            !airdropped[collection][assetId],
            "Challenge Exchange: Can not add for re challenge"
        );
        require(
            marketToken.balanceOf(_msgSender()) >= _getTotalAirdropFee(amount, bullzFee),
            "Challenge Exchange: Insufficient balance"
        );
        require(
            airdropStartAt > block.timestamp,
            "Challenge Exchange: invalid start at airdrop"
        );
        require(
            airdropEndAt > airdropStartAt,
            "Challenge Exchange: invalid airdropEndAt at airdrop"
        );
        IERC1155 nftCollection = IERC1155(collection);
        require(
            nftCollection.balanceOf(_msgSender(), assetId) >= amount,
            "Insufficient token balance"
        );
        _challengeIdCounter.increment();
        uint256 newChallengeId = _challengeIdCounter.current();
        bytes32 challengeId = keccak256(
            abi.encodePacked(block.timestamp, msg.sender, newChallengeId)
        );
        challenges[challengeId] = Challenge(
            _msgSender(),
            collection,
            assetId,
            amount,
            airdropStartAt,
            airdropEndAt,
            ChallengeStatus.CREATED
        );

        emit AddChallenge(
            challengeId,
            _msgSender(),
            collection,
            assetId,
            amount,
            airdropStartAt,
            airdropEndAt,
            bullzFee,
            eventIdAddChallenge
        );

        SafeERC20.safeTransferFrom(
            marketToken,
            _msgSender(),
            owner(),
            _getTotalAirdropFee(amount, bullzFee)
        );

        nftCollection.safeTransferFrom(
            _msgSender(),
            address(this),
            assetId,
            amount,
            ""
        );

        return challengeId;
    }

    /**
     * @dev aidrop an NFT to a winner
     * @param receiver the aindrop nft receiver
     * @param amount the amount to aidrop to receiver
     * @param eventIdAirDropChallenge a tracking id used to sync db
     */
    function airdropChallenge(
        bytes32 challengeId,
        address receiver,
        uint256 amount,
        uint256 eventIdAirDropChallenge
    ) external override returns (bool) {
        require(
            receiver != address(0),
            "Challenge Exchange: Receiver address not valid"
        );
        Challenge memory challenge = challenges[challengeId];
        require(
            challenge.seller == _msgSender(),
            "Challenge Exchange: caller not an owner"
        );
        require(
            challenge.amount >= amount,
            "Challenge Exchange: Insufficient balance airdrop"
        );
        require(
            block.timestamp >= challenge.airdropStartAt,
            "Challenge Exchange: invalid start at airdrop"
        );

        challenge.amount = challenge.amount - amount;
        challenge.status = ChallengeStatus.IN_AIRDROP;

        challenges[challengeId] = challenge;
        IERC1155 nftCollection = IERC1155(challenge.collection);

        if (!airdropped[challenge.collection][challenge.assetId]) {
            airdropped[challenge.collection][challenge.assetId] = true;
        }

        emit AirDropChallenge(
            challengeId,
            receiver,
            amount,
            eventIdAirDropChallenge
        );
        
        nftCollection.safeTransferFrom(
            address(this),
            receiver,
            challenge.assetId,
            amount,
            ""
        );
        return true;
    }

    function withdrawChallenge(
        bytes32 challengeId,
        uint256 eventIdWithdrawChallenge
    ) external override returns (bool) {
        Challenge memory challenge = challenges[challengeId];
        require(
            challenge.seller == _msgSender(),
            "Challenge Exchange: caller not an owner"
        );
        require(
            challenge.airdropEndAt < block.timestamp,
            "Challenge exchange airdrop not ended"
        );

        require(
            challenge.status == ChallengeStatus.CREATED ||
                challenge.status == ChallengeStatus.IN_AIRDROP,
            "Challenge exchange: challenge not withdrawable"
        );

        require(
            challenge.amount > 0,
            "Challenge Exchange: No NFTs to return."
        );

        IERC1155 nftCollection = IERC1155(challenge.collection);

        challenge.status = ChallengeStatus.WITHDRAWN;
        challenges[challengeId] = challenge;

         nftCollection.safeTransferFrom(
            address(this),
            _msgSender(),
            challenge.assetId,
            challenge.amount,
            ""
        );

        emit WithdrawChallenge(challengeId, eventIdWithdrawChallenge);
        return true;
    }



    /**
     * @dev aidrop an NFT to a winner
     * @param recipients the aindrop nft receivers
     * @param amounts the amount to aidrop to receivers
     * @param eventIdAirDropChallenge a tracking id used to sync db
     */
    function bulkAirdropChallenge(
        bytes32 challengeId,
        address[] calldata recipients,
        uint256[] calldata amounts,
        uint256 eventIdAirDropChallenge
    ) external override returns (bool) {
        
        uint256 recipientCount = recipients.length;
        require(
                recipientCount == amounts.length,
                "Challenge Exchange: recipients and amounts array length mismatches."
        );
        uint256 airdropNFTAmount = 0;
        for (uint256 i = 0; i < recipientCount; i++) {
            require(
                recipients[i] != address(0),
                "Challenge Exchange: Receiver address not valid"
            );
            airdropNFTAmount = airdropNFTAmount + amounts[i];

        }
        Challenge memory challenge = challenges[challengeId];
        require(
            challenge.seller == _msgSender(),
            "Challenge Exchange: caller not an owner"
        );
        
        require(
            challenge.amount >= airdropNFTAmount,
            "Challenge Exchange: Insufficient NFT balance to airdrop"
        );
        require(
            block.timestamp >= challenge.airdropStartAt,
            "Challenge Exchange: invalid start at airdrop"
        );

        challenge.amount = challenge.amount - airdropNFTAmount;
        challenge.status = ChallengeStatus.IN_AIRDROP;

        challenges[challengeId] = challenge;
        IERC1155 nftCollection = IERC1155(challenge.collection);

        if (!airdropped[challenge.collection][challenge.assetId]) {
            airdropped[challenge.collection][challenge.assetId] = true;
        }
        
        for (uint256 i = 0; i < recipientCount; i++) {            
            nftCollection.safeTransferFrom(
            address(this),
            recipients[i],
            challenge.assetId,
            amounts[i],
            ""
            );
        }
        emit BulkAirdropNFTChallenge(
            challengeId,
            recipients,
            amounts,
            eventIdAirDropChallenge
        );
        return true;
    }
}
