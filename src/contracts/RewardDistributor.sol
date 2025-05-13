// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {IWavsTrigger} from "interfaces/IWavsTrigger.sol";
import {ITypes} from "interfaces/ITypes.sol";
import {IWavsServiceManager} from "@wavs/interfaces/IWavsServiceManager.sol";
import {IWavsServiceHandler} from "@wavs/interfaces/IWavsServiceHandler.sol";
import {UniversalRewardsDistributor} from "@morpho-org/universal-rewards-distributor/UniversalRewardsDistributor.sol";

contract RewardDistributor is
    IWavsTrigger,
    IWavsServiceHandler,
    UniversalRewardsDistributor
{
    /// @inheritdoc IWavsTrigger
    TriggerId public nextTriggerId;

    /// @inheritdoc IWavsTrigger
    mapping(TriggerId _triggerId => Trigger _trigger) public triggersById;
    /// @notice See IWavsTrigger.triggerIdsByCreator
    mapping(address _creator => TriggerId[] _triggerIds)
        internal _triggerIdsByCreator;

    /// @notice Mapping of valid triggers
    mapping(TriggerId _triggerId => bool _isValid) internal _validTriggers;
    /// @notice Mapping of trigger data
    mapping(TriggerId _triggerId => bytes _data) internal _datas;
    /// @notice Mapping of trigger signatures
    mapping(TriggerId _triggerId => SignatureData _signature)
        internal _signatures;

    /// @notice Service manager instance
    IWavsServiceManager private _serviceManager;

    /// @notice The optional ipfs hash CID containing metadata about the root (e.g. the merkle tree itself).
    string public ipfsHashCid;

    /**
     * @notice Initialize the contract
     * @param serviceManager The service manager instance
     */
    constructor(
        IWavsServiceManager serviceManager
    ) UniversalRewardsDistributor(address(this), 0, bytes32(0), bytes32(0)) {
        _serviceManager = serviceManager;
    }

    /// @inheritdoc IWavsTrigger
    function addTrigger() external {
        // Get the next trigger id
        nextTriggerId = TriggerId.wrap(TriggerId.unwrap(nextTriggerId) + 1);
        TriggerId _triggerId = nextTriggerId;

        // Create the trigger
        Trigger memory _trigger = Trigger({
            creator: msg.sender,
            data: abi.encodePacked(_triggerId)
        });

        // Update storages
        triggersById[_triggerId] = _trigger;
        _triggerIdsByCreator[msg.sender].push(_triggerId);

        emit WavsRewardsTrigger(TriggerId.unwrap(_triggerId));
    }

    /// @inheritdoc IWavsTrigger
    function getTrigger(
        TriggerId triggerId
    ) external view override returns (TriggerInfo memory _triggerInfo) {
        Trigger storage _trigger = triggersById[triggerId];
        _triggerInfo = TriggerInfo({
            triggerId: triggerId,
            creator: _trigger.creator,
            data: _trigger.data
        });
    }

    /// @inheritdoc IWavsTrigger
    function triggerIdsByCreator(
        address _creator
    ) external view returns (TriggerId[] memory _triggerIds) {
        _triggerIds = _triggerIdsByCreator[_creator];
    }

    /// @inheritdoc IWavsServiceHandler
    function handleSignedEnvelope(
        Envelope calldata envelope,
        SignatureData calldata signatureData
    ) external {
        _serviceManager.validate(envelope, signatureData);

        DataWithId memory dataWithId = abi.decode(
            envelope.payload,
            (DataWithId)
        );

        _signatures[dataWithId.triggerId] = signatureData;
        _datas[dataWithId.triggerId] = dataWithId.data;
        _validTriggers[dataWithId.triggerId] = true;

        // Update distributor

        ITypes.AvsOutput memory avsOutput = abi.decode(
            dataWithId.data,
            (ITypes.AvsOutput)
        );

        _setRoot(avsOutput.root, avsOutput.ipfsHashData);
        ipfsHashCid = avsOutput.ipfsHash;
    }

    function isValidTriggerId(
        TriggerId _triggerId
    ) external view returns (bool _isValid) {
        _isValid = _validTriggers[_triggerId];
    }

    function getSignature(
        TriggerId _triggerId
    ) external view returns (SignatureData memory _signature) {
        _signature = _signatures[_triggerId];
    }

    function getData(
        TriggerId _triggerId
    ) external view returns (bytes memory _data) {
        _data = _datas[_triggerId];
    }
}
