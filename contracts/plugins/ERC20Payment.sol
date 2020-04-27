pragma solidity >=0.4.21 <0.6.0;

import "../utils/TokenClaimer.sol";
import "../utils/SafeMath.sol";

contract ERC20TokenBankInterface{
  function balance() public view returns(uint);
  function token() public view returns(address, string memory);
  function issue(address _to, uint _amount) public returns (bool success);
}

contract ERC20Payment{
  using SafeMath for uint;

  string public payment_info;
  ERC20TokenBankInterface public bank;
  address public account;
  uint public total_amount;
  uint public remain;

  event ClaimedPayment(address account, address to, uint amount);
  event ChangedBank(address old_bank, address new_bank);

  modifier only_owner{
    require(account == msg.sender, "only owner can call this");
    _;
  }
  constructor(string memory _info, address _bank, address _account, uint _amount) public {
    require(_bank != address(0x0), "invalid address");
    require(_account != address(0x0), "invalid address");
    payment_info = _info;
    bank = ERC20TokenBankInterface(_bank);
    account = _account;
    total_amount = _amount;
    remain = _amount;
  }

  function change_token_bank(address _addr) public only_owner returns(bool){
    require(_addr != address(0x0), "invalid address");
    require(_addr != address(bank), "same as old bank");

    address old =address(bank);
    bank = ERC20TokenBankInterface(_addr);
    emit ChangedBank(old, address(bank));
    return true;
  }

  function bank_balance() public view returns(uint){
    return bank.balance();
  }
  function bank_token() public view returns(address, string memory){
    return bank.token();
  }

  function claim_payment(address to, uint amount) public only_owner returns(bool){
    require(to != address(0x0), "invalid address");
    require(amount <= remain, "not enough remain");
    require(amount <= bank_balance(), "bank doesn't have enough token");
    remain = remain.safeSub(amount);
    bank.issue(to, amount);
    emit ClaimedPayment(msg.sender, to, amount);
    return true;
  }

}

contract ERC20PaymentFactory{
  event CreateERC20Payment(address addr);

  function newPayment(string memory info, address bank, address account, uint amount)
  public returns (ERC20Payment){
    ERC20Payment addr = new ERC20Payment(info, bank, account, amount);
    emit CreateERC20Payment(address(addr));
    return addr;
  }
}
