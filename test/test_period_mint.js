const { BN, constants, expectEvent, expectRevert  } = require('openzeppelin-test-helpers');
const { expect  } = require('chai');
const getBlockNumber = require('./blockNumber')(web3)

const GTToken = artifacts.require("GTToken");
const GTTokenFactory = artifacts.require("GTTokenFactory");

const MultiSigFactory = artifacts.require("MultiSigFactory");
const MultiSig = artifacts.require("MultiSig");
const TrustListFactory = artifacts.require("TrustListFactory");
const TrustList = artifacts.require("TrustList");

const PeriodMintFactory = artifacts.require("PeriodMintFactory");
const PeriodMint = artifacts.require("PeriodMint");

contract("PeriodMint", (accounts)=>{
  let token = {}
  let mint = {}

  let multisig = {}
  let start_block = {}
  let period = 15
  let period_share = 2100

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
      token = await GTToken.at(tokentx.logs[0].args._cloneToken);
      assert.ok(token);

      console.log(1);
      start_block = (await web3.eth.getBlock("latest")).number;
      factory = await PeriodMintFactory.deployed();
      tx = await factory.createPeriodMint(token.address, start_block, period, period_share, multisig.address)
      mint = await PeriodMint.at(tx.logs[0].args.addr);

      console.log(2);
      invoke_id = await multisig.get_unused_invoke_id("add_trusted", {from:accounts[0]});
      await token_trustlist.add_trusted(invoke_id, mint.address, {from:accounts[1]});
      await token_trustlist.add_trusted(invoke_id, mint.address, {from:accounts[0]});
    })

    it("add_shareholder", async() =>{
      invoke_id = await multisig.get_unused_invoke_id("add_shareholder", {from:accounts[0]});
      await mint.add_shareholder(invoke_id, accounts[0], 10, {from:accounts[0]});
      await mint.add_shareholder(invoke_id, accounts[0], 10, {from:accounts[1]});

      invoke_id = await multisig.get_unused_invoke_id("add_shareholder", {from:accounts[0]});
      await mint.add_shareholder(invoke_id, accounts[1], 10, {from:accounts[0]});
      await mint.add_shareholder(invoke_id, accounts[1], 10, {from:accounts[1]});

      await expectRevert(mint.admin_add_shareholder(accounts[2], 10, {from:accounts[0]}),
        "admin not set")

      a0 = (await token.balanceOf(accounts[0])).toNumber();
      a1 = (await token.balanceOf(accounts[1])).toNumber();
      i = 0;
      while(i <= start_block + period){
        await token.transfer(accounts[0], 0, {from:accounts[0]});
        i = (await web3.eth.getBlock("latest")).number;
      }
      start_block = i;
      await mint.issue();
      b0 = (await token.balanceOf(accounts[0])).toNumber();
      b1 = (await token.balanceOf(accounts[1])).toNumber();
      expect(b0).equal(a0 + 1050);
      expect(b1).equal(a1 + 1050);
    })

    it("config_shareholder", async() =>{
      invoke_id = await multisig.get_unused_invoke_id("config_shareholder", {from:accounts[0]});
      await mint.config_shareholder(invoke_id, accounts[1], 20, {from:accounts[0]});
      await mint.config_shareholder(invoke_id, accounts[1], 20, {from:accounts[1]});

      await expectRevert(mint.admin_config_shareholder(accounts[2], 10, {from:accounts[0]}),
        "admin not set")

      a0 = (await token.balanceOf(accounts[0])).toNumber();
      a1 = (await token.balanceOf(accounts[1])).toNumber();
      i = 0;
      while(i <= start_block + period){
        await token.transfer(accounts[0], 0, {from:accounts[0]});
        i = (await web3.eth.getBlock("latest")).number;
      }
      start_block = i;
      await mint.issue();
      b0 = (await token.balanceOf(accounts[0])).toNumber();
      b1 = (await token.balanceOf(accounts[1])).toNumber();
      expect(b0).equal(a0 + 700);
      expect(b1).equal(a1 + 1400);
    })
    it("remove_shareholder", async() =>{
      invoke_id = await multisig.get_unused_invoke_id("remove_shareholder", {from:accounts[0]});
      await mint.remove_shareholder(invoke_id, accounts[1], {from:accounts[0]});
      await mint.remove_shareholder(invoke_id, accounts[1], {from:accounts[1]});

      await expectRevert(mint.admin_remove_shareholder(accounts[2], {from:accounts[0]}),
        "admin not set")

      a0 = (await token.balanceOf(accounts[0])).toNumber();
      a1 = (await token.balanceOf(accounts[1])).toNumber();
      i = 0;
      while(i <= start_block + period){
        await token.transfer(accounts[0], 0, {from:accounts[0]});
        i = (await web3.eth.getBlock("latest")).number;
      }
      start_block = (await mint.status())._last_block_num.toNumber();
      console.log("start block: ", start_block)
      await mint.issue();
      b0 = (await token.balanceOf(accounts[0])).toNumber();
      b1 = (await token.balanceOf(accounts[1])).toNumber();
      expect(b0).equal(a0 + 2100);
      expect(b1).equal(a1);
      start_block = (await mint.status())._last_block_num.toNumber();

    })
    it("delegate/undelegate", async() =>{
      console.log(1);
      invoke_id = await multisig.get_unused_invoke_id("delegate_admin", {from:accounts[0]});
      await mint.delegate_admin(invoke_id, accounts[8], {from:accounts[0]});
      await mint.delegate_admin(invoke_id, accounts[8], {from:accounts[1]});

      console.log(2);
      await mint.admin_add_shareholder(accounts[1], 10, {from:accounts[8]});
      a0 = (await token.balanceOf(accounts[0])).toNumber();
      a1 = (await token.balanceOf(accounts[1])).toNumber();
      i = (await web3.eth.getBlock("latest")).number;
      start_block = (await mint.status())._last_block_num.toNumber();
      while(i <= start_block + period){
        await token.transfer(accounts[0], 0, {from:accounts[0]});
        i = (await web3.eth.getBlock("latest")).number;
      }
      start_block = i;
      await mint.issue();
      b0 = (await token.balanceOf(accounts[0])).toNumber();
      b1 = (await token.balanceOf(accounts[1])).toNumber();
      expect(b0).equal(a0 + 1050);
      expect(b1).equal(a1 + 1050);

      console.log(3);
      await mint.admin_config_shareholder(accounts[1], 20, {from:accounts[8]})
      i = 0;
      a0 = (await token.balanceOf(accounts[0])).toNumber();
      a1 = (await token.balanceOf(accounts[1])).toNumber();
      i = (await web3.eth.getBlock("latest")).number;
      start_block = (await mint.status())._last_block_num.toNumber();
      while(i <= start_block + period){
        await token.transfer(accounts[0], 0, {from:accounts[0]});
        i = (await web3.eth.getBlock("latest")).number;
      }
      start_block = i;
      await mint.issue();
      b0 = (await token.balanceOf(accounts[0])).toNumber();
      b1 = (await token.balanceOf(accounts[1])).toNumber();
      expect(b0).equal(a0 + 700);
      expect(b1).equal(a1 + 1400);


      console.log(4);
      await mint.admin_remove_shareholder(accounts[1], {from:accounts[8]})
      a0 = (await token.balanceOf(accounts[0])).toNumber();
      a1 = (await token.balanceOf(accounts[1])).toNumber();
      i = (await web3.eth.getBlock("latest")).number;
      start_block = (await mint.status())._last_block_num.toNumber();
      while(i <= start_block + period){
        await token.transfer(accounts[0], 0, {from:accounts[0]});
        i = (await web3.eth.getBlock("latest")).number;
      }
      start_block = i;
      await mint.issue();
      b0 = (await token.balanceOf(accounts[0])).toNumber();
      b1 = (await token.balanceOf(accounts[1])).toNumber();
      expect(b0).equal(a0 + 2100);
      expect(b1).equal(a1 );

      invoke_id = await multisig.get_unused_invoke_id("cancel_delegate_admin", {from:accounts[0]});
      await mint.cancel_delegate_admin(invoke_id,  {from:accounts[0]});
      await mint.cancel_delegate_admin(invoke_id,  {from:accounts[1]});

      await expectRevert(mint.admin_add_shareholder(accounts[2], 10, {from:accounts[0]}),
        "admin not set")
      await expectRevert(mint.admin_config_shareholder(accounts[2], 10, {from:accounts[0]}),
        "admin not set")
      await expectRevert(mint.admin_remove_shareholder(accounts[2], {from:accounts[0]}),
        "admin not set")
    })

  })
})
