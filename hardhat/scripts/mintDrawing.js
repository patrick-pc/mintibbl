const { ethers } = require('hardhat')

async function mintDrawing() {
  // const mintibbleContract = await ethers.getContractFactory('Mintibble')
  // const mintibble = await mintibbleContract.deploy()
  // await mintibble.deployed()

  const mintibble = await ethers.getContract('Mintibble')
  const txResponse = await mintibble.mintDrawing(
    'https://ipfs.io/ipfs/bafkreibn32onsuzduttaz347xgggdfjoqktafxocjlprsf3a4wfsbvwiym'
  )
  await txResponse.wait(1)
  console.log('Minted NFT #1')
}

mintDrawing()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
