// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

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

        ITypes.AvsOutput memory avsOutput = abi.decode(
            data,
            (ITypes.AvsOutput)
        );

        bytes32 root = rewardsDistributor.root();
        bytes32 ipfsHash = rewardsDistributor.ipfsHash();

        if (root == avsOutput.root && ipfsHash == avsOutput.ipfsHash) {
            console.log(
                "Trigger executed successfully, root and ipfsHash match."
            );
            console.log("");
            console.log("--------------------------------");
            console.log("root:");
            console.logBytes32(root);
            console.log("");
            console.log("ipfsHash:");
            console.logBytes32(ipfsHash);
            console.log("--------------------------------");
        } else {
            console.log("Trigger failed, root or ipfsHash mismatch");
            console.log("");
            console.log("--------------------------------");
            console.log("");
            console.log("contract root:");
            console.logBytes32(root);
            console.log("");
            console.log("contract ipfsHash:");
            console.logBytes32(ipfsHash);
            console.log("");
            console.log("--------------------------------");
            console.log("");
            console.log("avsOutput.root:");
            console.logBytes32(avsOutput.root);
            console.log("");
            console.log("avsOutput.ipfsHash:");
            console.logBytes32(avsOutput.ipfsHash);
            console.log("");
            console.log("--------------------------------");
        }

        vm.stopBroadcast();
    }
}
