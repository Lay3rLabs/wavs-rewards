// SPDX-License-Identifier: MIT
pragma solidity 0.8.22;

import {RewardsDistributor} from "contracts/RewardsDistributor.sol";
import {ITypes} from "interfaces/ITypes.sol";
import {Common} from "script/Common.s.sol";
import {console} from "forge-std/console.sol";

/// @dev Script to show the result of a trigger
contract ShowResult is Common {
    function run(
        string calldata serviceTriggerAddr,
        string calldata //serviceHandlerAddr
    ) public {
        vm.startBroadcast(_privateKey);
        RewardsDistributor rewardsDistributor = RewardsDistributor(
            vm.parseAddress(serviceTriggerAddr)
        );

        ITypes.TriggerId triggerId = rewardsDistributor.nextTriggerId();
        console.log(
            "Fetching data for TriggerId",
            ITypes.TriggerId.unwrap(triggerId)
        );

        bytes memory data = rewardsDistributor.getData(triggerId);
        console.log("Data:", string(data));

        ITypes.AvsOutput memory avsOutput = abi.decode(
            data,
            (ITypes.AvsOutput)
        );
        console.log("AvsOutput.root:");
        console.logBytes32(avsOutput.root);
        console.log("AvsOutput.ipfsHash:");
        console.logBytes32(avsOutput.ipfsHash);

        bytes32 root = rewardsDistributor.root();
        console.log("Set root:");
        console.logBytes32(root);

        bytes32 ipfsHash = rewardsDistributor.ipfsHash();
        console.log("Set ipfsHash:");
        console.logBytes32(ipfsHash);

        vm.stopBroadcast();
    }
}
