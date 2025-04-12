// SPDX-License-Identifier: MIT
pragma solidity 0.8.22;

import {RewardsDistributor} from "contracts/RewardsDistributor.sol";
import {ITypes} from "interfaces/ITypes.sol";
import {Common} from "script/Common.s.sol";
import {console} from "forge-std/console.sol";

/// @dev Script to add a new trigger
contract Trigger is Common {
    function run(
        string calldata serviceTriggerAddr,
        string calldata inputData
    ) public {
        vm.startBroadcast(_privateKey);
        RewardsDistributor rewardsDistributor = RewardsDistributor(
            vm.parseAddress(serviceTriggerAddr)
        );

        rewardsDistributor.addTrigger(abi.encodePacked(inputData));
        ITypes.TriggerId triggerId = rewardsDistributor.nextTriggerId();
        console.log("TriggerId", ITypes.TriggerId.unwrap(triggerId));
        vm.stopBroadcast();
    }
}
