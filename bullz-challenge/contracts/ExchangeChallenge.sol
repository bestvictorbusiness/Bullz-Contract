// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

/**
 * @dev contract to manage NFT challenges
 */
import "./interfaces/IExchangeChallenge.sol";
import "../loyalties/interfaces/ILoyalty.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";

contract ExchangeChallenge is IExchangeChallenge, Ownable, ERC1155Holder {
    using SafeERC20 for IERC20;
    mapping(bytes32 => Challenge) public challenges; // marketplace challenges
    mapping(address => mapping(uint256 => bool)) public airdropped;
    IERC20 public MARKET_TOKEN; // marketplace governance token
    uint256 public BULLZ_FEE = 5e18; // marketplace token peer challenge token
    using Counters for Counters.Counter;
    Counters.Counter private _challengeIdCounter;
    mapping(bytes32 => TokenChallenge) public tokenChallenges; // marketplace challenges
    uint256 public PRIMARY_TOKEN_FEE_PERCENT = 500; //500 value is for 5% with 2 decimal points
    uint256 public SECONDARY_TOKEN_FEE_PERCENT = 700; //700 value is for 7% with 2 decimal points
    address public PRIMARY_TOKEN = 0x515cea0e9d7F8c297bB9E832DFAcdb82CA8D8d37; //WOM token address

    constructor(address token) {
        require(token != address(0), "Challenge Exchange: Not a valid address");
        MARKET_TOKEN = IERC20(token);
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
            MARKET_TOKEN.balanceOf(_msgSender()) >=
                (BULLZ_FEE * amount),
            "Challenge Exchange: Insufficient balance"
        );
        require(
            airdropStartAt > block.timestamp,
            "Challenge Exchange: invalid start at airdrop"
        );
        require(
            airdropEndAt > airdropStartAt,
            "Challenge Exchange: invalid start at airdrop"
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
            airdropEndAt
        );

        emit AddChallenge(
            challengeId,
            _msgSender(),
            collection,
            assetId,
            amount,
            airdropStartAt,
            airdropEndAt,
            eventIdAddChallenge
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
        uint256 airdropFee = BULLZ_FEE * amount;
        require(
            MARKET_TOKEN.balanceOf(_msgSender()) >= airdropFee,
            "Challenge Exchange: Insufficient balance"
        );
        challenge.amount = challenge.amount - amount;

        challenges[challengeId] = challenge;
        IERC1155 nftCollection = IERC1155(challenge.collection);

        if (!airdropped[challenge.collection][challenge.assetId]) {
            airdropped[challenge.collection][challenge.assetId] = true;
        }

        emit AirDropChallenge(
            challengeId,
            receiver,
            amount,
            airdropFee,
            eventIdAirDropChallenge
        );
        bool success = MARKET_TOKEN.transferFrom(
            _msgSender(),
            owner(),
            airdropFee
        );
        require(
            success,
            "Challenge Exchange: Token transfer did not succeeded "
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
        IERC1155 nftCollection = IERC1155(challenge.collection);
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

    function setMarketToken(address token)
        external
        override
        onlyOwner
        returns (bool)
    {
        require(token != address(0), "Challenge Exchange: Not a valid address");
        MARKET_TOKEN = IERC20(token);
        emit SetMarketToken(token);
        return true;
    }

    function setFee(uint256 fee) external override onlyOwner returns (bool) {
        BULLZ_FEE = fee;
        emit SetFee(fee);
        return true;
    }

    /**
     * @dev Save new token challenge
     * @param token ERC20 contract address
     * @param winnerCount Max number of winner to airdrop
     * @param tokenAmount the amount in token per airdrop
     * @param airdropStartAt airdrop start date
     * @param airdropEndAt airdrop start date
     * @param eventIdAddTokenChallenge a tracking id used to sync db
     */
    function addTokenChallenge(
        address token,
        uint256 winnerCount,
        uint256 tokenAmount,
        uint256 airdropStartAt,
        uint256 airdropEndAt,
        uint256 eventIdAddTokenChallenge
    ) external override returns (bytes32) {
        require(
            token != address(0),
            "Challenge Exchange: Token address not valid"
        );
        IERC20 challengeToken = IERC20(token);
        uint256 tokenAirdropFee = _getTokenAirdropFee(token, tokenAmount);
        uint256 escrowAmount = _getEscrowAmount(
            tokenAirdropFee,
            tokenAmount,
            winnerCount
        );
        require(
            challengeToken.balanceOf(_msgSender()) >= escrowAmount,
            "Challenge Exchange: Insufficient balance"
        );
        require(
            airdropStartAt > block.timestamp,
            "Challenge Exchange: invalid start at airdrop"
        );
        require(
            airdropEndAt > airdropStartAt,
            "Challenge Exchange: invalid start at airdrop"
        );

        _challengeIdCounter.increment();
        bytes32 challengeId = keccak256(
            abi.encodePacked(
                block.timestamp,
                msg.sender,
                _challengeIdCounter.current()
            )
        );
        tokenChallenges[challengeId] = TokenChallenge(
            _msgSender(),
            token,
            winnerCount,
            tokenAmount,
            airdropStartAt,
            airdropEndAt,
            tokenAirdropFee
        );

        emit AddTokenChallenge(
            challengeId,
            _msgSender(),
            token,
            winnerCount,
            tokenAmount,
            airdropStartAt,
            airdropEndAt,
            tokenAirdropFee,
            eventIdAddTokenChallenge
        );

        bool success = challengeToken.transferFrom(
            _msgSender(),
            address(this),
            escrowAmount
        );
        require(
            success,
            "Challenge Exchange: Token transfer did not succeeded "
        );
        return challengeId;
    }

    function airdropTokenChallenge(
        bytes32 challengeId,
        address receiver,
        uint256 eventIdAirDropTokenChallenge
    ) external override returns (bool) {
        require(
            receiver != address(0),
            "Challenge Exchange: Receiver address not valid"
        );

        TokenChallenge memory challenge = tokenChallenges[challengeId];
        require(
            challenge.seller == _msgSender(),
            "Challenge Exchange: caller not an owner"
        );
        require(challenge.winnerCount > 0, "Challenge Exchange: Airdrop done");
        require(
            block.timestamp >= challenge.airdropStartAt,
            "Challenge Exchange: invalid start at airdrop"
        );

        IERC20 challengeToken = IERC20(challenge.token);
        challenge.winnerCount = challenge.winnerCount - 1;

        tokenChallenges[challengeId] = challenge;

        bool success = challengeToken.transfer(owner(), challenge.airdropFee);
        require(
            success,
            "Challenge Exchange: Airdrop fee transfer did not succeeded "
        );

        bool success1 = challengeToken.transfer(
            receiver,
            challenge.tokenAmount
        );
        require(
            success1,
            "Challenge Exchange: Airdrop transfer did not succeeded "
        );

        emit AirDropTokenChallenge(
            challengeId,
            receiver,
            challenge.tokenAmount,
            challenge.airdropFee,
            eventIdAirDropTokenChallenge
        );
        return true;
    }

    function withdrawTokenChallenge(
        bytes32 challengeId,
        uint256 eventIdWithdrawTokenChallenge
    ) external override returns (bool) {
        TokenChallenge memory challenge = tokenChallenges[challengeId];
        require(
            challenge.seller == _msgSender(),
            "Challenge Exchange: caller not an owner"
        );
        require(
            challenge.airdropEndAt < block.timestamp,
            "Challenge exchange airdrop not ended"
        );

        require(
            challenge.winnerCount > 0,
            "Challenge Exchange: No token left."
        );
        IERC20 challengeToken = IERC20(challenge.token);
        bool success = challengeToken.transfer(
            _msgSender(),
            _getEscrowAmount(
                challenge.airdropFee,
                challenge.tokenAmount,
                challenge.winnerCount
            )
        );
        require(
            success,
            "Challenge Exchange: Token transfer did not succeeded "
        );

        emit WithdrawTokenChallenge(challengeId, eventIdWithdrawTokenChallenge);
        return true;
    }

    function getAirdropFeePercent(address token)
        external
        view
        returns (uint256)
    {
        return _getAirdropFeePercent(token);
    }

    function _getAirdropFeePercent(address token)
        internal
        view
        returns (uint256)
    {
        if (token == PRIMARY_TOKEN) {
            return PRIMARY_TOKEN_FEE_PERCENT;
        } else {
            return SECONDARY_TOKEN_FEE_PERCENT;
        }
    }

    function _getTokenAirdropFee(address token, uint256 tokenAmount)
        internal
        view
        returns (uint256)
    {
        uint256 airdropFeePercent = _getAirdropFeePercent(token);

        return (airdropFeePercent * tokenAmount) / (10000);
    }

    function _getEscrowAmount(
        uint256 airdropFee,
        uint256 tokenAmount,
        uint256 winnerCount
    ) internal pure returns (uint256) {
        return (winnerCount * tokenAmount ) + airdropFee;
    }

    function setPrimaryTokenPercent(uint256 percent)
        external
        override
        onlyOwner
        returns (bool)
    {
        //10000 value is for 100% with 2 decimal points
        require(
            percent > 0 && percent <= 10000,
            "Challenge Exchange: Max percent is 100 with 2 decimal point value."
        );
        PRIMARY_TOKEN_FEE_PERCENT = percent;
        emit SetPrimaryTokenPercent(percent);
        return true;
    }

    function setSecondaryTokenPercent(uint256 percent)
        external
        override
        onlyOwner
        returns (bool)
    {
        //10000 value is for 100% with 2 decimal points
        require(
            percent > 0 && percent <= 10000,
            "Challenge Exchange: Max percent is 100 with 2 decimal point value."
        );
        SECONDARY_TOKEN_FEE_PERCENT = percent;
        emit SetSecondaryTokenPercent(percent);
        return true;
    }

    function setPrimaryToken(address token)
        external
        override
        onlyOwner
        returns (bool)
    {
        require(token != address(0), "Challenge Exchange: Not a valid address");
        PRIMARY_TOKEN = token;
        emit SetPrimaryToken(token);
        return true;
    }
}
