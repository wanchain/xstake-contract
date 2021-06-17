// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/proxy/Initializable.sol";
import "./RecordAirDropStorage.sol";

contract RecordAirDropDelegate is Initializable, AccessControl, RecordAirDropStorage {

    event RecordAirDrop(uint indexed epochId);

    function initialize(address admin) public payable initializer {
        _setupRole(DEFAULT_ADMIN_ROLE, admin);
    }

    receive() external payable {}

    function withdraw() external {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender));
        msg.sender.transfer(address(this).balance);
    }

    function send() external {

    }
}

