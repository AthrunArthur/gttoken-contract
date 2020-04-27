const ERC20AuctionFactory = artifacts.require("ERC20AuctionFactory")
const ERC20Auction = artifacts.require("ERC20Auction")
const ERC20AuctionOpProxyFactory = artifacts.require("ERC20AuctionOpProxyFactory");
const ERC20AuctionOpProxy = artifacts.require("ERC20AuctionOpProxy");
const ERC20PeriodAuction = artifacts.require("ERC20PeriodAuction");
const ERC20PeriodAuctionFactory = artifacts.require("ERC20PeriodAuctionFactory");


async function performMigration(deployer, network, accounts) {
  results= {}
  if(network.includes("main")){
    auction_factory = await ERC20AuctionFactory.deployed();
    proxy_factory = await ERC20AuctionOpProxyFactory.deployed();
    period_factory = await ERC20PeriodAuctionFactory.deployed();
    console.log("auction factory: ", auction_factory.address)
    console.log("auction proxy factory: ", proxy_factory.address);
    console.log("period auction factory: ", period_factory.address);

    rds_pool = '0xaCdcAadc2Af41b27034dce1310a17d1a4446684C';
    usdt_address = '0xdAC17F958D2ee523a2206206994597C13D831ec7';
    benifit_addr = '0x21A3dbeE594a3419D6037D6D8Cee0B1E10Bf345C';
    multisig_addr = '0xd030fffd702B037235676Af30612577A7CA201A2';

    min_obj_amount = 1000000
    min_bid_price = 1000000
    obj_price_unit = 1
    auction_period = 184300
    tx = await period_factory.createERC20PeriodAuction(min_obj_amount,
      min_bid_price,
      obj_price_unit,
      auction_period,
      auction_factory.address,
      multisig_addr);
    period_auction = await ERC20PeriodAuction.at(tx.logs[0].args.addr);
    console.log("Period Auction: ", period_auction.address);
    results["period_auction"] = period_auction.address;

    tx = await proxy_factory.createERC20AuctionOpProxy(rds_pool,
    usdt_address, benifit_addr, period_auction.address, multisig_addr);
    proxy = await ERC20AuctionOpProxy.at(tx.logs[0].args.addr);
    console.log("Auction Proxy: ", proxy.address);
    results["auction_proxy"] = proxy.address;

  require('fs').writeFile("30_" + network + ".json", JSON.stringify(results), function(err) {
    if (err) throw err;
    console.log('complete');
  });
  }
}
module.exports = function(deployer, network, accounts){
deployer
    .then(function() {
      return performMigration(deployer, network, accounts)
    })
    .catch(error => {
      console.log(error)
      process.exit(1)
    })
};
