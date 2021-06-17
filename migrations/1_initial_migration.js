// const Migrations = artifacts.require("Migrations");
const RecordAirDropDelegate = artifacts.require('RecordAirDropDelegate');
const Proxy = artifacts.require('Proxy');

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
  //--------------------

  await deployer.deploy(RecordAirDropDelegate);

  let recordAirDropDelegate = await RecordAirDropDelegate.deployed();
  await deployer.deploy(Proxy, recordAirDropDelegate.address, proxyAdmin, '0x');

  let safari = await RecordAirDropDelegate.at((await Proxy.deployed()).address);
  
  await safari.initialize(deployerAddr);

  await safari.grantRole('0x00', admin);

  if (deployerAddr.toLowerCase() !== admin.toLowerCase()) {
    console.log('renounceRole:', deployerAddr);
    await safari.renounceRole('0x00', deployerAddr);
  }

  console.log('record-air-drop:', safari.address);

};
