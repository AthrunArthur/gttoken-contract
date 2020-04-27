const { BN, constants, expectEvent, expectRevert  } = require('openzeppelin-test-helpers');
const { expect  } = require('chai');
const getBlockNumber = require('./blockNumber')(web3)

const GTToken = artifacts.require("GTToken");
const GTTokenFactory = artifacts.require("GTTokenFactory");

const MultiSigFactory = artifacts.require("MultiSigFactory");
const MultiSig = artifacts.require("MultiSig");
const TrustListFactory = artifacts.require("TrustListFactory");
const TrustList = artifacts.require("TrustList");
const OneTimeMintFactory = artifacts.require("OneTimeMintFactory");
const OneTimeMint = artifacts.require("OneTimeMint");

contract("OneTimeMint", (accounts)=>{
  let gttoken = {}
  let mint = {}

  let multisig = {}
  context('init', ()=>{
    it('init', async ()=>{
      multisig_factory = await MultiSigFactory.deployed();
      assert.ok(multisig_factory);
      tokentx = await multisig_factory.createMultiSig(accounts.slice(0, 3));
      multisig = await MultiSig.at(tokentx.logs[0].args.addr);

      trustlist_factory = await TrustListFactory.deployed();
      assert.ok(trustlist_factory);
      tokentx = await trustlist_factory.createTrustList([], multisig.address);
      token_trustlist = await TrustList.at(tokentx.logs[0].args.addr);

      f = await GTTokenFactory.deployed();
      tokentx = await f.createCloneToken('0x0000000000000000000000000000000000000000', 0, "Test", 6, "tst", true, multisig.address, token_trustlist.address);
      gttoken = await GTToken.at(tokentx.logs[0].args._cloneToken);
      assert.ok(gttoken);

      console.log(1);
      factory = await OneTimeMintFactory.deployed();
      tx = await factory.createOneTimeMint(gttoken.address, accounts[0], 1000)
      mint = await OneTimeMint.at(tx.logs[0].args.addr);

      console.log(2);
      invoke_id = await multisig.get_unused_invoke_id("add_trusted", {from:accounts[0]});
      await token_trustlist.add_trusted(invoke_id, mint.address, {from:accounts[1]});
      await token_trustlist.add_trusted(invoke_id, mint.address, {from:accounts[0]});
    })
    it('mint', async()=>{
      balance  = (await gttoken.balanceOf(accounts[0])).toNumber();
      expect(balance).to.equal(0);
      await mint.mint();
      balance  = (await gttoken.balanceOf(accounts[0])).toNumber();
      expect(balance).to.equal(1000);

      await expectRevert(mint.mint(), "already minted");
    })
  })
})
