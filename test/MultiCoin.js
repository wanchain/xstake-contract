'use strict'

const assert = require('assert')
const FakeOracle = artifacts.require('FakeOracle');
const FakeErc20 =  artifacts.require('FakeErc20');
const MultiCoinStakeDelegate =  artifacts.require('MultiCoinStakeDelegate');
const MultiCoinStakeProxy =  artifacts.require('MultiCoinStakeProxy');
const { expectRevert, expectEvent } = require('@openzeppelin/test-helpers');
const config = require("../truffle-config");
const args = require("optimist").argv
const Web4 = require("web3")
const keccak256 = require('keccak256')

const TETH = "0x0000000000000000000000000000000000000000"


const currentGroupIdKey1 = '0x'+keccak256("MULTICOINSTAKE_RESERVED_KEY____1").toString('hex');
const currentGroupIdKey2 = '0x'+keccak256("MULTICOINSTAKE_RESERVED_KEY____2").toString('hex');

contract('access', async (accounts) => {

    let  mc,proxy
    let operator = accounts[96]
    let admin = accounts[98]
    let robot = accounts[97]
    console.log("admin,operator:", admin, operator)
    let token1,token2,token3
    const toBN = web3.utils.toBN


    let operator_role = '0x'+keccak256("MULTICOIN_OPERATOR_ROLE").toString('hex')

    before("init contracts", async() => {
        let multiCoinStakeProxy = await MultiCoinStakeProxy.deployed();
        mc = await MultiCoinStakeDelegate.at(multiCoinStakeProxy.address)
        proxy = await MultiCoinStakeProxy.deployed();
        token1 = await FakeErc20.new("Token1", "TK1")
        token2 = await FakeErc20.new("Token2", "TK2")
        token3 = await FakeErc20.new("Token3", "TK3")
        console.log("aaaa=========================")
    })


    it('init again', async ()=>{
        let ret;
        ret = mc.initialize(accounts[98], operator, mc.address,"ETH",18,{from:operator})
        await expectRevert(ret, "Initializable: contract is already initialized")
    })

    it('operator access', async ()=>{
        let tx
        tx =  mc.revokeRole(operator_role, operator, {from:robot})
        await expectRevert(tx, "account 0x6db0e2f176d80082bc36210e4a4a67ceecd53f05 is missing role 0x0000000000000000000000000000000000000000000000000000000000000000")
        await mc.revokeRole(operator_role, operator, {from:admin})
        tx = mc.addToken(TETH,{from:operator})
        await expectRevert(tx, "not operator");
        await mc.grantRole(operator_role, operator, {from:admin})
        tx = await mc.addToken(TETH,{from:operator})
        expectEvent(tx, 'addTokenEvent', {token: TETH, symbol:"ETH", decimal:toBN(18)})

        tx = mc.setOracle(accounts[91],{from:operator})
        await expectRevert(tx, "not admin");
        tx = await mc.setOracle(accounts[91],{from:admin})
        expectEvent(tx, 'setOracleEvent', {oracle:accounts[91]})
    })

    it('upgrade', async ()=>{
        let ret;
        let proxyAdmin = accounts[99];
        ret =  proxy.upgradeTo(accounts[98],{from:proxyAdmin})
        await expectRevert(ret, "ERC1967: new implementation is not a contract")
        ret =  proxy.upgradeTo(token1.address,{from:admin})
        await expectRevert(ret, "revert")
        ret =  await proxy.upgradeTo(token1.address,{from:proxyAdmin})
        expectEvent(ret, "Upgraded", {implementation: token1.address})
    })
})

contract('token', async (accounts) => {

    let  mc
    let operator = accounts[96]
    let admin = accounts[98]
    let robot = accounts[97]
    console.log("admin,operator:", admin, operator)
    let token1,token2,token3
    const toBN = web3.utils.toBN

    before("init contracts", async() => {
        let multiCoinStakeProxy = await MultiCoinStakeProxy.deployed();
        mc = await MultiCoinStakeDelegate.at(multiCoinStakeProxy.address)
        token1 = await FakeErc20.new("Token1", "TK1")
        token2 = await FakeErc20.new("Token2", "TK2")
        token3 = await FakeErc20.new("Token3", "TK3")
        await token1.mint(operator, web3.utils.toWei("1000"))
        await token2.mint(operator, web3.utils.toWei("1000"))
        await token3.mint(operator, web3.utils.toWei("1000"))

    })


    it('add Token', async ()=>{
        let ret;
        ret = await mc.addToken(TETH,{from:operator})
        expectEvent(ret, 'addTokenEvent', {token: TETH, symbol:"ETH", decimal:toBN(18)})
        ret = mc.addToken(TETH,{from:operator})
        await expectRevert(ret, "Token has existed")

        ret = await mc.addToken(token1.address,{from:operator})
        expectEvent(ret, 'addTokenEvent', {token: token1.address, symbol:await token1.symbol(), decimal: await token1.decimals()})


        ret = mc.addToken(token2.address,{from:accounts[81]})
        await expectRevert(ret, "not operator")

        ret = mc.addToken("0x1122222222222222222222222222222222222222",{from:operator})
        await expectRevert(ret, "revert")

        ret = await mc.addToken(token2.address,{from:operator})
        expectEvent(ret, 'addTokenEvent', {token: token2.address, symbol:await token2.symbol(), decimal:await token2.decimals()})

        
    })

    it('disabl Token', async ()=>{
        let ret;
        ret = mc.disableToken(TETH,{from:accounts[81]})
        await expectRevert(ret, "not operator")
        ret = mc.disableToken(token1.address,{from:accounts[81]})
        await expectRevert(ret, "not operator")

        ret = await mc.disableToken(TETH,{from:operator})
        expectEvent(ret, 'disableTokenEvent', {token: TETH, symbol:"ETH", decimal:toBN(18)})


        ret = await mc.disableToken(token1.address,{from:operator})
        expectEvent(ret, 'disableTokenEvent', {token: token1.address, symbol:await token1.symbol(), decimal: await token1.decimals()})
        ret = await mc.enableToken(token1.address,{from:operator})
        expectEvent(ret, 'enableTokenEvent', {token: token1.address, symbol:await token1.symbol(), decimal: await token1.decimals()})
        ret = await mc.enableToken(token1.address,{from:operator})
        expectEvent(ret, 'enableTokenEvent', {token: token1.address, symbol:await token1.symbol(), decimal: await token1.decimals()}) // allow enable again.

        ret = mc.disableToken(token3.address,{from:operator})
        await expectRevert(ret, "Token doesn't exist")



        ret = await mc.disableToken(token2.address,{from:operator})
        expectEvent(ret, 'disableTokenEvent', {token: token2.address, symbol:await token2.symbol(), decimal: await token2.decimals()})

        ret =  mc.disableToken("0x1122222222222222222222222222222222222222",{from:operator})
        await expectRevert(ret, "Token doesn't exist")
        ret = mc.enableToken("0x1122222222222222222222222222222222222222",{from:operator})
        await expectRevert(ret, "Token doesn't exist")
       
    })



})


contract('Token list', async (accounts) => {

    let  mc
    let operator = accounts[96]
    let admin = accounts[98]
    let robot = accounts[97]
    let token1,token2,token3


    before("init contracts", async() => {
        let multiCoinStakeProxy = await MultiCoinStakeProxy.deployed();
        mc = await MultiCoinStakeDelegate.at(multiCoinStakeProxy.address)
        token1 = await FakeErc20.new("Token1", "TK1")
        token2 = await FakeErc20.new("Token2", "TK2")
        token3 = await FakeErc20.new("Token3", "TK3")
        await token1.mint(admin, web3.utils.toWei("1000"))
        await token2.mint(admin, web3.utils.toWei("1000"))
        await token3.mint(admin, web3.utils.toWei("1000"))

    })
    it('list Token', async ()=>{
        let ret, ret2;
        ret = await mc.getTokenCount();
        assert.equal(0, ret, "token count is wrong")

        await mc.addToken(TETH,{from:operator})
        ret = await mc.getTokenCount();
        console.log("ret:", ret)
        assert.equal(1, ret, "token count is wrong")
        
        await mc.addToken(token1.address,{from:operator})
        ret = await mc.getTokenCount();
        assert.equal(2, ret, "token count is wrong")

        await mc.addToken(token2.address,{from:operator})
        ret = await mc.getTokenCount();
        assert.equal(3, ret, "token count is wrong")

        ret = await mc.getTokenAddressByIndex(0)
        assert.equal(ret, TETH, "token wrong")
        ret2 = await mc.tokens(ret)
        console.log("ret2:",ret2)
        assert.equal(ret2.tokenAddr, TETH,"token wrong")
        assert.equal(ret2.enabled, true,"token wrong")

        ret = await mc.getTokenAddressByIndex(1)
        assert.equal(ret, token1.address, "token wrong")
        ret2 = await mc.tokens(ret)
        assert.equal(ret2.tokenAddr, token1.address,"token wrong")
        assert.equal(ret2.enabled, true,"token wrong")

        ret = await mc.getTokenAddressByIndex(2)
        assert.equal(ret, token2.address, "token wrong")
        ret2 = await mc.tokens(ret)
        assert.equal(ret2.tokenAddr, token2.address,"token wrong")
        assert.equal(ret2.enabled, true,"token wrong")


        // not existed.
        ret =  mc.getTokenAddressByIndex(3)
        await expectRevert(ret, 'revert')
        ret =  mc.getTokenAddressByIndex(30)
        await expectRevert(ret, 'revert')

        await mc.disableToken(TETH,{from:operator})
        ret = await mc.getTokenCount();
        assert.equal(3, ret, "token count is wrong")
        ret = await mc.getTokenAddressByIndex(0)
        assert.equal(ret, TETH, "token wrong")
        ret2 = await mc.tokens(ret)
        assert.equal(ret2.tokenAddr, TETH,"token wrong")
        assert.equal(ret2.enabled, false,"token wrong")
        
        await mc.disableToken(token1.address,{from:operator})
        ret = await mc.getTokenCount();
        assert.equal(3, ret, "token count is wrong")
        ret = await mc.getTokenAddressByIndex(1)
        assert.equal(ret, token1.address, "token wrong")
        ret2 = await mc.tokens(ret)
        assert.equal(ret2.tokenAddr, token1.address,"token wrong")
        assert.equal(ret2.enabled, false,"token wrong")

        await mc.disableToken(token2.address,{from:operator})
        ret = await mc.getTokenCount();
        assert.equal(3, ret, "token count is wrong")
        ret = await mc.getTokenAddressByIndex(2)
        assert.equal(ret, token2.address, "token wrong")
        ret2 = await mc.tokens(ret)
        assert.equal(ret2.tokenAddr, token2.address,"token wrong")
        assert.equal(ret2.enabled, false,"token wrong")


    })
})


async function checkInfo(mc, info){
    let tokenCount = info.length
    let tokenCountA = await mc.getTokenCount();
    assert.equal(tokenCount, tokenCountA, "tokenCount is wrong")

    for(let i=0; i<tokenCount; i++) {
        let stakeCount = info[i].stakers.length
        let stakeCountB = await mc.getStakerCountByToken(info[i].tokenAddr)
        assert.equal(stakeCountB, stakeCount, "stakeCount is wrong")

        for(let k=0; k<stakeCount; k++){
            let stakerFrom = await mc.getStakeAddrByIndex(info[i].tokenAddr,k)
            console.log("info:", i, k)
            assert.equal(stakerFrom, info[i].stakers[k].from,"staker from is wrong")
            let staker = await mc.stakers(info[i].tokenAddr,stakerFrom)
            assert.equal(staker.amount, info[i].stakers[k].amount, "amount is wrong")
            assert.equal(staker.quited, info[i].stakers[k].quited, "quited is wrong")
            assert.equal(staker.quitGroupId, info[i].stakers[k].quitGroupId, "quitGroupId is wrong")
        }
    }
}


contract('staker', async (accounts) => {

    let  mc,oracle
    let operator = accounts[96]
    let admin = accounts[98]
    let robot = accounts[97]
    let token1,token2,token3
    //let web3 = new Web3()
    const toBN = web3.utils.toBN
    let now = parseInt(Date.now()/1000)

    before("init contracts", async() => {
        let multiCoinStakeProxy = await MultiCoinStakeProxy.deployed();
        mc = await MultiCoinStakeDelegate.at(multiCoinStakeProxy.address)
        oracle = await FakeOracle.deployed()
        
        token1 = await FakeErc20.new("Token1", "TK1")
        token2 = await FakeErc20.new("Token2", "TK2")
        token3 = await FakeErc20.new("Token3", "TK3")
        await token1.mint(operator, web3.utils.toWei("100000"))
        await token2.mint(operator, web3.utils.toWei("100000"))
        await token3.mint(operator, web3.utils.toWei("100000"))
        await token1.mint(admin, web3.utils.toWei("100000"))
        await token2.mint(admin, web3.utils.toWei("100000"))
        await token3.mint(admin, web3.utils.toWei("100000"))
        await mc.addToken(TETH,{from:operator})
        await mc.addToken(token1.address,{from:operator})
        await mc.addToken(token2.address,{from:operator})
        await mc.disableToken(token1.address,{from:operator})

        await oracle.setStoremanGroupConfig("0x000000000000000000000000000000000000000000000041726965735f303036", 5, 0, 
        [1,2], 
        [0,1],"0x00","0x00",0,0)
        await oracle.setStoremanGroupConfig("0x000000000000000000000000000000000000000000000041726965735f303037", 5, 0, 
        [1,2], 
        [0,1],"0x00","0x00",now+1000,now+3600*24*30)

        await oracle.updatePrice([currentGroupIdKey1, currentGroupIdKey2],["0x000000000000000000000000000000000000000000000041726965735f303037","0x000000000000000000000000000000000000000000000041726965735f303036"])
    })
    it('list staker', async ()=>{
        let tx;


        tx = await mc.stakeIn(TETH, 1000,{from:admin,value:1000});
        expectEvent(tx, "stakeInEvent", {tokenAddr:TETH, from:admin, value:toBN(1000)})
        tx = await mc.stakeIn(TETH, 2000,{from:admin,value:2000});
        expectEvent(tx, "stakeInEvent", {tokenAddr:TETH, from:admin, value:toBN(2000)})

        tx =  await mc.stakeIn(TETH, 0,{from:admin,value:0});
        expectEvent(tx, "stakeInEvent", {tokenAddr:TETH, from:admin, value:toBN(0)}) // allow 0
        tx =  await mc.stakeIn(TETH, 1000,{from:admin,value:0});
        expectEvent(tx, "stakeInEvent", {tokenAddr:TETH, from:admin, value:toBN(0)}) // allow value != msg.value
        

        tx =  mc.stakeIn(token2.address, 1000,{from:operator}); // not approved
        await expectRevert(tx, "revert")

        await token2.approve(mc.address, 2000,{from:operator})

        tx = await mc.stakeIn(token2.address, 0,{from:operator});
        expectEvent(tx, "stakeInEvent", {tokenAddr:token2.address, from:operator, value:toBN(0)}) // allow 0
        tx =  await mc.stakeIn(token2.address, 100,{from:operator, value:200});
        expectEvent(tx, "stakeInEvent", {tokenAddr:token2.address, from:operator, value:toBN(100)}) // allow ETH when stakein token.

        tx = await mc.stakeIn(token2.address, 1000,{from:operator});
        expectEvent(tx, "stakeInEvent", {tokenAddr:token2.address, from:operator, value:toBN(1000)})
        tx = await mc.stakeIn(token2.address, 500,{from:operator});
        expectEvent(tx, "stakeInEvent", {tokenAddr:token2.address, from:operator, value:toBN(500)})

        tx =  mc.stakeIn(token1.address, 3000,{from:operator});
        await expectRevert(tx, "Token doesn't exist or disabled")
        tx =  mc.stakeIn(token3.address, 3000,{from:operator});
        await expectRevert(tx, "Token doesn't exist or disabled")


        tx =  mc.stakeIn(token2.address, 3000,{from:operator});
        await expectRevert(tx, "revert") // 额度不够


        tx = mc.stakeOut(token1.address, {from:operator});
        await expectRevert(tx, "unknown staker")
        tx = mc.stakeOut(token3.address, {from:operator});
        await expectRevert(tx, "Token doesn't exist")

        let g1 = await oracle.getValue(currentGroupIdKey1)
        console.log("g1:",'0x'+g1.toString(16))
        tx = await mc.stakeOut(TETH, {from:admin});
        expectEvent(tx, "stakeOutEvent", {tokenAddr:TETH, from:admin, currentGroupId:"0x000000000000000000000000000000000000000000000041726965735f303036"})


        await oracle.setStoremanGroupConfig("0x000000000000000000000000000000000000000000000041726965735f303037", 5, 0, 
        [1,2], 
        [0,1],"0x00","0x00",now,now+3600*24*30)
        tx = await mc.stakeOut(token2.address, {from:operator});
        expectEvent(tx, "stakeOutEvent", {tokenAddr:token2.address, from:operator, currentGroupId:"0x000000000000000000000000000000000000000000000041726965735f303037"})
        tx =  mc.stakeOut(TETH, {from:admin});
        await expectRevert(tx, "staker quited")
        tx =  mc.stakeOut(token2.address, {from:operator});
        await expectRevert(tx, "staker quited")


        const info = [
            {
                tokenAddr:TETH,
                stakers: [
                    {
                        from:admin,
                        amount: 3000,
                        quited:true,
                        quitGroupId: "0x000000000000000000000000000000000000000000000041726965735f303036",
                    }
                ]
            },
            {
                tokenAddr:token1.address,
                stakers:[],
            },
            {
                tokenAddr:token2.address,
                stakers: [
                    {
                        from:operator,
                        amount: 1600,
                        quited:true,
                        quitGroupId: "0x000000000000000000000000000000000000000000000041726965735f303037",
                    }
                ]
            },
        ];
        await checkInfo(mc,info);



    })
})


contract('stakeClaim', async (accounts) => {

    let  mc,oracle
    let operator = accounts[96]
    let admin = accounts[98]
    let robot = accounts[97]
    let token1,token2,token3, token4
    let web4 = new Web4("http://127.0.0.1:5545")
    const toBN = web3.utils.toBN
    let now = parseInt(Date.now()/1000)
    let mintValue = web3.utils.toWei("100000")
    let balance
    let other = accounts[31]

    before("init contracts", async() => {
        console.log("ttt:",mintValue,  typeof mintValue)

        let multiCoinStakeProxy = await MultiCoinStakeProxy.deployed();
        mc = await MultiCoinStakeDelegate.at(multiCoinStakeProxy.address)
        oracle = await FakeOracle.deployed()
        
        token1 = await FakeErc20.new("Token1", "TK1")
        token2 = await FakeErc20.new("Token2", "TK2")
        token3 = await FakeErc20.new("Token3", "TK3")
        token4 = await FakeErc20.new("Token4", "TK4")
        await token1.mint(admin, mintValue)
        await token2.mint(admin, mintValue)
        await token3.mint(admin, mintValue)

        await token1.mint(operator, mintValue)
        await token2.mint(operator, mintValue)
        await token3.mint(operator, mintValue)

        await token1.mint(other, mintValue)
        await token2.mint(other, mintValue)
        await token3.mint(other, mintValue)

        await mc.addToken(TETH,{from:operator})
        await mc.addToken(token1.address,{from:operator})
        await mc.addToken(token2.address,{from:operator})
        await mc.addToken(token3.address,{from:operator})
        await mc.disableToken(token1.address,{from:operator})

        await oracle.setStoremanGroupConfig("0x000000000000000000000000000000000000000000000041726965735f303036", 5, 0, 
        [1,2], 
        [0,1],"0x00","0x00",0,0)
        await oracle.setStoremanGroupConfig("0x000000000000000000000000000000000000000000000041726965735f303037", 5, 0, 
        [1,2], 
        [0,1],"0x00","0x00",now+1000,now+3600*24*30)

        await oracle.updatePrice([currentGroupIdKey1, currentGroupIdKey2],["0x000000000000000000000000000000000000000000000041726965735f303037","0x000000000000000000000000000000000000000000000041726965735f303036"])

    })
    it('list staker', async ()=>{
        let tx;

        tx = await mc.stakeIn(TETH, 1000,{from:admin,value:1000});
        expectEvent(tx, "stakeInEvent", {tokenAddr:TETH, from:admin, value:toBN(1000)})
        await token2.approve(mc.address, 2000,{from:operator})
        tx = await mc.stakeIn(token2.address, 1000,{from:operator});
        expectEvent(tx, "stakeInEvent", {tokenAddr:token2.address, from:operator, value:toBN(1000)})
        balance = (await token2.balanceOf(operator)).toString(10)
        console.log("balance:", balance)
        assert.equal(balance, toBN(mintValue).sub(toBN(1000)).toString(10))

        await token3.approve(mc.address, 2000,{from:other})
        await mc.stakeIn(TETH, 1000,{from:other,value:1000});
        await mc.stakeIn(token3.address, 1000,{from:other});

        tx = mc.stakeClaim(token4.address,  {from:operator});
        await expectRevert(tx, "Token doesn't exist")

        tx = mc.stakeClaim(token1.address,  {from:accounts[88]});
        await expectRevert(tx, "unknown staker")

        tx = mc.stakeClaim(token2.address,  {from:operator});
        await expectRevert(tx, "staker hasn't quited")


        tx = await mc.stakeOut(token2.address, {from:operator});
        expectEvent(tx, "stakeOutEvent", {tokenAddr:token2.address, from:operator, currentGroupId:"0x000000000000000000000000000000000000000000000041726965735f303036"})

        tx = mc.stakeClaim(token2.address,  {from:operator});
        await expectRevert(tx, "group hasn't dismissed")
        await oracle.setStoremanGroupConfig("0x000000000000000000000000000000000000000000000041726965735f303036", 7, 0, 
        [1,2], 
        [0,1],"0x00","0x00",0,0)
        tx = await mc.stakeClaim(token2.address,  {from:operator});
        expectEvent(tx, "stakeClaimEvent",{tokenAddr:token2.address, from:operator,value:toBN(1000)})

        balance = (await token2.balanceOf(operator)).toString(10)
        console.log("balance:", balance)
        assert.equal(balance, mintValue.toString(10))



        tx = mc.stakeClaim(TETH,  {from:accounts[88]});
        await expectRevert(tx, "unknown staker")

        tx = mc.stakeClaim(TETH,  {from:admin});
        await expectRevert(tx, "staker hasn't quited")

        await oracle.setStoremanGroupConfig("0x000000000000000000000000000000000000000000000041726965735f303036", 5, 0, [1,2], [0,1],"0x00","0x00",0,0)
        tx = await mc.stakeOut(TETH, {from:admin});
        expectEvent(tx, "stakeOutEvent", {tokenAddr:TETH, from:admin, currentGroupId:"0x000000000000000000000000000000000000000000000041726965735f303036"})

        tx = mc.stakeClaim(TETH,  {from:admin});
        await expectRevert(tx, "group hasn't dismissed")
        await oracle.setStoremanGroupConfig("0x000000000000000000000000000000000000000000000041726965735f303036", 7, 0, 
        [1,2], 
        [0,1],"0x00","0x00",0,0)

        let balance1 = toBN(await   web3.eth.getBalance(admin))
        tx = await mc.stakeClaim(TETH,  {from:admin});
        expectEvent(tx, "stakeClaimEvent",{tokenAddr:TETH, from:admin,value:toBN(1000)})
        console.log("tx:", tx)
        let balance2 = toBN(await   web3.eth.getBalance(admin))
        console.log("balance:", balance1.toString(10), balance2.toString(10))
        console.log("origin tx:", await web4.eth.getTransaction("tx.tx"))
        console.log("tttt:", balance1.add(toBN(1000)).sub(balance2).div(toBN(tx.receipt.gasUsed)).toString(10))
        let gasPrice = toBN(1)
        assert.equal(balance1.add(toBN(1000)).toString(10), balance2.add(toBN(tx.receipt.gasUsed).mul(gasPrice)).toString(10), "eth balance wrong")

        await mc.stakeOut(TETH, {from:other});
        await mc.stakeOut(token3.address, {from:other});
        let balance20 = toBN(await   web3.eth.getBalance(other))
        let balance30 = toBN(await   token3.balanceOf(other))
        await mc.stakeClaim2(TETH, other, {from:operator});
        await mc.stakeClaim2(token3.address, other, {from:operator});
        let balance21 = toBN(await   web3.eth.getBalance(other))
        let balance31 = toBN(await   token3.balanceOf(other))
        assert.equal(balance20.add(toBN(1000)).toString(10), balance21.toString(10))
        assert.equal(balance30.add(toBN(1000)).toString(10), balance31.toString(10))
    })
})




contract('getDepositAll', async (accounts) => {

    let  mc,oracle
    let operator = accounts[96]
    let admin = accounts[98]
    let robot = accounts[97]
    let token1,token2,token3
    let web4 = new Web4("http://127.0.0.1:5545")
    const toBN = web3.utils.toBN
    let now = parseInt(Date.now()/1000)
    let mintValue = web3.utils.toWei("100000")
    let balance
    before("init contracts", async() => {
        console.log("ttt:",mintValue,  typeof mintValue)

        let multiCoinStakeProxy = await MultiCoinStakeProxy.deployed();
        mc = await MultiCoinStakeDelegate.at(multiCoinStakeProxy.address)
        oracle = await FakeOracle.deployed()
        
        token1 = await FakeErc20.new("Token1", "TK1")
        token2 = await FakeErc20.new("Token2", "TK2")
        token3 = await FakeErc20.new("Token3", "TK3")
        await token1.mint(admin, mintValue)
        await token2.mint(admin, mintValue)
        await token3.mint(admin, mintValue)
        await token1.mint(operator, mintValue)
        await token2.mint(operator, mintValue)
        await token3.mint(operator, mintValue)

        await token1.mint(accounts[21], mintValue)
        await token2.mint(accounts[21], mintValue)
        await token3.mint(accounts[21], mintValue)
        await token1.mint(accounts[22], mintValue)
        await token2.mint(accounts[22], mintValue)
        await token3.mint(accounts[22], mintValue)

        await mc.addToken(TETH,{from:operator})
        await mc.addToken(token1.address,{from:operator})
        await mc.addToken(token2.address,{from:operator})
        await mc.addToken(token3.address,{from:operator})

        await oracle.setStoremanGroupConfig("0x000000000000000000000000000000000000000000000041726965735f303036", 5, 0, 
        [1,2], 
        [0,1],"0x00","0x00",0,0)
        await oracle.setStoremanGroupConfig("0x000000000000000000000000000000000000000000000041726965735f303037", 5, 0, 
        [1,2], 
        [0,1],"0x00","0x00",now+1000,now+3600*24*30)
        await oracle.updatePrice([currentGroupIdKey1, currentGroupIdKey2],["0x000000000000000000000000000000000000000000000041726965735f303037","0x000000000000000000000000000000000000000000000041726965735f303036"])


    })
    it('list staker', async ()=>{
        let tx;

        tx = await mc.stakeIn(TETH, 1000,{from:admin,value:1000});
        expectEvent(tx, "stakeInEvent", {tokenAddr:TETH, from:admin, value:toBN(1000)})
        await token2.approve(mc.address, 2000,{from:operator});
        tx = await mc.stakeIn(token2.address, 1000,{from:operator});
        expectEvent(tx, "stakeInEvent", {tokenAddr:token2.address, from:operator, value:toBN(1000)})
        balance = (await token2.balanceOf(operator)).toString(10)
        console.log("balance:", balance)
        assert.equal(balance, toBN(mintValue).sub(toBN(1000)).toString(10))
        await token1.approve(mc.address, 2000,{from:operator});
        await mc.stakeIn(token1.address, 1600,{from:operator});
        await token3.approve(mc.address, 2000,{from:accounts[21]})
        await mc.stakeIn(token3.address, 1600,{from:accounts[21]});
        await token3.approve(mc.address, 2000,{from:accounts[22]})
        await mc.stakeIn(token3.address, 1800,{from:accounts[22]});

        tx = await mc.stakeOut(token2.address, {from:operator});
        expectEvent(tx, "stakeOutEvent", {tokenAddr:token2.address, from:operator, currentGroupId:"0x000000000000000000000000000000000000000000000041726965735f303036"})

        tx = mc.stakeClaim(token2.address, {from:operator});
        await expectRevert(tx, "group hasn't dismissed")
        await oracle.setStoremanGroupConfig("0x000000000000000000000000000000000000000000000041726965735f303036", 7, 0, 
        [1,2], 
        [0,1],"0x00","0x00",0,0)
        tx = await mc.stakeClaim(token2.address, {from:operator});
        expectEvent(tx, "stakeClaimEvent",{tokenAddr:token2.address, from:operator,value:toBN(1000)})

        balance = (await token2.balanceOf(operator)).toString(10)
        console.log("balance:", balance)
        assert.equal(balance, mintValue.toString(10))



        
        await mc.disableToken(token1.address,{from:operator})

        let tokenBalances = await mc.getDepositAll();
        
        assert.equal(tokenBalances.tokenAddrs.length, 4)
        assert.equal(tokenBalances.tokenAddrs[0], TETH)
        assert.equal(tokenBalances.tokenAddrs[1], token2.address)
        assert.equal(tokenBalances.tokenAddrs[2], token3.address)
        assert.equal(tokenBalances.tokenAddrs[3], TETH)
        
        assert.equal(tokenBalances.amount.length, 4)
        assert.equal(tokenBalances.amount[0], 1000)
        assert.equal(tokenBalances.amount[1], 0)
        assert.equal(tokenBalances.amount[2], 3400)
        assert.equal(tokenBalances.amount[3], 0)

       

    })
})

