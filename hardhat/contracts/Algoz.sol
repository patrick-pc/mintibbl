// SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract Algoz {
    using ECDSA for bytes32;
    using ECDSA for bytes;

    mapping(bytes32 => bool) public consumedToken;
    address public tokenVerifier;
    bool public verifyEnabled;
    uint256 public proofTtl;

    constructor(
        address _tokenVerifier,
        bool _verifyEnabled,
        uint256 _proofTtl
    ) {
        require(_proofTtl > 0, "AlgozInvalidTokenTTL");
        tokenVerifier = _tokenVerifier;
        verifyEnabled = _verifyEnabled; // Should be true if the contract wants to use Algoz
        proofTtl = _proofTtl; // Ideally set this value to 3
    }

    function validateToken(
        bytes32 expiryToken,
        bytes32 authToken,
        bytes calldata signatureToken
    ) public {
        if (!verifyEnabled) return; // Skip verification if verifyEnabled is false
        require(!consumedToken[authToken], "AlgozConsumedTokenError"); // Verify if the token has been used in the past
        require(
            SafeMath.add(uint256(expiryToken), proofTtl) >= block.number,
            "AlgozTokenExpiredError"
        ); // Expire this proof if the current blocknumber > the expiry blocknumber
        require(
            abi.encodePacked(expiryToken, authToken).toEthSignedMessageHash().recover(
                signatureToken
            ) == tokenVerifier,
            "AlgozSignatureError"
        ); // Verify if the token has been used in the past
        consumedToken[authToken] = true;
    }
}
