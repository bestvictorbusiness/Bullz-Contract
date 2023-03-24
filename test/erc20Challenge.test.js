require("@nomiclabs/hardhat-ethers");
const hre = require("hardhat");
const { ethers } = require("hardhat");
const { expect } = require("chai");

async function getCurrentUnixTime() {
  return (await ethers.provider.getBlock("latest")).timestamp;
}
describe("ERC20 Challenge", async function () {
  let ExchangeChallenge;
  let TestERC1155;
  let TestERC20;

  let testERC1155;
  let testERC20;
  const SIX_SECOND_IN_MILLISECONDE = 6000;
  const TEN_SECOND_IN_MELLISECONDE = 10000;
  const TEN_SECOND = 10;
  const SIX_SECOND = 6;
  const zeroAddress = "0x0000000000000000000000000000000000000000";
  let exchangeChallenge;
  let account1, account2, account3, owner;
  const toBN = (value) => {
    return ethers.utils.parseUnits(value, 18);
  };

  const eventIdAddTokenChallenge = 4;
  const eventIdAirDropTokenChallenge = 5;
  const eventIdWithdrawTokenChallenge = 6;
  // const challengeId = 1;
  beforeEach(async () => {
    [owner, account1, account2, account3] = await ethers.getSigners();

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
  let airdropStartAt;
  let airdropEndAt;
  describe("ERC20 challenge", async () => {
    it("should create a token challenge successfully", async () => {
      airdropStartAt = (await getCurrentUnixTime()) + SIX_SECOND;
      airdropEndAt = (await getCurrentUnixTime()) + TEN_SECOND;
      const winnerCount = 1;
      const tokenAmount = 2;
      const feePercent = await exchangeChallenge.getAirdropFeePercent(
        testERC20.address
      );
      const airdropFee = winnerCount * tokenAmount * (feePercent / 10000);
      const totalPayable = winnerCount * tokenAmount + airdropFee;

      await testERC20
        .connect(account1)
        .approve(exchangeChallenge.address, toBN(totalPayable.toString()));

      const txp = await exchangeChallenge
        .connect(account1)
        .addTokenChallenge(
          testERC20.address,
          winnerCount,
          toBN(tokenAmount.toString()),
          airdropStartAt,
          airdropEndAt,
          eventIdAddTokenChallenge
        );
      let receipt = await txp.wait();
      const event = receipt.events?.filter((x) => {
        return x.event == "AddTokenChallenge";
      });
      const challengeId = event[0].args.challengeId;
      const challenge = await exchangeChallenge.tokenChallenges(challengeId);
      expect(challenge.seller).to.equal(account1.address);
    });

    it("should transfer airdrop fee to owner during challenge creation", async () => {
      airdropStartAt = (await getCurrentUnixTime()) + SIX_SECOND;
      airdropEndAt = (await getCurrentUnixTime()) + TEN_SECOND;
      const winnerCount = 1;
      const tokenAmount = 2;
      const feePercent = await exchangeChallenge.getAirdropFeePercent(
        testERC20.address
      );
      const ownerBalance1 = await testERC20.balanceOf(owner.address);
      const airdropFee = winnerCount * tokenAmount * (feePercent / 10000);
      const totalPayable = winnerCount * tokenAmount + airdropFee;

      await testERC20
        .connect(account1)
        .approve(exchangeChallenge.address, toBN(totalPayable.toString()));

      const txp = await exchangeChallenge
        .connect(account1)
        .addTokenChallenge(
          testERC20.address,
          winnerCount,
          toBN(tokenAmount.toString()),
          airdropStartAt,
          airdropEndAt,
          eventIdAddTokenChallenge
        );
      await txp.wait();
      const ownerBalance2 = await testERC20.balanceOf(owner.address);
      expect(Number(ownerBalance2.sub(ownerBalance1))).to.be.equals(Number(toBN(airdropFee.toString()))
      );
    });
    it("should escrow the airdrop token to contract during challenge creation", async () => {
      airdropStartAt = (await getCurrentUnixTime()) + SIX_SECOND;
      airdropEndAt = (await getCurrentUnixTime()) + TEN_SECOND;
      const winnerCount = 1;
      const tokenAmount = 2;
      const feePercent = await exchangeChallenge.getAirdropFeePercent(
        testERC20.address
      );
      const contractBalance1 = await testERC20.balanceOf(exchangeChallenge.address);
      const airdropFee = winnerCount * tokenAmount * (feePercent / 10000);
      const totalPayable = winnerCount * tokenAmount + airdropFee;

      await testERC20
        .connect(account1)
        .approve(exchangeChallenge.address, toBN(totalPayable.toString()));

      const txp = await exchangeChallenge
        .connect(account1)
        .addTokenChallenge(
          testERC20.address,
          winnerCount,
          toBN(tokenAmount.toString()),
          airdropStartAt,
          airdropEndAt,
          eventIdAddTokenChallenge
        );
      await txp.wait();
      const contractBalance2 = await testERC20.balanceOf(exchangeChallenge.address);
      expect(Number(contractBalance2.sub(contractBalance1))).to.be.equals(Number(toBN((winnerCount * tokenAmount).toString()))
      );
    });
    it("challenge creation should fails with winner must be upper to 0", async () => {
      airdropStartAt = (await getCurrentUnixTime()) + SIX_SECOND;
      airdropEndAt = (await getCurrentUnixTime()) + TEN_SECOND;
      const winnerCount = 1;
      const tokenAmount = 2;
      const feePercent = await exchangeChallenge.getAirdropFeePercent(
        testERC20.address
      );
      const airdropFee = winnerCount * tokenAmount * (feePercent / 10000);
      const totalPayable = winnerCount * tokenAmount + airdropFee;

      await testERC20
        .connect(account1)
        .approve(exchangeChallenge.address, toBN(totalPayable.toString()));

      expect(
        exchangeChallenge.connect(account1).addTokenChallenge(
          testERC20.address,
          0, //winnerCount
          toBN(tokenAmount.toString()),
          airdropStartAt,
          airdropEndAt,
          eventIdAddTokenChallenge
        )
      ).to.be.revertedWith("Winner count must be upper to 0");
    });
    it("challenge creation should fails with insufficient balance", async () => {
      airdropStartAt = (await getCurrentUnixTime()) + SIX_SECOND;
      airdropEndAt = (await getCurrentUnixTime()) + TEN_SECOND;
      const winnerCount = 1;
      const tokenAmount = 200;
      const feePercent = await exchangeChallenge.getAirdropFeePercent(
        testERC20.address
      );
      const airdropFee = winnerCount * tokenAmount * (feePercent / 10000);
      const totalPayable = winnerCount * tokenAmount + airdropFee;

      await testERC20
        .connect(account1)
        .approve(exchangeChallenge.address, toBN(totalPayable.toString()));

      expect(
        exchangeChallenge.connect(account1).addTokenChallenge(
          testERC20.address,
          0, //winnerCount
          toBN(tokenAmount.toString()),
          airdropStartAt,
          airdropEndAt,
          eventIdAddTokenChallenge
        )
      ).to.be.revertedWith("Challenge Exchange: Insufficient balance");
    });
    it("challenge creation should fails when start airdrop date outdated", async () => {
      airdropStartAt = (await getCurrentUnixTime()) - 10;
      airdropEndAt = (await getCurrentUnixTime()) + TEN_SECOND;
      const winnerCount = 1;
      const tokenAmount = 2;
      const feePercent = await exchangeChallenge.getAirdropFeePercent(
        testERC20.address
      );
      const airdropFee = winnerCount * tokenAmount * (feePercent / 10000);
      const totalPayable = winnerCount * tokenAmount + airdropFee;

      await testERC20
        .connect(account1)
        .approve(exchangeChallenge.address, toBN(totalPayable.toString()));

      expect(
        exchangeChallenge.connect(account1).addTokenChallenge(
          testERC20.address,
          0, //winnerCount
          toBN(tokenAmount.toString()),
          airdropStartAt,
          airdropEndAt,
          eventIdAddTokenChallenge
        )
      ).to.be.revertedWith("Challenge Exchange: invalid start at airdrop");
    });
    it("challenge creation should fails when airdropEndAt <= airdropStartAT", async () => {
      airdropStartAt = (await getCurrentUnixTime()) + SIX_SECOND;
      airdropEndAt = (await getCurrentUnixTime()) + SIX_SECOND;
      const winnerCount = 1;
      const tokenAmount = 2;
      const feePercent = await exchangeChallenge.getAirdropFeePercent(
        testERC20.address
      );
      const airdropFee = winnerCount * tokenAmount * (feePercent / 10000);
      const totalPayable = winnerCount * tokenAmount + airdropFee;

      await testERC20
        .connect(account1)
        .approve(exchangeChallenge.address, toBN(totalPayable.toString()));

      expect(
        exchangeChallenge.connect(account1).addTokenChallenge(
          testERC20.address,
          0, //winnerCount
          toBN(tokenAmount.toString()),
          airdropStartAt,
          airdropEndAt,
          eventIdAddTokenChallenge
        )
      ).to.be.revertedWith("Challenge Exchange: invalid end at airdrop");
    });
    it("challenge creation should fails token should not be zero address", async () => {
      airdropStartAt = (await getCurrentUnixTime()) + SIX_SECOND;
      airdropEndAt = (await getCurrentUnixTime()) + TEN_SECOND;
      const winnerCount = 1;
      const tokenAmount = 2;
      const feePercent = await exchangeChallenge.getAirdropFeePercent(
        testERC20.address
      );
      const airdropFee = winnerCount * tokenAmount * (feePercent / 10000);
      const totalPayable = winnerCount * tokenAmount + airdropFee;

      await testERC20
        .connect(account1)
        .approve(exchangeChallenge.address, toBN(totalPayable.toString()));

      expect(
        exchangeChallenge.connect(account1).addTokenChallenge(
          zeroAddress,
          0, //winnerCount
          toBN(tokenAmount.toString()),
          airdropStartAt,
          airdropEndAt,
          eventIdAddTokenChallenge
        )
      ).to.be.revertedWith("Challenge Exchange: Token address not valid");
    });
    it("airdrop should fails when receiver is 0x address", async () => {
      airdropStartAt = (await getCurrentUnixTime()) + SIX_SECOND;
      airdropEndAt = (await getCurrentUnixTime()) + TEN_SECOND;
      const winnerCount = 2;
      const tokenAmount = 2;
      const feePercent = await exchangeChallenge.getAirdropFeePercent(
        testERC20.address
      );
      const airdropFee = (tokenAmount * feePercent) / 10000;
      const totalPayable = winnerCount * (tokenAmount + airdropFee);

      await testERC20
        .connect(account1)
        .approve(exchangeChallenge.address, toBN(totalPayable.toString()));

      const txp = await exchangeChallenge
        .connect(account1)
        .addTokenChallenge(
          testERC20.address,
          winnerCount,
          toBN(tokenAmount.toString()),
          airdropStartAt,
          airdropEndAt,
          eventIdAddTokenChallenge
        );
      let receipt = await txp.wait();
      const event = receipt.events?.filter((x) => {
        return x.event == "AddTokenChallenge";
      });
      const challengeId = event[0].args.challengeId;
      await new Promise((resolve) =>
        setTimeout(resolve, SIX_SECOND_IN_MILLISECONDE)
      );

      expect(
        exchangeChallenge
          .connect(account1)
          .airdropTokenChallenge(
            challengeId,
            zeroAddress,
            eventIdAirDropTokenChallenge
          )
      ).to.be.revertedWith("Challenge Exchange: Receiver address not valid");
    });

    it("airdrop challenge token", async () => {
      airdropStartAt = (await getCurrentUnixTime()) + SIX_SECOND;
      airdropEndAt = (await getCurrentUnixTime()) + TEN_SECOND;
      const winnerCount = 2;
      const tokenAmount = 2;
      const feePercent = await exchangeChallenge.getAirdropFeePercent(
        testERC20.address
      );
      const airdropFee = (tokenAmount * feePercent) / 10000;
      const totalPayable = winnerCount * (tokenAmount + airdropFee);

      await testERC20
        .connect(account1)
        .approve(exchangeChallenge.address, toBN(totalPayable.toString()));

      const txp = await exchangeChallenge
        .connect(account1)
        .addTokenChallenge(
          testERC20.address,
          winnerCount,
          toBN(tokenAmount.toString()),
          airdropStartAt,
          airdropEndAt,
          eventIdAddTokenChallenge
        );
      let receipt = await txp.wait();
      const event = receipt.events?.filter((x) => {
        return x.event == "AddTokenChallenge";
      });
      const challengeId = event[0].args.challengeId;
      await new Promise((resolve) =>
        setTimeout(resolve, SIX_SECOND_IN_MILLISECONDE)
      );

      await exchangeChallenge
        .connect(account1)
        .airdropTokenChallenge(
          challengeId,
          account3.address,
          eventIdAirDropTokenChallenge
        );
      const challenge = await exchangeChallenge
        .connect(account1)
        .tokenChallenges(challengeId);
      expect(Number(challenge.winnerCount)).to.equal(winnerCount - 1);
      expect(challenge.seller).to.equal(account1.address);
    });

    it("airdrop challenge should fails caller is not owner", async () => {
      airdropStartAt = (await getCurrentUnixTime()) + SIX_SECOND;
      airdropEndAt = (await getCurrentUnixTime()) + TEN_SECOND;
      const winnerCount = 2;
      const tokenAmount = 2;
      const feePercent = await exchangeChallenge.getAirdropFeePercent(
        testERC20.address
      );
      const airdropFee = (tokenAmount * feePercent) / 10000;
      const totalPayable = winnerCount * (tokenAmount + airdropFee);

      await testERC20
        .connect(account1)
        .approve(exchangeChallenge.address, toBN(totalPayable.toString()));

      const txp = await exchangeChallenge
        .connect(account1)
        .addTokenChallenge(
          testERC20.address,
          winnerCount,
          toBN(tokenAmount.toString()),
          airdropStartAt,
          airdropEndAt,
          eventIdAddTokenChallenge
        );
      let receipt = await txp.wait();
      const event = receipt.events?.filter((x) => {
        return x.event == "AddTokenChallenge";
      });
      const challengeId = event[0].args.challengeId;
      await new Promise((resolve) =>
        setTimeout(resolve, SIX_SECOND_IN_MILLISECONDE)
      );

      await expect(
        exchangeChallenge
          .connect(account2)
          .airdropTokenChallenge(
            challengeId,
            account3.address,
            eventIdAirDropTokenChallenge
          )
      ).to.be.revertedWith("Challenge Exchange: caller not an owner");
    });
    it("airdrop challenge should fails with invalid start at airdrop", async () => {
      airdropStartAt = (await getCurrentUnixTime()) + SIX_SECOND;
      airdropEndAt = (await getCurrentUnixTime()) + TEN_SECOND;
      const winnerCount = 2;
      const tokenAmount = 2;
      const feePercent = await exchangeChallenge.getAirdropFeePercent(
        testERC20.address
      );
      const airdropFee = (tokenAmount * feePercent) / 10000;
      const totalPayable = winnerCount * (tokenAmount + airdropFee);

      await testERC20
        .connect(account1)
        .approve(exchangeChallenge.address, toBN(totalPayable.toString()));

      const txp = await exchangeChallenge
        .connect(account1)
        .addTokenChallenge(
          testERC20.address,
          winnerCount,
          toBN(tokenAmount.toString()),
          airdropStartAt,
          airdropEndAt,
          eventIdAddTokenChallenge
        );
      let receipt = await txp.wait();
      const event = receipt.events?.filter((x) => {
        return x.event == "AddTokenChallenge";
      });
      const challengeId = event[0].args.challengeId;

      await expect(
        exchangeChallenge
          .connect(account1)
          .airdropTokenChallenge(
            challengeId,
            account3.address,
            eventIdAirDropTokenChallenge
          )
      ).to.be.revertedWith("Challenge Exchange: invalid start at airdrop");
    });

    it("airdrop challenge should fails with Airdrop done", async () => {
      airdropStartAt = (await getCurrentUnixTime()) + SIX_SECOND;
      airdropEndAt = (await getCurrentUnixTime()) + TEN_SECOND;
      const winnerCount = 1;
      const tokenAmount = 2;
      const feePercent = await exchangeChallenge.getAirdropFeePercent(
        testERC20.address
      );
      const airdropFee = (tokenAmount * feePercent) / 10000;
      const totalPayable = winnerCount * (tokenAmount + airdropFee);

      await testERC20
        .connect(account1)
        .approve(exchangeChallenge.address, toBN(totalPayable.toString()));

      const txp = await exchangeChallenge
        .connect(account1)
        .addTokenChallenge(
          testERC20.address,
          winnerCount,
          toBN(tokenAmount.toString()),
          airdropStartAt,
          airdropEndAt,
          eventIdAddTokenChallenge
        );
      let receipt = await txp.wait();
      const event = receipt.events?.filter((x) => {
        return x.event == "AddTokenChallenge";
      });
      const challengeId = event[0].args.challengeId;
      await new Promise((resolve) =>
        setTimeout(resolve, SIX_SECOND_IN_MILLISECONDE)
      );
      await exchangeChallenge
        .connect(account1)
        .airdropTokenChallenge(
          challengeId,
          account3.address,
          eventIdAirDropTokenChallenge
        );
      await expect(
        exchangeChallenge
          .connect(account1)
          .airdropTokenChallenge(
            challengeId,
            account3.address,
            eventIdAirDropTokenChallenge
          )
      ).to.be.revertedWith("Challenge Exchange: Airdrop done");
    });

    it("withdraw token should fails with caller is not owner", async () => {
      airdropStartAt = (await getCurrentUnixTime()) + SIX_SECOND;
      airdropEndAt = (await getCurrentUnixTime()) + TEN_SECOND;
      const initialBalance = Number(
        await testERC20.balanceOf(account1.address)
      );
      const winnerCount = 2;
      const tokenAmount = 2;
      let feePercent = await exchangeChallenge.getAirdropFeePercent(
        testERC20.address
      );
      const airdropFee = (tokenAmount * feePercent) / 10000;
      const totalPayable = winnerCount * (tokenAmount + airdropFee);
      await testERC20
        .connect(account1)
        .approve(exchangeChallenge.address, toBN(totalPayable.toString()));

      const txp = await exchangeChallenge
        .connect(account1)
        .addTokenChallenge(
          testERC20.address,
          winnerCount,
          toBN(tokenAmount.toString()),
          airdropStartAt,
          airdropEndAt,
          eventIdAddTokenChallenge
        );

      let receipt = await txp.wait();
      const event = receipt.events?.filter((x) => {
        return x.event == "AddTokenChallenge";
      });
      const challengeId = event[0].args.challengeId;

      await new Promise((resolve) =>
        setTimeout(resolve, TEN_SECOND_IN_MELLISECONDE)
      );
      const sBalance = await testERC20.balanceOf(account1.address);

      expect(Number(sBalance)).to.be.equals(
        initialBalance - toBN(totalPayable.toString())
      );

      expect(
        exchangeChallenge
          .connect(account3)
          .withdrawTokenChallenge(challengeId, eventIdWithdrawTokenChallenge)
      ).to.be.revertedWith("Challenge Exchange: caller not an owner");
    });

    it("withdraw token should fails airdrop not ended", async () => {
      airdropStartAt = (await getCurrentUnixTime()) + SIX_SECOND;
      airdropEndAt = (await getCurrentUnixTime()) + TEN_SECOND;
      const initialBalance = Number(
        await testERC20.balanceOf(account1.address)
      );
      const winnerCount = 2;
      const tokenAmount = 2;
      let feePercent = await exchangeChallenge.getAirdropFeePercent(
        testERC20.address
      );
      const airdropFee = (tokenAmount * feePercent) / 10000;
      const totalPayable = winnerCount * (tokenAmount + airdropFee);
      await testERC20
        .connect(account1)
        .approve(exchangeChallenge.address, toBN(totalPayable.toString()));

      const txp = await exchangeChallenge
        .connect(account1)
        .addTokenChallenge(
          testERC20.address,
          winnerCount,
          toBN(tokenAmount.toString()),
          airdropStartAt,
          airdropEndAt,
          eventIdAddTokenChallenge
        );

      let receipt = await txp.wait();
      const event = receipt.events?.filter((x) => {
        return x.event == "AddTokenChallenge";
      });
      const challengeId = event[0].args.challengeId;
      const sBalance = await testERC20.balanceOf(account1.address);

      expect(Number(sBalance)).to.be.equals(
        initialBalance - toBN(totalPayable.toString())
      );

      expect(
        exchangeChallenge
          .connect(account3)
          .withdrawTokenChallenge(challengeId, eventIdWithdrawTokenChallenge)
      ).to.be.revertedWith("Challenge exchange airdrop not ended");
    });

    it("withdraw token should fails with No token left", async () => {
      airdropStartAt = (await getCurrentUnixTime()) + SIX_SECOND;
      airdropEndAt = (await getCurrentUnixTime()) + TEN_SECOND;
      const initialBalance = Number(
        await testERC20.balanceOf(account1.address)
      );
      const winnerCount = 1;
      const tokenAmount = 2;
      let feePercent = await exchangeChallenge.getAirdropFeePercent(
        testERC20.address
      );
      const airdropFee = (tokenAmount * feePercent) / 10000;
      const totalPayable = winnerCount * (tokenAmount + airdropFee);
      await testERC20
        .connect(account1)
        .approve(exchangeChallenge.address, toBN(totalPayable.toString()));

      const txp = await exchangeChallenge
        .connect(account1)
        .addTokenChallenge(
          testERC20.address,
          winnerCount,
          toBN(tokenAmount.toString()),
          airdropStartAt,
          airdropEndAt,
          eventIdAddTokenChallenge
        );

      let receipt = await txp.wait();
      const event = receipt.events?.filter((x) => {
        return x.event == "AddTokenChallenge";
      });
      const challengeId = event[0].args.challengeId;

      await new Promise((resolve) =>
        setTimeout(resolve, TEN_SECOND_IN_MELLISECONDE)
      );
      const sBalance = await testERC20.balanceOf(account1.address);

      await exchangeChallenge
        .connect(account1)
        .airdropTokenChallenge(
          challengeId,
          account3.address,
          eventIdAirDropTokenChallenge
        );
      expect(Number(sBalance)).to.be.equals(
        initialBalance - toBN(totalPayable.toString())
      );

      expect(
        exchangeChallenge
          .connect(account1)
          .withdrawTokenChallenge(challengeId, eventIdWithdrawTokenChallenge)
      ).to.be.revertedWith("Challenge exchange airdrop not ended");
    });

    it("withdraw token challenge", async () => {
      airdropStartAt = (await getCurrentUnixTime()) + SIX_SECOND;
      airdropEndAt = (await getCurrentUnixTime()) + TEN_SECOND;
      const initialBalance = Number(
        await testERC20.balanceOf(account1.address)
      );
      const winnerCount = 2;
      const tokenAmount = 2;
      let feePercent = await exchangeChallenge.getAirdropFeePercent(
        testERC20.address
      );
      const airdropFee = (tokenAmount * feePercent) / 10000;
      const totalPayable = winnerCount * (tokenAmount + airdropFee);
      await testERC20
        .connect(account1)
        .approve(exchangeChallenge.address, toBN(totalPayable.toString()));

      const txp = await exchangeChallenge
        .connect(account1)
        .addTokenChallenge(
          testERC20.address,
          winnerCount,
          toBN(tokenAmount.toString()),
          airdropStartAt,
          airdropEndAt,
          eventIdAddTokenChallenge
        );

      let receipt = await txp.wait();
      const event = receipt.events?.filter((x) => {
        return x.event == "AddTokenChallenge";
      });
      const challengeId = event[0].args.challengeId;

      await new Promise((resolve) =>
        setTimeout(resolve, TEN_SECOND_IN_MELLISECONDE)
      );
      const sBalance = await testERC20.balanceOf(account1.address);

      expect(Number(sBalance)).to.be.equals(
        initialBalance - toBN(totalPayable.toString())
      );

      await exchangeChallenge
        .connect(account1)
        .withdrawTokenChallenge(challengeId, eventIdWithdrawTokenChallenge);
      const tBalance = await testERC20.balanceOf(account1.address);
      expect(Number(tBalance)).to.be.equals(initialBalance - toBN((airdropFee * winnerCount).toString())); // initial amount
    });

    it("withdraw token should fails with challenge not withdrawable", async () => {
      airdropStartAt = (await getCurrentUnixTime()) + SIX_SECOND;
      airdropEndAt = (await getCurrentUnixTime()) + TEN_SECOND;
      const initialBalance = Number(
        await testERC20.balanceOf(account1.address)
      );
      const winnerCount = 2;
      const tokenAmount = 2;
      let feePercent = await exchangeChallenge.getAirdropFeePercent(
        testERC20.address
      );
      const airdropFee = (tokenAmount * feePercent) / 10000;
      const totalPayable = winnerCount * (tokenAmount + airdropFee);
      await testERC20
        .connect(account1)
        .approve(exchangeChallenge.address, toBN(totalPayable.toString()));

      const txp = await exchangeChallenge
        .connect(account1)
        .addTokenChallenge(
          testERC20.address,
          winnerCount,
          toBN(tokenAmount.toString()),
          airdropStartAt,
          airdropEndAt,
          eventIdAddTokenChallenge
        );

      let receipt = await txp.wait();
      const event = receipt.events?.filter((x) => {
        return x.event == "AddTokenChallenge";
      });
      const challengeId = event[0].args.challengeId;

      await new Promise((resolve) =>
        setTimeout(resolve, TEN_SECOND_IN_MELLISECONDE)
      );
      const sBalance = await testERC20.balanceOf(account1.address);

      expect(Number(sBalance)).to.be.equals(
        initialBalance - toBN(totalPayable.toString())
      );

      await exchangeChallenge
        .connect(account1)
        .withdrawTokenChallenge(challengeId, eventIdWithdrawTokenChallenge);
      const tBalance = await testERC20.balanceOf(account1.address);
      expect(Number(tBalance)).to.be.equals(initialBalance - toBN((airdropFee * winnerCount).toString()));

      expect(
        exchangeChallenge
        .connect(account1)
        .withdrawTokenChallenge(challengeId, eventIdWithdrawTokenChallenge)).to.be.revertedWith("Challenge exchange: challenge not withdrawable");
    });


    it("set fee for primary token", async () => {
      const txp = await exchangeChallenge
        .connect(owner)
        .setPrimaryTokenPercent(10);
      const address = await exchangeChallenge.primaryToken();
      const fee = await exchangeChallenge.getAirdropFeePercent(address);
      expect(Number(fee)).to.be.equals(10);
    });

    it("set fee for secodary token", async () => {
      secodaryERC20 = await TestERC20.deploy();
      const txp = await exchangeChallenge
        .connect(owner)
        .setSecondaryTokenPercent(15);
      const fee = await exchangeChallenge.getAirdropFeePercent(
        secodaryERC20.address
      );
      expect(Number(fee)).to.be.equals(15);
    });

    it("should fails with setSecondaryTokenPercent  should be between 0 and 10000", async () => {
      await expect(
        exchangeChallenge.connect(owner).setSecondaryTokenPercent(1000001)
      ).to.be.revertedWith(
        "Challenge Exchange: Percent must be between 0 to 100 with 2 decimal point value."
      );
    });


    it("bulk airdrop should fail when receiver is 0x address", async () => {
      airdropStartAt = (await getCurrentUnixTime()) + SIX_SECOND;
      airdropEndAt = (await getCurrentUnixTime()) + TEN_SECOND;
      const winnerCount = 2;
      const tokenAmount = 2;
      const feePercent = await exchangeChallenge.getAirdropFeePercent(
        testERC20.address
      );
      const airdropFee = (tokenAmount * feePercent) / 10000;
      const totalPayable = winnerCount * (tokenAmount + airdropFee);

      await testERC20
        .connect(account1)
        .approve(exchangeChallenge.address, toBN(totalPayable.toString()));

      const txp = await exchangeChallenge
        .connect(account1)
        .addTokenChallenge(
          testERC20.address,
          winnerCount,
          toBN(tokenAmount.toString()),
          airdropStartAt,
          airdropEndAt,
          eventIdAddTokenChallenge
        );
      let receipt = await txp.wait();
      const event = receipt.events?.filter((x) => {
        return x.event == "AddTokenChallenge";
      });
      const challengeId = event[0].args.challengeId;
      await new Promise((resolve) =>
        setTimeout(resolve, SIX_SECOND_IN_MILLISECONDE)
      );

      expect(
        exchangeChallenge
          .connect(account1)
          .bulkAirdropTokenChallenge(
            challengeId,
            [zeroAddress],
            eventIdAirDropTokenChallenge
          )
      ).to.be.revertedWith("Challenge Exchange: Receiver address not valid");
    });

    it("bulk airdrop challenge token", async () => {
      airdropStartAt = (await getCurrentUnixTime()) + SIX_SECOND;
      airdropEndAt = (await getCurrentUnixTime()) + TEN_SECOND;
      const winnerCount = 2;
      const tokenAmount = 2;
      const feePercent = await exchangeChallenge.getAirdropFeePercent(
        testERC20.address
      );
      const airdropFee = (tokenAmount * feePercent) / 10000;
      const totalPayable = winnerCount * (tokenAmount + airdropFee);

      await testERC20
        .connect(account1)
        .approve(exchangeChallenge.address, toBN(totalPayable.toString()));

      const txp = await exchangeChallenge
        .connect(account1)
        .addTokenChallenge(
          testERC20.address,
          winnerCount,
          toBN(tokenAmount.toString()),
          airdropStartAt,
          airdropEndAt,
          eventIdAddTokenChallenge
        );
      let receipt = await txp.wait();
      const event = receipt.events?.filter((x) => {
        return x.event == "AddTokenChallenge";
      });
      const challengeId = event[0].args.challengeId;
      await new Promise((resolve) =>
        setTimeout(resolve, SIX_SECOND_IN_MILLISECONDE)
      );

      const account3Balance1 = await testERC20.balanceOf(account3.address);
      await exchangeChallenge
        .connect(account1)
        .bulkAirdropTokenChallenge(
          challengeId,
          [account3.address, account2.address],
          eventIdAirDropTokenChallenge
        );
      
      const account3Balance2 = await testERC20.balanceOf(account3.address);

      const challenge = await exchangeChallenge
        .connect(account1)
        .tokenChallenges(challengeId);
      expect(Number(challenge.winnerCount)).to.equal(winnerCount - 2);
      expect(challenge.seller).to.equal(account1.address);
      expect(Number(account3Balance2.sub(account3Balance1))).to.be.equals(Number(toBN(tokenAmount.toString())));
    });

    it("bulk airdrop challenge should fails caller is not owner", async () => {
      airdropStartAt = (await getCurrentUnixTime()) + SIX_SECOND;
      airdropEndAt = (await getCurrentUnixTime()) + TEN_SECOND;
      const winnerCount = 2;
      const tokenAmount = 2;
      const feePercent = await exchangeChallenge.getAirdropFeePercent(
        testERC20.address
      );
      const airdropFee = (tokenAmount * feePercent) / 10000;
      const totalPayable = winnerCount * (tokenAmount + airdropFee);

      await testERC20
        .connect(account1)
        .approve(exchangeChallenge.address, toBN(totalPayable.toString()));

      const txp = await exchangeChallenge
        .connect(account1)
        .addTokenChallenge(
          testERC20.address,
          winnerCount,
          toBN(tokenAmount.toString()),
          airdropStartAt,
          airdropEndAt,
          eventIdAddTokenChallenge
        );
      let receipt = await txp.wait();
      const event = receipt.events?.filter((x) => {
        return x.event == "AddTokenChallenge";
      });
      const challengeId = event[0].args.challengeId;
      await new Promise((resolve) =>
        setTimeout(resolve, SIX_SECOND_IN_MILLISECONDE)
      );

      await expect(
        exchangeChallenge
          .connect(account2)
          .bulkAirdropTokenChallenge(
            challengeId,
            [account3.address],
            eventIdAirDropTokenChallenge
          )
      ).to.be.revertedWith("Challenge Exchange: caller not an owner");
    });
    it("bulk airdrop challenge should fails with invalid start at airdrop", async () => {
      airdropStartAt = (await getCurrentUnixTime()) + SIX_SECOND;
      airdropEndAt = (await getCurrentUnixTime()) + TEN_SECOND;
      const winnerCount = 2;
      const tokenAmount = 2;
      const feePercent = await exchangeChallenge.getAirdropFeePercent(
        testERC20.address
      );
      const airdropFee = (tokenAmount * feePercent) / 10000;
      const totalPayable = winnerCount * (tokenAmount + airdropFee);

      await testERC20
        .connect(account1)
        .approve(exchangeChallenge.address, toBN(totalPayable.toString()));

      const txp = await exchangeChallenge
        .connect(account1)
        .addTokenChallenge(
          testERC20.address,
          winnerCount,
          toBN(tokenAmount.toString()),
          airdropStartAt,
          airdropEndAt,
          eventIdAddTokenChallenge
        );
      let receipt = await txp.wait();
      const event = receipt.events?.filter((x) => {
        return x.event == "AddTokenChallenge";
      });
      const challengeId = event[0].args.challengeId;

      await expect(
        exchangeChallenge
          .connect(account1)
          .bulkAirdropTokenChallenge(
            challengeId,
            [account3.address],
            eventIdAirDropTokenChallenge
          )
      ).to.be.revertedWith("Challenge Exchange: invalid start at airdrop");
    });

    it("bulk airdrop challenge should fails with Airdrop done", async () => {
      airdropStartAt = (await getCurrentUnixTime()) + SIX_SECOND;
      airdropEndAt = (await getCurrentUnixTime()) + TEN_SECOND;
      const winnerCount = 1;
      const tokenAmount = 2;
      const feePercent = await exchangeChallenge.getAirdropFeePercent(
        testERC20.address
      );
      const airdropFee = (tokenAmount * feePercent) / 10000;
      const totalPayable = winnerCount * (tokenAmount + airdropFee);

      await testERC20
        .connect(account1)
        .approve(exchangeChallenge.address, toBN(totalPayable.toString()));

      const txp = await exchangeChallenge
        .connect(account1)
        .addTokenChallenge(
          testERC20.address,
          winnerCount,
          toBN(tokenAmount.toString()),
          airdropStartAt,
          airdropEndAt,
          eventIdAddTokenChallenge
        );
      let receipt = await txp.wait();
      const event = receipt.events?.filter((x) => {
        return x.event == "AddTokenChallenge";
      });
      const challengeId = event[0].args.challengeId;
      await new Promise((resolve) =>
        setTimeout(resolve, SIX_SECOND_IN_MILLISECONDE)
      );
      await exchangeChallenge
        .connect(account1)
        .bulkAirdropTokenChallenge(
          challengeId,
          [account3.address],
          eventIdAirDropTokenChallenge
        );
      await expect(
        exchangeChallenge
          .connect(account1)
          .bulkAirdropTokenChallenge(
            challengeId,
            [account2.address],
            eventIdAirDropTokenChallenge
          )
      ).to.be.revertedWith("Challenge Exchange: Insufficient winner count to airdrop");
    });
  });
});
