// SPDX-License-Identifier: MIT

pragma solidity ^0.8.12;

import "./interfaces/ILoyalty.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Loyalty is ILoyalty {
    mapping(address => mapping(uint256 => mapping(address => uint256))) public loyalties;
    mapping(address => mapping(uint256 => address)) public creators;
    mapping(address => mapping(uint256 => bool)) public hasLoyalty;

    using SafeMath for uint256;

    function addLoyalty(
        address collection,
        uint256 assetId,
        address right_holder,
        uint256 percent
    ) internal {
        require(
            percent > 0 && percent <= 10,
            "Loyalty percent must be between 0 and 10"
        );
        require(!_isInLoyalty(collection, assetId), "NFT already in loyalty");
        creators[collection][assetId] = right_holder;
        _addLoyalty(collection, assetId, right_holder, percent);
    }

    function sendLoyaltyToCreatorFromERC20Token(
        address collection,
        uint256 assetId,
        address seller,
        uint256 sellerAmount,
        address token,
        address bidder
    ) internal returns (uint256) {
        if (_isInLoyalty(collection, assetId)) {
            address creator = _getLoyaltyCreator(collection, assetId);
            if (creator != seller) {
                uint256 percent = getLoyalty(collection, assetId, creator);
                uint256 creatorBenif = (sellerAmount).mul(percent).div(100);
                IERC20(token).transferFrom(bidder, creator, creatorBenif);
                sellerAmount = sellerAmount.sub(creatorBenif);
            }
        }
        return sellerAmount;
    }

    function sendLoyaltyToCreatorFromETH(
        address collection,
        uint256 assetId,
        address seller,
        uint256 sellerAmount
    ) internal returns (uint256) {
        if (_isInLoyalty(collection, assetId)) {
            address creator = _getLoyaltyCreator(collection, assetId);
            if (creator != seller) {
                uint256 percent = getLoyalty(collection, assetId, creator);
                uint256 creatorBenif = (sellerAmount).mul(percent).div(100);
                (bool sentCreatorBenif, ) = creator.call{value: creatorBenif}(
                    ""
                );
                if (sentCreatorBenif) {
                    sellerAmount = sellerAmount.sub(creatorBenif);
                }
            }
        }
        return sellerAmount;
    }

    function getLoyalty(
        address collection,
        uint256 assetId,
        address right_holder
    ) public view returns (uint256) {
        return loyalties[collection][assetId][right_holder];
    }

    function getLoyaltyCreator(address collection, uint256 assetId)
        external
        view
        returns (address)
    {
        return _getLoyaltyCreator(collection, assetId);
    }

    function _getLoyaltyCreator(address collection, uint256 assetId)
        internal
        view
        returns (address)
    {
        return creators[collection][assetId];
    }

    function isInLoyalty(address collection, uint256 assetId)
        external
        view
        returns (bool)
    {
        return _isInLoyalty(collection, assetId);
    }

    function _isInLoyalty(address collection, uint256 assetId)
        internal
        view
        returns (bool)
    {
        return hasLoyalty[collection][assetId];
    }

    function _addLoyalty(
        address collection,
        uint256 assetId,
        address right_holder,
        uint256 percent
    ) internal {
        loyalties[collection][assetId][right_holder] = percent;
        hasLoyalty[collection][assetId] = true;
        emit AddLoyalty(collection, assetId, right_holder, percent);
    }
}
