pragma solidity >=0.4.21 <0.6.0;
import "../../MultiSigTools.sol";
import "../../TrustListTools.sol";
import "../../utils/TokenClaimer.sol";
import "../../utils/SafeMath.sol";
import "./IERC20Auction.sol";
import "../../assets/IERC20DepositPool.sol";
import "./IERC20AuctionOpProxy.sol";

contract ERC20TokenBankInterface{
  function balance() public view returns(uint);
  function token() public view returns(address, string memory);
  function issue(address _to, uint _amount) public returns (bool success);
}


contract ERC20Auction is IERC20Auction, MultiSigTools, TokenClaimer{

  IERC20AuctionOpProxy public auction_proxy;

  uint public minimum_object_amount;
  uint public minimum_bid_price;
  uint public obj_price_unit;

  uint public auction_start_block;
  uint public auction_end_block;


  address public current_buyer;
  uint public current_bid_price;
  uint public current_bid_amount;
  bool public is_auction_settled;
  address public auction_creator;

  constructor(address _auction_proxy,
              uint _min_obj_amount,
              uint _min_bid_price,
              uint _obj_price_unit,
              uint _start_block,
              uint _end_block,
              address _creator,
              address _multisig
) public MultiSigTools(_multisig){
    auction_proxy = IERC20AuctionOpProxy(_auction_proxy);
    minimum_object_amount = _min_obj_amount;
    minimum_bid_price = _min_bid_price;
    obj_price_unit = _obj_price_unit;
    auction_start_block = _start_block;
    auction_end_block = _end_block;
    auction_creator = _creator;
    current_buyer = address(0x0);
    current_bid_price = 0;
    current_bid_amount = 0;
    is_auction_settled = false;
  }

  function auction_info() public view returns (uint _min_obj_amount, uint _min_bid_price,
                                              uint _obj_price_unit, uint _start_block,
                                              uint _end_block){
    return (minimum_object_amount, minimum_bid_price, obj_price_unit, auction_start_block, auction_end_block);
  }

  function hammer_info() public view returns (address buyer, uint price, uint amount){
    require(is_auction_settled, "no hammer price until auction expired");
    buyer = current_buyer;
    price = current_bid_price;
    amount = current_bid_amount;
  }

  function object_token() public view returns(address, string memory){
    return auction_proxy.object_token();
  }
  function object_total_amount() public view returns(uint){
    return auction_proxy.object_total_amount();
  }

  event Bid(address addr, uint amount, uint price);

  function bid(uint amount, uint price) public returns (bool){
    require(block.number >= auction_start_block, "not start yet");
    require(block.number <= auction_end_block, "already expired");
    require(price >= current_bid_price, "should bid with higher price than current bid");
    require(price >= minimum_bid_price, "should be higher than the reserve price");
    require(amount >= minimum_object_amount, "should be more than minimum object amount");
    require(msg.sender != current_buyer, "you already got the bid");
    if(price == current_bid_price){
      require(amount > current_bid_amount, "same bid price should come with more amount");
    }

    require(amount <= object_total_amount(), "not enough object token for bid");

    auction_proxy.apply_bid(msg.sender, amount, price, obj_price_unit);

    if(current_buyer != address(0x0)){
      auction_proxy.revoke_bid(current_buyer, current_bid_amount, current_bid_price, obj_price_unit);
    }
    current_buyer = msg.sender;
    current_bid_price = price;
    current_bid_amount = amount;
    emit Bid(msg.sender, amount, price);
    return true;
  }

  function is_expired() public view returns(bool){
    return block.number > auction_end_block;
  }

  function is_finished() public view returns(bool){
    return is_auction_settled;
  }

  function auction_expiration() public returns (bool){
    require(block.number > auction_end_block, "not expired yet");
    require(!is_auction_settled, "auction settled already");
    if(current_buyer == address(0x0)){
      is_auction_settled = true;
      return true;
    }
    auction_proxy.apply_auction(current_buyer, current_bid_amount, current_bid_price, obj_price_unit);

    is_auction_settled = true;
    return true;
  }

  function claimStdTokens(uint64 id, address _token, address payable to) public only_signer is_majority_sig(id, "claimStdTokens"){
    _claimStdTokens(_token, to);
  }
}

contract ERC20AuctionFactory is IERC20AuctionFactory{
  event NewERC20Auction(address addr);

  function createERC20Auction(address _auction_proxy,
              uint _min_obj_amount,
              uint _min_bid_price,
              uint _obj_price_unit,
              uint _start_block,
              uint _end_block,
              address _creator,
              address _multisig
                             )public returns(address){
                               ERC20Auction auction = new ERC20Auction(
                                 _auction_proxy,
                                 _min_obj_amount,
                                 _min_bid_price,
                                 _obj_price_unit,
                                 _start_block,
                                 _end_block,
                                 _creator,
                                 _multisig
                               );
                               emit NewERC20Auction(address(auction));
                               return address(auction);
                             }
}
