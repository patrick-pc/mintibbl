const { network } = require('hardhat')
const { developmentChains, VERIFICATION_BLOCK_CONFIRMATIONS } = require('../helper-hardhat-config')
const { verify } = require('../utils/verify')

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments
  const { deployer } = await getNamedAccounts()
  const waitBlockConfirmations = developmentChains.includes(network.name)
    ? 1
    : VERIFICATION_BLOCK_CONFIRMATIONS

  log('----------------------------------------------------')
  const tokenVerifier = '0xABFdcAf85c08478a791De3B4c92d0f803E83873d'
  const verifyEnabled = true
  const proofTtl = 200
  const args = [tokenVerifier, verifyEnabled, proofTtl]
  const mintibbl = await deploy('Mintibbl', {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: waitBlockConfirmations,
  })

  // Verify the deployment
  if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
    log('Verifying...')
    await verify(mintibbl.address, args)
  }
  log('----------------------------------------------------')
}

module.exports.tags = ['all', 'mintibbl']
