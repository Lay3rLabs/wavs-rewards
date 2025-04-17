// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {ISimpleTrigger} from "interfaces/IWavsTrigger.sol";
import {ISimpleSubmit} from "interfaces/IWavsSubmit.sol";
import {ITypes} from "interfaces/ITypes.sol";
import {IWavsServiceManager} from "@wavs/interfaces/IWavsServiceManager.sol";
import {IWavsServiceHandler} from "@wavs/interfaces/IWavsServiceHandler.sol";
import {UniversalRewardsDistributor} from "@morpho-org/universal-rewards-distributor/UniversalRewardsDistributor.sol";

contract RewardsDistributor is
    ISimpleTrigger,
    ISimpleSubmit,
    IWavsServiceHandler,
    UniversalRewardsDistributor
{
    /// @inheritdoc ISimpleTrigger
    TriggerId public nextTriggerId;

    /// @inheritdoc ISimpleTrigger
    mapping(TriggerId _triggerId => Trigger _trigger) public triggersById;
    /// @notice See ISimpleTrigger.triggerIdsByCreator
    mapping(address _creator => TriggerId[] _triggerIds)
        internal _triggerIdsByCreator;

    /// @notice Mapping of valid triggers
    mapping(TriggerId _triggerId => bool _isValid) internal _validTriggers;
    /// @notice Mapping of trigger data
    mapping(TriggerId _triggerId => bytes _data) internal _datas;
    /// @notice Mapping of trigger signatures
    mapping(TriggerId _triggerId => bytes _signature) internal _signatures;

    /// @notice Service manager instance
    IWavsServiceManager private _serviceManager;

    /**
     * @notice Initialize the contract
     * @param serviceManager The service manager instance
     */
    constructor(
        IWavsServiceManager serviceManager
    ) UniversalRewardsDistributor(address(this), 0, bytes32(0), bytes32(0)) {
        _serviceManager = serviceManager;
    }

    /// @inheritdoc ISimpleTrigger
    function addTrigger(bytes memory _data) external {
        // Get the next trigger id
        nextTriggerId = TriggerId.wrap(TriggerId.unwrap(nextTriggerId) + 1);
        TriggerId _triggerId = nextTriggerId;

        // Create the trigger
        Trigger memory _trigger = Trigger({creator: msg.sender, data: _data});

        // Update storages
        triggersById[_triggerId] = _trigger;
        _triggerIdsByCreator[msg.sender].push(_triggerId);

        TriggerInfo memory _triggerInfo = TriggerInfo({
            triggerId: _triggerId,
            creator: _trigger.creator,
            data: _trigger.data
        });

        emit NewTrigger(abi.encode(_triggerInfo));
    }

    /// @inheritdoc ISimpleTrigger
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

    /// @inheritdoc ISimpleTrigger
    function triggerIdsByCreator(
        address _creator
    ) external view returns (TriggerId[] memory _triggerIds) {
        _triggerIds = _triggerIdsByCreator[_creator];
    }

    /// @inheritdoc IWavsServiceHandler
    function handleSignedData(
        bytes calldata _data,
        bytes calldata _signature
    ) external {
        _serviceManager.validate(_data, _signature);

        DataWithId memory dataWithId = abi.decode(_data, (DataWithId));

        _signatures[dataWithId.triggerId] = _signature;
        _datas[dataWithId.triggerId] = dataWithId.data;
        _validTriggers[dataWithId.triggerId] = true;

        // Update distributor

        ITypes.AvsOutput memory avsOutput = abi.decode(
            dataWithId.data,
            (ITypes.AvsOutput)
        );

        _setRoot(avsOutput.root, avsOutput.ipfsHashData);
    }

    /// @inheritdoc ISimpleSubmit
    function isValidTriggerId(
        TriggerId _triggerId
    ) external view returns (bool _isValid) {
        _isValid = _validTriggers[_triggerId];
    }

    /// @inheritdoc ISimpleSubmit
    function getSignature(
        TriggerId _triggerId
    ) external view returns (bytes memory _signature) {
        _signature = _signatures[_triggerId];
    }

    /// @inheritdoc ISimpleSubmit
    function getData(
        TriggerId _triggerId
    ) external view returns (bytes memory _data) {
        _data = _datas[_triggerId];
    }
}
