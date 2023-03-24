require("@nomiclabs/hardhat-ethers");
const hre = require("hardhat");
const { ethers } = require("hardhat");
const { expect } = require("chai");

async function getCurrentUnixTime() {
  return (await ethers.provider.getBlock("latest")).timestamp;
}
describe("Challenge", async function () {
  let ExchangeChallenge;
  let TestERC1155;
  let TestERC20;

  let testERC1155;
  let testERC20;
  const zeroAddress = "0x0000000000000000000000000000000000000000";
  let exchangeChallenge;
  let account1, account2, account3, owner;
  const toBN = (value) => {
    return ethers.utils.parseUnits(value, 18);
  };

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
  describe("Challenge", async () => {
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

      it("should fails with secondary token percent should be between 0 and 10000", async () => {
        await expect(
          exchangeChallenge.connect(owner).setSecondaryTokenPercent(1000001)
        ).to.be.revertedWith(
          "Challenge Exchange: Percent must be between 0 to 100 with 2 decimal point value."
        );
      });
      it("should set primary token", async () => {
        const txp = await exchangeChallenge
          .connect(owner)
          .setPrimaryToken(testERC20.address);
        const token = await exchangeChallenge.primaryToken();
        expect(token).to.be.equals(testERC20.address);
      });
      it("should set primary token fails when token is zero address", async () => {
        secodaryERC20 = await TestERC20.deploy();
        expect(
          exchangeChallenge.connect(owner).setPrimaryToken(zeroAddress)
        ).to.be.revertedWith("Challenge Exchange: Not a valid address");
      });

      it("should fails with percent should be between 0 and 10000", async () => {
        await expect(
          exchangeChallenge.connect(owner).setPrimaryTokenPercent(1000001)
        ).to.be.revertedWith(
          "Challenge Exchange: Percent must be between 0 to 100 with 2 decimal point value."
        );
      });
      it("only owner could set primary token percent ", async () => {
        expect(
          exchangeChallenge.connect(account1).setPrimaryTokenPercent(10001)
        ).to.be.revertedWith("Ownable: caller is not the owner");
      });
      it("should throw only owner could set fee", async () => {
        expect(
          exchangeChallenge.connect(account1).setFee(10)
        ).to.be.revertedWith("Challenge Exchange: Insufficient balance");
      });

      it("set swap rate", async () => {
        const txp = await exchangeChallenge.connect(owner).setFee(10);
        const fee = await exchangeChallenge.bullzFee();
        expect(Number(fee)).to.be.equals(10);
      });
      it("bullz fee should match initial value", async () => {
        const fee = await exchangeChallenge.bullzFee();
        expect(Number(fee)).to.be.equals(5 * 10 ** 6);
      });
      it("market token should match initial value", async () => {
        expect(await exchangeChallenge.marketToken()).to.be.equals(
          testERC20.address
        );
      });
      it("only owner could set primary token percent ", async () => {
        expect(
          exchangeChallenge.connect(account1).setPrimaryTokenPercent(10001)
        ).to.be.revertedWith("Ownable: caller is not the owner");
      });
      it("set utility token", async () => {
        const txp = await exchangeChallenge
          .connect(owner)
          .setMarketToken(testERC1155.address);
        const address = await exchangeChallenge.marketToken();
        expect(address).to.be.equals(testERC1155.address);
      });
      it("set market token should fail when token address is 0", async () => {
        expect(exchangeChallenge
          .connect(owner)
          .setMarketToken(zeroAddress)).to.be.revertedWith("Challenge Exchange: Not a valid address");
      });
  });
});
