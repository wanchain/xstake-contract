

//const QuotaLib = artifacts.require('QuotaLib');
const FakeOracle = artifacts.require('FakeOracle');
const MultiCoinStakeDelegate =  artifacts.require('MultiCoinStakeDelegate');
const MultiCoinStakeProxy =  artifacts.require('MultiCoinStakeProxy');

const config = require("../truffle-config");



module.exports = async function (deployer, network, accounts) {
  let proxyAdmin = accounts[99];
  network = network.split("-")[0];
  global.network = network;
  if (network === 'nodeploy') return;
  if (network === 'localTest') return;

  const operator = config.networks[network].from;

  await deployer.deploy(FakeOracle);
  await deployer.deploy(MultiCoinStakeDelegate);
  let fakeOracle = await FakeOracle.deployed();
  let multiCoinStakeDelegate = await MultiCoinStakeDelegate.deployed();
  await deployer.deploy(MultiCoinStakeProxy, multiCoinStakeDelegate.address, proxyAdmin, '0x');
  let multiCoinStakeProxy = await MultiCoinStakeDelegate.at((await MultiCoinStakeProxy.deployed()).address);
  console.log("fakeOracle address:", fakeOracle.address);
  console.log("multiCoinStakeProxy address:", multiCoinStakeProxy.address);

  await multiCoinStakeProxy.initialize(accounts[98], operator, fakeOracle.address, "ETH",18, {from:operator});
}
