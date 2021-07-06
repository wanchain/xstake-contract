// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;


contract FakeOracle {

  struct StoremanGroupConfig {
    uint    deposit;
    uint[2] chain;
    uint[2] curve;
    bytes   gpk1;
    bytes   gpk2;
    uint    startTime;
    uint    endTime;
    uint8   status;
    bool    isDebtClean;
  }

  mapping(bytes32=>StoremanGroupConfig) public mapStoremanGroupConfig;  
  mapping(bytes32 => uint) public mapPrices;

  function setStoremanGroupConfig(
    bytes32 id,
    uint8   status,
    uint    deposit,
    uint[2] memory chain,
    uint[2] memory curve,
    bytes   memory gpk1,
    bytes   memory gpk2,
    uint    startTime,
    uint    endTime
  ) external {
    mapStoremanGroupConfig[id].deposit = deposit;
    mapStoremanGroupConfig[id].status = status;
    mapStoremanGroupConfig[id].chain[0] = chain[0];
    mapStoremanGroupConfig[id].chain[1] = chain[1];
    mapStoremanGroupConfig[id].curve[0] = curve[0];
    mapStoremanGroupConfig[id].curve[1] = curve[1];
    mapStoremanGroupConfig[id].gpk1 = gpk1;
    mapStoremanGroupConfig[id].gpk2 = gpk2;
    mapStoremanGroupConfig[id].startTime = startTime;
    mapStoremanGroupConfig[id].endTime = endTime;    
  }

  function updatePrice(
    bytes32[] calldata keys,
    uint[] calldata prices
  )
    external
  {
    require(keys.length == prices.length, "length not same");

    for (uint256 i = 0; i < keys.length; i++) {
      mapPrices[keys[i]] = prices[i];
    }

  }
  function getValue(bytes32 key) external view returns (uint) {
    return mapPrices[key];
  }
  function getStoremanGroupStatus(bytes32 id)
    public
    view
    returns(uint8 status, uint startTime, uint endTime)
  {
    status = mapStoremanGroupConfig[id].status;
    startTime = mapStoremanGroupConfig[id].startTime;
    endTime = mapStoremanGroupConfig[id].endTime;
  }


}