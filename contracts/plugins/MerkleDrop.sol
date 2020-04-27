pragma solidity >=0.4.21 <0.6.0;

import "../MultiSigTools.sol";
import "../utils/Arrays.sol";
import "../utils/SafeMath.sol";
import "../utils/MerkleProof.sol";

contract ERC20TokenBankInterface{
  function balance() public view returns(uint);
  function token() public view returns(address, string memory);
  function issue(address _to, uint _amount) public returns (bool success);
}

contract MerkleDrop is MultiSigTools{
  using SafeMath for uint;

  string public info;
  ERC20TokenBankInterface public token_bank;
  uint public total_dropped;
  bytes32 public merkle_root;

  bool public paused;
  mapping(address => bool) private claim_status;

  constructor(string memory _info, address _token_bank,
              bytes32 _merkle_root, address _multisig) MultiSigTools(_multisig) public{
    info = _info;
    token_bank = ERC20TokenBankInterface(_token_bank);
    total_dropped = 0;
    merkle_root = _merkle_root;
    paused = false;
  }

  function pause(uint64 id) public only_signer is_majority_sig(id, "pause"){
    paused = true;
  }
  function unpause(uint64 id) public only_signer is_majority_sig(id, "unpause"){
    paused = false;
  }

  event DropToken(address claimer, address to, uint amount);
  function claim(address to, uint amount, bytes32[] memory proof)  public returns(bool){
    require(paused == false, "already paused");
    require(claim_status[msg.sender] == false, "you claimed already");

    bytes32 leaf = keccak256(abi.encodePacked(msg.sender, amount));

    bool ret = MerkleProof.verify(proof, merkle_root, leaf);
    require(ret, "invalid merkle proof");

    claim_status[msg.sender] = true;
    token_bank.issue(to, amount);
    total_dropped = total_dropped.safeAdd(amount);
    emit DropToken(msg.sender, to, amount);
    return true;
  }
}

contract MerkleDropFactory{
  event NewMerkleDrop(address addr);

  function createMerkleDrop(string memory _info, address _token_bank,
                            bytes32 _merkle_root, address _multisig) public returns(address){
    MerkleDrop mm = new MerkleDrop(_info, _token_bank,
                                  _merkle_root, _multisig);
    emit NewMerkleDrop(address(mm));
    return address(mm);
  }

}
