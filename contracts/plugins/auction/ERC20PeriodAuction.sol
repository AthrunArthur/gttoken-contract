pragma solidity >=0.4.21 <0.6.0;
import "../../MultiSigTools.sol";
import "../../TrustListTools.sol";
import "../../utils/TokenClaimer.sol";
import "../../utils/SafeMath.sol";
import "./IERC20Auction.sol";
import "./IERC20AuctionOpProxy.sol";

contract ERC20TokenBankInterface{
  function balance() public view returns(uint);
  function token() public view returns(address, string memory);
  function issue(address _to, uint _amount) public returns (bool success);
}

contract ERC20PeriodAuction is MultiSigTools{
  IERC20AuctionOpProxy public auction_proxy;

  uint public minimum_object_amount;
  uint public minimum_bid_price;
  uint public obj_price_unit;

  uint public auction_period;
  bool public auction_paused;

  IERC20AuctionFactory public auction_factory;

  IERC20Auction public current_auction;

  mapping (address => bool) private trusted_auctions;

  constructor(uint _min_obj_amount,
              uint _min_bid_price,
              uint _obj_price_unit,
              uint _auction_period,
              address _auction_factory,
             address _multisig) public MultiSigTools(_multisig){
    minimum_object_amount = _min_obj_amount;
    minimum_bid_price = _min_bid_price;
    obj_price_unit = _obj_price_unit;

    auction_period = _auction_period;
    auction_factory = IERC20AuctionFactory(_auction_factory);
    auction_paused = false;
  }

  function unpause_auction(uint64 id) public only_signer is_majority_sig(id, "unpause_auction"){
    require(auction_paused, "already unpaused");
    auction_paused = false;
  }
  function pause_auction(uint64 id) public only_signer is_majority_sig(id, "pause_auction"){
    require(!auction_paused, "already paused");
    auction_paused = true;
  }

  event ChangeAuctionProxy(address old_addr, address new_addr);
  function change_auction_proxy(uint64 id, address new_proxy) public only_signer is_majority_sig(id, "change_auction_proxy"){
    require(new_proxy != address(0x0), "invalid address");
    if(address(current_auction) != address(0x0)){
      require(current_auction.is_finished(), "current auction is not finished");
    }
    address old = address(auction_proxy);
    auction_proxy = IERC20AuctionOpProxy(new_proxy);
    emit ChangeAuctionProxy(old, new_proxy);
  }

  event ChangeMinObjAmount(uint old_amount, uint new_amount);
  function change_minimum_object_amount(uint64 id, uint new_amount) public only_signer is_majority_sig(id, "change_minimum_object_amount"){
    require(new_amount != 0, "invalid amount");
    if(address(current_auction) != address(0x0)){
      require(current_auction.is_finished(), "current auction is not finished");
    }
    uint old = minimum_object_amount;
    minimum_object_amount = new_amount;
    emit ChangeMinObjAmount(old, new_amount);
  }

  event ChangeMinBidPrice(uint old_price, uint new_price);
  function change_min_bid_price(uint64 id, uint new_price) public only_signer is_majority_sig(id, "change_min_bid_price"){
    require(new_price != 0, "invalid price");
    if(address(current_auction) != address(0x0)){
      require(current_auction.is_finished(), "current auction is not finished");
    }
    uint old = minimum_bid_price;
    minimum_bid_price = new_price;
    emit ChangeMinBidPrice(old, new_price);
  }

  event ChangeAuctionObjPriceUnit(uint old_unit, uint new_unit);
  function change_auction_obj_price_unit(uint64 id, uint new_unit) public only_signer is_majority_sig(id, "change_auction_obj_price_unit"){
    require(new_unit >=1, "invalid unit");
    if(address(current_auction) != address(0x0)){
      require(current_auction.is_finished(), "current auction is not finished");
    }
    uint old = obj_price_unit;
    obj_price_unit = new_unit;
    emit ChangeAuctionObjPriceUnit(old, new_unit);
  }

  event ChangeAuctionPeriod(uint old_period, uint new_period);
  function change_auction_period(uint64 id, uint new_period) public only_signer is_majority_sig(id, "change_auction_period"){
    require(new_period > 1, "invalid period");
    if(address(current_auction) != address(0x0)){
      require(current_auction.is_finished(), "current auction is not finished");
    }
    uint old = auction_period;
    auction_period = new_period;
    emit ChangeAuctionPeriod(old, auction_period);
  }

  event ChangeAuctionFactory(address old_factory, address new_factory);
  function change_auction_factory(uint64 id, address new_factory) public only_signer is_majority_sig(id, "change_auction_factory"){
    require(new_factory != address(0x0), "invalid address");
    if(address(current_auction) != address(0x0)){
      require(current_auction.is_finished(), "current auction is not finished");
    }
    address old = address(auction_factory);
    auction_factory = IERC20AuctionFactory(new_factory);
    emit ChangeAuctionFactory(old, new_factory);
  }

  event ChangeCurrentAuction(address old_auction, address new_auction);
  function change_current_auction(uint64 id, address new_auction) public only_signer is_majority_sig(id, "change_current_auction"){
    require(new_auction != address(0x0), "invalid address");
    if(address(current_auction) != address(0x0)){
      require(current_auction.is_finished(), "current auction is not finished");
    }
    address old = address(current_auction);
    current_auction = IERC20Auction(new_auction);
    trusted_auctions[new_auction] = true;
    emit ChangeCurrentAuction(old, new_auction);
    auction_proxy.add_auction(address(current_auction));
  }

  event NewAuction(address new_auction);
  function new_auction() public returns (address auction_address){
    require(!auction_paused, "auction already paused");
    require(address(auction_proxy) != address(0x0), "not ready for create auction");

    if(address(current_auction) != address(0x0)){
      require(current_auction.is_expired(), "current auction is not expired");
      if(!current_auction.is_finished()){
        current_auction.auction_expiration();
      }
      require(current_auction.is_finished(), "current auction cannot be finished");
    }


    address _current_auction = auction_factory.createERC20Auction(address(auction_proxy),
                                                        minimum_object_amount,
                                                        minimum_bid_price,
                                                        obj_price_unit,
                                                        block.number,
                                                        block.number + auction_period,
                                                        msg.sender,
                                                        address(multisig_contract)
                                                        );

    trusted_auctions[address(_current_auction)] = true;
    current_auction = IERC20Auction(_current_auction);
    auction_proxy.add_auction(address(current_auction));

    emit NewAuction(address(current_auction));
    return address(current_auction);
  }
}

contract ERC20PeriodAuctionFactory{
  event NewERC20PeriodAuction(address addr);
  function createERC20PeriodAuction(uint _min_obj_amount,
              uint _min_bid_price,
              uint _obj_price_unit,
              uint _auction_period,
              address _auction_factory,
             address _multisig) public returns(address){

               ERC20PeriodAuction auction = new ERC20PeriodAuction(
                 _min_obj_amount,
                 _min_bid_price,
                 _obj_price_unit,
                 _auction_period,
                 _auction_factory,
                 _multisig
               );

               emit NewERC20PeriodAuction(address(auction));

               return address(auction);
          }
}
