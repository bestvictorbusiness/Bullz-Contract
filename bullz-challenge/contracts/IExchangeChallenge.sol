// SPDX-License-Identifier: MIT
pragma solidity 0.8.15;


/**
 * @dev Interface of the ExchangeChallenge contract 
 */
interface IExchangeChallenge {
    /**
     * @dev Returns true if this contract implements the interface defined by
     */
    struct Challenge{
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
    event AddChallenge(bytes32 challengeId, address indexed seller, address indexed collection, uint256  assetId, uint256  amount, uint256  airdropStartAt,  uint256 airdropEndAt);
    /**
     * @dev save an offer challenge.
     */
    function addChallenge(address collection, uint256 assetId, uint256 amount, uint256 airdropStartAt,  uint256 airdropEndAt) external  returns (bytes32);

    /**
     * @dev Emitted when `challengeId` challenge is created.
     */
    event AirDropChallenge(bytes32 challengeId, address receiver, uint256 amount);
    /**
     * @dev airdrop NFT token
     */
    function airdropChallenge(bytes32 challengeId, address receiver, uint256 amount) external returns (bool);
    /**
     * @dev set utility token
     */
     function setMarketToken(address token)external   returns (bool);
    /**
     * @dev set marketplace  token nft number equivalent in ERC20
     */
     function setFee(uint256 fee)external   returns (bool);
    /**
    * @dev withdraw nft when airdrop is ended
     */
    function withdrawChallenge(bytes32 challengeId) external returns (bool);
    
    event WithdrawChallenge(bytes32 challengeId);
    event SetMarketToken(address  token);
    event BulkAirdrop(address owner,address collection, uint nftId, address[] recipient);
    event SetFee(uint256 fee);
 

}