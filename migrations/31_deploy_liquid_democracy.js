const LiquidDemocracyFactory = artifacts.require("LiquidDemocracyFactory")
const AddressArray = artifacts.require("AddressArray")

async function performMigration(deployer, network, accounts) {
  await AddressArray.deployed();
  await deployer.link(AddressArray, LiquidDemocracyFactory);
  await deployer.deploy(LiquidDemocracyFactory);
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
