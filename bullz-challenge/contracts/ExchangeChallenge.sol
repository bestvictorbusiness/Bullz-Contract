pragma solidity >=0.6.0 <0.9.0;
/**
 * @dev contract to manage NFT challenges
 */
import './IExchangeChallenge.sol';
import '@openzeppelin/contracts/token/ERC1155/IERC1155.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract ExchangeChallenge is IExchangeChallenge, Ownable{
    
    using SafeMath for uint256;
    mapping(uint256 => Challenge) public challenges;// marketplace challenges
    mapping(address=>mapping(address => mapping(uint256 => bool))) public noResells;
    IERC20 public MARKET_TOKEN; // marketplace governance token
    uint256 public BULLZ_FEE = 5e18;// marketplace token peer challenge token
    
    constructor(address token){
        MARKET_TOKEN = IERC20(token);
    }
    /**
     * @dev Save new challenge
     * @param seller owner who create the challenge
     * @param collection ERC1155 collection
     * @param assetId the NFT identifer
     * @param amount the amount in airdrop
     * @param allowResell allow resell after first sell
     * @param saleEnd sell end date
     * @param airdropStartAt airdrop start date
     * @param airdropEndAt airdrop end date
     */
    function addChallenge(
        uint256 challengeId,
        address seller, 
        address collection, 
        uint256 assetId, 
        uint256 amount,
        uint256 submissionLimit, 
        bool allowResell, 
        uint256 saleEnd, 
        uint256 airdropStartAt, 
        uint256 airdropEndAt)external  override returns (uint256){
            require(noResells[seller][collection][assetId] != true,'Challenge Exchange: Unauthorized sell');
            require(MARKET_TOKEN.balanceOf(seller) >= uint256(BULLZ_FEE).mul(submissionLimit) , "Challenge Exchange: Insufficient balance");
            require(airdropStartAt > block.timestamp, "Challenge Exchange: invalid start at airdrop");
            require(airdropEndAt > airdropStartAt, "Challenge Exchange: invalid  airdrop");
            IERC1155 nftCollection = IERC1155(collection);
            require(
                nftCollection.balanceOf(_msgSender(), assetId) >= amount,
                "Insufficient token balance"
            );
            require(seller == _msgSender(), "Seller should be owner");
            MARKET_TOKEN.transferFrom(_msgSender(), owner(), submissionLimit.mul(BULLZ_FEE));
            challenges[challengeId] = Challenge(
                seller, 
                collection, 
                assetId, 
                amount, 
                submissionLimit,
                allowResell, 
                saleEnd, 
                airdropStartAt, 
                airdropEndAt
            );
            emit AddChallenge(challengeId,seller, collection, assetId, amount, submissionLimit, allowResell, saleEnd, airdropStartAt, airdropEndAt);
            return challengeId;
        }
    /**
    * @dev aidrop an NFT to a winner
    * @param receiver the aindrop nft receiver
    * @param amount the amount to aidrop to receiver
     */    
    function airdropChallenge(
        uint256 challengeId, 
        address receiver, 
        uint256 amount
        ) external  override returns (bool){
            Challenge storage challenge = challenges[challengeId];
            require(challenge.seller == _msgSender(),"Challenge Exchange: caller not an owner");
            require(challenge.amount >= amount, "Challenge Exchange: Insufficient balance to airdrop");
            require(block.timestamp >= challenge.airdropStartAt, "Challenge Exchange: invalid start at airdrop");
            require(challenge.airdropStartAt <= challenge.airdropEndAt, "Challenge Exchange: invalid  airdrop");
            challenge.amount =  uint256(challenge.amount).sub(amount);    
            IERC1155 nftCollection = IERC1155(challenge.collection);
            nftCollection.safeTransferFrom(_msgSender(), receiver, challenge.assetId, amount, "");
            if(!challenge.allowResell){
                noResells[receiver][challenge.collection][challenge.assetId] = true;
            }
            return true;
        }

   function setMarketToken(address token) onlyOwner() external  override returns (bool){
        MARKET_TOKEN = IERC20(token);
        emit SetMarketToken(token);
        return true;
    }   
    function setBullzFee(uint256 fee) onlyOwner() external  override returns (bool){
        BULLZ_FEE = fee;
        emit SetBullzFee(fee);
        return true;
    }

}
