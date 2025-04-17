// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {ERC20} from "@openzeppelin-contracts/token/ERC20/ERC20.sol";

contract RewardERC20 is ERC20 {
    address public minter = msg.sender;

    constructor() ERC20("RewardERC20", "RE20") {}

    function mint(address to, uint256 amount) external {
        require(msg.sender == minter, "Only minter can mint");
        _mint(to, amount);
    }

    function setMinter(address newMinter) external {
        require(msg.sender == minter, "Only minter can set new minter");
        minter = newMinter;
    }
}
