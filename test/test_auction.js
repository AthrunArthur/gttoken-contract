const ERC20 = artifacts.require("USDT");
const StdERC20 = artifacts.require("StdERC20")
const ERC20TokenBankFactory = artifacts.require("ERC20TokenBankFactory")
const ERC20TokenBank = artifacts.require("ERC20TokenBank")

//const ERC20DepositPool = artifacts.require("ERC20DepositPool")
//const ERC20DepositPoolFactory = artifacts.require("ERC20DepositPoolFactory")
const ERC20AuctionFactory = artifacts.require("ERC20AuctionFactory")
const ERC20Auction = artifacts.require("ERC20Auction")
const ERC20AuctionOpProxyFactory = artifacts.require("ERC20AuctionOpProxyFactory")
const ERC20AuctionOpProxy = artifacts.require("ERC20AuctionOpProxy")
const ERC20PeriodAuctionFactory = artifacts.require("ERC20PeriodAuctionFactory")
const ERC20PeriodAuction = artifacts.require("ERC20PeriodAuction")

const { BN, constants, expectEvent, expectRevert  } = require('openzeppelin-test-helpers');
const { expect  } = require('chai');

const getBlockNumber = require('./blockNumber')(web3)

const MultiSigFactory = artifacts.require("MultiSigFactory");
const MultiSig = artifacts.require("MultiSig");
const MultiSigTools = artifacts.require("MultiSigTools");
const TrustListFactory = artifacts.require("TrustListFactory");
const TrustList = artifacts.require("TrustList");

contract('ERC20DepositPool', (accounts) =>{

  let multisig_factory = {}
  let multisig = {}
  let trustlist_factory = {}
  let token = {}
  let obj_token = {}
  let bank_factory = {}
  let obj_token_bank = {}

  //let deposit_factory = {}
  //let dpool = {}

  let auction_factory = {}
  let auction = {}
  let auction_height = {}

  let period_auction_factory = {}
  let period_auction = {}

  let auction_proxy_factory = {}
  let auction_proxy = {}

  let obj_token_bank_trustlist = {}
  //let dpool_trustlist = {}

  let benifit_addr = accounts[8];
  let auction_period = 15
  let each_total_balance = 100000

  context('init', ()=>{
    it('init', async() =>{
      console.log(1);
          multisig_factory = await MultiSigFactory.deployed();
          assert.ok(multisig_factory);
          tokentx = await multisig_factory.createMultiSig(accounts.slice(0, 4));
          multisig = await MultiSig.at(tokentx.logs[0].args.addr);

      console.log(2);
          trustlist_factory = await TrustListFactory.deployed();
          assert.ok(trustlist_factory);

      console.log(3);
          token = await ERC20.deployed();
      obj_token = await StdERC20.deployed();

      console.log(4);
          bank_factory = await ERC20TokenBankFactory.deployed();
          assert.ok(bank_factory);
      console.log(5);
          tokentx = await trustlist_factory.createTrustList([], multisig.address);
          obj_token_bank_trustlist = await TrustList.at(tokentx.logs[0].args.addr);
          tx = await bank_factory.newERC20TokenBank("ERC20 for all", obj_token.address, multisig.address, obj_token_bank_trustlist.address);
          obj_token_bank = await ERC20TokenBank.at(tx.logs[0].args.addr);
      console.log(6);

          //deposit_factory = await ERC20DepositPoolFactory.deployed();
          //assert.ok(deposit_factory);
          //tokentx = await trustlist_factory.createTrustList([], multisig.address);
          //dpool_trustlist = await TrustList.at(tokentx.logs[0].args.addr);
          //tokentx = await deposit_factory.createERC20DepositPool(token.address, dpool_trustlist.address);
          //dpool = await ERC20DepositPool.at(tokentx.logs[0].args.addr);
          //assert.ok(dpool);
      console.log(7);

          //balance  = (await dpool.balanceOf(dpool.address)).toNumber();
          //expect(balance).to.equal(0);

          obj_token.issue(obj_token_bank.address, 1000);
          for(i = 0; i<5; i++){
            await token.issue(accounts[i], each_total_balance);
          }

      console.log(8);
          invoke_id = await multisig.get_unused_invoke_id("add_trusted");
          //await trustlist.add_trusted(invoke_id, accounts[9], {from:accounts[0]});
          //await trustlist.add_trusted(invoke_id, accounts[9], {from:accounts[1]});
          //await trustlist.add_trusted(invoke_id, accounts[9], {from:accounts[2]});

      auction_factory = await ERC20AuctionFactory.deployed();
      period_auction_factory = await ERC20PeriodAuctionFactory.deployed();
      auction_proxy_factory = await ERC20AuctionOpProxyFactory.deployed();

      console.log(9);
      // 1. create period auction
      tokentx = await period_auction_factory.createERC20PeriodAuction(
        10, 10, 2, auction_period, auction_factory.address, multisig.address
      );
      period_auction = await ERC20PeriodAuction.at(tokentx.logs[0].args.addr);
      assert.ok(period_auction);

      console.log(10);
      //2. create auction op proxy
      tokentx = await auction_proxy_factory.createERC20AuctionOpProxy(obj_token_bank.address,
      token.address, benifit_addr, period_auction.address, multisig.address);
      auction_proxy = await ERC20AuctionOpProxy.at(tokentx.logs[0].args.addr);

      console.log(11);
      //3. add auction_proxy to period auction
      invoke_id = await multisig.get_unused_invoke_id("change_auction_proxy");
      await period_auction.change_auction_proxy(invoke_id, auction_proxy.address, {from:accounts[0]});
      await period_auction.change_auction_proxy(invoke_id, auction_proxy.address, {from:accounts[1]});
      const {logs} = await period_auction.change_auction_proxy(invoke_id, auction_proxy.address, {from:accounts[2]});
      console.log("logs: ", logs);

      console.log(12);
      //4. object token bank set trust the proxy
      invoke_id = await multisig.get_unused_invoke_id("add_trusted");
      await obj_token_bank_trustlist.add_trusted(invoke_id, auction_proxy.address, {from:accounts[0]});
      await obj_token_bank_trustlist.add_trusted(invoke_id, auction_proxy.address, {from:accounts[1]});
      await obj_token_bank_trustlist.add_trusted(invoke_id, auction_proxy.address, {from:accounts[2]});

      console.log(13);
      //5. deposit pool set trust the proxy
      //invoke_id = await multisig.get_unused_invoke_id("add_trusted");
      //await dpool_trustlist.add_trusted(invoke_id, auction_proxy.address, {from:accounts[0]});
      //await dpool_trustlist.add_trusted(invoke_id, auction_proxy.address, {from:accounts[1]});
      //await dpool_trustlist.add_trusted(invoke_id, auction_proxy.address, {from:accounts[2]});

    })

    it('empty auction', async() =>{
      tx = await period_auction.new_auction();
      cur = (await web3.eth.getBlock("latest")).number;
      auction = await ERC20Auction.at(tx.logs[0].args.new_auction);

      await expectRevert(period_auction.new_auction(),
      "current auction is not expired");
    i = cur;
    while(i < cur + auction_period){
      //Ganache will increase block number for each transaction
      await token.transfer(accounts[0], 0, {from:accounts[0]});
      i = (await web3.eth.getBlock("latest")).number;
    }
      tx = await period_auction.new_auction();
      auction = await ERC20Auction.at(tx.logs[0].args.new_auction);
      auction_height = (await web3.eth.getBlock("latest")).number;
      console.log("auction_height: ", auction_height)
    })

    it('1 bid with 0', async()=>{
      rt = await auction.auction_info()
      console.log("auction end block: ", rt._end_block.toNumber());
      cur = (await web3.eth.getBlock("latest")).number;
      console.log("current block: ", cur);

      await expectRevert(auction.bid(0, 100, {from:accounts[0]}),
        "should be more than minimum object amount");
    })
    it('1 bid with too much', async()=>{
      await expectRevert(auction.bid(1001, 10, {from:accounts[0]}),
        "not enough object token for bid");
    })

    it('1 bid with normal but low price', async()=>{
      await expectRevert(auction.bid(10, 9, {from:accounts[0]}),
        "should be higher than the reserve price");
    })

    it('1 bid with normal but no deposit', async()=>{
      await expectRevert(auction.bid(10, 10, {from:accounts[0]}),
        "ERC20AuctionOpProxy, transferFrom return false. Please make sure you have enough token and approved them for auction.");
    })

    it('1 bid with normal and deposit', async()=>{
      token.approve(auction_proxy.address, 100, {from:accounts[0]});
      //dpool.deposit(100, {from:accounts[0]});
      auction.bid(10, 10, {from:accounts[0]})

      await expectRevert(auction.auction_expiration(), "not expired yet")

      i = 0
    while(i <= auction_height + auction_period){
      //Ganache will increase block number for each transaction
      await token.transfer(accounts[0], 0, {from:accounts[0]});
      i = (await web3.eth.getBlock("latest")).number;
    }
      rt = await auction.auction_info()
      console.log("auction end block: ", rt._end_block.toNumber());
      cur = (await web3.eth.getBlock("latest")).number;
      console.log("current block: ", cur);

      ret = await auction.is_expired()
      console.log("ret : ", ret);
      expect(ret).to.equal(true);
      await auction.auction_expiration();
      await expectRevert(auction.auction_expiration(), "auction settled already")

      balance  = (await token.balanceOf(accounts[0])).toNumber();
      expect(balance).to.equal(each_total_balance - 50);
      balance  = (await obj_token.balanceOf(accounts[0])).toNumber();
      expect(balance).to.equal(10);
      balance  = (await token.balanceOf(benifit_addr)).toNumber();
      expect(balance).to.equal(50);
      balance  = (await obj_token.balanceOf(obj_token_bank.address)).toNumber();
      expect(balance).to.equal(990);
    })

    it('2 bid with same', async()=>{

      tx = await period_auction.new_auction();
      auction = await ERC20Auction.at(tx.logs[0].args.new_auction);
      auction_height = (await web3.eth.getBlock("latest")).number;
      await auction.bid(10, 10, {from:accounts[0]})

      await token.approve(auction_proxy.address, 200, {from:accounts[1]})
      //await dpool.deposit(200, {from:accounts[1]})
      await expectRevert(auction.bid(10, 10, {from:accounts[1]}),
        "same bid price should come with more amount")
      await auction.bid(11, 11, {from:accounts[1]})
      await expectRevert(auction.bid(11, 12, {from:accounts[1]}),
        "you already got the bid")
    })

    it('3 bid with less', async()=>{
      await token.approve(auction_proxy.address, 200, {from:accounts[2]})
      //await dpool.deposit(200, {from:accounts[2]})
      await expectRevert(auction.bid(10, 10, {from:accounts[2]}),
        "should bid with higher price than current bid")
    })

    it('3 bid with more', async()=>{
      await auction.bid(10, 12, {from:accounts[2]})
    })

    it('auction expire', async() =>{
      i = 0
      while(i <= auction_height + auction_period){
        await token.transfer(accounts[0], 0, {from:accounts[0]});
        i = (await web3.eth.getBlock("latest")).number;
      }
      tx = await period_auction.new_auction();
      auction = await ERC20Auction.at(tx.logs[0].args.new_auction);
      auction_height = (await web3.eth.getBlock("latest")).number;
    })

    it('auction_finish', async() =>{
      balance  = (await token.balanceOf(accounts[2])).toNumber();
      expect(balance).to.equal(each_total_balance - 60);
      balance  = (await obj_token.balanceOf(accounts[2])).toNumber();
      expect(balance).to.equal(10);
      balance  = (await token.balanceOf(benifit_addr)).toNumber();
      expect(balance).to.equal(110);
      balance  = (await obj_token.balanceOf(obj_token_bank.address)).toNumber();
      expect(balance).to.equal(980);
    })

    it('change benifit addr', async() =>{
      invoke_id = await multisig.get_unused_invoke_id("change_benifit_pool");
      await auction_proxy.change_benifit_pool(invoke_id, accounts[7], {from:accounts[0]})
      await auction_proxy.change_benifit_pool(invoke_id, accounts[7], {from:accounts[1]})
      await auction_proxy.change_benifit_pool(invoke_id, accounts[7], {from:accounts[2]})

      await token.approve(auction_proxy.address, 200, {from:accounts[3]})
      await auction.bid(10, 12, {from:accounts[3]})

      a8 = (await token.balanceOf(accounts[8])).toNumber();
      a7 = (await token.balanceOf(accounts[7])).toNumber();

      i = 0
      while(i <= auction_height + auction_period){
        await token.transfer(accounts[0], 0, {from:accounts[0]});
        i = (await web3.eth.getBlock("latest")).number;
      }
      await auction.auction_expiration()

      b8 = (await token.balanceOf(accounts[8])).toNumber();
      b7 = (await token.balanceOf(accounts[7])).toNumber();
      expect(b8).to.equal(a8);
      expect(b7).to.equal(a7 + 60);

    })
    it('pause/unpause', async() =>{
      invoke_id = await multisig.get_unused_invoke_id("pause_auction");
      await period_auction.pause_auction(invoke_id, {from:accounts[0]})
      await period_auction.pause_auction(invoke_id, {from:accounts[1]})
      await period_auction.pause_auction(invoke_id, {from:accounts[2]})

      await expectRevert(period_auction.new_auction({from:accounts[0]}),
        "auction already paused");

      invoke_id = await multisig.get_unused_invoke_id("unpause_auction");
      await period_auction.unpause_auction(invoke_id, {from:accounts[0]})
      await period_auction.unpause_auction(invoke_id, {from:accounts[1]})
      await period_auction.unpause_auction(invoke_id, {from:accounts[2]})

      tx = await period_auction.new_auction();
      auction = await ERC20Auction.at(tx.logs[0].args.new_auction);
      auction_height = (await web3.eth.getBlock("latest")).number;

      i = 0
      while(i <= auction_height + auction_period){
        await token.transfer(accounts[0], 0, {from:accounts[0]});
        i = (await web3.eth.getBlock("latest")).number;
      }
      await auction.auction_expiration()
    })

    it('change min obj amount', async() =>{
      invoke_id = await multisig.get_unused_invoke_id("change_minimum_object_amount");
      await period_auction.change_minimum_object_amount(invoke_id, 20, {from:accounts[0]})
      await period_auction.change_minimum_object_amount(invoke_id, 20, {from:accounts[1]})
      await period_auction.change_minimum_object_amount(invoke_id, 20, {from:accounts[2]})
    })
    it('change min bid price', async() =>{
      invoke_id = await multisig.get_unused_invoke_id("change_min_bid_price");
      await period_auction.change_min_bid_price(invoke_id, 20, {from:accounts[0]})
      await period_auction.change_min_bid_price(invoke_id, 20, {from:accounts[1]})
      await period_auction.change_min_bid_price(invoke_id, 20, {from:accounts[2]})
    })
    it('change obj price unit', async() =>{
      invoke_id = await multisig.get_unused_invoke_id("change_auction_obj_price_unit");
      await period_auction.change_auction_obj_price_unit(invoke_id, 5, {from:accounts[0]})
      await period_auction.change_auction_obj_price_unit(invoke_id, 5, {from:accounts[1]})
      await period_auction.change_auction_obj_price_unit(invoke_id, 5, {from:accounts[2]})
    })

    it('change auction period', async() =>{
      invoke_id = await multisig.get_unused_invoke_id("change_auction_period");
      await period_auction.change_auction_period(invoke_id, 50, {from:accounts[0]})
      await period_auction.change_auction_period(invoke_id, 50, {from:accounts[1]})
      await period_auction.change_auction_period(invoke_id, 50, {from:accounts[2]})
      auction_period = 50;
    })

    it('auction after change', async() =>{
      tx = await period_auction.new_auction();
      auction = await ERC20Auction.at(tx.logs[0].args.new_auction);
      auction_height = (await web3.eth.getBlock("latest")).number;

      await expectRevert(auction.bid(19, 100, {from:accounts[0]}),
        "should be more than minimum object amount");

      await expectRevert(auction.bid(30, 19, {from:accounts[0]}),
        "should be higher than the reserve price");

      await token.approve(auction_proxy.address, 800, {from:accounts[3]})
      await auction.bid(20, 20, {from:accounts[3]})

      a7 = (await token.balanceOf(accounts[7])).toNumber();
      o3 = (await obj_token.balanceOf(accounts[3])).toNumber();

      i = 0
      while(i <= auction_height + auction_period){
        await token.transfer(accounts[0], 0, {from:accounts[0]});
        i = (await web3.eth.getBlock("latest")).number;
      }
      await auction.auction_expiration()

      b7 = (await token.balanceOf(accounts[7])).toNumber();
      bo3 = (await obj_token.balanceOf(accounts[3])).toNumber();
      expect(b7).to.equal(a7 + 80);
      expect(bo3).to.equal(o3 + 20);
    })
  })
})
