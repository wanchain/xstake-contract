// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "./RecordAirDropStorage.sol";

contract RecordAirDropDelegate is Initializable, AccessControl, RecordAirDropStorage {
    using SafeMath for uint;

    bytes32 public constant ROBOT_ROLE = keccak256("ROBOT_ROLE");

    uint public constant MAX_ONCE = 200;

    event RecordAirDrop(uint indexed timestamp, uint indexed snapshot, address[] tokenAddress, uint[] totalStaked, uint[] totalIncentive);

    event AirDrop(address indexed user, uint indexed amount);

    function initialize(address admin, address robot) public payable initializer {
        _setupRole(DEFAULT_ADMIN_ROLE, admin);
        _setupRole(ROBOT_ROLE, robot);
    }

    receive() external payable {}

    function withdraw() external onlyRole(DEFAULT_ADMIN_ROLE) {
        payable(msg.sender).transfer(address(this).balance);
    }

    function updateIncentive(uint timestamp, uint snapshot, address[] memory tokenAddress, uint[] memory totalStaked, uint[] memory totalIncentive) external onlyRole(ROBOT_ROLE) {
        require(tokenAddress.length == totalStaked.length, "tokenAddress totalStaked length not same");
        emit RecordAirDrop(timestamp, snapshot, tokenAddress, totalStaked, totalIncentive);
    }

    function airDrop(address payable[] memory users, uint[] memory amounts, address _depositToken) external onlyRole(ROBOT_ROLE) {
        require(hasRole(ROBOT_ROLE, msg.sender));
        require(users.length <= MAX_ONCE, "too many addresses");
        require(users.length == amounts.length, "user amount length not same");
        uint length = users.length;
        for (uint i=0; i<length; i++) {
            require(address(this).balance >= amounts[i], "Balance not enough");
            users[i].transfer(amounts[i]);
            userReward[_depositToken][users[i]] = userReward[_depositToken][users[i]].add(amounts[i]);
            emit AirDrop(users[i], amounts[i]);
        }
    }

    function setDailyIncentive(address tokenKey, uint amount) external onlyRole(ROBOT_ROLE) {
        dailyIncentive[tokenKey] = amount;
    }
}

