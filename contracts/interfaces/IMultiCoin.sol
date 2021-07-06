// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IMultiCoin {
  function  getDepositAll() external view returns(address[] memory tokenAddrs, uint[] memory amount, uint[] memory decimal, string[] memory symbol);
}