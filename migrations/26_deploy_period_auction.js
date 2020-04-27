const SafeMath = artifacts.require("SafeMath")
const ERC20PeriodAuctionFactory = artifacts.require("ERC20PeriodAuctionFactory")

async function performMigration(deployer, network, accounts) {
  await deployer.link(SafeMath, ERC20PeriodAuctionFactory);
  await deployer.deploy(ERC20PeriodAuctionFactory);
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
