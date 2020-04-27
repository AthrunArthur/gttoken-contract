const SafeMath = artifacts.require("SafeMath")
const MerkleProof = artifacts.require("MerkleProof")
const MerkleProofWrapper = artifacts.require("MerkleProofWrapper")

async function performMigration(deployer, network, accounts) {
  await deployer.deploy(MerkleProof);
  if(network.includes("ganache")){
    await deployer.deploy(MerkleProofWrapper)
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
