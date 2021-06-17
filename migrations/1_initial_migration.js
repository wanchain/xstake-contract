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
  let proxyAdmin = '0xa206e4858849f70c3d684e854e7C126EF7baB32e';
  let admin = '0x83f83439Cc3274714A7dad32898d55D17f7C6611';
  let robot = '0x4Cf0A877E906DEaD748A41aE7DA8c220E4247D9e';
  //--------------------

  await deployer.deploy(RecordAirDropDelegate);

  let recordAirDropDelegate = await RecordAirDropDelegate.deployed();
  await deployer.deploy(CommonProxy, recordAirDropDelegate.address, proxyAdmin, '0x');

  let safari = await RecordAirDropDelegate.at((await CommonProxy.deployed()).address);
  
  await safari.initialize(deployerAddr, robot);

  await safari.grantRole('0x00', admin);

  if (deployerAddr.toLowerCase() !== admin.toLowerCase()) {
    console.log('renounceRole:', deployerAddr);
    await safari.renounceRole('0x00', deployerAddr);
  }

  console.log('record-air-drop:', safari.address);

};
