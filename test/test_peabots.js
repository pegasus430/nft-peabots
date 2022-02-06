const nft = artifacts.require("PeaBots.sol")

const {
  balance,
  BN,
  ether,
  expectRevert,
  expectEvent,
  time
} = require('@openzeppelin/test-helpers');


const BigNumber = web3.utils.BN;

const should = require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bn')(BigNumber))
  .should();

contract("Peabots: Contract Tests", accounts => {
  beforeEach(async function() {
    this.owner = accounts[0];
    let whiteList = [accounts[1], accounts[2]];
    let claimAmounts = [2, 3];
    this.instance = await nft.new(whiteList, claimAmounts, {from: this.owner});
  })
  it('Presale Test', async function() {
    await this.instance.flipSaleState({from: this.owner});

    await this.instance.mint(2, {from: accounts[1], value: ether('0.16')})

    // startingIndexBlock = await this.instance.startingIndexBlock({from: accounts[1]});
    // console.log('startingIndexBlock======================', startingIndexBlock);
    
    let balance = await this.instance.balanceOf(accounts[1]);
    balance.should.be.bignumber.equal(new BN('2'));
    let owner0 = await this.instance.ownerOf(0);
    owner0.should.be.equal(accounts[1])
  })
  it('Mints an NFT', async function() {
    await this.instance.flipSaleState({from: this.owner});
    await this.instance.flipPrivateSaleState({from: this.owner});
    await this.instance.mint(2, {from: accounts[3], value: ether('0.16')})
    let balance = await this.instance.balanceOf(accounts[3]);
    balance.should.be.bignumber.equal(new BN('2'));

    let owner0 = await this.instance.ownerOf(1);
    owner0.should.be.equal(accounts[3])
  })
  it('Rejects a purchase under of insufficient value', async function() {
    await this.instance.flipSaleState({from: this.owner});
    await this.instance.flipPrivateSaleState({from: this.owner});
    await this.instance.setMintPrice(ether('0.9'), {from: this.owner});
    await this.instance.mint(1, {from: accounts[3], value: ether('0.9')});
  })
  it("Doesn't allow a purchase over the limit", async function() {
    await this.instance.flipPrivateSaleState({from: this.owner});
    await this.instance.flipSaleState({from: this.owner});
    await this.instance.mint(5, {from: accounts[3], value: ether('0.4')})
  })
  
  it('Withdraws balance to the owner', async function() {
    await this.instance.flipSaleState({from: this.owner});
    await this.instance.flipPrivateSaleState({from: this.owner});
    let balance_tracker = await balance.tracker(this.owner)
    await this.instance.mint(2, {from: accounts[3], value: ether('0.16')})
    await this.instance.withdraw({from: this.owner});
    let total = await balance_tracker.deltaWithFees();  // return delta and gasfee  const {delta, fees} = await tracker.deltaWithFees();
    let totalDelta = total.delta.add(total.fees)
    totalDelta.should.be.bignumber.equal(ether('0.16'))
  })
  it('Withdraws partial balance to arbitrary wallet', async function() {
    await this.instance.flipSaleState({from: this.owner});
    await this.instance.flipPrivateSaleState({from: this.owner});
    let balance_tracker = await balance.tracker(accounts[5])
    await this.instance.mint(2, {from: accounts[3], value: ether('0.16')})
    await this.instance.partialWithdraw(ether('0.1'), accounts[5], {from: this.owner});
    let total = await balance_tracker.delta();
    total.should.be.bignumber.equal(ether('0.1'))
  })
  it('Allows Owner to Mint 30', async function() {
    await this.instance.reserve(30, {from: this.owner});
    let balance = await this.instance.balanceOf(this.owner);
    balance.should.be.bignumber.equal(new BN('30'))
  })
  it("Walks through starting index logic", async function() {
    await this.instance.flipSaleState({from: this.owner});
    await this.instance.flipPrivateSaleState({from: this.owner});
    await this.instance.mint(1, {from: accounts[3], value: ether('0.08')})
    //await expectRevert(this.instance.setStartingIndex(), "Starting index block must be set")
    let startingIndexBlock = await this.instance.startingIndexBlock.call();
    console.log(startingIndexBlock.toNumber())

    let last_block = await time.latestBlock()
    startingIndexBlock.should.be.bignumber.equal(last_block)

    await time.increase(time.duration.hours(26));
    await this.instance.mint(2, {from: accounts[3], value: ether('0.16')});


    await this.instance.setStartingIndex();

    let starting_index = await this.instance.startingIndex.call();

    console.log(starting_index.toNumber());
    starting_index.should.be.bignumber.above(new BN('0'))
    starting_index.should.be.bignumber.at.most(new BN('11679'))
  })
  it('checks base uri', async function() {
    await this.instance.flipSaleState({from: this.owner});
    await this.instance.flipPrivateSaleState({from: this.owner});
    await this.instance.mint(5, {from: accounts[3], value: ether('0.4')})
    await this.instance.mint(5, {from: accounts[3], value: ether('0.4')})
    await this.instance.mint(5, {from: accounts[3], value: ether('0.4')})
    await this.instance.mint(5, {from: accounts[3], value: ether('0.4')})
    await this.instance.mint(5, {from: accounts[3], value: ether('0.4')})
    await this.instance.mint(5, {from: accounts[3], value: ether('0.4')})
    await this.instance.mint(5, {from: accounts[3], value: ether('0.4')})
    await this.instance.mint(5, {from: accounts[3], value: ether('0.4')})
    let tokenNum = await this.instance.MAX_ELEMENTS();
    await this.instance.setStartingIndex();
    await this.instance.setBaseURI('ipfs://xxxyyyyzzz/', {from: this.owner});
    for (let i = 0; i < tokenNum; i++) {
      let uri = await this.instance.tokenURI.call(i);
      console.log(uri);
    }
  })
  it('check tokenByIndex', async function() {
    await this.instance.flipSaleState({from: this.owner});
    await this.instance.flipPrivateSaleState({from: this.owner});
    await this.instance.mint(2, {from: accounts[3], value: ether('0.16')})
    let token0 = await this.instance.tokenByIndex.call(0)
    let token1 = await this.instance.tokenByIndex.call(1)

    console.log('token0', token0.toString())
    console.log('token1', token1.toString())
    token0.should.be.bignumber.equal(new BN('0'))
    token1.should.be.bignumber.equal(new BN('1'))
  })
})
