const { assert } = require("chai");

const Marketplace = artifacts.require("./Marketplace.sol");

require("chai")
  .use(require("chai-as-promised"))
  .should();

contract("Marketplace", ([deployer, seller, buyer]) => {
  let marketplace;

  before(async () => {
    marketplace = await Marketplace.deployed(); // we are using await in the context of async, so that
    // it will not move forward until this function call is completed.

    // and we use await in blockchain, because function calls are ASYNCHRONOUS IN BLOCKCHAIN.
    //  because they take a lot of time to complete
  });

  describe("deployment", async () => {
    it("deployes successfully", async () => {
      const address = await marketplace.address;
      assert.notEqual(address, 0x0);
      assert.notEqual(address, "");
      assert.notEqual(address, null);
      assert.notEqual(address, undefined);
    });

    it("has a name", async () => {
      const name = await marketplace.name();
      assert.equal(name, "Dapp Univeristy Marketplace");
    });
  });

  describe("products", async () => {
    let result, productCount;

    before(async () => {
      result = await marketplace.createProduct(
        "iPhone",
        web3.utils.toWei("1", "Ether"),
        { from: seller }
      );
      productCount = await marketplace.productCount();
    });

    it("creates product", async () => {
      // ----SUCCESS-----

      assert.equal(productCount, 1);
      // console.log(result.logs);

      const event = result.logs[0].args;
      // id is equal to productCount
      assert.equal(BigInt(event.id), productCount, "id is correct");
      // name is same as the name entered
      assert.equal(event.name, "iPhone", "name is correct");
      // price is same as the price entered
      assert.equal(
        BigInt(event.price),
        web3.utils.toWei("1", "Ether"),
        "price is correct"
      );
      // owner is the seller
      assert.equal(event.owner, seller, "owner is correct");
      // yet not sold, so purcahsed = false
      assert.equal(event.purchased, false, "purchased is correct");

      // *****************************************************************

      // ----FAILURE----

      // must have a name
      await await marketplace.createProduct(
        "",
        web3.utils.toWei("1", "Ether"),
        {
          from: seller,
        }
      ).should.be.rejected;

      // must have a price
      await await marketplace.createProduct("iPhone", 0, {
        from: seller,
      }).should.be.rejected;
    });

    it("lists products", async () => {
      const product = await marketplace.products(productCount);

      // id is equal to productCount
      assert.equal(product.id.toNumber(), productCount, "id is correct");
      // name is same as the name entered
      assert.equal(product.name, "iPhone", "name is correct");
      // price is same as the price entered
      assert.equal(
        BigInt(product.price),
        web3.utils.toWei("1", "Ether"),
        "price is correct"
      );
      // owner is the seller
      assert.equal(product.owner, seller, "owner is correct");
      // yet not sold, so purcahsed = false
      assert.equal(product.purchased, false, "purchased is correct");
    });

    it("purchases product", async () => {
      // track old balance
      let oldSellerBalance;
      oldSellerBalance = await web3.eth.getBalance(seller);
      oldSellerBalance = new web3.utils.BN(oldSellerBalance);

      // SUCCESS - PURCAHSE IS MADE
      const result = await marketplace.purchaseProduct(productCount, {
        from: buyer,
        value: web3.utils.toWei("1", "Ether"),
      });

      // check logs
      const event = result.logs[0].args;
      // id is equal to productCount
      assert.equal(BigInt(event.id), productCount, "id is correct");
      // name is same as the name entered
      assert.equal(event.name, "iPhone", "name is correct");
      // price is same as the price entered
      assert.equal(
        BigInt(event.price),
        web3.utils.toWei("1", "Ether"),
        "price is correct"
      );
      // owner is the buyer
      assert.equal(event.owner, buyer, "owner is correct");
      // sold, so purcahsed = true
      assert.equal(event.purchased, true, "purchased is correct");

      // check if the funds are transferred
      let newSellerBalance;
      newSellerBalance = await web3.eth.getBalance(seller);
      newSellerBalance = new web3.utils.BN(newSellerBalance);

      let price;
      price = web3.utils.toWei("1", "Ether");
      price = new web3.utils.BN(price);

      // console.log(oldSellerBalance, newSellerBalance, price);

      const expectedBal = oldSellerBalance.add(price);
      assert.equal(newSellerBalance.toString(), expectedBal.toString());

      // FAILURE

      // must have a valid id
      await await marketplace.purchaseProduct(11, {
        from: buyer,
        value: web3.utils.toWei("1", "Ether"),
      }).should.be.rejected;

      // must have a enough  balance
      await await marketplace.purchaseProduct(productCount, {
        from: buyer,
        value: 1000000000000000,
      }).should.be.rejected;

      // buyer is not seller
      await await marketplace.purchaseProduct(productCount, {
        from: seller,
        value: web3.utils.toWei("1", "Ether"),
      }).should.be.rejected;

      // product cant be purchased twice
      await await marketplace.purchaseProduct(productCount, {
        from: deployer,
        value: web3.utils.toWei("1", "Ether"),
      }).should.be.rejected;
    });
  });
});
