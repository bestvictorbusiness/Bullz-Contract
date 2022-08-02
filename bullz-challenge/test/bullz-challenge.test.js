const ExchangeChallenge = artifacts.require("ExchangeChallenge.sol");
const TestERC1155 = artifacts.require("./contracts/TestERC1155.sol");
const TestERC20 = artifacts.require("./contracts/TestERC20.sol");

const { expectThrow } = require("@daonomic/tests-common");
async function getCurrentUnixTime() {
    return (
      await new web3.eth.getBlock(await web3.eth.getBlockNumber())
    ).timestamp;
  }
contract("YaasExchangeChallenge", accounts => {
	let testERC1155;
	let testERC20;
    const SIX_SECOND_IN_MILLISECONDE = 6000;
    const TEN_SECOND_IN_MELLISECONDE = 10000;
    const TEN_SECOND = 10;
    const TWO_SECOND = 2;
    const SIX_SECOND = 6;
    let exchangeChallenge;
    // const challengeId = 1;
	beforeEach(async () => {
        testERC1155 = await TestERC1155.new();
        testERC20 = await TestERC20.new();
        exchangeChallenge = await ExchangeChallenge.new(testERC20.address);
        await testERC20.mint(accounts[1], web3.utils.toBN(100e18));
        await testERC20.mint(accounts[2], 100);
        await testERC20.mint(accounts[3], web3.utils.toBN(100e18));
        await testERC1155.mint(1, 300,{from:accounts[1]});
        await testERC1155.mint(2, 300,{from:accounts[2]});
    });
	describe("Create challenge", async () => {
        let assetId = 1;
        let amount = 1;
        let airdropStartAt;
        let airdropEndAt;
        it("Expect throw Challenge Exchange: Insufficient balance", async () => {
            airdropStartAt =  await getCurrentUnixTime();
            airdropEndAt = (await getCurrentUnixTime()) + TEN_SECOND;
			await expectThrow(
                 exchangeChallenge.addChallenge(
                    testERC1155.address, //collection
                    assetId, 
                    amount, 
                    airdropStartAt, 
                    airdropEndAt,
                    { from: accounts[2] }
                )
            )
        });
        it("Successful challenge creation", async () => {
                airdropStartAt =  (await getCurrentUnixTime()) + SIX_SECOND;
                airdropEndAt = (await getCurrentUnixTime()) + TEN_SECOND;
                await testERC20.approve(exchangeChallenge.address, web3.utils.toBN(amount*10e18), {from: accounts[1]});
                await testERC1155.setApprovalForAll(exchangeChallenge.address, true, {from: accounts[1]});
                const txp = await exchangeChallenge.addChallenge(
                    testERC1155.address, //collection
                    assetId, 
                    amount, 
                    airdropStartAt,
                    airdropEndAt,
                    { from: accounts[1] }
                );
                const challengeId = txp.logs[0].args.challengeId;
                const challenge = await exchangeChallenge.challenges(challengeId);
                assert.equal(challenge.seller, accounts[1]);
        });

        it("airdrop challenge nft", async () => {
            await testERC1155.setApprovalForAll(exchangeChallenge.address, true, {from: accounts[1]});
            await testERC20.approve(exchangeChallenge.address, web3.utils.toBN(amount*10e18), {from: accounts[1]});
           
            airdropStartAt =  (await getCurrentUnixTime())+TWO_SECOND;
            airdropEndAt = (await getCurrentUnixTime()) + TEN_SECOND;
            const txp = await exchangeChallenge.addChallenge( 
                testERC1155.address, //collection
                assetId, 
                amount, 
                airdropStartAt,
                airdropEndAt,
                { from: accounts[1] }
            );

            const challengeId = txp.logs[0].args.challengeId;
            await new Promise((resolve) => setTimeout(resolve, SIX_SECOND_IN_MILLISECONDE));
            await exchangeChallenge.airdropChallenge(challengeId, accounts[3], 1, {from: accounts[1]});
            const challenge = await exchangeChallenge.challenges(challengeId);
            assert.equal(challenge.amount, amount-1);
            assert.equal(challenge.seller, accounts[1]);
        });
        it("withdraw challenge", async () => {
            await testERC1155.setApprovalForAll(exchangeChallenge.address, true, {from: accounts[1]});
            await testERC20.approve(exchangeChallenge.address, web3.utils.toBN(amount*10e18), {from: accounts[1]});
           
            airdropStartAt =  (await getCurrentUnixTime())+TWO_SECOND;
            airdropEndAt = (await getCurrentUnixTime()) + SIX_SECOND;
            const txp = await exchangeChallenge.addChallenge( 
                testERC1155.address, //collection
                assetId, 
                amount, 
                airdropStartAt,
                airdropEndAt,
                { from: accounts[1] }
            );

            const challengeId = txp.logs[0].args.challengeId;
            await new Promise((resolve) => setTimeout(resolve, TEN_SECOND_IN_MELLISECONDE));
            assert.equal(Number(await testERC1155.balanceOf(accounts[1], assetId)), 299);// 1 NFT is deducted from the balance
            await exchangeChallenge.withdrawChallenge(challengeId, {from: accounts[1]});
            const challenge = await exchangeChallenge.challenges(challengeId);
            assert.equal(Number(await testERC1155.balanceOf(accounts[1], assetId)), 300);// initial amount
        });


        it("Unauthorized nft challenge creation", async () => {
            await testERC1155.setApprovalForAll(exchangeChallenge.address, true, {from: accounts[1]});
            await testERC20.approve(exchangeChallenge.address, web3.utils.toBN(amount*10e18), {from: accounts[1]});
            airdropStartAt =  (await getCurrentUnixTime())+TWO_SECOND;
            airdropEndAt = (await getCurrentUnixTime()) + TEN_SECOND;
            await expectThrow(
            exchangeChallenge.addChallenge(
                testERC1155.address, //collection
                assetId, 
                amount, 
                airdropStartAt,
                airdropEndAt,
                { from: accounts[3] }
            )
            )
        });


        it("Expect throw Challenge Exchange: wallet not the owner, set swap rate", async () => {
			await expectThrow(
               exchangeChallenge.setFee(10,
                    { from: accounts[1] }
                )
            )
        });
        it("set swap rate", async () => {
            const txp = await exchangeChallenge.setFee(10,
                { from: accounts[0] }
            );
            const fee = await exchangeChallenge.BULLZ_FEE();
            assert.equal(fee, 10);
        });


        it("set utility token", async () => {
            const txp = await exchangeChallenge.setMarketToken(testERC1155.address,
                { from: accounts[0] }
            );
            const address = await exchangeChallenge.MARKET_TOKEN();
            assert.equal(address, testERC1155.address);
        });
    })
});
