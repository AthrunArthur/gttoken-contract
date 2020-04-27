const { BN, constants, expectEvent, expectRevert  } = require('openzeppelin-test-helpers');
const { expect  } = require('chai');

const getBlockNumber = require('./blockNumber')(web3)
const { MerkleTree } = require('./helpers/merkleTree.js');
const { keccak256, bufferToHex, toBuffer } = require('ethereumjs-util');

const TrustListFactory = artifacts.require("TrustListFactory");
const TrustList = artifacts.require("TrustList");
const MultiSigFactory = artifacts.require("MultiSigFactory");
const MultiSig = artifacts.require("MultiSig");
const MultiSigTools = artifacts.require("MultiSigTools");

const ERC20 = artifacts.require("USDT");
const ERC20TokenBankFactory = artifacts.require("ERC20TokenBankFactory");
const ERC20TokenBank = artifacts.require("ERC20TokenBank");
const MerkleDropFactory = artifacts.require("MerkleDropFactory");
const MerkleDrop = artifacts.require("MerkleDrop");

function test_keccak(addr, value) {
  k = web3.utils.soliditySha3(
            {t:"address", v:addr}, {t:"uint", v: value});
  return toBuffer(k);
}
contract("MerkleDrop", (accounts) =>{

  let multisig_factory = {}
  let multisig = {}
  let trustlist_factory = {}
  let trustlist = {}
  let token = {}
  let bank_factory = {}
  let bank = {}

  let drop_factory = {}
  let drop = {}
  let merkle_tree = {}
  let root = {}
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

          drop_factory = await MerkleDropFactory.deployed();


          const elements = [test_keccak(accounts[0], 100),
          test_keccak(accounts[1], 200),
          test_keccak(accounts[2], 300)
          ];

      merkle_tree= new MerkleTree(elements);

      root = merkle_tree.getHexRoot();

          tx = await drop_factory.createMerkleDrop("test drop", bank.address,
          root, multisig.address);
          drop = await MerkleDrop.at(tx.logs[0].args.addr);

          await token.issue(bank.address, 1000000);

          invoke_id = await multisig.get_unused_invoke_id("add_trusted");
          await trustlist.add_trusted(invoke_id, drop.address, {from:accounts[0]});
          await trustlist.add_trusted(invoke_id, drop.address, {from:accounts[1]});
          await trustlist.add_trusted(invoke_id, drop.address, {from:accounts[2]});

        })

  it('claim', async() =>{
  //const elements = [test_keccak(accounts[0], 100),
          //test_keccak(accounts[1], 200),
          //test_keccak(accounts[2], 300)
          //];

      //merkle_tree= new MerkleTree(elements);
    const proof = merkle_tree.getHexProof(
      test_keccak(accounts[0], 100)
    );
    await drop.claim(accounts[0], 100, proof, {from:accounts[0]});
    await expectRevert(drop.claim(accounts[0], 100, proof), "you claimed already");

    const nproof = merkle_tree.getHexProof(
      test_keccak(accounts[1], 200)
    );

    await expectRevert(drop.claim(accounts[1], 201, nproof, {from:accounts[1]}), "invalid merkle proof");

  const bad_elements = [test_keccak(accounts[0], 100),
          test_keccak(accounts[1], 300),
          test_keccak(accounts[2], 300)
          ];

      const bad_merkle_tree= new MerkleTree(bad_elements);
    const nnproof = bad_merkle_tree.getHexProof(
      test_keccak(accounts[1], 300)
    );

  await expectRevert(drop.claim(accounts[1], 300, nnproof, {from:accounts[1]}), "invalid merkle proof");
  })

    it('pause/unpause', async() =>{
      invoke_id = await multisig.get_unused_invoke_id("pause");
      await drop.pause(invoke_id, {from:accounts[0]});
      await drop.pause(invoke_id, {from:accounts[1]});
      await drop.pause(invoke_id, {from:accounts[2]});

    const proof = merkle_tree.getHexProof(
      test_keccak(accounts[2], 300)
    );
    await expectRevert(drop.claim(accounts[2], 300, proof, {from:accounts[2]}),
      "already paused");

      invoke_id = await multisig.get_unused_invoke_id("unpause");
      await drop.unpause(invoke_id, {from:accounts[0]});
      await drop.unpause(invoke_id, {from:accounts[1]});
      await drop.unpause(invoke_id, {from:accounts[2]});
      await drop.claim(accounts[8], 300, proof, {from:accounts[2]});

      balance  = (await token.balanceOf(accounts[8])).toNumber();
      expect(balance).to.equal(300);
    })
  })
})
