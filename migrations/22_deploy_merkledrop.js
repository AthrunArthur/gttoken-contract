const SafeMath = artifacts.require("SafeMath")
const MerkleProof = artifacts.require("MerkleProof")
const MerkleDropFactory = artifacts.require("MerkleDropFactory")

async function performMigration(deployer, network, accounts) {
  await deployer.link(SafeMath, MerkleDropFactory);
  await deployer.link(MerkleProof, MerkleDropFactory);

  await deployer.deploy(MerkleDropFactory);
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
