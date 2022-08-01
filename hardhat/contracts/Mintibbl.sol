// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

error Mintibbl__TokenUriAlreadyExists();

/// @title Mintibbl
/// @author web3slinger
/// @notice This contract is for minting Mintibbl drawings
contract Mintibbl is ERC721URIStorage {
    uint256 private s_tokenCounter;
    mapping(string => bool) private s_usedTokenURIs;

    event NewDrawing(address indexed sender, uint256 indexed tokenId);

    constructor() ERC721("Mintibbl", "MNTBL") {}

    function mintDrawing(string memory tokenURI) public {
        if (tokenURIExists(tokenURI)) revert Mintibbl__TokenUriAlreadyExists();

        emit NewDrawing(msg.sender, s_tokenCounter);
        _safeMint(msg.sender, s_tokenCounter);
        _setTokenURI(s_tokenCounter, tokenURI);
        s_tokenCounter = s_tokenCounter + 1;
        s_usedTokenURIs[tokenURI] = true;
    }

    function tokenURIExists(string memory tokenURI) public view returns (bool) {
        return s_usedTokenURIs[tokenURI] == true;
    }

    function getTokenCounter() public view returns (uint256) {
        return s_tokenCounter;
    }
}
