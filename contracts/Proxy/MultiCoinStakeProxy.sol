// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";

contract MultiCoinStakeProxy is TransparentUpgradeableProxy {
    constructor(address _logic, address admin_,  bytes memory _data) public payable TransparentUpgradeableProxy(_logic, admin_, _data) {}
}
