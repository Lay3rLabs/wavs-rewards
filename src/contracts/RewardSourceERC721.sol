// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {ERC721} from "@openzeppelin-contracts/token/ERC721/ERC721.sol";

contract RewardSourceERC721 is ERC721 {
    address public minter = msg.sender;

    constructor() ERC721("RewardSource", "RSNFT") {}

    function mint(address to, uint256 tokenId) external {
        require(msg.sender == minter, "Only minter can mint");
        _safeMint(to, tokenId);
    }

    function setMinter(address newMinter) external {
        require(msg.sender == minter, "Only minter can set new minter");
        minter = newMinter;
    }
}
