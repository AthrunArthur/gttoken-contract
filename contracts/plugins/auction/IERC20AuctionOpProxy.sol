pragma solidity >=0.4.21 <0.6.0;
contract IERC20AuctionOpProxy {
  function add_auction(address _auction) public;
  function apply_bid(address addr, uint amount, uint price, uint price_unit) public;
  function revoke_bid(address addr, uint amount, uint price, uint price_unit) public;
  function apply_auction(address addr, uint amount, uint price, uint price_unit) public;
  function object_token() public view returns(address, string memory);
  function object_total_amount() public view returns(uint);
}

