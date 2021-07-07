// const Migrations = artifacts.require("Migrations");
const RecordAirDropDelegate = artifacts.require('RecordAirDropDelegate');
const CommonProxy = artifacts.require('CommonProxy');

module.exports = async function (deployer) {
  if (deployer.network === 'development' || deployer.network === 'coverage') {
    console.log('no need migration');
    return;
  }

  let deployerAddr = deployer.provider.addresses[0];
  console.log('deployerAddr', deployerAddr);
  //TODO:  CONFIG----------
  let proxyAdmin = deployer.provider.addresses[99];
  let admin = deployer.provider.addresses[98];
  let robot = deployer.provider.addresses[97];
  let operator = deployer.provider.addresses[96];

  await deployer.deploy(RecordAirDropDelegate);

  let recordAirDropDelegate = await RecordAirDropDelegate.deployed();
  await deployer.deploy(CommonProxy, recordAirDropDelegate.address, proxyAdmin, '0x');

  let record = await RecordAirDropDelegate.at((await CommonProxy.deployed()).address);
  
  await record.initialize(deployerAddr, robot);

  await record.grantRole('0x00', admin);

  if (deployerAddr.toLowerCase() !== admin.toLowerCase()) {
    console.log('renounceRole:', deployerAddr);
    await record.renounceRole('0x00', deployerAddr);
  }

  console.log('record-air-drop:', record.address);

};
