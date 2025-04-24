use crate::{
    bindings::wavs::worker::layer_types::{TriggerData, TriggerDataEthContractEvent},
    solidity,
};
use alloy_sol_types::SolValue;
use anyhow::Result;
use wavs_wasi_chain::decode_event_log_data;

pub fn decode_trigger_event(trigger_data: TriggerData) -> Result<(u64, String, String)> {
    match trigger_data {
        TriggerData::EthContractEvent(TriggerDataEthContractEvent { log, .. }) => {
            let solidity::WavsRewardsTrigger { triggerId, rewardTokenAddr, rewardSourceNftAddr } =
                decode_event_log_data!(log)?;
            Ok((triggerId, rewardTokenAddr.to_string(), rewardSourceNftAddr.to_string()))
        }
        _ => Err(anyhow::anyhow!("Unsupported trigger data type")),
    }
}

pub fn encode_trigger_output(trigger_id: u64, output: solidity::AvsOutput) -> Vec<u8> {
    solidity::DataWithId { triggerId: trigger_id, data: output.abi_encode().to_vec().into() }
        .abi_encode()
}
