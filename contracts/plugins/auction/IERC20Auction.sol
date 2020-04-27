pragma solidity >=0.4.21 <0.6.0;

contract IERC20Auction{
 function is_expired() public view returns(bool);

 function is_finished() public view returns(bool);

 function auction_expiration() public returns(bool);
}

contract IERC20AuctionFactory{

  function createERC20Auction(address _auction_proxy,
              uint _min_obj_amount,
              uint _min_bid_price,
              uint _obj_price_unit,
              uint _start_block,
              uint _end_block,
              address _creator,
              address _multisig
                             ) public returns(address);

}
