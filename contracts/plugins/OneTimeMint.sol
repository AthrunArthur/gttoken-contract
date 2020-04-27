pragma solidity >=0.4.21 <0.6.0;
import "../utils/TokenClaimer.sol";

contract TokenInterface is TransferableToken{
    function destroyTokens(address _owner, uint _amount) public returns (bool);
    function generateTokens(address _owner, uint _amount) public returns (bool);
}

contract OneTimeMint{
  TokenInterface public token_contract;
  address public target_addr;
  uint public amount;
  bool public is_minted;

  constructor(address _token, address _target, uint _amount) public{
    token_contract = TokenInterface(_token);
    target_addr = _target;
    amount = _amount;
    is_minted = false;
  }

  function mint() public{
    require(is_minted == false, "already minted");
    token_contract.generateTokens(target_addr, amount);
    is_minted = true;
  }
}

contract OneTimeMintFactory{
  event NewOneTimeMint(address addr);

  function createOneTimeMint(address _token, address _target, uint _amount)public returns(address){
    OneTimeMint otm = new OneTimeMint(_token, _target, _amount);
    emit NewOneTimeMint(address(otm));
    return address(otm);
  }
}
