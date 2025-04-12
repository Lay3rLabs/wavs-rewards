// SPDX-License-Identifier: MIT
pragma solidity 0.8.22;

import {Test} from "forge-std/Test.sol";
import {RewardsDistributor} from "contracts/RewardsDistributor.sol";
import {ITypes} from "interfaces/ITypes.sol";
import {IWavsServiceManager} from "@wavs/interfaces/IWavsServiceManager.sol";

contract RewardsDistributorTest is Test {
    RewardsDistributor public rewardsDistributor;

    function setUp() public {
        rewardsDistributor = new RewardsDistributor(
            IWavsServiceManager(address(0))
        );
    }

    function testTrigger() public {
        rewardsDistributor.addTrigger("data1");

        ITypes.TriggerId triggerId = ITypes.TriggerId.wrap(1);
        ITypes.TriggerInfo memory trigger = rewardsDistributor.getTrigger(
            triggerId
        );

        assertEq(trigger.creator, address(this));
        assertEq(trigger.data, "data1");
        assertEq(
            ITypes.TriggerId.unwrap(trigger.triggerId),
            ITypes.TriggerId.unwrap(triggerId)
        );
    }
}
