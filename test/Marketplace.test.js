const { assert } = require("chai");
//const { Item } = require("react-bootstrap/lib/Breadcrumb");

const Marketplace = artifacts.require("./Marketplace.sol");

require('chai')
    .use(require('chai-as-promised'))
    .should()

contract('Marketplace', ([ deployer, seller, buyer ]) => {

    let marketplace

    before(async () => {
        marketplace = await Marketplace.deployed()
    })

    describe('deployment', async () => {
        It('deploys successfully', async() => {
            const address = await marketplace.address
            assert.notEqual(address, 0x0)
            assert.notEqual(address, '')
            assert.notEqual(address, null)
            assert.notEqual(address, undefined)
        })

        it('has a name', async () => {
            const name = await marketplace.name()
            assert.equal(name, 'Mastermind Marketplace')
        })
    })

    describe('products', async () => {
        let result, productCount

        before(async() => {
            result = await marketplace.createProduct('Samsung s20', web3.utils.toWei('1', 'Ether'), { from: seller })
            productCount = await marketplace.productCount()
        })

        it('creates products', async() => {

            //SUCCESS
            assert.equal(productCount, 1)
            const event = result.logs[0].args
            assert.equal(event.id.toNumber(), productCount.toNumber(), 'id is correct')
            assert.equal(event.name, 'Samsung', 'is correct')
            assert.equal(event.price, '1000000000000000000', 'is correct')
            assert.equal(event.owner, seller, 'is correct')
            assert.equal(event.purchased, false, 'is correct')
            
            //FAILURE: Product must have a name
            await marketplace.createProduct('', web3.utils.toWei('1', 'Ether'), { from: seller }).should.be.rejected;  
            //FAILURE: Product must have a price
            await marketplace.createProduct('Samsung', 0, { from: seller }).should.be.rejected;  
              
        })
 
        it('lists products', async () => {
            const products = await marketplace.products(productCount)
            assert.equal(products.id.toNumber(), productCount.toNumber(), 'id is correct')
            assert.equal(products.name, 'Samsung', 'is correct')
            assert.equal(products.price, '1000000000000000000', 'is correct')
            assert.equal(products.owner, seller, 'is correct')
            assert.equal(products.purchased, false, 'is correct')
        })
        

        it('Sells products', async () => {

            //Track the seller balance before purchase
            let oldSellerBalance
            oldSellerBalance = await web3.eth.getBalance(seller)
            oldSellerBalance = await web3.utils.BN(oldSellerBalance)

            result = await marketplace.purchaseProduct(productCount, { from: buyer, value: web3.utils.toWei('1', 'Ether') })
            
            //check logs
            const event = result.logs[0].args
            assert.equal(event.id.toNumber(), productCount.toNumber(), 'id is correct')
            assert.equal(event.name, 'Samsung', 'is correct')
            assert.equal(event.price, '1000000000000000000', 'is correct')
            assert.equal(event.owner, buyer, 'is correct')
            assert.equal(event.purchased, true, 'is correct')

            //Check that seller received funds
            let newSellerBalance
            newSellerBalance = await web3.eth.getBalance(seller)
            newSellerBalance = new web3.utils.BN(newSellerBalance)

            let price
            price = web3.utils.toWei('1', 'Ether')
            price = new web3.utils.BN(price)

            const expectedBalance = oldSellerBalance.add(price)

            assert.equal(newSellerBalance.toString(), expectedBalance.toString())

            //failure: tries to buy a product that does not exist, i.e the product does not have a valid id
            result = await marketplace.purchaseProduct(99, { from: buyer, value: web3.utils.toWei('1', 'Ether') }).should.be.rejected
            //failure: buyer tries to buy a product without enough ether
            result = await marketplace.purchaseProduct(productCount, { from: buyer, value: web3.utils.toWei('0.5', 'Ether') }).should.be.rejected
            //failure: deployer tries to buy a product again, i.e product cant be bought twice
            result = await marketplace.purchaseProduct(productCount, { from: deployer, value: web3.utils.toWei('1', 'Ether') }).should.be.rejected
            //failure: buyer tries to buy a product again, i.e buyer cant be the seller
            result = await marketplace.purchaseProduct(productCount, { from: buyer, value: web3.utils.toWei('1', 'Ether') }).should.be.rejected
        })
    })
})

