const ERC20PaymentFactory = artifacts.require("ERC20PaymentFactory")
const SafeMath = artifacts.require("SafeMath")

async function performMigration(deployer, network, accounts) {
  await deployer.link(SafeMath, ERC20PaymentFactory);
  await deployer.deploy(ERC20PaymentFactory);
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
