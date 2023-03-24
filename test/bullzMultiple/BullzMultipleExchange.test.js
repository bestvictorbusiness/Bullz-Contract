const ZERO = "0x0000000000000000000000000000000000000000";
var expectThrow = require("./helper.js");
require("@nomiclabs/hardhat-ethers");
const hre = require("hardhat");
const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("BullzExchangeMultiple", (accounts) => {
  let testERC1155;
  let testERC20;
  let bullzMultipleExchange;
  let ownerShare = 1;
  let SIX_DAYS_IN_SECONDS = 518400;
  let expiresAt = Math.round(Date.now() / 1000) + SIX_DAYS_IN_SECONDS;
  let BullzMultipleExchange;
  let TestERC1155;
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

    BullzMultipleExchange = await ethers.getContractFactory(
      "BullzMultipleExchange"
    );

    TestERC1155 = await ethers.getContractFactory("ERC1155Openzeppelin");
    TestERC20 = await ethers.getContractFactory("TestERC20");

    testERC1155 = await TestERC1155.deploy("test", "TST");
    testERC20 = await TestERC20.deploy();
    bullzMultipleExchange = await BullzMultipleExchange.deploy();

    await testERC20.mint(account1.address, 100);
    await testERC20.mint(account2.address, 100);
    await testERC20.mint(account3.address, 300);
    await testERC1155.connect(account1).awardItem(1, 300, "0x", 0, 2);
    await testERC1155.connect(account2).awardItem(2, 300, "0x", 0, 2);

    await testERC20.mint(account5.address, 100);
    await testERC20.mint(account6.address, 100);
    await testERC1155.connect(account7).awardItem(3, 100, "0x", 0, 2);
  });
  describe("Create new Offer/Auction", () => {
    let amount = 20;
    let price = 100;
    let eventIdListed = 100;
    it("Expect throw sender not an owner", async () => {
      try {
        await bullzMultipleExchange.connect(account2).addOffer({
          _collection: testERC1155.address,
          _assetId: 1,
          _token: testERC20.address,
          _price: price,
          _amount: amount,
          _isForSell: false,
          _isForAuction: true,
          _expiresAt: expiresAt,
          _shareIndex: ownerShare,
          eventIdListed: eventIdListed,
        });
      } catch (err) {
        expect(true);
      }
    });

    it("Expect throw contract not approved", async () => {
      expect(
        bullzMultipleExchange.connect(account1).addOffer({
          _collection: testERC1155.address,
          _assetId: 1,
          _token: testERC20.address,
          _price: price,
          _amount: amount,
          _isForSell: false,
          _isForAuction: true,
          _expiresAt: expiresAt,
          _shareIndex: ownerShare,
          eventIdListed: eventIdListed,
        })
      ).to.revertedWith();
    });
    it("Expect offer successfuly created", async () => {
      const assetId = 1;
      const price = 100;
      console.log(account1.address);
      await testERC1155
        .connect(account1)
        .setApprovalForAll(bullzMultipleExchange.address, true);
      const res = await bullzMultipleExchange.connect(account1).addOffer({
        _collection: testERC1155.address,
        _assetId: assetId,
        _token: testERC20.address,
        _price: price,
        _amount: amount,
        _isForSell: false,
        _isForAuction: true,
        _expiresAt: expiresAt,
        _shareIndex: ownerShare,
        eventIdListed: eventIdListed,
      });
      let receipt = await res.wait();
      const event = receipt.events?.filter((x) => {
        return x.event == "Listed";
      });
      const offerId = event[0].args.offerId;
      const offer = await bullzMultipleExchange.offers(offerId);
      expect(offer.seller).to.be.equals(account1.address);
    });
    it("Set Offer price", async () => {
      const assetId = 1;
      await testERC1155
        .connect(account1)
        .setApprovalForAll(bullzMultipleExchange.address, true);
      const res = await bullzMultipleExchange.connect(account1).addOffer({
        _collection: testERC1155.address,
        _assetId: 1,
        _token: testERC20.address,
        _price: price,
        _amount: amount,
        _isForSell: false,
        _isForAuction: true,
        _expiresAt: expiresAt,
        _shareIndex: ownerShare,
        eventIdListed: eventIdListed,
      });
      let receipt = await res.wait();
      const event = receipt.events?.filter((x) => {
        return x.event == "Listed";
      });
      const offerId = event[0].args.offerId;
      const eventIdSetOfferPrice = 201;
      await bullzMultipleExchange
        .connect(account1)
        .setOfferPrice(offerId, 200, eventIdSetOfferPrice);
      const offer = await bullzMultipleExchange.offers(offerId);
      expect(offer.price).to.be.equals(200);
    });
    it("Set ExpiresAt", async () => {
      const assetId = 1;
      await testERC1155
        .connect(account1)
        .setApprovalForAll(bullzMultipleExchange.address, true);
      const res = await bullzMultipleExchange.connect(account1).addOffer({
        _collection: testERC1155.address,
        _assetId: 1,
        _token: testERC20.address,
        _price: price,
        _amount: amount,
        _isForSell: false,
        _isForAuction: true,
        _expiresAt: expiresAt,
        _shareIndex: ownerShare,
        eventIdListed: eventIdListed,
      });
      let receipt = await res.wait();
      const event = receipt.events?.filter((x) => {
        return x.event == "Listed";
      });
      const offerId = event[0].args.offerId;
      const eventIdSetExpireAt = 202;
      await bullzMultipleExchange
        .connect(account1)
        .setExpiresAt(offerId, 1620481368, eventIdSetExpireAt);
      const offer = await bullzMultipleExchange.offers(offerId);
      expect(offer.expiresAt).to.be.equals(1620481368);
    });
  });
  describe("Create/Cancel bid", () => {
    let assetId = 1;
    let price = 100;
    let isForAuction = true;
    let isForSell = false;
    let amount = 20;
    let eventIdListed = 101;
    it("Expect throw erc20 not approved", async () => {
      await testERC1155
        .connect(account1)
        .setApprovalForAll(bullzMultipleExchange.address, true);
      const res = await bullzMultipleExchange.connect(account1).addOffer({
        _collection: testERC1155.address,
        _assetId: assetId,
        _token: testERC20.address,
        _price: price,
        _amount: amount,
        _isForSell: isForSell,
        _isForAuction: isForAuction,
        _expiresAt: expiresAt,
        _shareIndex: ownerShare,
        eventIdListed: eventIdListed,
      });
      let receipt = await res.wait();
      const event = receipt.events?.filter((x) => {
        return x.event == "Listed";
      });
      const offerId = event[0].args.offerId;
      const eventIdBidCreated = 203;
      await bullzMultipleExchange.offers(offerId);
      expect(
        bullzMultipleExchange
          .connect(account2)
          .safePlaceBid(offerId, price, amount, eventIdBidCreated)
      ).to.be.revertedWith();
    });
    it("Expect success bid created", async () => {
      await testERC1155
        .connect(account1)
        .setApprovalForAll(bullzMultipleExchange.address, true);
      let res = await bullzMultipleExchange.connect(account1).addOffer({
        _collection: testERC1155.address,
        _assetId: assetId,
        _token: testERC20.address,
        _price: price,
        _amount: amount,
        _isForSell: isForSell,
        _isForAuction: isForAuction,
        _expiresAt: expiresAt,
        _shareIndex: ownerShare,
        eventIdListed: eventIdListed,
      });
      let receipt = await res.wait();
      const event = receipt.events?.filter((x) => {
        return x.event == "Listed";
      });
      const offerId = event[0].args.offerId;
      const offer = await bullzMultipleExchange.offers(offerId);
      const eventIdBidCreated = 203;
      await testERC20
        .connect(account2)
        .approve(bullzMultipleExchange.address, price);
      res = await bullzMultipleExchange
        .connect(account2)
        .safePlaceBid(offerId, price, amount, eventIdBidCreated);
      const bid = await bullzMultipleExchange.bidforAuctions(
        offerId,
        account2.address
      );
      expect(price).to.be.equals(bid.price);
    });
    it("Cancel bid", async () => {
      await testERC1155
        .connect(account1)
        .setApprovalForAll(bullzMultipleExchange.address, true);
      let res = await bullzMultipleExchange.connect(account1).addOffer({
        _collection: testERC1155.address,
        _assetId: assetId,
        _token: testERC20.address,
        _price: price,
        _amount: amount,
        _isForSell: isForSell,
        _isForAuction: isForAuction,
        _expiresAt: expiresAt,
        _shareIndex: ownerShare,
        eventIdListed: eventIdListed,
      });
      let receipt = await res.wait();
      const event = receipt.events?.filter((x) => {
        return x.event == "Listed";
      });
      const offerId = event[0].args.offerId;
      await bullzMultipleExchange.offers(offerId);
      const eventIdBidCreated = 203;
      await testERC20
        .connect(account2)
        .approve(bullzMultipleExchange.address, price);
      res = await bullzMultipleExchange
        .connect(account2)
        .safePlaceBid(offerId, price, amount, eventIdBidCreated);
      const eventIdBidCancelled = 204;
      const bidC = await bullzMultipleExchange
        .connect(account2)
        .cancelBid(offerId, account2.address, eventIdBidCancelled);
      const bid = await bullzMultipleExchange.bidforAuctions(
        offerId,
        account2.address
      );
      expect(0).to.be.equals(bid.price);
    });
    it("Accept single bid", async () => {
      await testERC1155
        .connect(account1)
        .setApprovalForAll(bullzMultipleExchange.address, true);
      let res = await bullzMultipleExchange.connect(account1).addOffer({
        _collection: testERC1155.address,
        _assetId: assetId,
        _token: testERC20.address,
        _price: price,
        _amount: amount,
        _isForSell: isForSell,
        _isForAuction: isForAuction,
        _expiresAt: expiresAt,
        _shareIndex: ownerShare,
        eventIdListed: eventIdListed,
      });
      let receipt = await res.wait();
      const event = receipt.events?.filter((x) => {
        return x.event == "Listed";
      });
      const offerId = event[0].args.offerId;
      await bullzMultipleExchange.offers(offerId);
      await testERC20
        .connect(account2)
        .approve(bullzMultipleExchange.address, price);
      await testERC20
        .connect(account3)
        .approve(bullzMultipleExchange.address, price);
      let eventIdBidCreated = 203;
      res = await bullzMultipleExchange
        .connect(account2)
        .safePlaceBid(offerId, price, 10, eventIdBidCreated);
      eventIdBidCreated = 206;
      res = await bullzMultipleExchange
        .connect(account3)
        .safePlaceBid(offerId, price, 10, eventIdBidCreated);
      const eventIdBidSuccessful = 207;
      await bullzMultipleExchange
        .connect(account1)
        .acceptBid(offerId, account2.address, eventIdBidSuccessful);
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

    it("Test multiple auction/direct sell", async () => {
      assetId = 3;
      price = 1;
      isForAuction = true;
      isForSell = false;
      amount = 20;
      amountInAuction = 50;
      amountInDirectSell = 30;
      await testERC1155
        .connect(account7)
        .setApprovalForAll(bullzMultipleExchange.address, true);
      let res = await bullzMultipleExchange.connect(account7).addOffer({
        _collection: testERC1155.address,
        _assetId: assetId,
        _token: testERC20.address,
        _price: price,
        _amount: amountInAuction,
        _isForSell: isForSell,
        _isForAuction: isForAuction,
        _expiresAt: expiresAt,
        _shareIndex: ownerShare,
        eventIdListed: eventIdListed,
      });
      let receipt = await res.wait();
      const event = receipt.events?.filter((x) => {
        return x.event == "Listed";
      });
      const offerId = event[0].args.offerId;
      await bullzMultipleExchange.offers(offerId);
      await testERC20
        .connect(account2)
        .approve(bullzMultipleExchange.address, price * amountInAuction);
      const eventIdBidCreated = 207;
      res = await bullzMultipleExchange
        .connect(account2)
        .safePlaceBid(offerId, price, amountInAuction, eventIdBidCreated);
      const eventIdBidSuccessful = 208;
      await bullzMultipleExchange
        .connect(account7)
        .acceptBid(offerId, account2.address, eventIdBidSuccessful);

      isForAuction = false;
      isForSell = true;
      amountInDirectSell = 30;

      price = web3.utils.toWei("0.0001", "ether");
      const res1 = await bullzMultipleExchange.connect(account7).addOffer({
        _collection: testERC1155.address,
        _assetId: assetId,
        _token: testERC20.address,
        _price: price,
        _amount: amountInDirectSell,
        _isForSell: isForSell,
        _isForAuction: isForAuction,
        _expiresAt: expiresAt,
        _shareIndex: ownerShare,
        eventIdListed: eventIdListed,
      });

      let receipt1 = await res1.wait();
      const event1 = receipt1.events?.filter((x) => {
        return x.event == "Listed";
      });
      const offerId1 = event1[0].args.offerId;
      let newPrice = web3.utils.toWei("0.01", "ether");
      const eventIdSwapped = 209;
      await bullzMultipleExchange
        .connect(account8)
        .buyOffer(offerId1, amountInDirectSell, eventIdSwapped, {
          value: newPrice,
        });
      expect(
        await testERC1155.balanceOf(account7.address, assetId)
      ).to.be.equals(20);
    });
    it("Accept multiple bid", async () => {
      await testERC1155
        .connect(account1)
        .setApprovalForAll(bullzMultipleExchange.address, true);
      assetId = 1;
      price = 100;
      isForAuction = true;
      isForSell = false;
      amount = 20;
      let res = await bullzMultipleExchange.connect(account1).addOffer({
        _collection: testERC1155.address,
        _assetId: assetId,
        _token: testERC20.address,
        _price: price,
        _amount: amount,
        _isForSell: isForSell,
        _isForAuction: isForAuction,
        _expiresAt: expiresAt,
        _shareIndex: ownerShare,
        eventIdListed: eventIdListed,
      });
      let receipt = await res.wait();
      const event = receipt.events?.filter((x) => {
        return x.event == "Listed";
      });
      const offerId = event[0].args.offerId;
      await bullzMultipleExchange.offers(offerId);
      await testERC20
        .connect(account2)
        .approve(bullzMultipleExchange.address, price);
      await testERC20
        .connect(account3)
        .approve(bullzMultipleExchange.address, price);
      let eventIdBidCreated = 210;
      res = await bullzMultipleExchange
        .connect(account2)
        .safePlaceBid(offerId, price, 10, eventIdBidCreated);
      let eventIdBidSuccessful = 211;
      await bullzMultipleExchange
        .connect(account1)
        .acceptBid(offerId, account2.address, eventIdBidSuccessful);
      eventIdBidCreated = 212;
      res = await bullzMultipleExchange
        .connect(account3)
        .safePlaceBid(offerId, price, 10, eventIdBidCreated);
      eventIdBidSuccessful = 213;
      await bullzMultipleExchange
        .connect(account1)
        .acceptBid(offerId, account3.address, eventIdBidSuccessful);
      expect(
        (await testERC20.balanceOf(account1.address)).toString()
      ).to.be.equals((price * 3 - (price * 2) / 100).toString());
      expect(
        (await testERC20.balanceOf(account2.address)).toString()
      ).to.be.equals("0");
      expect(
        (await testERC20.balanceOf(account3.address)).toString()
      ).to.be.equals((price * 2).toString());
    });
  });
  describe("Direct Buy/Sell", () => {
    let amount = 20;
    let assetId = 2;
    let price = web3.utils.toWei("10", "ether");

    let isForAuction = false;
    let isForSell = true;
    let eventIdListed = 102;
    it("Create offer successfuly", async () => {
      await testERC1155
        .connect(account2)
        .setApprovalForAll(bullzMultipleExchange.address, true);
      const res = await bullzMultipleExchange.connect(account2).addOffer({
        _collection: testERC1155.address,
        _assetId: assetId,
        _token: testERC20.address,
        _price: price,
        _amount: amount,
        _isForSell: isForSell,
        _isForAuction: isForAuction,
        _expiresAt: expiresAt,
        _shareIndex: ownerShare,
        eventIdListed: eventIdListed,
      });
      expect(true);
    });
    it("Buy offer", async () => {
      await testERC1155
        .connect(account2)
        .setApprovalForAll(bullzMultipleExchange.address, true);
      amount = 2;
      price = web3.utils.toWei("0.02", "ether");
      const res = await bullzMultipleExchange.connect(account2).addOffer({
        _collection: testERC1155.address,
        _assetId: assetId,
        _token: testERC20.address,
        _price: price,
        _amount: amount,
        _isForSell: isForSell,
        _isForAuction: isForAuction,
        _expiresAt: expiresAt,
        _shareIndex: ownerShare,
        eventIdListed: eventIdListed,
      });
      let receipt = await res.wait();
      const event = receipt.events?.filter((x) => {
        return x.event == "Listed";
      });
      const offerId = event[0].args.offerId;
      let newPrice = web3.utils.toWei("0.0202", "ether");
      const eventIdSwapped = 214;
      await bullzMultipleExchange
        .connect(account3)
        .buyOffer(offerId, 1, eventIdSwapped, { value: newPrice });
      expect(
        await testERC1155.balanceOf(account3.address, assetId)
      ).to.be.equals(1);
    });
    it("Delegate Buy offer", async () => {
      await testERC1155
        .connect(account2)
        .setApprovalForAll(bullzMultipleExchange.address, true);
      amount = 2;
      const eventIdSwapped = 215;
      price = web3.utils.toWei("0.02", "ether");
      const res = await bullzMultipleExchange.connect(account2).addOffer({
        _collection: testERC1155.address,
        _assetId: assetId,
        _token: testERC20.address,
        _price: price,
        _amount: amount,
        _isForSell: isForSell,
        _isForAuction: isForAuction,
        _expiresAt: expiresAt,
        _shareIndex: ownerShare,
        eventIdListed: eventIdListed,
      });
      let receipt = await res.wait();
      const event = receipt.events?.filter((x) => {
        return x.event == "Listed";
      });
      const offerId = event[0].args.offerId;
      let newPrice = web3.utils.toWei("0.0202", "ether");

      await bullzMultipleExchange
        .connect(account3)
        .delegateBuy(offerId, 1, account4.address, eventIdSwapped, {
          value: newPrice,
        });
      count1ldBalance = await web3.eth.getBalance(account2.address);
      count2ldBalance = await web3.eth.getBalance(account3.address);
      expect(
        await testERC1155.balanceOf(account4.address, assetId)
      ).to.be.equals(1);
    });
    it("test loyalty Offer", async () => {});
    it("set owner share", async () => {
      const res = await bullzMultipleExchange.connect(owner).setFeeTo(1, 1);
      expect(await bullzMultipleExchange.shares(1)).to.be.equals(1);
    });
  });
});
