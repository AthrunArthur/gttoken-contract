const ERC20 = artifacts.require("USDT");
const ERC20DepositPool = artifacts.require("ERC20DepositPool")
const ERC20DepositPoolFactory = artifacts.require("ERC20DepositPoolFactory")

const { BN, constants, expectEvent, expectRevert  } = require('openzeppelin-test-helpers');
const { expect  } = require('chai');

const getBlockNumber = require('./blockNumber')(web3)

const MultiSigFactory = artifacts.require("MultiSigFactory");
const MultiSig = artifacts.require("MultiSig");
const MultiSigTools = artifacts.require("MultiSigTools");
const TrustListFactory = artifacts.require("TrustListFactory");
const TrustList = artifacts.require("TrustList");


contract('ERC20DepositPool', (accounts) =>{

  let multisig_factory = {}
  let multisig = {}
  let trustlist_factory = {}
  let trustlist = {}
  let token = {}

  let factory = {}
  let dpool = {}

  context('init', ()=>{
        it('init', async () => {
          multisig_factory = await MultiSigFactory.deployed();
          assert.ok(multisig_factory);
          tokentx = await multisig_factory.createMultiSig(accounts.slice(0, 4));
          multisig = await MultiSig.at(tokentx.logs[0].args.addr);

          trustlist_factory = await TrustListFactory.deployed();
          assert.ok(trustlist_factory);
          tokentx = await trustlist_factory.createTrustList([], multisig.address);
          trustlist = await TrustList.at(tokentx.logs[0].args.addr);

          token = await ERC20.deployed();
          console.log("token :", token.address);

          factory = await ERC20DepositPoolFactory.deployed();
          assert.ok(factory);
          tokentx = await factory.createERC20DepositPool(token.address, trustlist.address);
          dpool = await ERC20DepositPool.at(tokentx.logs[0].args.addr);
          assert.ok(dpool);

          balance  = (await dpool.balanceOf(dpool.address)).toNumber();
          expect(balance).to.equal(0);


          for(i = 0; i<5; i++){
            await token.issue(accounts[i], 1000000);
          }

          invoke_id = await multisig.get_unused_invoke_id("add_trusted");
          await trustlist.add_trusted(invoke_id, accounts[9], {from:accounts[0]});
          await trustlist.add_trusted(invoke_id, accounts[9], {from:accounts[1]});
          await trustlist.add_trusted(invoke_id, accounts[9], {from:accounts[2]});

        })

    it('deposit_withdraw', async() =>{
      await expectRevert(dpool.deposit(1000, {from:accounts[0]}),
        "ERC20DepositPool, transferFrom return false");

      await token.approve(dpool.address, 1000001, {from:accounts[0]});

      await expectRevert(dpool.deposit(1000001, {from:accounts[0]}),
        "ERC20DepositPool, transferFrom return false");


      await dpool.deposit(500000, {from:accounts[0]});

      balance = (await dpool.balanceOf(accounts[0])).toNumber();
      expect(balance).to.equal(500000);
      balance = (await token.balanceOf(accounts[0])).toNumber();
      expect(balance).to.equal(500000);

      await expectRevert(dpool.withdraw(1, {from:accounts[1]}),
        "not enough deposit, maybe locked already");

      await expectRevert(dpool.withdraw(500001, {from:accounts[0]}),
        "not enough deposit, maybe locked already");

      await dpool.withdraw(250000, {from:accounts[0]});
      balance = (await dpool.balanceOf(accounts[0])).toNumber();
      expect(balance).to.equal(250000);
      balance = (await token.balanceOf(accounts[0])).toNumber();
      expect(balance).to.equal(750000);

      await dpool.withdraw(250000, {from:accounts[0]});

      balance = (await dpool.balanceOf(accounts[0])).toNumber();
      expect(balance).to.equal(0);
      balance = (await token.balanceOf(accounts[0])).toNumber();
      expect(balance).to.equal(1000000);
    })

    it('deposit_lock', async() =>{
      await expectRevert(dpool.lock(accounts[1], 1000, {from:accounts[8]}),
        "not a trusted issuer");

      await expectRevert(dpool.lock(accounts[1], 100, {from:accounts[9]}),
      "not enough deposit");

      await token.approve(dpool.address, 1000000, {from:accounts[1]});
      await dpool.deposit(1000, {from:accounts[1]});

      await dpool.lock(accounts[1], 1000, {from:accounts[9]});

      console.log(1)
      await expectRevert(dpool.withdraw(1, {from:accounts[1]}),
      "not enough deposit, maybe locked already");

      console.log(2)
      await expectRevert(dpool.unlock(accounts[1], 1001, {from:accounts[8]}),
      "not a trusted issuer");

      console.log(3)
      await expectRevert(dpool.unlock(accounts[1], 1001, {from:accounts[9]}),
      "unlock too much");

      console.log(4)
      await dpool.unlock(accounts[1], 500, {from:accounts[9]});

      await dpool.deposit(1000, {from:accounts[1]});

      console.log(5)
      balance = (await dpool.balanceOf(accounts[1])).toNumber();
      expect(balance).to.equal(2000);
      balance = (await dpool.lockedOf(accounts[1])).toNumber();
      expect(balance).to.equal(500);

      console.log(6)
      await dpool.lock(accounts[1], 500, {from:accounts[9]});

      balance = (await dpool.balanceOf(accounts[1])).toNumber();
      expect(balance).to.equal(2000);
      balance = (await dpool.lockedOf(accounts[1])).toNumber();
      expect(balance).to.equal(1000);

      console.log(7)

      await dpool.withdraw(1000, {from:accounts[1]});

      balance = (await dpool.balanceOf(accounts[1])).toNumber();
      expect(balance).to.equal(1000);
      balance = (await dpool.lockedOf(accounts[1])).toNumber();
      expect(balance).to.equal(1000);
    })

    it('deposit_transfer', async() =>{
      await token.approve(dpool.address, 1000000, {from:accounts[2]});

      await dpool.deposit(2000, {from:accounts[2]});

      await dpool.transfer(accounts[3], 1000, {from:accounts[2]});
      balance = (await dpool.balanceOf(accounts[2])).toNumber();
      expect(balance).to.equal(1000);
      balance = (await dpool.balanceOf(accounts[3])).toNumber();
      expect(balance).to.equal(1000);


      await dpool.lock(accounts[2], 1000, {from:accounts[9]});

      await expectRevert(dpool.transfer(accounts[3], 1001, {from:accounts[2]}),
      "not enough deposit, maybe locked already");

      await dpool.unlock(accounts[2], 200, {from:accounts[9]});

      await dpool.internal_transfer(accounts[2], accounts[4], 100, {from:accounts[9]});
      balance = (await dpool.balanceOf(accounts[2])).toNumber();
      expect(balance).to.equal(900);

      balance = (await dpool.balanceOf(accounts[4])).toNumber();
      expect(balance).to.equal(100);


      await dpool.outside_transfer(accounts[2], accounts[4], 100, {from:accounts[9]});

      balance = (await dpool.balanceOf(accounts[2])).toNumber();
      expect(balance).to.equal(800);

      balance = (await dpool.balanceOf(accounts[4])).toNumber();
      expect(balance).to.equal(100);

      balance = (await token.balanceOf(accounts[4])).toNumber();
      expect(balance).to.equal(1000100);
    })

  })
})
