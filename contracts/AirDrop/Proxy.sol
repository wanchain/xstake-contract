// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";

// ZooKeeperProxy is only used for 4 upgradeable contract:
// Boosting, NFT, NFT factory, Marketplace
contract CommonProxy is TransparentUpgradeableProxy {
    constructor(address _logic, address admin_, bytes memory _data) 
        public 
        payable 
        TransparentUpgradeableProxy(_logic, admin_, _data) { }
}
