// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./Algoz.sol";

error Mintibbl__TokenUriAlreadyExists();

/// @title Mintibbl
/// @author web3slinger
/// @notice This contract is for minting Mintibbl drawings
contract Mintibbl is ERC721URIStorage, Ownable, Algoz {
    bool private s_verifyEnabled;
    uint256 private s_proofTtl;
    uint256 private s_tokenCounter;
    mapping(string => bool) private s_usedTokenURIs;

    event NewDrawing(address indexed sender, uint256 indexed tokenId);

    constructor(
        address tokenVerifier,
        bool verifyEnabled,
        uint256 proofTtl
    ) ERC721("Mintibbl", "MNTBL") Algoz(tokenVerifier, verifyEnabled, proofTtl) {
        s_verifyEnabled = verifyEnabled;
        s_proofTtl = proofTtl;
        s_tokenCounter = 0;
    }

    /// @dev Using algoz to prevent bots from spamming the contract - https://www.algoz.xyz/
    function mintDrawing(
        string memory tokenURI,
        bytes32 expiryToken,
        bytes32 authToken,
        bytes calldata signatureToken
    ) public {
        validateToken(expiryToken, authToken, signatureToken);
        if (tokenURIExists(tokenURI)) revert Mintibbl__TokenUriAlreadyExists();

        emit NewDrawing(msg.sender, s_tokenCounter);
        _safeMint(msg.sender, s_tokenCounter);
        _setTokenURI(s_tokenCounter, tokenURI);
        s_tokenCounter = s_tokenCounter + 1;
        s_usedTokenURIs[tokenURI] = true;
    }

    function setVerifyEnabled(bool verifyEnabled) public onlyOwner {
        s_verifyEnabled = verifyEnabled;
    }

    function setProofTtl(uint256 proofTtl) public onlyOwner {
        s_proofTtl = proofTtl;
    }

    function tokenURIExists(string memory tokenURI) public view returns (bool) {
        return s_usedTokenURIs[tokenURI] == true;
    }

    function getTokenCounter() public view returns (uint256) {
        return s_tokenCounter;
    }
}
