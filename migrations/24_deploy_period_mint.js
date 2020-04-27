const SafeMath = artifacts.require("SafeMath")
const AddressArray = artifacts.require("AddressArray")
const PeriodMintFactory = artifacts.require("PeriodMintFactory")

async function performMigration(deployer, network, accounts) {
  await deployer.link(SafeMath, PeriodMintFactory);
  await deployer.link(AddressArray, PeriodMintFactory);
  await deployer.deploy(PeriodMintFactory);
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
