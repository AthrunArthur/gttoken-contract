pragma solidity >=0.4.21 <0.6.0;
contract IERC20DepositPool {
  event Transfer(address from, address to, uint amount);
  event OutsideTransfer(address from, address to, uint amount);
  event InternalTransfer(address from, address to, uint amount);
  event DepositERC20(address addr, uint amount);
  event WithdrawERC20(address addr, uint amount);

  event LockERC20(address from, address addr, uint amount);
  event UnlockERC20(address from, address addr, uint amount);

  function deposit(uint _amount) public returns (bool);

  function transfer(address _to, uint _amount) public returns (bool);

  function withdraw(uint _amount) public returns(bool);

  function lock(address addr, uint amount) public  returns (bool);

  function unlock(address addr, uint amount) public  returns(bool);

  function outside_transfer(address from, address to, uint _amount) public returns(bool);

  function internal_transfer(address from, address to, uint amount) public returns(bool);
}
