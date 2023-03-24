// at the top of the file

const ZERO = "0x0000000000000000000000000000000000000000";
var expectThrow = require("./helper.js");
require("@nomiclabs/hardhat-ethers");
const hre = require("hardhat");
const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("BullzSingleExchange", (accounts) => {
  let testERC721;
  let testERC20;
  let bullzSingleExchange;
  let ownerShare = 1;
  let SIX_DAYS_IN_SECONDS = 518400;
  let expiresAt = Math.round(Date.now() / 1000) + SIX_DAYS_IN_SECONDS;
  let price = 100;
  let BullzSingleExchange;
  let TestERC721;
  let TestERC20;
  let account1,
    account2,
    account3,
    account4,
    account5,
    account6,
    account7,
    account8,
    owner;

  beforeEach(async () => {
    [
      owner,
      account1,
      account2,
      account3,
      account4,
      account5,
      account6,
      account7,
      account8,
    ] = await ethers.getSigners();
    BullzSingleExchange = await ethers.getContractFactory(
      "BullzSingleExchange"
    );
    TestERC721 = await ethers.getContractFactory("TestERC721");
    TestERC20 = await ethers.getContractFactory("TestERC20");

    testERC721 = await TestERC721.deploy();
    testERC20 = await TestERC20.deploy();
    bullzSingleExchange = await BullzSingleExchange.deploy();

    await testERC20.mint(account1.address, 100);
    await testERC20.mint(account2.address, 100);
    await testERC20.mint(account3.address, 300);
    await testERC721.connect(account1).awardItem(1);
    await testERC721.connect(account2).awardItem(2);
  });
  describe("Create new Offer/Auction", () => {
    it("Expect throw sender not an owner", async () => {
      let tx = bullzSingleExchange
        .connect(account2)
        .addOffer(
          account2.address,
          testERC721.address,
          1,
          testERC20.address,
          price,
          false,
          true,
          expiresAt,
          ownerShare
        );
      expect(tx).to.be.revertedWith();
    });

    it("Expect throw contract not approved", async () => {
      let tx = bullzSingleExchange
        .connect(account1)
        .addOffer(
          account1.address,
          testERC721.address,
          1,
          testERC20.address,
          false,
          price,
          false,
          true,
          expiresAt,
          ownerShare
        );
      expect(tx).to.be.revertedWith();
    });
    it("Expect offer successfuly created", async () => {
      let assetId = 1;
      let price = web3.utils.toWei("10", "ether");
      let isForAuction = false;
      let isForSell = true;
      await testERC721
        .connect(account1)
        .setApprovalForAll(bullzSingleExchange.address, true, {
          from: account1.address,
        });
      const res = await bullzSingleExchange
        .connect(account1)
        .addOffer(
          account1.address,
          testERC721.address,
          assetId,
          testERC20.address,
          price,
          isForSell,
          isForAuction,
          expiresAt,
          ownerShare
        );
      const offer = await bullzSingleExchange.offers(
        testERC721.address,
        assetId
      );
      expect(offer.seller).to.be.equals(account1.address);
    });
    it("Set Offer price", async () => {
      const assetId = 1;
      const price = 100;
      await testERC721
        .connect(account1)
        .setApprovalForAll(bullzSingleExchange.address, true);
      const res = await bullzSingleExchange
        .connect(account1)
        .addOffer(
          account1.address,
          testERC721.address,
          assetId,
          testERC20.address,
          price,
          false,
          true,
          expiresAt,
          ownerShare
        );
      await bullzSingleExchange
        .connect(account1)
        .setOfferPrice(testERC721.address, assetId, 200);
      const offer = await bullzSingleExchange.offers(
        testERC721.address,
        assetId
      );
      expect(offer.price).to.be.equals(200);
    });
    it("Set ExpiresAt", async () => {
      const assetId = 1;
      const price = 100;
      await testERC721
        .connect(account1)
        .setApprovalForAll(bullzSingleExchange.address, true);
      const res = await bullzSingleExchange
        .connect(account1)
        .addOffer(
          account1.address,
          testERC721.address,
          assetId,
          testERC20.address,
          price,
          false,
          true,
          expiresAt,
          ownerShare
        );
      await bullzSingleExchange
        .connect(account1)
        .setExpiresAt(testERC721.address, assetId, 1620481368);
      const offer = await bullzSingleExchange.offers(
        testERC721.address,
        assetId
      );
      expect(offer.expiresAt).to.be.equals(1620481368);
    });
  });
  describe("Create/Cancel bid", () => {
    let assetId = 1;
    let price = 100;
    let isForAuction = true;
    let isForSell = false;
    it("Expect throw erc20 not approved", async () => {
      await testERC721
        .connect(account1)
        .setApprovalForAll(bullzSingleExchange.address, true);
      const res = await bullzSingleExchange
        .connect(account1)
        .addOffer(
          account1.address,
          testERC721.address,
          assetId,
          testERC20.address,
          price,
          isForSell,
          isForAuction,
          expiresAt,
          ownerShare
        );
      await bullzSingleExchange.offers(testERC721.address, assetId);
      let tx = bullzSingleExchange
        .connect(account2)
        .safePlaceBid(testERC721.address, assetId, testERC20.address, 100);
      await expect(tx).to.be.revertedWith("NFT Marketplace: Allowance error");
    });
    it("Expect success bid created", async () => {
      await testERC721
        .connect(account1)
        .setApprovalForAll(bullzSingleExchange.address, true);
      let res = await bullzSingleExchange.connect(account1).addOffer(
        account1.address,
        testERC721.address,
        assetId,
        testERC20.address,
        price,
        isForSell, // isForSell
        isForAuction, // isForAuction
        expiresAt,
        ownerShare
      );
      const offer = await bullzSingleExchange.offers(
        testERC721.address,
        assetId
      );
      await testERC20
        .connect(account2)
        .approve(bullzSingleExchange.address, price);
      res = await bullzSingleExchange
        .connect(account2)
        .safePlaceBid(testERC721.address, assetId, testERC20.address, price);
      const bid = await bullzSingleExchange.bidforAuctions(
        testERC721.address,
        assetId,
        account2.address
      );
      expect(price).to.be.equals(bid.price);
    });
    it("Cancel bid", async () => {
      await testERC721
        .connect(account1)
        .setApprovalForAll(bullzSingleExchange.address, true);
      let res = await bullzSingleExchange.connect(account1).addOffer(
        account1.address,
        testERC721.address,
        assetId,
        testERC20.address,
        price,
        isForSell, // isForSell
        isForAuction, // isForAuction
        expiresAt,
        ownerShare
      );
      await bullzSingleExchange.offers(testERC721.address, assetId);
      await testERC20
        .connect(account2)
        .approve(bullzSingleExchange.address, price);
      res = await bullzSingleExchange
        .connect(account2)
        .safePlaceBid(testERC721.address, assetId, testERC20.address, price);
      const bidC = await bullzSingleExchange
        .connect(account2)
        .cancelBid(testERC721.address, assetId, account2.address);
      const bid = await bullzSingleExchange.bidforAuctions(
        testERC721.address,
        assetId,
        account2.address
      );
      expect(0).to.be.equals(bid.price);
    });
    it("Accept bid", async () => {
      let assetId = 1;
      let price = 100;
      let isForAuction = true;
      let isForSell = false;
      await testERC721
        .connect(account1)
        .setApprovalForAll(bullzSingleExchange.address, true);
      let res = await bullzSingleExchange
        .connect(account1)
        .addOffer(
          account1.address,
          testERC721.address,
          assetId,
          testERC20.address,
          price,
          isForSell,
          isForAuction,
          expiresAt,
          ownerShare
        );
      await bullzSingleExchange.offers(testERC721.address, assetId);
      await testERC20
        .connect(account2)
        .approve(bullzSingleExchange.address, price);
      await testERC20
        .connect(account3)
        .approve(bullzSingleExchange.address, price);
      res = await bullzSingleExchange
        .connect(account2)
        .safePlaceBid(testERC721.address, assetId, testERC20.address, price);
      res = await bullzSingleExchange
        .connect(account3)
        .safePlaceBid(testERC721.address, assetId, testERC20.address, price);
      await bullzSingleExchange
        .connect(account1)
        .acceptBid(testERC721.address, assetId, account2.address);
      expect(
        (await testERC20.balanceOf(account1.address)).toString()
      ).to.be.equals((price * 2 - (price * 1) / 100).toString());
      expect(
        (await testERC20.balanceOf(account2.address)).toString()
      ).to.be.equals("0");
      expect(
        (await testERC20.balanceOf(account3.address)).toString()
      ).to.be.equals((price * 3).toString());
    });
  });
  describe("Direct Buy/Sell", () => {
    let assetId = 2;
    let price = web3.utils.toWei("10", "ether");
    let isForAuction = false;
    let isForSell = true;
    it("Create offer successfuly", async () => {
      await testERC721
        .connect(account2)
        .setApprovalForAll(bullzSingleExchange.address, true);
      const res = await bullzSingleExchange
        .connect(account2)
        .addOffer(
          account2.address,
          testERC721.address,
          assetId,
          testERC20.address,
          price,
          isForSell,
          isForAuction,
          expiresAt,
          ownerShare
        );
      expect(1, 1);
    });
    it("Buy offer", async () => {
      let count2ldBalance = await web3.eth.getBalance(account2.address);
      let count3ldBalance = await web3.eth.getBalance(account3.address);
      await testERC721
        .connect(account2)
        .setApprovalForAll(bullzSingleExchange.address, true);
      const res = await bullzSingleExchange
        .connect(account2)
        .addOffer(
          account2.address,
          testERC721.address,
          assetId,
          testERC20.address,
          price,
          isForSell,
          isForAuction,
          expiresAt,
          ownerShare
        );
      let newPrice = web3.utils.toWei("11", "ether");
      await bullzSingleExchange
        .connect(account3)
        .buyOffer(testERC721.address, assetId, { value: newPrice });
      count1ldBalance = await web3.eth.getBalance(account2.address);
      count2ldBalance = await web3.eth.getBalance(account3.address);
      expect(await testERC721.ownerOf(assetId), account3.address);
    });
    it("Delegate Buy offer", async () => {
      let count2ldBalance = await web3.eth.getBalance(account2.address);
      await testERC721
        .connect(account2)
        .setApprovalForAll(bullzSingleExchange.address, true);
      const res = await bullzSingleExchange
        .connect(account2)
        .addOffer(
          account2.address,
          testERC721.address,
          assetId,
          testERC20.address,
          price,
          isForSell,
          isForAuction,
          expiresAt,
          ownerShare
        );
      let newPrice = web3.utils.toWei("10.1", "ether");
      await bullzSingleExchange
        .connect(account3)
        .delegateBuy(testERC721.address, assetId, account4.address, {
          value: newPrice,
        });
      count1ldBalance = await web3.eth.getBalance(account2.address);
      count2ldBalance = await web3.eth.getBalance(account3.address);
      expect(await testERC721.ownerOf(assetId)).to.be.equals(account4.address);
    });
    it("Buy Loyalty offer", async () => {});
    it("set owner share", async () => {
      const res = await bullzSingleExchange.connect(owner).setFeeTo(1, 1);
      expect(await bullzSingleExchange.shares(1)).to.be.equals(1);
    });
  });
});
