// SPDX-License-Identifier: MIT
pragma solidity 0.8.15;

/**
 * @dev contract to manage NFT challenges
 */
import './IExchangeChallenge.sol';
import '@openzeppelin/contracts/token/ERC1155/IERC1155.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";


contract ExchangeChallenge is IExchangeChallenge, Ownable, ERC1155Holder{
    
    using SafeMath for uint256;
    mapping(bytes32 => Challenge) public challenges;// marketplace challenges
    mapping(address => mapping(uint256 => bool)) public airdropped;
    IERC20 public MARKET_TOKEN; // marketplace governance token
    uint256 public BULLZ_FEE = 5e18;// marketplace token peer challenge token
    using Counters for Counters.Counter;
    Counters.Counter private _challengeIdCounter;
    
    constructor(address token){
        require(token != address(0), "Challenge Exchange: Not a valid address");
        MARKET_TOKEN = IERC20(token);
    }
    /**
     * @dev Save new challenge
     * @param collection ERC1155 collection
     * @param assetId the NFT identifer
     * @param amount the amount in airdrop
     * @param airdropStartAt airdrop start date
     * @param airdropEndAt airdrop start date
     */
    function addChallenge(        
        address collection, 
        uint256 assetId, 
        uint256 amount, 
        uint256 airdropStartAt,
        uint256 airdropEndAt)external override returns (bytes32){
            require(collection != address(0), "Challenge Exchange: Collection address not valid");
            require(!airdropped[collection][assetId],'Challenge Exchange: Can not add for re challenge');
            require(MARKET_TOKEN.balanceOf(_msgSender()) >= uint256(BULLZ_FEE).mul(amount) , "Challenge Exchange: Insufficient balance");
            require(airdropStartAt > block.timestamp, "Challenge Exchange: invalid start at airdrop");
            require(airdropEndAt > airdropStartAt, "Challenge Exchange: invalid start at airdrop");
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
            
            emit AddChallenge(challengeId, _msgSender(), collection, assetId, amount, airdropStartAt, airdropEndAt);

            bool success = MARKET_TOKEN.transferFrom(_msgSender(), owner(), amount.mul(BULLZ_FEE));
            require(success, "Challenge Exchange: Token transfer did not succeeded ");

            nftCollection.safeTransferFrom(_msgSender(), address(this), assetId, amount, ""); 

            return challengeId;
        }
    /**
    * @dev aidrop an NFT to a winner
    * @param receiver the aindrop nft receiver
    * @param amount the amount to aidrop to receiver
     */    
    function airdropChallenge(
        bytes32 challengeId, 
        address receiver, 
        uint256 amount
        ) external override returns (bool){
            require(receiver != address(0), "Challenge Exchange: Receiver address not valid");
            Challenge storage challenge = challenges[challengeId];
            require(challenge.seller == _msgSender(),"Challenge Exchange: caller not an owner");
            require(challenge.amount >= amount, "Challenge Exchange: Insufficient balance airdrop");
            require(block.timestamp >= challenge.airdropStartAt, "Challenge Exchange: invalid start at airdrop");
            challenge.amount =  uint256(challenge.amount).sub(amount);    
            IERC1155 nftCollection = IERC1155(challenge.collection);

            if(!airdropped[challenge.collection][challenge.assetId]){
                airdropped[challenge.collection][challenge.assetId] = true;
            }

            nftCollection.safeTransferFrom(address(this), receiver, challenge.assetId, amount, "");
            return true;
        }

    function withdrawChallenge(bytes32 challengeId)external  override returns (bool){
        Challenge memory challenge = challenges[challengeId];
        require(challenge.seller == _msgSender(),"Challenge Exchange: caller not an owner");
        require(challenge.airdropEndAt < block.timestamp, "Challenge exchange airdrop not ended");
        IERC1155 nftCollection = IERC1155(challenge.collection);
        nftCollection.safeTransferFrom(address(this), _msgSender(), challenge.assetId, challenge.amount, "");
        emit WithdrawChallenge(challengeId);
        return true;
    }

   function setMarketToken(address token) onlyOwner() external  override returns (bool){
        require(token != address(0), "Challenge Exchange: Not a valid address");
        MARKET_TOKEN = IERC20(token);
        emit SetMarketToken(token);
        return true;
    } 
      
    function setFee(uint256 fee) onlyOwner() external  override returns (bool){
        BULLZ_FEE = fee;
        emit SetFee(fee);
        return true;
    }
}
