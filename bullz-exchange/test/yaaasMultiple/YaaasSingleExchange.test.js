const { deployProxy, upgradeProxy } = require('@openzeppelin/truffle-upgrades');
const YaaasSingleExchange = artifacts.require("YaaasSingleExchange.sol");
const TestERC721 = artifacts.require("../contracts/TestERC721.sol");
const TestERC20 = artifacts.require("../contracts/TestERC20.sol");
// at the top of the file
var expectThrow = require('./helper.js');

contract("YaaasSingleExchange", accounts => {
	let testERC721;
	let testERC20;
	let yaaasSingleExchange;
    let ownerShare = 1;
    let SIX_DAYS_IN_SECONDS = 518400;
    let expiresAt = (Math.round(Date.now()/1000)+SIX_DAYS_IN_SECONDS);
    let price = 100;

	beforeEach(async () => {
        testERC721 = await TestERC721.new();
        testERC20 = await TestERC20.new();
        yaaasSingleExchange = await YaaasSingleExchange.new();
        await testERC20.mint(accounts[1], 100);
        await testERC20.mint(accounts[2], 100);
        await testERC20.mint(accounts[3], 300);
        await testERC721.mint(accounts[1], 1);
        await testERC721.mint(accounts[2], 2);
    });
	describe("Create new Offer/Auction", () => {
		it("Expect throw sender not an owner", async () => {
				let tx = yaaasSingleExchange.addOffer(
                    accounts[2],
                    testERC721.address,
                    1,
                    testERC20.address,
                    price,
                    false,
                    true,
                    expiresAt,
                    ownerShare,
                    { from: accounts[2] }
                )
                await expectThrow(tx); 
        });
        
        it("Expect throw contract not approved", async () => {
			let tx = yaaasSingleExchange.addOffer(
                    accounts[1],
                    testERC721.address,
                    1,
                    testERC20.address,
                    false,
                    price,
                    false,
                    true,
                    expiresAt,
                    ownerShare,
                     { from: accounts[1] })
            await expectThrow(tx); 
        });
        it("Expect offer successfuly created", async () => {
            let assetId = 1;
            let price = web3.utils.toWei('10', 'ether');
            let isForAuction = false;
            let isForSell = true;
            await testERC721.setApprovalForAll(yaaasSingleExchange.address, true, {from: accounts[1]});
			const res = await yaaasSingleExchange.addOffer(
                accounts[1],
                testERC721.address,
                assetId,
                testERC20.address,
                price,
                isForSell,
                isForAuction,
                expiresAt,
                ownerShare,  { from: accounts[1] }
            )
            const offer = await  yaaasSingleExchange.offers(testERC721.address, assetId);
            assert.equal(offer.seller, accounts[1]);
        });
        it("Set Offer price", async () => {
            const assetId = 1;
            const price = 100;
            await testERC721.setApprovalForAll(yaaasSingleExchange.address, true, {from: accounts[1]});
			const res = await yaaasSingleExchange.addOffer(
                    accounts[1],
                    testERC721.address,
                    assetId,
                    testERC20.address,
                    price,
                    false,
                    true,
                    expiresAt,
                    ownerShare,  { from: accounts[1] }
                )
            await yaaasSingleExchange.setOfferPrice(testERC721.address, assetId, 200, {from: accounts[1]})    
            const offer = await  yaaasSingleExchange.offers(testERC721.address, assetId);
            assert.equal(offer.price, 200);
        });
        it("Set ExpiresAt", async () => {
            const assetId = 1;
            const price = 100;
            await testERC721.setApprovalForAll(yaaasSingleExchange.address, true, {from: accounts[1]});
			const res = await yaaasSingleExchange.addOffer(
                    accounts[1],
                    testERC721.address,
                    assetId,
                    testERC20.address,
                    price,
                    false,
                    true,
                    expiresAt,
                    ownerShare,
                     { from: accounts[1] }
                )
            await yaaasSingleExchange.setExpiresAt(testERC721.address, assetId, 1620481368, {from: accounts[1]})    
            const offer = await  yaaasSingleExchange.offers(testERC721.address, assetId);
            assert.equal(offer.expiresAt, 1620481368);
        });
        

    })
    describe("Create/Cancel bid", () => {
        let assetId = 1;
        let price = 100;
        let isForAuction = true;
        let isForSell = false;
        it("Expect throw erc20 not approved", async () => {
            await testERC721.setApprovalForAll(yaaasSingleExchange.address, true, {from: accounts[1]});
			const res = await yaaasSingleExchange.addOffer(
                    accounts[1],
                    testERC721.address,
                    assetId,
                    testERC20.address,
                    price,
                    isForSell,
                    isForAuction,
                    expiresAt,
                    ownerShare,  { from: accounts[1] }
                )
            await  yaaasSingleExchange.offers(testERC721.address, assetId);
            let tx = yaaasSingleExchange.safePlaceBid(
                testERC721.address,
                assetId,
                testERC20.address,
                100,
                {from:accounts[2]}
                )
            await expectThrow(tx); 
        })
        it("Expect success bid created", async () => {
            await testERC721.setApprovalForAll(yaaasSingleExchange.address, true, {from: accounts[1]});
			let res = await yaaasSingleExchange.addOffer(
                    accounts[1],
                    testERC721.address,
                    assetId,
                    testERC20.address,
                    price,
                    isForSell,// isForSell
                    isForAuction,// isForAuction
                    expiresAt,
                    ownerShare,
                     { from: accounts[1] }
                )
            const offer = await  yaaasSingleExchange.offers(testERC721.address, assetId);
            await testERC20.approve(yaaasSingleExchange.address, price, {from: accounts[2]});
            res = await yaaasSingleExchange.safePlaceBid(
                testERC721.address,
                assetId,
                testERC20.address,
                price,
                {from:accounts[2]}
                )
            const bid = await yaaasSingleExchange.bidforAuctions(testERC721.address, assetId, accounts[2]);    
            assert.equal(price, bid.price);
        })
        it("Cancel bid", async () => {
            await testERC721.setApprovalForAll(yaaasSingleExchange.address, true, {from: accounts[1]});
			let res = await yaaasSingleExchange.addOffer(
                    accounts[1],
                    testERC721.address,
                    assetId,
                    testERC20.address,
                    price,
                    isForSell,// isForSell
                    isForAuction,// isForAuction
                    expiresAt,
                    ownerShare,
                      { from: accounts[1] }
                )
            await  yaaasSingleExchange.offers(testERC721.address, assetId);
            await testERC20.approve(yaaasSingleExchange.address, price, {from: accounts[2]});
            res = await yaaasSingleExchange.safePlaceBid(
                testERC721.address,
                assetId,
                testERC20.address,
                price,
                {from:accounts[2]}
                )
            const bidC = await yaaasSingleExchange.cancelBid(testERC721.address, assetId,accounts[2], {from: accounts[2]})  
            const bid = await yaaasSingleExchange.bidforAuctions(testERC721.address, assetId, accounts[2]) 
            assert.equal(0, bid.price);
        })
        it("Accept bid", async () => {
            let assetId = 1;
            let price = 100;
            let isForAuction = true;
            let isForSell = false;
            await testERC721.setApprovalForAll(yaaasSingleExchange.address, true, {from: accounts[1]});
			let res = await yaaasSingleExchange.addOffer(
                accounts[1],
                testERC721.address,
                assetId,
                testERC20.address,
                price,
                isForSell,
                isForAuction,
                expiresAt,
                ownerShare,  { from: accounts[1] }
            )
            await  yaaasSingleExchange.offers(testERC721.address, assetId);
            await testERC20.approve(yaaasSingleExchange.address, price, {from: accounts[2]});
            await testERC20.approve(yaaasSingleExchange.address, price, {from: accounts[3]});
            res = await yaaasSingleExchange.safePlaceBid(
                testERC721.address,
                assetId,
                testERC20.address,
                price,
                {from:accounts[2]}
                )
            res = await yaaasSingleExchange.safePlaceBid(
                testERC721.address,
                assetId,
                testERC20.address,
                price,
                {from:accounts[3]}
                )
            await yaaasSingleExchange.acceptBid( testERC721.address, assetId, accounts[2], {from: accounts[1]})  
            assert.equal((await testERC20.balanceOf(accounts[1])).toString(), (price*2)-(price*1/100));
            assert.equal((await testERC20.balanceOf(accounts[2])).toString(), 0);
            assert.equal((await testERC20.balanceOf(accounts[3])).toString(),(price*3));
        })

    })
    describe("Direct Buy/Sell", () => {
        let assetId = 2;
        let price = web3.utils.toWei('10', 'ether');
        let isForAuction = false;
        let isForSell = true;
        it("Create offer successfuly", async () => {
            await testERC721.setApprovalForAll(yaaasSingleExchange.address, true, {from: accounts[2]});
			const res = await yaaasSingleExchange.addOffer(
                    accounts[2],
                    testERC721.address,
                    assetId,
                    testERC20.address,
                    price,
                    isForSell,
                    isForAuction,
                    expiresAt,
                    ownerShare,  { from: accounts[2] }
                )
           assert.equal(1,1)
            
        })
        it("Buy offer", async () => {
            let count2ldBalance = await web3.eth.getBalance(accounts[2]);
            let count3ldBalance = await web3.eth.getBalance(accounts[3]);
            await testERC721.setApprovalForAll(yaaasSingleExchange.address, true, {from: accounts[2]});
			const res = await yaaasSingleExchange.addOffer(
                    accounts[2],
                    testERC721.address,
                    assetId,
                    testERC20.address,
                    price,
                    isForSell,
                    isForAuction,
                    expiresAt,
                    ownerShare,
                      { from: accounts[2] }
            )
            let newPrice = web3.utils.toWei('11', 'ether');
            await yaaasSingleExchange.buyOffer(testERC721.address, assetId,{from: accounts[3], value:newPrice})
            count1ldBalance = await web3.eth.getBalance(accounts[2]);
            count2ldBalance = await web3.eth.getBalance(accounts[3]);
            assert.equal((await testERC721.ownerOf(assetId)),accounts[3])            
        })
        it("Delegate Buy offer", async () => {
            let count2ldBalance = await web3.eth.getBalance(accounts[2]);
            let count3ldBalance = await web3.eth.getBalance(accounts[3]);
            await testERC721.setApprovalForAll(yaaasSingleExchange.address, true, {from: accounts[2]});
			const res = await yaaasSingleExchange.addOffer(
                    accounts[2],
                    testERC721.address,
                    assetId,
                    testERC20.address,
                    price,
                    isForSell,
                    isForAuction,
                    expiresAt,
                    ownerShare,
                      { from: accounts[2] }
            )
            let newPrice = web3.utils.toWei('10.1', 'ether');
            await yaaasSingleExchange.delegateBuy(testERC721.address, assetId, accounts[4], {from: accounts[3], value:newPrice})
            count1ldBalance = await web3.eth.getBalance(accounts[2]);
            count2ldBalance = await web3.eth.getBalance(accounts[3]);
            assert.equal((await testERC721.ownerOf(assetId)),accounts[4])            
        })
        it("Buy Loyalty offer", async () => {
            const loyaltyPercent = 1;
            await testERC721.setApprovalForAll(yaaasSingleExchange.address, true, {from: accounts[2]});
			let res = await yaaasSingleExchange.addLoyaltyOffer(
                    accounts[2],
                    testERC721.address,
                    assetId,
                    testERC20.address,
                    price,
                    isForSell,
                    isForAuction,
                    expiresAt,
                    ownerShare,
                    loyaltyPercent,
                      { from: accounts[2] }
            )
            let newPrice = web3.utils.toWei('10.1', 'ether');
            await yaaasSingleExchange.buyOffer(testERC721.address, assetId,{from: accounts[3], value:newPrice})
            await testERC721.setApprovalForAll(yaaasSingleExchange.address, true, {from: accounts[3]});
            let count2ldBalance = await web3.eth.getBalance(accounts[2]);
            res = await yaaasSingleExchange.addOffer(
                accounts[3],
                testERC721.address,
                assetId,
                testERC20.address,
                price,
                isForSell,
                isForAuction,
                expiresAt,
                ownerShare,
                  { from: accounts[3] }
            )
            await yaaasSingleExchange.buyOffer(testERC721.address, assetId,{from: accounts[1], value:newPrice})
            count2ldBalance = await web3.eth.getBalance(accounts[2]);           
            assert.equal((await testERC721.ownerOf(assetId)),accounts[1])            
        })
        it("set owner share", async () => {
            
			const res = await yaaasSingleExchange.setFeeTo(
                    1,1,  { from: accounts[0] }
            )
            assert.equal((await yaaasSingleExchange.shares(1)),1)      
        })
        
    })
});
