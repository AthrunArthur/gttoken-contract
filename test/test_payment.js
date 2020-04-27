const ERC20 = artifacts.require("USDT");
const ERC20TokenBankFactory = artifacts.require("ERC20TokenBankFactory");
const ERC20TokenBank = artifacts.require("ERC20TokenBank");
const ERC20Payment = artifacts.require("ERC20Payment");
const ERC20PaymentFactory = artifacts.require("ERC20PaymentFactory");

const { BN, constants, expectEvent, expectRevert  } = require('openzeppelin-test-helpers');
const { expect  } = require('chai');

const getBlockNumber = require('./blockNumber')(web3)

const MultiSigFactory = artifacts.require("MultiSigFactory");
const MultiSig = artifacts.require("MultiSig");
const MultiSigTools = artifacts.require("MultiSigTools");
const TrustListFactory = artifacts.require("TrustListFactory");
const TrustList = artifacts.require("TrustList");

contract('ERC20Salary', (accounts) =>{
  let multisig_factory = {}
  let multisig = {}
  let trustlist_factory = {}
  let trustlist = {}
  let token = {}
  let bank_factory = {}
  let bank = {}
  let payment_factory = {}
  let payment = {}

  let addr0 = "0x0000000000000000000000000000000000000000";
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

          bank_factory = await ERC20TokenBankFactory.deployed();
          assert.ok(bank_factory);
          tx = await bank_factory.newERC20TokenBank("ERC20 for all", token.address, multisig.address, trustlist.address);
          bank = await ERC20TokenBank.at(tx.logs[0].args.addr);

          payment_factory = await ERC20PaymentFactory.deployed();

          tx = await payment_factory.newPayment("ERC20 payment", accounts[1], accounts[0], 9999, {from:accounts[0]});
          payment = await ERC20Payment.at(tx.logs[0].args.addr);

          await token.issue(bank.address, 100);

        });

    it('test change bank', async() =>{
      await expectRevert(payment.change_token_bank(accounts[1], {from:accounts[1]}), "only owner can call this");
      await expectRevert(payment.change_token_bank(accounts[1], {from:accounts[0]}), "same as old bank");
      await payment.change_token_bank(bank.address, {from:accounts[0]});
    });

    it('test claim', async() =>{
      await expectRevert(payment.claim_payment(accounts[2], 100, {from:accounts[0]}), "not a trusted issuer");

          invoke_id = await multisig.get_unused_invoke_id("add_trusted");
          await trustlist.add_trusted(invoke_id, payment.address, {from:accounts[0]});
          await trustlist.add_trusted(invoke_id, payment.address, {from:accounts[1]});
          await trustlist.add_trusted(invoke_id, payment.address, {from:accounts[2]});

      await expectRevert(payment.claim_payment(accounts[2], 10000, {from:accounts[0]}), "not enough remain");
      await expectRevert(payment.claim_payment(accounts[2], 1000, {from:accounts[0]}), "bank doesn't have enough token");

      await payment.claim_payment(accounts[2], 100, {from:accounts[0]});
      balance0 = (await token.balanceOf(accounts[2], {from:accounts[9]})).toNumber();
      expect(balance0).to.equal(100);

      await token.issue(bank.address, 10000);
      await payment.claim_payment(accounts[2], 9899, {from:accounts[0]});
      balance1 = (await token.balanceOf(accounts[2], {from:accounts[9]})).toNumber();
      expect(balance1).to.equal(9999);

      await expectRevert(payment.claim_payment(accounts[2], 1, {from:accounts[0]}), "not enough remain");



    });
  })
})
