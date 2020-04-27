pragma solidity >=0.4.21 <0.6.0;
import "../../AddressList.sol";
import "./IERC20AuctionOpProxy.sol";
import "../../MultiSigTools.sol";
import "../../utils/SafeMath.sol";
import "../../utils/TokenClaimer.sol";

contract ERC20TokenBankInterface{
  function balance() public view returns(uint);
  function token() public view returns(address, string memory);
  function issue(address _to, uint _amount) public returns (bool success);
}

contract ERC20AuctionOpProxy is AddressList, IERC20AuctionOpProxy, MultiSigTools{
  using SafeMath for uint;

  ERC20TokenBankInterface public object_erc20_pool;
  address public exchange_erc20_token;
  address public benifit_pool;

  address public auction_mgr_contract;

  constructor(address _object_erc20_pool,
              address _exchange_erc20_token,
              address _benifit_pool,
             address _auction_mgr,
             address _multisig) public AddressList()
             MultiSigTools(_multisig){

    object_erc20_pool = ERC20TokenBankInterface(_object_erc20_pool);
    exchange_erc20_token = _exchange_erc20_token;
    benifit_pool = _benifit_pool;
    auction_mgr_contract = _auction_mgr;
  }


  function add_auction(address _auction) public{
    require (msg.sender == auction_mgr_contract, "only auction mgr can op this");
    _add_address(_auction);
  }

  function apply_bid(address addr, uint amount, uint price, uint price_unit) public{
    require(is_address_exist(msg.sender), "only trusted auction contract can op this");

    uint total = amount.safeMul(price).safeDiv(price_unit);
    //exchange_deposit_pool.lock(addr, total);
    TransferableToken token = TransferableToken(exchange_erc20_token);
    uint old_balance = token.balanceOf(address(this));
    (bool ret, ) = exchange_erc20_token.call(abi.encodeWithSignature("transferFrom(address,address,uint256)", addr, address(this), total));
    require(ret, "ERC20AuctionOpProxy, transferFrom return false. Please make sure you have enough token and approved them for auction.");
    uint new_balance = token.balanceOf(address(this));
    require(new_balance == old_balance + total, "ERC20TokenAuctionOpProxy, apply_bid, invalid bid");
  }

  function revoke_bid(address addr, uint amount, uint price, uint price_unit) public{
    require(is_address_exist(msg.sender), "only trusted auction contract can op this");
    uint old_total = amount.safeMul(price).safeDiv(price_unit);

    (bool ret, ) = exchange_erc20_token.call(abi.encodeWithSignature("transfer(address,uint256)", addr, old_total));
    require(ret, "ERC20AuctionOpProxy, revoke_bid, transfer return false");
    //exchange_deposit_pool.unlock(addr, old_total);
  }

  function apply_auction(address addr, uint amount, uint price, uint price_unit) public{
    require(is_address_exist(msg.sender), "only trusted auction contract can op this");
    uint total = amount.safeMul(price).safeDiv(price_unit);

    TransferableToken token = TransferableToken(exchange_erc20_token);
    uint old_balance = token.balanceOf(benifit_pool);
    (bool ret, ) = exchange_erc20_token.call(abi.encodeWithSignature("transfer(address,uint256)", benifit_pool, total));
    require(ret, "ERC20AuctionOpProxy, apply_auction, transfer return false");
    uint new_balance = token.balanceOf(benifit_pool);
    require(new_balance == old_balance + total, "ERC20AuctionOpProxy, apply_auction, invalid transfer");

    //exchange_deposit_pool.outside_transfer(addr, benifit_pool, total);
    //exchange_deposit_pool.unlock(addr, total);
    object_erc20_pool.issue(addr, amount);
  }

  function object_token() public view returns(address, string memory){
    return object_erc20_pool.token();
  }
  function object_total_amount() public view returns(uint){
    return object_erc20_pool.balance();
  }

  event ChangeObjectERC20Pool(address old_addr, address new_addr);
  function change_object_erc20_pool(uint64 id, address new_pool) public only_signer is_majority_sig(id, "change_object_erc20_pool"){
    require(new_pool != address(0x0), "invalid address");
    address old_addr = address(object_erc20_pool);
    object_erc20_pool = ERC20TokenBankInterface(new_pool);

    emit ChangeObjectERC20Pool(old_addr, new_pool);
  }

  event ChangeBenifitPool(address old_addr, address new_addr);
  function change_benifit_pool(uint64 id, address new_pool) public only_signer is_majority_sig(id, "change_benifit_pool"){
    require(new_pool != address(0x0), "invalid address");
    address old = benifit_pool;
    benifit_pool = new_pool;
    emit ChangeBenifitPool(old, benifit_pool);
  }
}

contract ERC20AuctionOpProxyFactory{
  event NewERC20AuctionOpProxy(address addr);
  function createERC20AuctionOpProxy(address _object_erc20_pool,
              address _exchange_erc20_token,
              address _benifit_pool, address _auction_mgr, address _multisig) public returns(address){
                ERC20AuctionOpProxy proxy = new ERC20AuctionOpProxy(_object_erc20_pool,
                                                                   _exchange_erc20_token, _benifit_pool, _auction_mgr, _multisig);

                emit NewERC20AuctionOpProxy(address(proxy));
                return address(proxy);
  }
}


