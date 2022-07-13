// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.12;

import "./Loyalty.sol";
import "./FeeManager.sol";

import "./interfaces/IBullzMultipleExchange.sol";

import "./libraries/BullzLibrary.sol";
import "./libraries/TransferHelper.sol";

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";

contract BullzMultipleExchange is
    IBullzMultipleExchange,
    Loyalty,
    FeeManager,
    ERC1155Holder
{
    using SafeMath for uint256;

    //ERC1155
    mapping(uint256 => Offer) public offers;
    // For auctions bid by bider, collection and assetId
    mapping(uint256 => mapping(address => Bid)) public bidforAuctions;

    modifier onlyOfferOwner(uint256 offerId) {
        require(_msgSender() == offers[offerId].seller);
        _;
    }

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
    ) external {
        addLoyalty(_collection, _assetId, _msgSender(), _loyaltyPercent);
        _addOffer(
            _id,
            _seller,
            _collection,
            _assetId,
            _token,
            _price,
            _amount,
            _isForSell,
            _isForAuction,
            _expiresAt,
            _shareIndex
        );
    }

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
    ) external {
        _addOffer(
            _id,
            _seller,
            _collection,
            _assetId,
            _token,
            _price,
            _amount,
            _isForSell,
            _isForAuction,
            _expiresAt,
            _shareIndex
        );
    }

    function _addOffer(
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
    ) internal {
        require(!offers[_id].exists, "Offer exists already");
        // get NFT asset from seller
        IERC1155 multipleNFTCollection = IERC1155(_collection);
        require(
            multipleNFTCollection.balanceOf(_msgSender(), _assetId) >= _amount,
            "Insufficient token balance"
        );

        require(_seller == _msgSender(), "Seller should be equals owner");
        require(
            multipleNFTCollection.isApprovedForAll(_msgSender(), address(this)),
            "Contract not approved"
        );
        offers[_id] = Offer(
            _seller,
            _collection,
            _assetId,
            _token,
            _price,
            _amount,
            _isForSell,
            _isForAuction,
            _expiresAt,
            _shareIndex,
            true //offer exists
        );
        IERC1155(_collection).safeTransferFrom(
            _seller,
            address(this),
            _assetId,
            _amount,
            ""
        );
        emit Listed(_seller, _collection, _assetId, _amount, _price);
    }

    function setOfferPrice(uint256 offerID, uint256 price)
        external
        onlyOfferOwner(offerID)
    {
        Offer storage offer = _getOwnerOffer(offerID);
        offer.price = price;
        emit SetOfferPrice(offerID, price);
    }

    function setForSell(uint256 offerID, bool isForSell)
        external
        onlyOfferOwner(offerID)
    {
        Offer storage offer = _getOwnerOffer(offerID);
        offer.isForSell = isForSell;
        emit SetForSell(offerID, isForSell);
    }

    function setForAuction(uint256 offerID, bool isForAuction)
        external
        onlyOfferOwner(offerID)
    {
        Offer storage offer = _getOwnerOffer(offerID);
        offer.isForAuction = isForAuction;
        emit SetForAuction(offerID, isForAuction);
    }

    function setExpiresAt(uint256 offerID, uint256 expiresAt)
        external
        onlyOfferOwner(offerID)
    {
        Offer storage offer = _getOwnerOffer(offerID);
        offer.expiresAt = expiresAt;
        emit SetExpireAt(offerID, expiresAt);
    }

    function cancelOffer(uint256 offerID) external onlyOfferOwner(offerID) {
        Offer memory offer = _getOwnerOffer(offerID);
        require(offer.expiresAt < block.timestamp, "Offer should be expired");
        delete offers[offerID];
        IERC1155(offer.collection).safeTransferFrom(
            address(this),
            offer.seller,
            offer.assetId,
            offer.amount,
            ""
        );
        emit CancelOffer(offerID);
    }

    function _getOwnerOffer(uint256 id) internal view returns (Offer storage) {
        Offer storage offer = offers[id];
        return offer;
    }

    function buyOffer(uint256 id, uint256 amount) external payable {
        Offer memory offer = offers[id];
        require(msg.value > 0, "price must be > 0");
        require(offer.isForSell, "Offer not for sell");
        require(
            offer.expiresAt > block.timestamp,
            "Marketplace: offer expired"
        );
        _buyOffer(offer, id, amount, _msgSender());
        emit Swapped(
            _msgSender(),
            offer.seller,
            offer.collection,
            offer.assetId,
            msg.value
        );
    }

    /*
        This method is introduced to buy NFT with the help of a delegate.
        It will work as like buyOffer method, but instead transferring NFT to _msgSender address, it will transfer the NFT to buyer address.
        As its a payable method, it's highly unlikely that somebody would call this function for fishing or by mistake.
    */
    function delegateBuy(uint256 id, uint256 amount, address buyer) external payable {
        Offer memory offer = offers[id];
        require(msg.value > 0, "price must be > 0");
        require(offer.isForSell, "Offer not for sell");
        require(
            offer.expiresAt > block.timestamp,
            "Marketplace: offer expired"
        );
        _buyOffer(offer, id, amount, buyer);
        emit Swapped(
            buyer,
            offer.seller,
            offer.collection,
            offer.assetId,
            msg.value
        );
    }

    function _buyOffer(
        Offer memory offer,
        uint256 offerId,
        uint256 amount,
        address buyer
    ) internal {
        IERC1155 multipleNFTCollection = IERC1155(offer.collection);
        (uint256 ownerProfitAmount, uint256 sellerAmount) = BullzLibrary
            .computePlateformOwnerProfitByAmount(
                msg.value,
                offer.price,
                amount,
                getFeebyIndex(offer.shareIndex)
            );
        sellerAmount = sendLoyaltyToCreatorFromETH(
            offer.collection,
            offer.assetId,
            offer.seller,
            sellerAmount
        );
        offers[offerId].amount = BullzLibrary
            .extractPurshasedAmountFromOfferAmount(offer.amount, amount);
        TransferHelper.safeTransferETH(offer.seller, sellerAmount);
        TransferHelper.safeTransferETH(owner(), ownerProfitAmount);
        if (offer.amount == 0) delete offers[offerId];
        multipleNFTCollection.safeTransferFrom(
            address(this),
            buyer,
            offer.assetId,
            amount,
            new bytes(0)
        );
    }

    function safePlaceBid(
        uint256 _offer_id,
        address _token,
        uint256 _price,
        uint256 _amount
    ) external {
        _createBid(_offer_id, _token, _price, _amount);
    }

    function _createBid(
        uint256 offerID,
        address _token,
        uint256 _price,
        uint256 _amount
    ) internal {
        // Checks order validity
        Offer memory offer = offers[offerID];
        // check on expire time
        Bid memory bid = bidforAuctions[offerID][_msgSender()];
        require(bid.id == 0, "bid already exists");
        require(_token == offer.token);
        require(offer.isForAuction, "NFT Marketplace: NFT token not in sell");
        require(
            offer.expiresAt > block.timestamp,
            "Marketplace: offer expired"
        );
        require(
            IERC20(_token).allowance(_msgSender(), address(this)) >= _price,
            "NFT Marketplace: Allowance error"
        );
        // Create bid
        bytes32 bidId = keccak256(
            abi.encodePacked(block.timestamp, msg.sender, _price)
        );

        // Save Bid for this order
        bidforAuctions[offerID][_msgSender()] = Bid({
            id: bidId,
            bidder: _msgSender(),
            token: _token,
            price: _price,
            amount: _amount
        });

        emit BidCreated(
            bidId,
            offer.collection,
            offer.assetId,
            _msgSender(), // bidder
            _token,
            _price,
            _amount
        );
    }

    function cancelBid(uint256 _offerId, address _bidder) external {
        Offer memory offer = _getOwnerOffer(_offerId);
        require(
            _bidder == _msgSender() || _msgSender() == offer.seller,
            "Marketplace: Unauthorized operation"
        );
        Bid memory bid = bidforAuctions[_offerId][_msgSender()];
        delete bidforAuctions[_offerId][_bidder];
        emit BidCancelled(bid.id);
    }

    function acceptBid(uint256 _offerID, address _bidder)
        external
        onlyOfferOwner(_offerID)
    {
        //get offer
        Offer memory offer = _getOwnerOffer(_offerID);
        // get bid to accept
        Bid memory bid = bidforAuctions[_offerID][_bidder];

        // get service fees
        (uint256 ownerProfitAmount, uint256 sellerAmount) = BullzLibrary
            .computePlateformOwnerProfit(
                bid.price,
                bid.price,
                getFeebyIndex(offer.shareIndex)
            );
        // check seller
        sellerAmount = sendLoyaltyToCreatorFromERC20Token(
            offer.collection,
            offer.assetId,
            offer.seller,
            sellerAmount,
            bid.token,
            bid.bidder
        );
        require(
            offer.seller == _msgSender(),
            "Marketplace: unauthorized sender"
        );
        require(offer.isForAuction, "Marketplace: offer not in auction");
        require(
            offer.amount >= bid.amount,
            "Marketplace: insufficient balance"
        );

        delete bidforAuctions[_offerID][_bidder];
        emit BidAccepted(bid.id);
        // transfer escrowed bid amount minus market fee to seller
        TransferHelper.safeTransferFrom(
            bid.token,
            bid.bidder,
            _msgSender(),
            sellerAmount
        );
        TransferHelper.safeTransferFrom(
            bid.token,
            bid.bidder,
            owner(),
            ownerProfitAmount
        );

        offer.amount = BullzLibrary.extractPurshasedAmountFromOfferAmount(
            offer.amount,
            bid.amount
        );

        if (offer.amount == 0) delete offers[_offerID];
        // Transfer NFT asset
        IERC1155(offer.collection).safeTransferFrom(
            address(this),
            bid.bidder,
            offer.assetId,
            bid.amount,
            ""
        );
        // Notify ..
        emit BidSuccessful(
            offer.collection,
            offer.assetId,
            bid.token,
            bid.bidder,
            bid.price,
            bid.amount
        );
    }
}
