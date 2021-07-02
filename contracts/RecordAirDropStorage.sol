// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

import "@openzeppelin/contracts/math/SafeMath.sol";

contract RecordAirDropStorage {
    using SafeMath for uint256;

    // user reward:  token => user address => total reward
    mapping(address => mapping(address => uint)) public userReward;
}
