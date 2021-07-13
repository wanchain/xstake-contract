

//const QuotaLib = artifacts.require('QuotaLib');
const FakeOracle = artifacts.require('FakeOracle');
const MultiCoinStakeDelegate =  artifacts.require('MultiCoinStakeDelegate');
const MultiCoinStakeProxy =  artifacts.require('MultiCoinStakeProxy');

const config = require("../truffle-config");



module.exports = async function (deployer, network, accounts) {
  network = network.split("-")[0];
  global.network = network;
  if (network === 'nodeploy') return;
  if (network === 'localTest') return;


  let deployerAddr = accounts[0];
  console.log('deployerAddr', deployerAddr);
  //TODO:  CONFIG----------
  let proxyAdmin = accounts[99];
  let admin = accounts[98];
  let robot = accounts[97];
  let operator = accounts[96];

  //--------------------


  await deployer.deploy(MultiCoinStakeDelegate);
  let fakeOracle = await FakeOracle.deployed();
  let multiCoinStakeDelegate = await MultiCoinStakeDelegate.deployed();

  let proxy = await MultiCoinStakeProxy.deployed()
  await proxy.upgradeTo(multiCoinStakeDelegate.address, {from:proxyAdmin})
}
