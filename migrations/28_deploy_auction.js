const SafeMath = artifacts.require("SafeMath")
const ERC20AuctionFactory = artifacts.require("ERC20AuctionFactory")
const AddressArray = artifacts.require("AddressArray")

async function performMigration(deployer, network, accounts) {
  await deployer.link(SafeMath, ERC20AuctionFactory);
  await deployer.link(AddressArray, ERC20AuctionFactory)
  await deployer.deploy(ERC20AuctionFactory);
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
