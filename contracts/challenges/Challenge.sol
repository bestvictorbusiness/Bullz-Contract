// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

abstract contract Challenge is Ownable {
    IERC20 public marketToken; // marketplace governance token
    uint256 public bullzFee = 5e6; // marketplace token per challenge token
    uint256 public primaryTokenFeePercent = 500; //500 value is for 5% with 2 decimal points
    uint256 public secondaryTokenFeePercent = 700; //700 value is for 7% with 2 decimal points
    address public primaryToken;
    mapping(address => mapping(uint256 => bool)) public airdropped;

    event SetMarketToken(address indexed token);
    event SetFee(uint256 indexed fee);
    event SetPrimaryTokenPercent(uint256 indexed percent);
    event SetSecondaryTokenPercent(uint256 indexed percent);
    event SetPrimaryToken(address indexed token);

    function setFee(uint256 fee) external onlyOwner returns (bool) {
        require(
            fee > 0, "Challenge Exchange: Fee must be greated than zero."
        );
        bullzFee = fee;
        emit SetFee(fee);
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
        if (token == primaryToken) {
            return primaryTokenFeePercent;
        } else {
            return secondaryTokenFeePercent;
        }
    }

    function setPrimaryTokenPercent(uint256 percent)
        external
        onlyOwner
        returns (bool)
    {
        //10000 value is for 100% with 2 decimal points
        require(
            percent > 0 && percent <= 10000,
            "Challenge Exchange: Percent must be between 0 to 100 with 2 decimal point value."
        );
        primaryTokenFeePercent = percent;
        emit SetPrimaryTokenPercent(percent);
        return true;
    }

    function setSecondaryTokenPercent(uint256 percent)
        external
        onlyOwner
        returns (bool)
    {
        //10000 value is for 100% with 2 decimal points
        require(
            percent > 0 && percent <= 10000,
            "Challenge Exchange: Percent must be between 0 to 100 with 2 decimal point value."
        );
        secondaryTokenFeePercent = percent;
        emit SetSecondaryTokenPercent(percent);
        return true;
    }

    function setPrimaryToken(address token) public onlyOwner returns (bool) {
        require(token != address(0), "Challenge Exchange: Not a valid address");
        primaryToken = token;
        emit SetPrimaryToken(token);
        return true;
    }

    function setMarketToken(address token) public onlyOwner returns (bool) {
        require(token != address(0), "Challenge Exchange: Not a valid address");
        marketToken = IERC20(token);
        emit SetMarketToken(token);
        return true;
    }

    function _getEscrowAmount(
        uint256 winnerCount,
        uint256 tokenAmount
    ) internal pure returns (uint256) {
        return winnerCount * tokenAmount;
    }

    function _getTotalAirdropFee(
        uint256 winnerCount,
        uint256 airdropFee
    ) internal pure returns (uint256) {
        return winnerCount * airdropFee;
    }
}
