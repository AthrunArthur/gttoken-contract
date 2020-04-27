const SafeMath = artifacts.require("SafeMath")
const ERC20DepositPoolFactory = artifacts.require("ERC20DepositPoolFactory")

async function performMigration(deployer, network, accounts) {
  await deployer.link(SafeMath, ERC20DepositPoolFactory);
  await deployer.deploy(ERC20DepositPoolFactory);
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
