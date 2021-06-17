const CommonProxy = artifacts.require('CommonProxy');
const RecordAirDropDelegate = artifacts.require('RecordAirDropDelegate');
const { web3 } = require('@openzeppelin/test-helpers/src/setup');

const assert = require('assert');

contract("RecordAirDropDelegate", accounts => {
  beforeEach(async ()=>{

  });

  it("should success when initialize", async () => {
    delegate = await RecordAirDropDelegate.new();
    delegate.initialize(accounts[0], accounts[5]);

    try {
      await delegate.initialize(accounts[0], accounts[5]);
      assert.fail('never go here');
    } catch (e) {
      assert.ok(e.message.match(/revert/));
    }
  });

  it("should success when updateIncentive", async () => {
    delegate = await RecordAirDropDelegate.new();
    delegate.initialize(accounts[0], accounts[5]);

    await delegate.updateIncentive(1, 1, [accounts[0]], [100], [200], {from: accounts[5]});

    try {
      await delegate.updateIncentive(1, 1, [accounts[0]], [100], [200], {from: accounts[0]});
      assert.fail('never go here');
    } catch (e) {
      assert.ok(e.message.match(/revert/));
    }
  });

  it("should success when deposit", async () => {
    delegate = await RecordAirDropDelegate.new();
    delegate.initialize(accounts[0], accounts[5]);

    await web3.eth.sendTransaction({from: accounts[0], to: delegate.address, value: 100});

    let balance = await web3.eth.getBalance(delegate.address);
    assert.strictEqual(balance.toString(), '100');
  });

  it("should success when withdraw", async () => {
    delegate = await RecordAirDropDelegate.new();
    delegate.initialize(accounts[0], accounts[5]);

    await web3.eth.sendTransaction({from: accounts[0], to: delegate.address, value: 100});
    await delegate.withdraw({from: accounts[0]});

    let balance = await web3.eth.getBalance(delegate.address);
    assert.strictEqual(balance.toString(), '0');

    try {
      await delegate.withdraw({from: accounts[2]});
      assert.fail('never go here');
    } catch (e) {
      assert.ok(e.message.match(/revert/));
    }
  });

  it("should success when withdraw", async () => {
    delegate = await RecordAirDropDelegate.new();
    delegate.initialize(accounts[0], accounts[5]);

    await web3.eth.sendTransaction({from: accounts[0], to: delegate.address, value: 10000});
    let balance = await web3.eth.getBalance(delegate.address);
    assert.strictEqual(balance.toString(), '10000');
    await delegate.airDrop([accounts[6], accounts[7]], [5000, 5000], {from: accounts[5]});
    balance = await web3.eth.getBalance(delegate.address);
    assert.strictEqual(balance.toString(), '0');

    try {
    await delegate.airDrop([accounts[6], accounts[7]], [5000, 5000], {from: accounts[3]});
      assert.fail('never go here');
    } catch (e) {
      assert.ok(e.message.match(/revert/));
    }
  });

});

