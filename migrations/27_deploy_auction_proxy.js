const SafeMath = artifacts.require("SafeMath")
const ERC20AuctionOpProxyFactory = artifacts.require("ERC20AuctionOpProxyFactory")
const AddressArray = artifacts.require("AddressArray")

async function performMigration(deployer, network, accounts) {
  await deployer.link(SafeMath, ERC20AuctionOpProxyFactory);
  await deployer.link(AddressArray, ERC20AuctionOpProxyFactory)
  await deployer.deploy(ERC20AuctionOpProxyFactory);
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
