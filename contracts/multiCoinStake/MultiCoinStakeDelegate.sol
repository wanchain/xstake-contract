// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

import "./MultiCoinStakeStorage.sol";

interface IOracle {
  function getValue(bytes32 key) external view returns (uint); 
  function getStoremanGroupStatus(bytes32 id)
    external
    view
    returns(uint8 status, uint startTime, uint endTime);
} 

interface IEERC20 is IERC20 {
  function symbol() external view returns (string memory);
  function decimals() external view returns (uint8);
}

contract MultiCoinStakeDelegate is Initializable, AccessControl, MultiCoinStakeStorage {
  using SafeERC20 for IEERC20;
  using SafeMath for uint;
  using EnumerableSet for EnumerableSet.AddressSet;

  uint constant group_dismissed = 7;
  bytes32 constant currentGroupIdKey1 = keccak256("MULTICOINSTAKE_RESERVED_KEY____1");
  bytes32 constant currentGroupIdKey2 = keccak256("MULTICOINSTAKE_RESERVED_KEY____2");

  event addTokenEvent(address indexed token, string symbol, uint decimal);
  event disableTokenEvent(address indexed token, string symbol, uint decimal);
  event enableTokenEvent(address indexed token, string symbol, uint decimal);
  event stakeInEvent(address indexed tokenAddr, address indexed from, uint indexed value);
  event stakeOutEvent(address indexed tokenAddr, address indexed from, bytes32 indexed currentGroupId);
  event stakeClaimEvent(address indexed tokenAddr, address from, uint indexed value);
  event setOracleEvent(address indexed oracle);

  modifier onlyAdmin() {
    require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "not admin");
    _;
  }
  modifier onlyOperator() {
    require(hasRole(OPERATOR_ROLE, msg.sender), "not operator");
    _;
  }
  function initialize(address _admin, address _operator, address _oracle, string calldata _default_symbol, uint _default_decimal) external initializer {
    _setupRole(DEFAULT_ADMIN_ROLE, _admin);
    _setupRole(OPERATOR_ROLE, _operator);
    oracle = _oracle;
    default_decimal = _default_decimal;
    default_symbol = _default_symbol;
  }
  function  setOracle(address _oracle) external onlyAdmin {
    oracle = _oracle;
    emit setOracleEvent(_oracle);
  }
  function getStoremanGroupStatus (bytes32 id) public view returns (uint8 status) {
    (status,,) = IOracle(oracle).getStoremanGroupStatus(id);
    return status;
  }
  function getCurrentStoremanGroupID() public view returns (bytes32 groupId) {
    uint group1 = IOracle(oracle).getValue(currentGroupIdKey1);
    uint group2 = IOracle(oracle).getValue(currentGroupIdKey2);

    uint startTime;
    (,startTime,) = IOracle(oracle).getStoremanGroupStatus(bytes32(group1));
    if(block.timestamp >= startTime){
      return bytes32(group1);
    } else {
      return bytes32(group2);
    }
  }

  function stakeIn(address tokenAddr, uint _value) external payable {
    uint value;
    Token storage token = tokens[tokenAddr];
    require(token.enabled == true, "Token doesn't exist or disabled");

    if(tokenAddr == address(0)){
      value = msg.value;
    } else {
      value = _value;
      IEERC20(tokenAddr).safeTransferFrom(msg.sender, address(this), value);
    }

    Staker storage s = stakers[tokenAddr][msg.sender];
    if(!stakerSet[tokenAddr].contains(msg.sender)) {
      stakerSet[tokenAddr].add(msg.sender);
    } 
    s.amount = s.amount.add(value);
    emit stakeInEvent(tokenAddr, msg.sender, value);
  } 


  function stakeOut(address tokenAddr) external {
    require(tokenSet.contains(tokenAddr), "Token doesn't exist");
    Staker storage s = stakers[tokenAddr][msg.sender];
    require(s.amount != 0,"unknown staker");
    require(s.quited == false, "staker quited");
    s.quited = true;
    s.quitGroupId = getCurrentStoremanGroupID();
    emit stakeOutEvent(tokenAddr, msg.sender, s.quitGroupId);
  }

  function stakeClaim(address tokenAddr, address stakeAddr) external {
    require(tokenSet.contains(tokenAddr), "Token doesn't exist");
    require(stakerSet[tokenAddr].contains(stakeAddr),"unknown staker");
    Staker storage s = stakers[tokenAddr][stakeAddr];
    require(s.quited == true, "staker hasn't quited");

    // check group status. user can claim only when group is dismissed.
    uint8 status = getStoremanGroupStatus(s.quitGroupId);
    require(status == group_dismissed, "group hasn't dismissed");
    uint amount = s.amount;
    s.amount = 0;

    stakerSet[tokenAddr].remove(stakeAddr);
    delete stakers[tokenAddr][stakeAddr];

    if(tokenAddr == address(0)){
      payable(stakeAddr).transfer(amount);
    } else {
      IEERC20(tokenAddr).safeTransfer(stakeAddr, amount);
    }

    emit stakeClaimEvent(tokenAddr, stakeAddr, amount);
  }

  function getStakerCountByToken(address tokenAddr) external view returns(uint count){
    return stakerSet[tokenAddr].length();
  }
  function getStakeAddrByIndex(address tokenAddr, uint index) external view returns(address from){
    return stakerSet[tokenAddr].at(index);
  }

  function addToken(address tokenAddr) onlyOperator external {
    require(!tokenSet.contains(tokenAddr), "Token has existed");

    Token storage token = tokens[tokenAddr];
    if(tokenAddr == address(0)){
      token.symbol = default_symbol;
      token.decimal = default_decimal;
    } else {
      token.symbol = IEERC20(tokenAddr).symbol();
      token.decimal = IEERC20(tokenAddr).decimals();
    }
    token.tokenAddr = tokenAddr;
    token.enabled = true;
    tokenSet.add(tokenAddr);
    emit addTokenEvent(tokenAddr, token.symbol, token.decimal);
  }
  function disableToken(address tokenAddr) onlyOperator external{
    require(tokenSet.contains(tokenAddr), "Token doesn't exist");
    Token storage token = tokens[tokenAddr];
    token.enabled = false;
    emit disableTokenEvent(tokenAddr, token.symbol, token.decimal);
  }
  function enableToken(address tokenAddr) onlyOperator external{
    require(tokenSet.contains(tokenAddr), "Token doesn't exist");
    Token storage token = tokens[tokenAddr];
    token.enabled = true;
    emit enableTokenEvent(tokenAddr, token.symbol, token.decimal);
  }

  function getTokenCount() external view returns (uint count)  {
    return tokenSet.length();
  }
  function getTokenAddressByIndex(uint index) external view returns(address token)  {
    return tokenSet.at(index);
  }


  function  getDepositAll() external view returns(address[] memory tokenAddrs, uint[] memory amount, uint[] memory decimal, string[] memory symbol) {
    uint tokenCount = tokenSet.length();
    tokenAddrs = new address[](tokenCount);
    amount = new uint[](tokenCount);
    decimal = new uint[](tokenCount);
    symbol = new string[](tokenCount);
    uint k=0;
    for(uint i=0; i<tokenCount; i++) {
      address tokenAddr = tokenSet.at(i);
      Token storage token = tokens[tokenAddr];
      if(!token.enabled) {
        continue;
      }
      tokenAddrs[k] = tokenAddr;
      decimal[k] = token.decimal;
      symbol[k] = token.symbol;
      if(tokenAddr == address(0)){
        amount[k] = address(this).balance;
      }else {
        amount[k] = IEERC20(token.tokenAddr).balanceOf(address(this));
      }
      k++;
    }
  }
}
