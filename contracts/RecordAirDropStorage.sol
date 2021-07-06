// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract RecordAirDropStorage {
    using SafeMath for uint256;

    // user reward:  token => user address => total reward
    mapping(address => mapping(address => uint)) public userReward;
}
