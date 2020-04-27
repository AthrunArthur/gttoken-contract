const MerkleDropFactory = artifacts.require("MerkleDropFactory")
const MerkleDrop= artifacts.require("MerkleDrop")
const GTTokenFactory = artifacts.require("GTTokenFactory");
const GTToken = artifacts.require('GTToken')
const MultiSigFactory = artifacts.require("MultiSigFactory");
const MultiSig = artifacts.require("MultiSig");
const TrustListFactory = artifacts.require("TrustListFactory");
const TrustList = artifacts.require("TrustList");
const OneTimeMint = artifacts.require("OneTimeMint")
const OneTimeMintFactory = artifacts.require("OneTimeMintFactory")
const ERC20TokenBankFactory = artifacts.require("ERC20TokenBankFactory");
const ERC20TokenBank = artifacts.require("ERC20TokenBank");
const PeriodMintFactory = artifacts.require("PeriodMintFactory");
const PeriodMint = artifacts.require("PeriodMint");

async function performMigration(deployer, network, accounts) {
  funders = ["0x2D68C532dc01482acE9397F8b9280732D3361063", "0x845D866F4A9B1D13BcC2905bd90Af3C285Fb8c82",
  "0xf4267391072B27D76Ed8f2A9655BCf5246013F2d"];

  results = {}
  if(network.includes("ropsten")){
          multisig_factory = await MultiSigFactory.deployed();
          console.log("MultiSigFactory: ", multisig_factory.address)
          tokentx = await multisig_factory.createMultiSig(funders);
          multisig = await MultiSig.at(tokentx.logs[0].args.addr);
          console.log("MultiSig: ", multisig.address)
          results['multisig'] = multisig.address;

          trustlist_factory = await TrustListFactory.deployed();
          console.log("TrustListFactory: ", trustlist_factory.address)
          tokentx = await trustlist_factory.createTrustList([], multisig.address);
          token_trustlist = await TrustList.at(tokentx.logs[0].args.addr);
          console.log("GTToken TrustList: ", token_trustlist.address);
          results['gotoken_issuers'] = token_trustlist.address;

          token_factory = await GTTokenFactory.deployed();
          console.log("GTTokenFactory: ", token_factory.address);
          tokentx = await token_factory.createCloneToken('0x0000000000000000000000000000000000000000', 0, "GoToken", 6, "GOO", true, multisig.address, token_trustlist.address);
          gttoken = await GTToken.at(tokentx.logs[0].args._cloneToken);
          console.log("GTToken: ", gttoken.address);
          results["gotoken"] = gttoken.address;

          tokentx = await trustlist_factory.createTrustList([], multisig.address);
          bank_trustlist = await TrustList.at(tokentx.logs[0].args.addr);

    token_bank_factory = await ERC20TokenBankFactory.deployed();
    tx = await token_bank_factory.newERC20TokenBank("test bank", gttoken.address, multisig.address, bank_trustlist.address);
    token_bank = await ERC20TokenBank.at(tx.logs[0].args.addr);

    drop_factory = await MerkleDropFactory.deployed();
    tx = await drop_factory.createMerkleDrop("test drop", token_bank.address, '0xc3df1ac6573e22f57ac49f27bb6456153b536699e16a84fe4eddea908cf73d91',
    multisig.address);
    drop = await MerkleDrop.at(tx.logs[0].args.addr);
    results["drop"] = drop.address;

    mint_factory = await OneTimeMintFactory.deployed();
    tx = await mint_factory.createOneTimeMint(gttoken.address, token_bank.address, 300000000);
    mint = await OneTimeMint.at(tx.logs[0].args.addr);
    results["mint"] = mint.address;
  }else if(network.includes("main")){
    multisig_addr = '0xd030fffd702B037235676Af30612577A7CA201A2';
    token_trustlist = '0xF9382f5C532fa1c539458e25A1a4ce2625Ae0d4E';
    token_addr = '0xc06a9758d89289d72e09e412bB51913206A183fE';
    auction_pool_trustlist = '0xef056AB3d654492da1150C77BB4Eb1A37C49c145';
    auction_bank_addr = '0xaCdcAadc2Af41b27034dce1310a17d1a4446684C';
    community_pool_trustlist = '0x350e4328fdEfde9aF74aD4057167eEe1487114a4';
    community_bank_addr = '0x0aC96b5d9d3baBF9CB4F1C088aeDBD7d66C03474';
    exchange_pool_trustlist = '0x71AAe3A1715DAD08cfb66C34ad2e7881dD26b730';
    exchange_bank_addr = '0x16c7aCA0Ff69D86FA9187Bc45cD6A2dF0B9062f8';

    mint_factory = await OneTimeMintFactory.deployed();
    tx = await mint_factory.createOneTimeMint(token_addr, exchange_bank_addr, 18899986000);
    mint = await OneTimeMint.at(tx.logs[0].args.addr);
    console.log("OneTime Mint address: ", mint.address);
    results["onetime_mint"] = mint.address;

    period_factory = await PeriodMintFactory.deployed();
    start_block = 9721200
    period = 184300
    period_share = 2100000000
    tx = await period_factory.createPeriodMint(token_addr, start_block, period, period_share,
    multisig_addr);
    period_mint = await PeriodMint.at(tx.logs[0].args.addr);
    console.log("Period Mint address: ", period_mint.address);
    results["period_mint"] = period_mint.address;

    drop_factory = await MerkleDropFactory.deployed();
    merkle_root = '0x259d712178e95d12baba4c3aebd67acba71360232fa7b703d8847f165977b6b9';
    tx = await drop_factory.createMerkleDrop("Exchange from old RDS",
      exchange_bank_addr, merkle_root,
      multisig_addr);
    drop = await MerkleDrop.at(tx.logs[0].args.addr);
    console.log("MerkleDrop address: ", drop.address)
    results["merkle_drop"] = drop.address;
  }
  require('fs').writeFile ("25_" + network + ".json", JSON.stringify(results), function(err) {
    if (err) throw err;
    console.log('complete');
  });
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
