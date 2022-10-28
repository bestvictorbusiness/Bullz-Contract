// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

/**
 * @dev Interface of the ExchangeChallenge contract
 */
interface IExchangeChallenge {
    /**
     * @dev Returns true if this contract implements the interface defined by
     */
    struct Challenge {
        address seller;
        address collection;
        uint256 assetId;
        uint256 amount;
        uint256 airdropStartAt;
        uint256 airdropEndAt;
    }
    /**
     * @dev Emitted when `challengeId` challenge is created.
     */
    event AddChallenge(
        bytes32 challengeId,
        address indexed seller,
        address indexed collection,
        uint256 assetId,
        uint256 amount,
        uint256 airdropStartAt,
        uint256 airdropEndAt,
        uint256 indexed eventIdAddChallenge
    );

    function addChallenge(
        address collection,
        uint256 assetId,
        uint256 amount,
        uint256 airdropStartAt,
        uint256 airdropEndAt,
        uint256 eventIdAddChallenge
    ) external;

    /**
     * @dev save an offer challenge.
     */
    //function addChallenge(address collection, uint256 assetId, uint256 amount, uint256 airdropStartAt,  uint256 airdropEndAt) external  returns (bytes32);

    /**
     * @dev Emitted when `challengeId` challenge is created.
     */
    event AirDropChallenge(
        bytes32 indexed challengeId,
        address indexed receiver,
        uint256 amount,
        uint256 airdropFee,
        uint256 indexed eventIdAirDropChallenge
    );

    /**
     * @dev airdrop NFT token
     */
    function airdropChallenge(
        bytes32 challengeId,
        address receiver,
        uint256 amount,
        uint256 eventIdAirDropChallenge
    ) external returns (bool);

    /**
     * @dev set utility token
     */
    function setMarketToken(address token) external returns (bool);

    /**
     * @dev set marketplace  token nft number equivalent in ERC20
     */
    function setFee(uint256 fee) external returns (bool);

    /**
     * @dev withdraw nft when airdrop is ended
     */
    function withdrawChallenge(
        bytes32 challengeId,
        uint256 eventIdWithdrawChallenge
    ) external returns (bool);

    event WithdrawChallenge(
        bytes32 indexed challengeId,
        uint256 indexed eventIdWithdrawChallenge
    );
    event SetMarketToken(address indexed token);
    event BulkAirdrop(
        address owner,
        address indexed collection,
        uint256 nftId,
        address[] recipient
    );
    event SetFee(uint256 indexed fee);

    struct TokenChallenge {
        address seller;
        address token;
        uint256 winnerCount;
        uint256 tokenAmount;
        uint256 airdropStartAt;
        uint256 airdropEndAt;
        uint256 airdropFee;
    }

    event AddTokenChallenge(
        bytes32 challengeId,
        address indexed seller,
        address indexed token,
        uint256 winnerCount,
        uint256 tokenAmount,
        uint256 airdropStartAt,
        uint256 airdropEndAt,
        uint256 tokenAirdropFee,
        uint256 indexed eventIdAddTokenChallenge
    );

    function addTokenChallenge(
        address token,
        uint256 winnerCount,
        uint256 tokenAmount,
        uint256 airdropStartAt,
        uint256 airdropEndAt,
        uint256 eventIdAddTokenChallenge
    ) external returns (bytes32);

    event AirDropTokenChallenge(
        bytes32 indexed challengeId,
        address indexed receiver,
        uint256 tokenAmount,
        uint256 airdropFee,
        uint256 indexed eventIdAirDropTokenChallenge
    );

    function airdropTokenChallenge(
        bytes32 challengeId,
        address receiver,
        uint256 eventIdAirDropTokenChallenge
    ) external returns (bool);

    event WithdrawTokenChallenge(
        bytes32 indexed challengeId,
        uint256 indexed eventIdWithdrawTokenChallenge
    );

    function withdrawTokenChallenge(
        bytes32 challengeId,
        uint256 eventIdWithdrawTokenChallenge
    ) external returns (bool);

    event SetPrimaryTokenPercent(uint256 indexed percent);

    function setPrimaryTokenPercent(uint256 percent) external returns (bool);

    event SetSecondaryTokenPercent(uint256 indexed percent);

    function setSecondaryTokenPercent(uint256 percent) external returns (bool);

    event SetPrimaryToken(address indexed token);

    /**
     * @dev set prymary token
     */
    function setPrimaryToken(address token) external returns (bool);
}
