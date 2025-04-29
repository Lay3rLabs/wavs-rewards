// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {stdJson} from "forge-std/StdJson.sol";
import {console} from "forge-std/console.sol";

import {Common} from "script/Common.s.sol";

import {RewardDistributor} from "contracts/RewardDistributor.sol";
import {RewardSourceERC721} from "contracts/RewardSourceERC721.sol";
import {RewardERC20} from "contracts/RewardERC20.sol";
import {ITypes} from "interfaces/ITypes.sol";

/// @dev Script to claim rewards
contract ClaimScript is Common {
    using stdJson for string;

    function run(
        string calldata rewardDistributorAddr,
        string calldata rewardErc20Addr
    ) public {
        address rewardErc20Address = vm.parseAddress(rewardErc20Addr);

        vm.startBroadcast(_privateKey);
        RewardDistributor rewardDistributor = RewardDistributor(
            vm.parseAddress(rewardDistributorAddr)
        );

        ITypes.TriggerId triggerId = rewardDistributor.nextTriggerId();
        console.log(
            "Fetching data for TriggerId",
            ITypes.TriggerId.unwrap(triggerId)
        );

        bytes memory data = rewardDistributor.getData(triggerId);

        ITypes.AvsOutput memory avsOutput = abi.decode(
            data,
            (ITypes.AvsOutput)
        );

        bytes32 root = rewardDistributor.root();
        bytes32 ipfsHash = rewardDistributor.ipfsHash();

        if (root == avsOutput.root && ipfsHash == avsOutput.ipfsHashData) {
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
            console.log(avsOutput.ipfsHash);
            console.log("--------------------------------");
            console.log("");
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
            console.log("avsOutput.ipfsHashData:");
            console.logBytes32(avsOutput.ipfsHashData);
            console.log("");
            console.log("avsOutput.ipfsHash:");
            console.log(avsOutput.ipfsHash);
            console.log("");
            console.log("--------------------------------");
            console.log("");
        }

        // access IPFS_GATEWAY_URL from env
        string memory ipfsGatewayUrl = vm.envString("IPFS_GATEWAY_URL");
        string memory url = string.concat(ipfsGatewayUrl, avsOutput.ipfsHash);

        console.log("Merkle data URL: ", url);
        console.log("Claiming rewards...");

        // Query for the merkle entry
        string memory entry = runCmd(
            string.concat("curl -s ", url, " | jq -c .tree[0]")
        );

        // Extract the claimable amount and proof
        uint256 claimable = vm.parseJsonUint(entry, ".claimable");
        bytes32[] memory proof = vm.parseJsonBytes32Array(entry, ".proof");

        console.log("Claimable:", claimable);

        // Claim rewards with proof
        address claimer = vm.addr(_privateKey);
        RewardERC20 rewardErc20 = RewardERC20(rewardErc20Address);
        uint256 balanceBefore = rewardErc20.balanceOf(claimer);
        uint256 claimed = rewardDistributor.claim(
            claimer,
            rewardErc20Address,
            claimable,
            proof
        );
        uint256 balanceAfter = rewardErc20.balanceOf(claimer);

        console.log("Balance before:", balanceBefore);
        console.log("Balance after:", balanceAfter);
        console.log("Claimed:", claimed);

        vm.stopBroadcast();
    }

    // Run a command and return the output by creating a temporary script with
    // the entire command and running it via bash. This gets around the limits
    // of FFI, such as not being able to pipe between two commands.
    function runCmd(string memory cmd) internal returns (string memory) {
        string memory script = string.concat(vm.projectRoot(), "/.ffirun.sh");
        // Save the cmd to a file
        vm.writeFile(script, cmd);
        // Run the cmd
        string[] memory exec = new string[](2);
        exec[0] = "bash";
        exec[1] = script;
        string memory result = string(vm.ffi(exec));
        // Delete the file
        vm.removeFile(script);
        // Return the result
        return result;
    }
}
