require("@nomiclabs/hardhat-ethers");
const hre = require("hardhat");
const { ethers } = require("hardhat");
const { expect } = require("chai");

async function getCurrentUnixTime() {
  return (await ethers.provider.getBlock("latest")).timestamp;
}
describe("NFT Challenge", async function () {
  let ExchangeChallenge;
  let TestERC1155;
  let TestERC20;

  let testERC1155;
  let testERC20;
  const SIX_SECOND_IN_MILLISECONDE = 6000;
  const TEN_SECOND_IN_MELLISECONDE = 10000;
  const TEN_SECOND = 10;
  const TWO_SECOND = 2;
  const SIX_SECOND = 6;
  const zeroAddress = "0x0000000000000000000000000000000000000000";

  let exchangeChallenge;
  let account1, account2, account3, owner, account4;
  const toBN = (value) => {
    return ethers.utils.parseUnits(value, 18);
  };
  const eventIdAddChallenge = 1;
  const eventIdAirDropChallenge = 2;
  const eventIdWithdrawChallenge = 3;
  // const challengeId = 1;
  beforeEach(async () => {
    [owner, account1, account2, account3, account4] = await ethers.getSigners();

    ExchangeChallenge = await ethers.getContractFactory("ExchangeChallenge");
    TestERC1155 = await ethers.getContractFactory("ERC1155Openzeppelin");
    TestERC20 = await ethers.getContractFactory("TestERC20");

    testERC1155 = await TestERC1155.deploy("test", "TST");
    testERC20 = await TestERC20.deploy();
    exchangeChallenge = await ExchangeChallenge.deploy(testERC20.address, testERC20.address);

    await testERC20.mint(account1.address, toBN("100"));
    await testERC20.mint(account2.address, 100);
    await testERC20.mint(account3.address, toBN("100"));
    await testERC1155.connect(account1).awardItem(1, 300, "0x", 0, 2);
    await testERC1155.connect(account2).awardItem(2, 300, "0x", 0, 2);
    
  });
  let assetId = 1;
  let amount = 1;
  let airdropStartAt;
  let airdropEndAt;
  describe("NFT challenge", async () => {
    it("should create nft challenge successfully", async () => {
      airdropStartAt = (await getCurrentUnixTime()) + 10;
      airdropEndAt = (await getCurrentUnixTime()) + 15;
      await testERC20
        .connect(account1)
        .approve(exchangeChallenge.address, toBN("10"));
      await testERC1155
        .connect(account1)
        .setApprovalForAll(exchangeChallenge.address, true);
      const txp = await exchangeChallenge.connect(account1).addChallenge(
        testERC1155.address, //collection
        assetId,
        amount,
        airdropStartAt,
        airdropEndAt,
        eventIdAddChallenge
      );
      let receipt = await txp.wait();
      const event = receipt.events?.filter((x) => {
        return x.event == "AddChallenge";
      });
      const challengeId = event[0].args.challengeId;
      const challenge = await exchangeChallenge.challenges(challengeId);
      expect(challenge.seller).to.equal(account1.address);
    });

    it("should transfer airdrop fee to owner during challenge creation", async () => {
      airdropStartAt = (await getCurrentUnixTime()) + 10;
      airdropEndAt = (await getCurrentUnixTime()) + 15;
      const ownerBalance1 = await testERC20.balanceOf(owner.address);
      const fee = await exchangeChallenge.bullzFee();
      await testERC20
        .connect(account1)
        .approve(exchangeChallenge.address, fee.mul(amount));
      await testERC1155
        .connect(account1)
        .setApprovalForAll(exchangeChallenge.address, true);
      const txp = await exchangeChallenge.connect(account1).addChallenge(
        testERC1155.address, //collection
        assetId,
        amount,
        airdropStartAt,
        airdropEndAt,
        eventIdAddChallenge
      );
      await txp.wait();
      const ownerBalance2 = await testERC20.balanceOf(owner.address);

      expect(Number(ownerBalance2.sub(ownerBalance1))).to.be.equals(Number(fee.mul(amount)));
    });

    it("challenge creation should fails collection should not be zero address", async () => {
      airdropStartAt = (await getCurrentUnixTime()) + TEN_SECOND;
      airdropEndAt = (await getCurrentUnixTime()) + TEN_SECOND;
      expect(
        exchangeChallenge.addChallenge(
          zeroAddress, //collections
          assetId,
          amount,
          airdropStartAt,
          airdropEndAt,
          eventIdAddChallenge
        )
      ).to.be.revertedWith("Challenge Exchange: Collection address not valid");
    });
    it("should throw Challenge Exchange: Insufficient nft balance", async () => {
      airdropStartAt = (await getCurrentUnixTime()) + SIX_SECOND;
      airdropEndAt = (await getCurrentUnixTime()) + TEN_SECOND;
      expect(
         
        exchangeChallenge.connect(account1).addChallenge(
          testERC1155.address, //collections
          assetId,
          4,
          airdropStartAt,
          airdropEndAt,
          eventIdAddChallenge
        )
      ).to.be.revertedWith("Challenge Exchange: Insufficient balance");
    });
    it("should throw Challenge Exchange: Insufficient token balance", async () => {
      airdropStartAt = (await getCurrentUnixTime()) + SIX_SECOND;
      airdropEndAt = (await getCurrentUnixTime()) + TEN_SECOND;
      expect( exchangeChallenge.connect(account2).addChallenge(
          testERC1155.address, //collections
          2,//asset2
          amount,
          airdropStartAt,
          airdropEndAt,

          eventIdAddChallenge
        )
      ).to.be.revertedWith("Challenge Exchange: Insufficient balance");
    });
    it("should fails when with can not add for re challenge", async () => {
      await testERC1155
        .connect(account1)
        .setApprovalForAll(exchangeChallenge.address, true);
      await testERC20
        .connect(account1)
        .approve(exchangeChallenge.address, toBN("10"));

      airdropStartAt = (await getCurrentUnixTime()) + TWO_SECOND;
      airdropEndAt = (await getCurrentUnixTime()) + TEN_SECOND;
      const txp = await exchangeChallenge.connect(account1).addChallenge(
        testERC1155.address, //collection
        assetId,
        amount,
        airdropStartAt,
        airdropEndAt,
        eventIdAddChallenge
      );

      let receipt = await txp.wait();
      const event = receipt.events?.filter((x) => {
        return x.event == "AddChallenge";
      });
      const challengeId = event[0].args.challengeId;
      await new Promise((resolve) =>
        setTimeout(resolve, SIX_SECOND_IN_MILLISECONDE)
      );
      expect(exchangeChallenge.connect(account1).addChallenge(
        testERC1155.address, //collection
        assetId,
        amount,
        airdropStartAt,
        airdropEndAt,
        eventIdAddChallenge
      )).to.be.revertedWith("Challenge Exchange: Can not add for re challenge")
    });
    it("challenge creation should fails when start airdrop date outdated", async () => {
      airdropStartAt = (await getCurrentUnixTime()) - 10;
      airdropEndAt = (await getCurrentUnixTime()) + TEN_SECOND;
      expect(
        exchangeChallenge.addChallenge(
          testERC1155.address, //collections
          assetId,
          amount,
          airdropStartAt,
          airdropEndAt,
          eventIdAddChallenge
        )
      ).to.be.revertedWith("Challenge Exchange: invalid start at airdrop");
    });
    it("challenge creation should fails when airdropEndAt <= airdropStartAT", async () => {
      airdropStartAt = (await getCurrentUnixTime()) + TEN_SECOND;
      airdropEndAt = (await getCurrentUnixTime()) + TEN_SECOND;
      expect(
        exchangeChallenge.connect(account1).addChallenge(
          testERC1155.address, //collections
          assetId,
          amount,
          airdropStartAt,
          airdropEndAt,
          eventIdAddChallenge
        )
      ).to.be.revertedWith("Challenge Exchange: invalid airdropEndAt at airdrop");
    });
   
    it("challenge creation should fails nft amount < balance", async () => {
      airdropStartAt = (await getCurrentUnixTime()) + TEN_SECOND;
      airdropEndAt = (await getCurrentUnixTime()) + TEN_SECOND;
      expect(
        exchangeChallenge.addChallenge(
          zeroAddress, //collections
          assetId,
          20000,
          airdropStartAt,
          airdropEndAt,
          eventIdAddChallenge
        )
      ).to.be.revertedWith("Insufficient token balance");
    });
    it("airdrop should fails when receiver is 0x address", async () => {
      await testERC1155
        .connect(account1)
        .setApprovalForAll(exchangeChallenge.address, true);
      await testERC20
        .connect(account1)
        .approve(exchangeChallenge.address, toBN("10"));

      airdropStartAt = (await getCurrentUnixTime()) + TWO_SECOND;
      airdropEndAt = (await getCurrentUnixTime()) + TEN_SECOND;
      const txp = await exchangeChallenge.connect(account1).addChallenge(
        testERC1155.address, //collection
        assetId,
        amount,
        airdropStartAt,
        airdropEndAt,
        eventIdAddChallenge
      );

      let receipt = await txp.wait();
      const event = receipt.events?.filter((x) => {
        return x.event == "AddChallenge";
      });
      const challengeId = event[0].args.challengeId;
      await new Promise((resolve) =>
        setTimeout(resolve, SIX_SECOND_IN_MILLISECONDE)
      );
      expect(exchangeChallenge
        .connect(account1)
        .airdropChallenge(
          challengeId,
          zeroAddress,
          1,
          eventIdAirDropChallenge
        )).to.be.revertedWith("Challenge Exchange: Receiver address not valid")
    });
    it("airdrop challenge should fails caller is not owner", async () => {
      await testERC1155
        .connect(account1)
        .setApprovalForAll(exchangeChallenge.address, true);
      await testERC20
        .connect(account1)
        .approve(exchangeChallenge.address, toBN("10"));

      airdropStartAt = (await getCurrentUnixTime()) + TWO_SECOND;
      airdropEndAt = (await getCurrentUnixTime()) + TEN_SECOND;
      const txp = await exchangeChallenge.connect(account1).addChallenge(
        testERC1155.address, //collection
        assetId,
        amount,
        airdropStartAt,
        airdropEndAt,
        eventIdAddChallenge
      );

      let receipt = await txp.wait();
      const event = receipt.events?.filter((x) => {
        return x.event == "AddChallenge";
      });
      const challengeId = event[0].args.challengeId;
      await new Promise((resolve) =>
        setTimeout(resolve, SIX_SECOND_IN_MILLISECONDE)
      );
      expect(exchangeChallenge
        .connect(account3)
        .airdropChallenge(
          challengeId,
          zeroAddress,
          1,
          eventIdAirDropChallenge
        )).to.be.revertedWith("Challenge Exchange: caller not an owner")
    });
    it("airdrop challenge amount should not exceed challenge amount", async () => {
      await testERC1155
        .connect(account1)
        .setApprovalForAll(exchangeChallenge.address, true);
      await testERC20
        .connect(account1)
        .approve(exchangeChallenge.address, toBN("10"));

      airdropStartAt = (await getCurrentUnixTime()) + TWO_SECOND;
      airdropEndAt = (await getCurrentUnixTime()) + TEN_SECOND;
      const txp = await exchangeChallenge.connect(account1).addChallenge(
        testERC1155.address, //collection
        assetId,
        amount,
        airdropStartAt,
        airdropEndAt,
        eventIdAddChallenge
      );

      let receipt = await txp.wait();
      const event = receipt.events?.filter((x) => {
        return x.event == "AddChallenge";
      });
      const challengeId = event[0].args.challengeId;
      await new Promise((resolve) =>
        setTimeout(resolve, SIX_SECOND_IN_MILLISECONDE)
      );
      expect(exchangeChallenge
        .connect(account3)
        .airdropChallenge(
          challengeId,
          zeroAddress,
          2,
          eventIdAirDropChallenge
        )).to.be.revertedWith("Challenge Exchange: Insufficient balance airdrop")
    });
    it("airdrop challenge should fails with invalid start at airdrop", async () => {
      await testERC1155
        .connect(account1)
        .setApprovalForAll(exchangeChallenge.address, true);
      await testERC20
        .connect(account1)
        .approve(exchangeChallenge.address, toBN("10"));

      airdropStartAt = (await getCurrentUnixTime()) + TWO_SECOND;
      airdropEndAt = (await getCurrentUnixTime()) + TEN_SECOND;
      const txp = await exchangeChallenge.connect(account1).addChallenge(
        testERC1155.address, //collection
        assetId,
        amount,
        airdropStartAt,
        airdropEndAt,
        eventIdAddChallenge
      );

      let receipt = await txp.wait();
      const event = receipt.events?.filter((x) => {
        return x.event == "AddChallenge";
      });
      const challengeId = event[0].args.challengeId;
      expect(exchangeChallenge
        .connect(account3)
        .airdropChallenge(
          challengeId,
          zeroAddress,
          2,
          eventIdAirDropChallenge
        )).to.be.revertedWith("Challenge Exchange: invalid start at airdrop")
    });
    it("should airdrop challenge nft", async () => {
      await testERC1155
        .connect(account1)
        .setApprovalForAll(exchangeChallenge.address, true);
      await testERC20
        .connect(account1)
        .approve(exchangeChallenge.address, toBN("10"));

      airdropStartAt = (await getCurrentUnixTime()) + TWO_SECOND;
      airdropEndAt = (await getCurrentUnixTime()) + TEN_SECOND;
      const txp = await exchangeChallenge.connect(account1).addChallenge(
        testERC1155.address, //collection
        assetId,
        amount,
        airdropStartAt,
        airdropEndAt,
        eventIdAddChallenge
      );

      let receipt = await txp.wait();
      const event = receipt.events?.filter((x) => {
        return x.event == "AddChallenge";
      });
      const challengeId = event[0].args.challengeId;
      await new Promise((resolve) =>
        setTimeout(resolve, SIX_SECOND_IN_MILLISECONDE)
      );
      await exchangeChallenge
        .connect(account1)
        .airdropChallenge(
          challengeId,
          account3.address,
          1,
          eventIdAirDropChallenge
        );
      const challenge = await exchangeChallenge
        .connect(account1)
        .challenges(challengeId);
      expect(Number(challenge.amount)).to.equal(amount - 1);
      expect(challenge.seller).to.equal(account1.address);
    });
    it("withdraw should fails with caller is not owner", async () => {
      await testERC1155.connect(account1);
      await exchangeChallenge.connect(account1);
      await testERC1155
        .connect(account1)
        .setApprovalForAll(exchangeChallenge.address, true);
      await testERC20
        .connect(account1)
        .approve(exchangeChallenge.address, toBN("10"));

      airdropStartAt = (await getCurrentUnixTime()) + TWO_SECOND;
      airdropEndAt = (await getCurrentUnixTime()) + SIX_SECOND;

      const txp = await exchangeChallenge.connect(account1).addChallenge(
        testERC1155.address, //collection
        assetId,
        amount,
        airdropStartAt,
        airdropEndAt,
        eventIdAddChallenge
      );

      let receipt = await txp.wait();
      const event = receipt.events?.filter((x) => {
        return x.event == "AddChallenge";
      });
      const challengeId = event[0].args.challengeId;
      await new Promise((resolve) =>
        setTimeout(resolve, TEN_SECOND_IN_MELLISECONDE)
      );
       expect(exchangeChallenge
        .connect(account3)
        .withdrawChallenge(challengeId, eventIdWithdrawChallenge)).to.be.revertedWith('Challenge Exchange: caller not an owner')
    });
    it("withdraw should fails airdrop not ended", async () => {
      await testERC1155.connect(account1);
      await exchangeChallenge.connect(account1);
      await testERC1155
        .connect(account1)
        .setApprovalForAll(exchangeChallenge.address, true);
      await testERC20
        .connect(account1)
        .approve(exchangeChallenge.address, toBN("10"));

      airdropStartAt = (await getCurrentUnixTime()) + TWO_SECOND;
      airdropEndAt = (await getCurrentUnixTime()) + SIX_SECOND;

      const txp = await exchangeChallenge.connect(account1).addChallenge(
        testERC1155.address, //collection
        assetId,
        amount,
        airdropStartAt,
        airdropEndAt,
        eventIdAddChallenge
      );

      let receipt = await txp.wait();
      const event = receipt.events?.filter((x) => {
        return x.event == "AddChallenge";
      });
      const challengeId = event[0].args.challengeId;
       expect(exchangeChallenge
        .connect(account1)
        .withdrawChallenge(challengeId, eventIdWithdrawChallenge)).to.be.revertedWith('Challenge exchange airdrop not ended')
    });
    it("should withdraw challenge", async () => {
      await testERC1155.connect(account1);
      await exchangeChallenge.connect(account1);
      await testERC1155
        .connect(account1)
        .setApprovalForAll(exchangeChallenge.address, true);
      await testERC20
        .connect(account1)
        .approve(exchangeChallenge.address, toBN("10"));

      airdropStartAt = (await getCurrentUnixTime()) + TWO_SECOND;
      airdropEndAt = (await getCurrentUnixTime()) + SIX_SECOND;

      const txp = await exchangeChallenge.connect(account1).addChallenge(
        testERC1155.address, //collection
        assetId,
        amount,
        airdropStartAt,
        airdropEndAt,
        eventIdAddChallenge
      );

      let receipt = await txp.wait();
      const event = receipt.events?.filter((x) => {
        return x.event == "AddChallenge";
      });
      const challengeId = event[0].args.challengeId;
      await new Promise((resolve) =>
        setTimeout(resolve, TEN_SECOND_IN_MELLISECONDE)
      );
      expect(
        Number(await testERC1155.balanceOf(account1.address, assetId))
      ).to.be.equals(299); // 1 NFT is deducted from the balance
      await exchangeChallenge
        .connect(account1)
        .withdrawChallenge(challengeId, eventIdWithdrawChallenge);
      expect(
        Number(await testERC1155.balanceOf(account1.address, assetId))
      ).to.be.equals(300); // initial amount
    });

    it("withdraw should fails with challenge not withdrawable", async () => {
      await testERC1155.connect(account1);
      await exchangeChallenge.connect(account1);
      await testERC1155
        .connect(account1)
        .setApprovalForAll(exchangeChallenge.address, true);
      await testERC20
        .connect(account1)
        .approve(exchangeChallenge.address, toBN("10"));

      airdropStartAt = (await getCurrentUnixTime()) + TWO_SECOND;
      airdropEndAt = (await getCurrentUnixTime()) + SIX_SECOND;

      const txp = await exchangeChallenge.connect(account1).addChallenge(
        testERC1155.address, //collection
        assetId,
        amount,
        airdropStartAt,
        airdropEndAt,
        eventIdAddChallenge
      );

      let receipt = await txp.wait();
      const event = receipt.events?.filter((x) => {
        return x.event == "AddChallenge";
      });
      const challengeId = event[0].args.challengeId;
      await new Promise((resolve) =>
        setTimeout(resolve, TEN_SECOND_IN_MELLISECONDE)
      );
      expect(
        Number(await testERC1155.balanceOf(account1.address, assetId))
      ).to.be.equals(299); // 1 NFT is deducted from the balance
      await exchangeChallenge
        .connect(account1)
        .withdrawChallenge(challengeId, eventIdWithdrawChallenge);
      expect(
        Number(await testERC1155.balanceOf(account1.address, assetId))
      ).to.be.equals(300); // initial amount


      expect(
        exchangeChallenge
        .connect(account1)
        .withdrawChallenge(challengeId, eventIdWithdrawChallenge)).to.be.revertedWith("Challenge exchange: challenge not withdrawable");
    });

    it("Unauthorized nft challenge creation", async () => {
      await testERC1155.connect(account1);
      await testERC20.connect(account1);

      await testERC1155.setApprovalForAll(exchangeChallenge.address, true);
      await testERC20.approve(exchangeChallenge.address, toBN("10"));
      airdropStartAt = (await getCurrentUnixTime()) + TWO_SECOND;
      airdropEndAt = (await getCurrentUnixTime()) + TEN_SECOND;
      await expect(
        exchangeChallenge.connect(account3).addChallenge(
          testERC1155.address, //collection
          assetId,
          amount,
          airdropStartAt,
          airdropEndAt,
          eventIdAddChallenge
        )
      ).to.be.revertedWith("Insufficient token balance");
    });

    it("should bulk airdrop challenge nft", async () => {
      await testERC1155
        .connect(account1)
        .setApprovalForAll(exchangeChallenge.address, true);
      amount = 5;
      const fee = await exchangeChallenge.bullzFee();
      await testERC20
        .connect(account1)
        .approve(exchangeChallenge.address, fee.mul(amount));

      airdropStartAt = (await getCurrentUnixTime()) + TWO_SECOND;
      airdropEndAt = (await getCurrentUnixTime()) + TEN_SECOND;
      
      
      const txp = await exchangeChallenge.connect(account1).addChallenge(
        testERC1155.address, //collection
        assetId,
        amount,
        airdropStartAt,
        airdropEndAt,
        eventIdAddChallenge
      );

      let receipt = await txp.wait();
      const event = receipt.events?.filter((x) => {
        return x.event == "AddChallenge";
      });
      const challengeId = event[0].args.challengeId;
      await new Promise((resolve) =>
        setTimeout(resolve, SIX_SECOND_IN_MILLISECONDE)
      );
      const account2NFTBalance1 = await testERC1155.balanceOf(account2.address, assetId);

      await exchangeChallenge
        .connect(account1)
        .bulkAirdropChallenge(
          challengeId,
          [account2.address, account3.address],
          [1, 1],
          eventIdAirDropChallenge
        );

      const account2NFTBalance2 = await testERC1155.balanceOf(account2.address, assetId);
      const challenge = await exchangeChallenge
        .connect(account1)
        .challenges(challengeId);
      expect(Number(challenge.amount)).to.equal(amount - 2);
      expect(challenge.seller).to.equal(account1.address);
      expect(account2NFTBalance2.sub(account2NFTBalance1)).to.be.equals(1);
    });
    it("bulk airdrop should fails with Insufficient NFT balance to airdrop", async () => {
      await testERC1155
        .connect(account1)
        .setApprovalForAll(exchangeChallenge.address, true);
      amount = 2;
      const fee = await exchangeChallenge.bullzFee();
      await testERC20
        .connect(account1)
        .approve(exchangeChallenge.address, fee.mul(amount));

      airdropStartAt = (await getCurrentUnixTime()) + TWO_SECOND;
      airdropEndAt = (await getCurrentUnixTime()) + TEN_SECOND;
      
      const txp = await exchangeChallenge.connect(account1).addChallenge(
        testERC1155.address, //collection
        assetId,
        amount,
        airdropStartAt,
        airdropEndAt,
        eventIdAddChallenge
      );

      let receipt = await txp.wait();
      const event = receipt.events?.filter((x) => {
        return x.event == "AddChallenge";
      });
      const challengeId = event[0].args.challengeId;
      await new Promise((resolve) =>
        setTimeout(resolve, SIX_SECOND_IN_MILLISECONDE)
      );

      expect(exchangeChallenge
      .connect(account1)
      .bulkAirdropChallenge(
        challengeId,
        [account2.address, account3.address, account4.address],
        [1, 1, 1],
        eventIdAirDropChallenge
      )).to.be.revertedWith("Challenge Exchange: Insufficient NFT balance to airdrop");
    });
    it("bulk airdrop should fails when any receiver is 0x address", async () => {
      await testERC1155
        .connect(account1)
        .setApprovalForAll(exchangeChallenge.address, true);
      amount = 2;
      const fee = await exchangeChallenge.bullzFee();
      await testERC20
        .connect(account1)
        .approve(exchangeChallenge.address, fee.mul(amount));

      airdropStartAt = (await getCurrentUnixTime()) + TWO_SECOND;
      airdropEndAt = (await getCurrentUnixTime()) + TEN_SECOND;
      
      const txp = await exchangeChallenge.connect(account1).addChallenge(
        testERC1155.address, //collection
        assetId,
        amount,
        airdropStartAt,
        airdropEndAt,
        eventIdAddChallenge
      );

      let receipt = await txp.wait();
      const event = receipt.events?.filter((x) => {
        return x.event == "AddChallenge";
      });
      const challengeId = event[0].args.challengeId;
      await new Promise((resolve) =>
        setTimeout(resolve, SIX_SECOND_IN_MILLISECONDE)
      );

      expect(exchangeChallenge
      .connect(account1)
      .bulkAirdropChallenge(
        challengeId,
        [zeroAddress, account3.address],
        [1, 1],
        eventIdAirDropChallenge
      )).to.be.revertedWith("Challenge Exchange: Receiver address not valid");
    });
    it("bulk airdrop challenge should fails with caller is not owner", async () => {
      await testERC1155
        .connect(account1)
        .setApprovalForAll(exchangeChallenge.address, true);
      await testERC20
        .connect(account1)
        .approve(exchangeChallenge.address, toBN("10"));

      airdropStartAt = (await getCurrentUnixTime()) + TWO_SECOND;
      airdropEndAt = (await getCurrentUnixTime()) + TEN_SECOND;
      const txp = await exchangeChallenge.connect(account1).addChallenge(
        testERC1155.address, //collection
        assetId,
        amount,
        airdropStartAt,
        airdropEndAt,
        eventIdAddChallenge
      );

      let receipt = await txp.wait();
      const event = receipt.events?.filter((x) => {
        return x.event == "AddChallenge";
      });
      const challengeId = event[0].args.challengeId;
      await new Promise((resolve) =>
        setTimeout(resolve, SIX_SECOND_IN_MILLISECONDE)
      );
      expect(exchangeChallenge
        .connect(account3)
        .bulkAirdropChallenge(
          challengeId,
          [account2.address],
          [1],
          eventIdAirDropChallenge
        )).to.be.revertedWith("Challenge Exchange: caller not an owner");
    });
    it("bulk airdrop challenge should fails with invalid start at airdrop", async () => {
      await testERC1155
        .connect(account1)
        .setApprovalForAll(exchangeChallenge.address, true);
      await testERC20
        .connect(account1)
        .approve(exchangeChallenge.address, toBN("10"));

      airdropStartAt = (await getCurrentUnixTime()) + TWO_SECOND;
      airdropEndAt = (await getCurrentUnixTime()) + TEN_SECOND;
      const txp = await exchangeChallenge.connect(account1).addChallenge(
        testERC1155.address, //collection
        assetId,
        amount,
        airdropStartAt,
        airdropEndAt,
        eventIdAddChallenge
      );

      let receipt = await txp.wait();
      const event = receipt.events?.filter((x) => {
        return x.event == "AddChallenge";
      });
      const challengeId = event[0].args.challengeId;
      expect(exchangeChallenge
          .connect(account1)
          .bulkAirdropChallenge(
            challengeId,
            [account3.address],
            [1],
            eventIdAirDropChallenge
        )).to.be.revertedWith("Challenge Exchange: invalid start at airdrop")
    });
    it("bulk airdrop should fails with recipients and amounts array length mismatches", async () => {
      await testERC1155
        .connect(account1)
        .setApprovalForAll(exchangeChallenge.address, true);
      amount = 2;
      const fee = await exchangeChallenge.bullzFee();
      await testERC20
        .connect(account1)
        .approve(exchangeChallenge.address, fee.mul(amount));

      airdropStartAt = (await getCurrentUnixTime()) + TWO_SECOND;
      airdropEndAt = (await getCurrentUnixTime()) + TEN_SECOND;
      
      const txp = await exchangeChallenge.connect(account1).addChallenge(
        testERC1155.address, //collection
        assetId,
        amount,
        airdropStartAt,
        airdropEndAt,
        eventIdAddChallenge
      );

      let receipt = await txp.wait();
      const event = receipt.events?.filter((x) => {
        return x.event == "AddChallenge";
      });
      const challengeId = event[0].args.challengeId;
      await new Promise((resolve) =>
        setTimeout(resolve, SIX_SECOND_IN_MILLISECONDE)
      );

      expect(exchangeChallenge
      .connect(account1)
      .bulkAirdropChallenge(
        challengeId,
        [account2.address, account3.address],
        [1, 1, 1],
        eventIdAirDropChallenge
      )).to.be.revertedWith("Challenge Exchange: recipients and amounts array length mismatches.");
    });
  });
});