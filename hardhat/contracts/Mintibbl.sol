// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./Algoz.sol";

/// @title Mintibbl
/// @author web3slinger
/// @notice This contract is for minting Mintibbl drawings
contract Mintibbl is ERC721URIStorage, Ownable, Algoz {
    uint256 private s_tokenCounter;

    event NewDrawing(address indexed sender, uint256 indexed tokenId);

    constructor(
        address tokenVerifier,
        bool verifyEnabled,
        uint256 proofTtl
    ) ERC721("Mintibbl", "MNTBL") Algoz(tokenVerifier, verifyEnabled, proofTtl) {}

    /// @dev Using algoz to prevent bots from spamming the contract - https://www.algoz.xyz/
    function mintDrawing(
        string memory tokenURI,
        bytes32 expiryToken,
        bytes32 authToken,
        bytes calldata signatureToken
    ) public {
        validate_token(expiryToken, authToken, signatureToken);

        emit NewDrawing(msg.sender, s_tokenCounter);
        _safeMint(msg.sender, s_tokenCounter);
        _setTokenURI(s_tokenCounter, tokenURI);
        s_tokenCounter = s_tokenCounter + 1;
    }

    function setVerifyEnabled(bool verifyEnabled) public onlyOwner {
        verify_enabled = verifyEnabled;
    }

    function setProofTtl(uint256 proofTtl) public onlyOwner {
        proof_ttl = proofTtl;
    }

    function getTokenCounter() public view returns (uint256) {
        return s_tokenCounter;
    }
}
