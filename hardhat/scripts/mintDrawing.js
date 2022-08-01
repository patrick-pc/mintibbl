const { ethers } = require('hardhat')

async function mintDrawing() {
  // const mintibblContract = await ethers.getContractFactory('Mintibbl')
  // const mintibbl = await mintibblContract.deploy()
  // await mintibbl.deployed()

  const mintibbl = await ethers.getContract('Mintibbl')
  let txResponse = await mintibbl.mintDrawing(
    'ipfs://bafyreie5yhisuj5zws7qz6gztalf6wxvhlvzhwfhtksbekwzfjhff7iaey/metadata.json'
  )
  await txResponse.wait(1)
  console.log('Minted NFT #1')

  txResponse = await mintibbl.mintDrawing(
    'ipfs://bafyreigswfupftg6f2c6ltqmvhbdf2g6ejf3octthrr2hzfoahu5ootpqq/metadata.json'
  )
  await txResponse.wait(1)
  console.log('Minted NFT #2')

  txResponse = await mintibbl.mintDrawing(
    'ipfs://bafyreigswfupftg6f2c6ltqmvhbdf2g6ejf3octthrr2hzfoahu5ootpqq/metadata.json'
  )
  await txResponse.wait(1)
  console.log('Minted NFT #3')
}

mintDrawing()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
