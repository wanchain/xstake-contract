// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

contract MultiCoinStakeStorage {
  bytes32 public constant OPERATOR_ROLE = keccak256("MULTICOIN_OPERATOR_ROLE");

  struct Staker {
    uint amount;
    bool quited;
    bytes32 quitGroupId; // quited groupID. 
  }
  struct Token {
    address   tokenAddr;
    string    symbol;
    uint      decimal;
    bool      enabled;
  }

  address public oracle;

  string public default_symbol;
  uint public default_decimal;

  EnumerableSet.AddressSet tokenSet;
  mapping(address=>Token) public tokens;  // tokenAddr=>tokenInfo

  mapping(address=>EnumerableSet.AddressSet) stakerSet;       // fromAddr=>addressSet
  mapping(address=>mapping(address=>Staker)) public stakers;  // tokenAddr=>from=>staker

}

