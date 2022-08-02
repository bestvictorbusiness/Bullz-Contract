const { deployProxy, upgradeProxy } = require('@openzeppelin/truffle-upgrades');
const YaaasMultipleExchange = artifacts.require("YaaasMultipleExchange.sol");
const TestERC1155 = artifacts.require("../contracts/TestERC1155.sol");
const TestERC20 = artifacts.require("../contracts/TestERC20.sol");

const ZERO = "0x0000000000000000000000000000000000000000";
var expectThrow = require('./helper.js');

contract("YaasExchangeMultiple", accounts => {
	let testERC1155;
	let testERC20;
	let yaasMultipleExchange;
    let ownerShare = 1;
    let offerId= 1;
    let SIX_DAYS_IN_SECONDS = 518400;
    let expiresAt = (Math.round(Date.now()/1000)+SIX_DAYS_IN_SECONDS);

	beforeEach(async () => {
        testERC1155 = await TestERC1155.new();
        testERC20 = await TestERC20.new();
        yaasMultipleExchange = await YaaasMultipleExchange.new();
        await testERC20.mint(accounts[1], 100);
        await testERC20.mint(accounts[2], 100);
        await testERC20.mint(accounts[3], 300);
        await testERC1155.mint(1, 300,{from:accounts[1]});
        await testERC1155.mint(2, 300,{from:accounts[2]});

        await testERC20.mint(accounts[5], 100);
        await testERC20.mint(accounts[6], 100);
        await testERC1155.mint(3, 100,{from:accounts[7]});
    });
	describe("Create new Offer/Auction", () => {
        let amount = 20;
        let price = 100;
		it("Expect throw sender not an owner", async () => {
			try {
                await yaasMultipleExchange.addOffer(
                    offerId, 
                    accounts[2],
                    testERC1155.address,
                    1,
                    testERC20.address,
                    price,
                    amount,
                    false,
                    true,
                    expiresAt,
                    ownerShare,
                    { from: accounts[2] }
                );
            }
            catch (err) {
                assert(true);
            }  
        });
        
        it("Expect throw contract not approved", async () => {
			await expectThrow(
				 yaasMultipleExchange.addOffer(
                    offerId, 
                    accounts[1],
                    testERC1155.address,
                    1,
                    testERC20.address,
                    price,
                    amount,
                    false,
                    true,
                    expiresAt,
                    ownerShare,
                     { from: accounts[1] }
                )
            )
        });
        it("Expect offer successfuly created", async () => {
            const assetId = 1;
            const price = 100;
            await testERC1155.setApprovalForAll(yaasMultipleExchange.address, true, {from: accounts[1]});
			const res = await yaasMultipleExchange.addOffer(
                offerId,
                accounts[1],
                testERC1155.address,
                1,
                testERC20.address,
                price,
                amount,
                false,
                true,
                expiresAt,
                ownerShare,
                    { from: accounts[1] }
                )
            const offer = await  yaasMultipleExchange.offers(offerId);
            assert.equal(offer.seller, accounts[1]);
        });
        it("Set Offer price", async () => {
            const assetId = 1;
            await testERC1155.setApprovalForAll(yaasMultipleExchange.address, true, {from: accounts[1]});
			const res = await yaasMultipleExchange.addOffer(
                    offerId,
                    accounts[1],
                    testERC1155.address,
                    assetId,
                    testERC20.address,
                    price,
                    amount,
                    false,
                    true,
                    expiresAt,
                    ownerShare,  { from: accounts[1] }
                )
            await yaasMultipleExchange.setOfferPrice(offerId, 200, {from: accounts[1]})    
            const offer = await  yaasMultipleExchange.offers(offerId);
            assert.equal(offer.price, 200);
        });
        it("Set ExpiresAt", async () => {
            const assetId = 1;
            await testERC1155.setApprovalForAll(yaasMultipleExchange.address, true, {from: accounts[1]});
			const res = await yaasMultipleExchange.addOffer(
                    offerId,
                    accounts[1],
                    testERC1155.address,
                    assetId,
                    testERC20.address,
                    price,
                    amount,
                    false,
                    true,
                    expiresAt,
                    ownerShare,
                     { from: accounts[1] }
                )
            await yaasMultipleExchange.setExpiresAt(offerId, 1620481368, {from: accounts[1]})    
            const offer = await  yaasMultipleExchange.offers(offerId);
            assert.equal(offer.expiresAt, 1620481368);
        });
        

    })
    describe("Create/Cancel bid", () => {
        let assetId = 1;
        let price = 100;
        let isForAuction = true;
        let isForSell = false;
        let amount = 20;
        it("Expect throw erc20 not approved", async () => {
            await testERC1155.setApprovalForAll(yaasMultipleExchange.address, true, {from: accounts[1]});
			const res = await yaasMultipleExchange.addOffer(
                    offerId,
                    accounts[1],
                    testERC1155.address,
                    assetId,
                    testERC20.address,
                    price,
                    amount,
                    isForSell,
                    isForAuction,
                    expiresAt,
                    ownerShare,  { from: accounts[1] }
                )
            await  yaasMultipleExchange.offers(offerId);
            await expectThrow(    
             yaasMultipleExchange.safePlaceBid(
                offerId,
                testERC20.address,
                price,
                amount,
                expiresAt,
                {from:accounts[2]}
                )
            )
        })
        it("Expect success bid created", async () => {
            await testERC1155.setApprovalForAll(yaasMultipleExchange.address, true, {from: accounts[1]});
			let res = await yaasMultipleExchange.addOffer(
                    offerId,
                    accounts[1],
                    testERC1155.address,
                    assetId,
                    testERC20.address,
                    price,
                    amount,
                    isForSell,// isForSell
                    isForAuction,// isForAuction
                    expiresAt,
                    ownerShare,
                     { from: accounts[1] }
                )
            const offer = await  yaasMultipleExchange.offers(offerId);
            await testERC20.approve(yaasMultipleExchange.address, price, {from: accounts[2]});
            res = await yaasMultipleExchange.safePlaceBid(
                offerId,
                testERC20.address,
                price,
                amount,
                {from:accounts[2]}
                )
            const bid = await yaasMultipleExchange.bidforAuctions(offerId, accounts[2]);    
            assert.equal(price, bid.price);
        })
        it("Cancel bid", async () => {
            await testERC1155.setApprovalForAll(yaasMultipleExchange.address, true, {from: accounts[1]});
			let res = await yaasMultipleExchange.addOffer(
                    offerId,
                    accounts[1],
                    testERC1155.address,
                    assetId,
                    testERC20.address,
                    price,
                    amount,
                    isForSell,// isForSell
                    isForAuction,// isForAuction
                    expiresAt,
                    ownerShare,
                      { from: accounts[1] }
                )
            await  yaasMultipleExchange.offers(offerId);
            await testERC20.approve(yaasMultipleExchange.address, price, {from: accounts[2]});
            res = await yaasMultipleExchange.safePlaceBid(
                offerId,
                testERC20.address,
                price,
                amount,//amount
                {from:accounts[2]}
                )
            const bidC = await yaasMultipleExchange.cancelBid(offerId,accounts[2], {from: accounts[2]})  
            const bid = await yaasMultipleExchange.bidforAuctions(offerId, accounts[2]) 
            assert.equal(0, bid.price);
        })
        it("Accept single bid", async () => {
            await testERC1155.setApprovalForAll(yaasMultipleExchange.address, true, {from: accounts[1]});
			let res = await yaasMultipleExchange.addOffer(
                    offerId,
                    accounts[1],
                    testERC1155.address,
                    assetId,
                    testERC20.address,
                    price,
                    amount,
                    isForSell,// isForSell
                    isForAuction,// isForAuction
                    expiresAt, 
                    ownerShare, { from: accounts[1] }
                )
            await  yaasMultipleExchange.offers(offerId);
            await testERC20.approve(yaasMultipleExchange.address, price, {from: accounts[2]});
            await testERC20.approve(yaasMultipleExchange.address, price, {from: accounts[3]});
            res = await yaasMultipleExchange.safePlaceBid(
                offerId,
                testERC20.address,
                price,
                10,//amount
                {from:accounts[2]}
                )
            res = await yaasMultipleExchange.safePlaceBid(
                offerId,
                testERC20.address,
                price,
                10,//amount
                {from:accounts[3]}
                )
            await yaasMultipleExchange.acceptBid( offerId, accounts[2], {from: accounts[1]})  
            assert.equal((await testERC20.balanceOf(accounts[1])).toString(), (price*2)-(price*1/100));
            assert.equal((await testERC20.balanceOf(accounts[2])).toString(), 0);
            assert.equal((await testERC20.balanceOf(accounts[3])).toString(),(price*3));
        })

        it("Test multiple auction/direct sell", async () => {
             assetId = 3;
             price = 1;
             isForAuction = true;
             isForSell = false;
             amount = 20;
             amountInAuction = 50;
             amountInDirectSell = 30;
             offerId = 7
            await testERC1155.setApprovalForAll(yaasMultipleExchange.address, true, {from: accounts[7]});
			let res = await yaasMultipleExchange.addOffer(
                    offerId,
                    accounts[7],
                    testERC1155.address,
                    assetId,
                    testERC20.address,
                    price,
                    amountInAuction,
                    isForSell,// isForSell
                    isForAuction,// isForAuction
                    expiresAt, 
                    ownerShare, { from: accounts[7] }
                )
            await  yaasMultipleExchange.offers(offerId);
            await testERC20.approve(yaasMultipleExchange.address, price*amountInAuction, {from: accounts[2]});
            res = await yaasMultipleExchange.safePlaceBid(
                offerId,
                testERC20.address,
                price,
                amountInAuction,
                {from:accounts[2]}
                )
            await yaasMultipleExchange.acceptBid( offerId, accounts[2], {from: accounts[7]})

            isForAuction = false;
            isForSell = true;
            amountInDirectSell = 30;
            offerId = 8
            price = web3.utils.toWei('0.0001', 'ether');
			await yaasMultipleExchange.addOffer(
                    offerId,
                    accounts[7],
                    testERC1155.address,
                    assetId,
                    testERC20.address,
                    price,
                    amountInDirectSell,
                    isForSell,
                    isForAuction,
                    expiresAt,
                    ownerShare,
                      { from: accounts[7] }
            )
            let newPrice = web3.utils.toWei('0.01', 'ether');
            await yaasMultipleExchange.buyOffer(offerId, amountInDirectSell,{from: accounts[8], value:newPrice})
            assert.equal((await testERC1155.balanceOf(accounts[7], assetId)),20)      

        })
        it("Accept multiple bid", async () => {
            await testERC1155.setApprovalForAll(yaasMultipleExchange.address, true, {from: accounts[1]});
             assetId = 1;
             price = 100;
             isForAuction = true;
             isForSell = false;
             amount = 20;
			let res = await yaasMultipleExchange.addOffer(
                    offerId,
                    accounts[1],
                    testERC1155.address,
                    assetId,
                    testERC20.address,
                    price,
                    amount,
                    isForSell,// isForSell
                    isForAuction,// isForAuction
                    expiresAt, 
                    ownerShare, { from: accounts[1] }
                )
            await  yaasMultipleExchange.offers(offerId);
            await testERC20.approve(yaasMultipleExchange.address, price, {from: accounts[2]});
            await testERC20.approve(yaasMultipleExchange.address, price, {from: accounts[3]});
            res = await yaasMultipleExchange.safePlaceBid(
                offerId,
                testERC20.address,
                price,
                10,//amount
                {from:accounts[2]}
                )
            await yaasMultipleExchange.acceptBid( offerId, accounts[2], {from: accounts[1]})
            res = await yaasMultipleExchange.safePlaceBid(
                offerId,
                testERC20.address,
                price,
                10,//amount
                {from:accounts[3]}
                )
            await yaasMultipleExchange.acceptBid( offerId, accounts[3], {from: accounts[1]})  
            assert.equal((await testERC20.balanceOf(accounts[1])).toString(), (price*3)-(price*2/100));
            assert.equal((await testERC20.balanceOf(accounts[2])).toString(), 0);
            assert.equal((await testERC20.balanceOf(accounts[3])).toString(),(price*2));
        })

    })
    describe("Direct Buy/Sell", () => {
        let amount = 20;
        let assetId = 2;
        let price = web3.utils.toWei('10', 'ether');
        
        let isForAuction = false;
        let isForSell = true;
        it("Create offer successfuly", async () => {
            await testERC1155.setApprovalForAll(yaasMultipleExchange.address, true, {from: accounts[2]});
			const res = await yaasMultipleExchange.addOffer(
                    offerId,
                    accounts[2],
                    testERC1155.address,
                    assetId,
                    testERC20.address,
                    price,
                    amount,
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
            await testERC1155.setApprovalForAll(yaasMultipleExchange.address, true, {from: accounts[2]});
            amount = 2;
            price = web3.utils.toWei('0.02', 'ether');
			const res = await yaasMultipleExchange.addOffer(
                    offerId,
                    accounts[2],
                    testERC1155.address,
                    assetId,
                    testERC20.address,
                    price,
                    amount,
                    isForSell,
                    isForAuction,
                    expiresAt,
                    ownerShare,
                      { from: accounts[2] }
            )
            let newPrice = web3.utils.toWei('0.0202', 'ether');
            await yaasMultipleExchange.buyOffer(offerId, 1,{from: accounts[3], value:newPrice})
            count1ldBalance = await web3.eth.getBalance(accounts[2]);
            count2ldBalance = await web3.eth.getBalance(accounts[3]);
            assert.equal((await testERC1155.balanceOf(accounts[3], assetId)),1)            
        })
        it("Delegate Buy offer", async () => {
            let count2ldBalance = await web3.eth.getBalance(accounts[2]);
            let count3ldBalance = await web3.eth.getBalance(accounts[3]);
            await testERC1155.setApprovalForAll(yaasMultipleExchange.address, true, {from: accounts[2]});
            amount = 2;
            price = web3.utils.toWei('0.02', 'ether');
			const res = await yaasMultipleExchange.addOffer(
                    offerId,
                    accounts[2],
                    testERC1155.address,
                    assetId,
                    testERC20.address,
                    price,
                    amount,
                    isForSell,
                    isForAuction,
                    expiresAt,
                    ownerShare,
                      { from: accounts[2] }
            )
            let newPrice = web3.utils.toWei('0.0202', 'ether');
            await yaasMultipleExchange.delegateBuy(offerId, 1, accounts[4], {from: accounts[3], value:newPrice})
            count1ldBalance = await web3.eth.getBalance(accounts[2]);
            count2ldBalance = await web3.eth.getBalance(accounts[3]);
            assert.equal((await testERC1155.balanceOf(accounts[4], assetId)),1)            
        })
        it("test loyalty Offer", async () => {
            let count2ldBalance = await web3.eth.getBalance(accounts[2]);
            await testERC1155.setApprovalForAll(yaasMultipleExchange.address, true, {from: accounts[2]});
            amount = 2;
            price = web3.utils.toWei('0.02', 'ether');
            offerId=10
			const res = await yaasMultipleExchange.addLoyaltyOffer(
                    offerId,
                    accounts[2],
                    testERC1155.address,
                    assetId,
                    testERC20.address,
                    price,
                    amount,
                    isForSell,
                    isForAuction,
                    expiresAt,
                    ownerShare,
                    1,// loyalty percent
                      { from: accounts[2] }
            )
            let newPrice = web3.utils.toWei('0.0202', 'ether');
            await yaasMultipleExchange.buyOffer(offerId, 1,{from: accounts[3], value:newPrice})
            count1ldBalance = await web3.eth.getBalance(accounts[2]);
            count2ldBalance = await web3.eth.getBalance(accounts[3]);
            assert.equal((await testERC1155.balanceOf(accounts[3], assetId)),1)            
        })
        it("set owner share", async () => {
            
			const res = await yaasMultipleExchange.setFeeTo(
                    1,1,  { from: accounts[0] }
            )
            assert.equal((await yaasMultipleExchange.shares(1)),1)      
        })
        
    })
});
