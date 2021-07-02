// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/proxy/Initializable.sol";
import "./RecordAirDropStorage.sol";

contract RecordAirDropDelegate is Initializable, AccessControl, RecordAirDropStorage {

    bytes32 public constant ROBOT_ROLE = keccak256("ROBOT_ROLE");

    uint public constant MAX_ONCE = 200;

    event RecordAirDrop(uint indexed timestamp, uint indexed snapshot, address[] tokenAddress, uint[] totalStaked, uint[] totalIncentive);

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

    function updateIncentive(uint timestamp, uint snapshot, address[] memory tokenAddress, uint[] memory totalStaked, uint[] memory totalIncentive) external {
        require(hasRole(ROBOT_ROLE, msg.sender));
        emit RecordAirDrop(timestamp, snapshot, tokenAddress, totalStaked, totalIncentive);
    }

    function airDrop(address payable[] memory users, uint[] memory amounts, address _depositToken) external {
        require(hasRole(ROBOT_ROLE, msg.sender));
        require(users.length <= MAX_ONCE, "too many addresses");
        uint length = users.length;
        for (uint i=0; i<length; i++) {
            require(address(this).balance >= amounts[i], "Balance not enough");
            users[i].transfer(amounts[i]);
            userReward[_depositToken][users[i]] = userReward[_depositToken][users[i]].add(amounts[i]);
            emit AirDrop(users[i], amounts[i]);
        }
    }
}

