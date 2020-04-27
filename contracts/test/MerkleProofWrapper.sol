pragma solidity >=0.4.21 <0.6.0;

import "../utils/MerkleProof.sol";

contract MerkleProofWrapper {
    function verify(bytes32[] memory proof, bytes32 root, bytes32 leaf) public pure returns (bool) {
        return MerkleProof.verify(proof, root, leaf);
    }
}
