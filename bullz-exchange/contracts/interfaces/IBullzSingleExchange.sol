// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.12;

/**
 * @title A DEX for ERC721 tokens (NFTs)
 */
interface IBullzSingleExchange {
    /**
     * @notice Put a single NFT in the market for sell
     * @dev Emit an ERC721 Token in sell
     * @param _seller the token owner
     * @param _collection the ERC1155 address
     * @param _assetId the NFT id
     * @param _token the sale price
     * @param _price the sale price
     * @param _isForSell if the token in direct sale
     * @param _isForAuction if the token in auctions
     * @param _expiresAt the offer's exprire date.
     * @param _shareIndex the percentage the contract owner earns in every sale
     * @param _loyaltyPercent  the percentage the NFT creator earns in every sale

     */
    function addLoyaltyOffer(
        address _seller,
        address _collection,
        uint256 _assetId,
        address _token,
        uint256 _price,
        bool _isForSell,
        bool _isForAuction,
        uint256 _expiresAt,
        uint256 _shareIndex,
        uint256 _loyaltyPercent
    ) external;

    /**
     * @notice Put a single NFT in the market for sell
     * @dev Emit an ERC721 Token in sell
     * @param _seller the token owner
     * @param _collection the ERC1155 address
     * @param _assetId the NFT id
     * @param _token the sale price
     * @param _price the sale price
     * @param _isForSell if the token in direct sale
     * @param _isForAuction if the token in auctions
     * @param _expiresAt the offer's exprire date.
     * @param _shareIndex the percentage the contract owner earns in every sale
     */
    function addOffer(
        address _seller,
        address _collection,
        uint256 _assetId,
        address _token,
        uint256 _price,
        bool _isForSell,
        bool _isForAuction,
        uint256 _expiresAt,
        uint256 _shareIndex
    ) external;

    /**
     * @notice Set NFT's sell price in the market
     * @dev Set Offer price
     * @param _collection the token owner
     * @param _assetId the ERC1155 address
     * @param _price new minimun price to sell an NFT
     */
    function setOfferPrice(
        address _collection,
        uint256 _assetId,
        uint256 _price
    ) external;

    /**
     * @notice hide an NFT in direct sell from the market, or enable NFT's purshare in the market in direct sell
     * @dev Enable or disable an offer in direct sell
     * @param _collection the ERC721 collection address
     * @param _assetId the NFT identifant
     * @param _isForSell a boolean to make offer in direct sell or not
     */
    function setForSell(
        address _collection,
        uint256 _assetId,
        bool _isForSell
    ) external;

    /**
     * @notice hide an NFT in auction from the market, or enable NFT's purshare in the market in auction
     * @dev Enable or disable an offer in auction
     * @param _collection the ERC721 collection address
     * @param _assetId the NFT identifant
     * @param _isForAuction a boolean to make offer in auction or not
     */
    function setForAuction(
        address _collection,
        uint256 _assetId,
        bool _isForAuction
    ) external;

    /**
     * @notice Expands NFT offer expire Time
     * @dev set offer expire date
     * @param _collection the ERC721 collection address
     * @param _assetId the NFT identifant
     * @param _expiresAt new expire date
     */
    function setExpiresAt(
        address _collection,
        uint256 _assetId,
        uint256 _expiresAt
    ) external;

    /**
     * @dev Cancel in remore an NFT from the market
     * @param _collection the ERC721 collection address
     * @param _assetId the NFT identifant
     */
    function cancelOffer(address _collection, uint256 _assetId) external;

    /**
     * @dev Buy NFT from the market
     * @param _collection the ERC721 collection address
     * @param _assetId the NFT identifant
     */
    function buyOffer(address _collection, uint256 _assetId) external payable;

    /**
     * @dev accept placed bid
     * @param _collection ERC721 collection address
     * @param _assetId  NFT identifant
     * @param _bidder Accepted bidder address
     */
    function acceptBid(
        address _collection,
        uint256 _assetId,
        address _bidder
    ) external;

    /**
     * @dev cancel bid by owner or bidder
     * @param _collection ERC721 collection address
     * @param _assetId  NFT identifant
     * @param _bidder bidder address
     */
    function cancelBid(
        address _collection,
        uint256 _assetId,
        address _bidder
    ) external;

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
        address token,
        uint256 price
    );
    struct Offer {
        address seller;
        address collection;
        uint256 assetId;
        address token;
        uint256 price;
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
    }
    // BID EVENTS
    event BidCreated(
        bytes32 id,
        address indexed collection,
        uint256 indexed assetId,
        address indexed bidder,
        address token,
        uint256 price
    );
    event BidSuccessful(
        address collection,
        uint256 assetId,
        address token,
        address bidder,
        uint256 price
    );
    event BidAccepted(bytes32 id);
    event BidCancelled(bytes32 id);
    event SetForSell(address collection, uint256 assetId, bool isForSell);
    event SetForAuction(address collection, uint256 assetId, bool isForAuction);
    event SetExpireAt(address collection, uint256 assetId, uint256 expiresAt);
    event CancelOffer(address collection, uint256 assetId);
    event AddLoyaltyBid(
        address seller,
        address collection,
        uint256 assetId,
        address token,
        uint256 price
    );
    event SetOfferPrice(address collection, uint256 assetId, uint256 price);
}
