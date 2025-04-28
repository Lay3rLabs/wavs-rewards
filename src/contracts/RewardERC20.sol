// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {ERC20} from "@openzeppelin-contracts/token/ERC20/ERC20.sol";

contract RewardERC20 is ERC20 {
    constructor() ERC20("RewardERC20", "RE20") {}

    // Let anyone mint tokens.
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
