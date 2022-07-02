const { network, ethers, deployments, getNamedAccounts } = require('hardhat')
const { developmentChains } = require('../../helper-hardhat-config')
const { assert } = require('chai')

!developmentChains.includes(network.name)
  ? describe.skip
  : describe('Mintibble Unit Tests', function () {
      let deployer, mintibble

      beforeEach(async function () {
        deployer = (await getNamedAccounts()).deployer
        await deployments.fixture(['all'])
        mintibble = await ethers.getContract('Mintibble', deployer)
      })

      describe('mintDrawing', function () {
        it('Increments the token id', async function () {})
      })
    })
