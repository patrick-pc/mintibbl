const { network, ethers, deployments, getNamedAccounts } = require('hardhat')
const { developmentChains } = require('../../helper-hardhat-config')
const { assert, expect } = require('chai')

!developmentChains.includes(network.name)
  ? describe.skip
  : describe('Mintibbl Unit Tests', function () {
      let deployer, mintibbl

      beforeEach(async function () {
        deployer = (await getNamedAccounts()).deployer
        await deployments.fixture(['all'])
        mintibbl = await ethers.getContract('Mintibbl', deployer)
      })

      describe('mintDrawing', function () {
        it('Reverts if the tokenURI is duplicate', async function () {
          const txResponse = await mintibbl.mintDrawing(
            'ipfs://bafyreigswfupftg6f2c6ltqmvhbdf2g6ejf3octthrr2hzfoahu5ootpqq/metadata.json'
          )
          await txResponse.wait(1)

          await expect(
            mintibbl.mintDrawing(
              'ipfs://bafyreigswfupftg6f2c6ltqmvhbdf2g6ejf3octthrr2hzfoahu5ootpqq/metadata.json'
            )
          ).to.be.revertedWith('Mintibbl__TokenUriAlreadyExists')
        })
        it('Emits an event', async function () {
          expect(
            mintibbl.mintDrawing(
              'ipfs://bafyreigswfupftg6f2c6ltqmvhbdf2g6ejf3octthrr2hzfoahu5ootpqq/metadata.json'
            )
          ).to.emit('NewDrawing')
        })
        it('Allows users to mint an NFT', async function () {
          const txResponse = await mintibbl.mintDrawing(
            'ipfs://bafyreigswfupftg6f2c6ltqmvhbdf2g6ejf3octthrr2hzfoahu5ootpqq/metadata.json'
          )
          await txResponse.wait(1)
          const tokenCounter = await mintibbl.getTokenCounter()

          assert.equal(tokenCounter.toString(), '1')
        })
      })
    })
