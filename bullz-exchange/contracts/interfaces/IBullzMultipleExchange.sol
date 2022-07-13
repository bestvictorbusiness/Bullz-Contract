// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.12;

/**
 * @title A DEX for ERC1155 tokens (NFTs)
 */
interface IBullzMultipleExchange {
    /**
     * @notice Put a single NFT in the market for sell & define loyalty NFT creator profit percentage
     * @dev Emit an ERC721 Token in sell
     * @param _id the NFT market identifier
     * @param _seller the token owner
     * @param _collection the ERC1155 address
     * @param _assetId the NFT id
     * @param _token the accepted ERC20 token for bid
     * @param _price the sale price
     * @param _amount the amount of NFT to put in sell
     * @param _isForSell  the token in direct sale
     * @param _isForAuction  the token in auctions
     * @param _expiresAt the offer's exprire date.
     * @param _shareIndex the percentage the contract owner earns in every sale
     * @param _loyaltyPercent  the percentage the NFT creator earns in every sale
     */
    function addLoyaltyOffer(
        uint256 _id,
        address _seller,
        address _collection,
        uint256 _assetId,
        address _token,
        uint256 _price,
        uint256 _amount,
        bool _isForSell,
        bool _isForAuction,
        uint256 _expiresAt,
        uint256 _shareIndex,
        uint256 _loyaltyPercent
    ) external;

    /**
     * @notice Put a single NFT in the market for sell
     * @dev Emit an ERC721 Token in sell
     * @param _id the NFT market identifier
     * @param _seller the token owner
     * @param _collection the ERC1155 address
     * @param _assetId the NFT id
     * @param _token the accepted ERC20 token for bid
     * @param _price the sale price
     * @param _amount the amount of NFT to put in sell
     * @param _isForSell  the token in direct sale
     * @param _isForAuction  the token in auctions
     * @param _expiresAt the offer's exprire date.
     * @param _shareIndex the percentage the contract owner earns in every sale
     */
    function addOffer(
        uint256 _id,
        address _seller,
        address _collection,
        uint256 _assetId,
        address _token,
        uint256 _price,
        uint256 _amount,
        bool _isForSell,
        bool _isForAuction,
        uint256 _expiresAt,
        uint256 _shareIndex
    ) external;

    /**
     * @notice Set NFT's sell price in the market
     * @dev Set Offer price
     * @param _offerId the market NFT identifier
     * @param _price new minimun price to sell an NFT
     */
    function setOfferPrice(uint256 _offerId, uint256 _price) external;

    /**
     * @notice hide an NFT in direct sell from the market, or enable NFT's purshare in the market in direct sell
     * @dev Enable or disable an offer in direct sell
     * @param _offerId the market NFT identifier
     * @param _isForSell a boolean to make offer in direct sell or not
     */
    function setForSell(uint256 _offerId, bool _isForSell) external;

    /**
     * @notice hide an NFT in auction from the market, or enable NFT's purshare in the market in auction
     * @dev Enable or disable an offer in auction
     * @param _offerId the market NFT identifier
     * @param _isForAuction a boolean to make offer in auction or not
     */
    function setForAuction(uint256 _offerId, bool _isForAuction) external;

    /**
     * @dev set offer expire date
     * @param _offerId the market NFT identifier
     * @param _expiresAt new expire date
     */
    function setExpiresAt(uint256 _offerId, uint256 _expiresAt) external;

    /**
     * @notice Cancel an offer
     * @dev Lets an NFT owner cancel an NFT in sell when some requirements are met.
     * and withdraw  the concerned asset from the contract.
     * @param _offerId the market NFT identifier
     */
    function cancelOffer(uint256 _offerId) external;

    /**
     * @notice buy NFT Token
     * @dev Lets a user buy the NFT from the DEX. Function verifies that the amount
     * sent in wei is equal to that of the sale price. If it is, the contract
     * will accept the ether then compute the owner profit and NFT creator profit then transfer the NFT to the buyer.
     * After it's been transferred, the DEX then transfers the ether minus owner & creator profit
     * Deletes the struct from the mapping after.
     @param _offerId the market NFT identifier
     @param amount the amount user wants to purshase
     */
    function buyOffer(uint256 _offerId, uint256 amount) external payable;

    /**
     * @dev place a bid on an offer
     * @param _offerId the market NFT identifier
     * @param _token erc20 token address
     * @param _price the bid price
     * @param _amount the nft amount
     */
    function safePlaceBid(
        uint256 _offerId,
        address _token,
        uint256 _price,
        uint256 _amount
    ) external;

    /**
     * @dev cancelBid by owner or bidder
     * @param _offerId ERC721 collection address
     * @param _bidder bidder address
     */
    function cancelBid(uint256 _offerId, address _bidder) external;

    /**
     * @dev accept a bid by the offer's owner
     * @param _offerId ERC721 collection address
     * @param _bidder bidder address
     */
    function acceptBid(uint256 _offerId, address _bidder) external;

    event Swapped(
        address buyer,
        address seller,
        address token,
        uint256 assetId,
        uint256 price
    );
    event Listed(
        address seller,
        address collection,
        uint256 assetId,
        uint256 price,
        uint256 amount
    );
    struct Offer {
        address seller;
        address collection;
        uint256 assetId;
        address token;
        uint256 price;
        uint256 amount;
        bool isForSell;
        bool isForAuction;
        uint256 expiresAt;
        uint256 shareIndex;
        bool exists;
    }
    struct Bid {
        bytes32 id;
        address bidder;
        address token;
        uint256 price;
        uint256 amount;
    }
    // BID EVENTS
    event BidCreated(
        bytes32 id,
        address indexed collection,
        uint256 indexed assetId,
        address indexed bidder,
        address token,
        uint256 price,
        uint256 amount
    );
    event BidSuccessful(
        address collection,
        uint256 assetId,
        address token,
        address bidder,
        uint256 price,
        uint256 amount
    );
    event BidAccepted(bytes32 id);
    event BidCancelled(bytes32 id);
    event SetOfferPrice(uint256 _offerId, uint256 price);
    event SetForSell(uint256 _offerId, bool isForSell);
    event SetForAuction(uint256 _offerId, bool isForAuction);
    event SetExpireAt(uint256 _offerId, uint256 expiresAt);
    event CancelOffer(uint256 _offerId);
}
