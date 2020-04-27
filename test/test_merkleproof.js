const { BN, constants, expectEvent, expectRevert  } = require('openzeppelin-test-helpers');
const { expect  } = require('chai');

const getBlockNumber = require('./blockNumber')(web3)
const { MerkleTree } = require('./helpers/merkleTree.js');
const { keccak256, bufferToHex } = require('ethereumjs-util');

const MerkleProofWrapper = artifacts.require('MerkleProofWrapper');

contract('MerkleProof', (accounts) => {
  let merkleProof = {}

  context('init', ()=>{
    it("init", async() =>{
      merkleProof = await MerkleProofWrapper.deployed();
    });

    it('should return true for a valid Merkle proof', async function () {
      const elements = [keccak256('a'), keccak256('b'), keccak256('c'), keccak256('d')];
      const merkleTree = new MerkleTree(elements);

      const root = merkleTree.getHexRoot();

      const proof = merkleTree.getHexProof(elements[0]);

      const leaf = bufferToHex(elements[0]);

      expect(await merkleProof.verify(proof, root, leaf)).to.equal(true);
    });

    it('should return false for an invalid Merkle proof', async function () {
      const correctElements = [keccak256('a'), keccak256('b'), keccak256('c')];
      const correctMerkleTree = new MerkleTree(correctElements);

      const correctRoot = correctMerkleTree.getHexRoot();

      const correctLeaf = bufferToHex(correctElements[0]);

      const badElements = [keccak256('d'), keccak256('e'), keccak256('f')];
      const badMerkleTree = new MerkleTree(badElements);

      const badProof = badMerkleTree.getHexProof(badElements[0]);

      expect(await merkleProof.verify(badProof, correctRoot, correctLeaf)).to.equal(false);
    });

    it('should return false for a Merkle proof of invalid length', async function () {
      const elements = [keccak256('a'), keccak256('b'), keccak256('c')];
      const merkleTree = new MerkleTree(elements);

      const root = merkleTree.getHexRoot();

      const proof = merkleTree.getHexProof(elements[0]);
      const badProof = proof.slice(0, proof.length - 5);

      const leaf = bufferToHex(elements[0]);

      expect(await merkleProof.verify(badProof, root, leaf)).to.equal(false);
    });
  });
});
