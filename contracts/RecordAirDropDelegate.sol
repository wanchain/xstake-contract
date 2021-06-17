// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/proxy/Initializable.sol";
import "./RecordAirDropStorage.sol";

contract RecordAirDropDelegate is Initializable, AccessControl, RecordAirDropStorage {

    bytes32 public constant ROBOT_ROLE = keccak256("ROBOT_ROLE");

    uint public constant MAX_ONCE = 200;

    event RecordAirDrop(uint indexed epochId, uint indexed snapshot, address[] tokenAddress, uint[] totalStaked, uint[] totalIncentive);

    event AirDrop(address indexed user, uint indexed amount);

    function initialize(address admin, address robot) public payable initializer {
        _setupRole(DEFAULT_ADMIN_ROLE, admin);
        _setRoleAdmin(ROBOT_ROLE, DEFAULT_ADMIN_ROLE);
        grantRole(ROBOT_ROLE, robot);
    }

    receive() external payable {}

    function withdraw() external {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender));
        msg.sender.transfer(address(this).balance);
    }

    function updateIncentive(uint epochId, uint snapshot, address[] memory tokenAddress, uint[] memory totalStaked, uint[] memory totalIncentive) external {
        require(hasRole(ROBOT_ROLE, msg.sender));
        emit RecordAirDrop(epochId, snapshot, tokenAddress, totalStaked, totalIncentive);
    }

    function airDrop(address payable[] memory users, uint[] memory amounts) external {
        require(hasRole(ROBOT_ROLE, msg.sender));
        require(users.length <= MAX_ONCE);
        uint length = users.length;
        uint total = 0;
        for (uint i=0; i<length; i++) {
            total = total.add(amounts[i]);
            require(address(this).balance >= total, "Balance not enough");

            users[i].transfer(amounts[i]);
            emit AirDrop(users[i], amounts[i]);
        }
    }
}

