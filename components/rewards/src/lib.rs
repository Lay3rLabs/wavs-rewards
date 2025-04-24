pub mod bindings;
mod ipfs;
mod merkle;
mod sources;
mod trigger;

use crate::bindings::{export, Guest, TriggerAction};
use crate::sources::SourceRegistry;
use alloy_primitives::{U256, U512};
use merkle::get_merkle_tree;
use merkle_tree_rs::standard::LeafType;
use serde::Serialize;
use serde_json::json;
use trigger::{decode_trigger_event, encode_trigger_output};
use wavs_wasi_chain::ethereum::alloy_primitives::hex;
use wit_bindgen_rt::async_support::futures;
use wstd::runtime::block_on;

struct Component;
export!(Component with_types_in bindings);

impl Guest for Component {
    fn run(action: TriggerAction) -> std::result::Result<Option<Vec<u8>>, String> {
        // let reward_token_address = std::env::var("WAVS_ENV_REWARD_TOKEN_ADDRESS")
        //     .map_err(|e| format!("Failed to get reward token address: {}", e))?;
        // let reward_source_nft_address = std::env::var("WAVS_ENV_REWARD_SOURCE_NFT_ADDRESS")
        //     .map_err(|e| format!("Failed to get NFT address: {}", e))?;
        let ipfs_url = std::env::var("WAVS_ENV_PINATA_API_URL")
            .unwrap_or_else(|_| "https://uploads.pinata.cloud/v3/files".to_string());
        let ipfs_api_key = std::env::var("WAVS_ENV_PINATA_API_KEY")
            .map_err(|e| format!("Failed to get API key: {}", e))?;

        let (trigger_id, reward_token_address, reward_source_nft_address) =
            decode_trigger_event(action.data).map_err(|e| e.to_string())?;

        let mut registry = SourceRegistry::new();
        // Provide 1e18 rewards per NFT held.
        registry.add_source(sources::erc721::Erc721Source::new(
            &reward_source_nft_address,
            U256::from(1e18),
        ));

        block_on(async move {
            let accounts = registry.get_accounts().map_err(|e| e.to_string())?;

            // each value is [address, token, amount]
            let values = accounts
                .into_iter()
                .map(|account| {
                    let registry = &registry;
                    let reward_token_address = reward_token_address.clone();
                    async move {
                        let amount =
                            registry.get_rewards(&account).await.map_err(|e| e.to_string())?;
                        Ok::<Vec<String>, String>(vec![
                            account,
                            reward_token_address,
                            amount.to_string(),
                        ])
                    }
                })
                .collect::<Vec<_>>();

            let results = futures::future::join_all(values)
                .await
                .into_iter()
                .collect::<Result<Vec<_>, _>>()?;

            let total_rewards =
                results.iter().map(|v| v[2].parse::<U512>().unwrap()).sum::<U512>().to_string();

            let tree = get_merkle_tree(results.clone())?;
            let root = tree.root();
            let root_bytes = hex::decode(&root).map_err(|e| e.to_string())?;

            let mut ipfs_data = MerkleTreeIpfsData {
                id: root.clone(),
                metadata: json!({
                    "num_accounts": results.len(),
                    "token_address": reward_token_address,
                    "total_rewards": total_rewards,
                }),
                root: root.clone(),
                tree: vec![],
            };

            // get proof for each value
            results.into_iter().for_each(|value| {
                let proof = tree.get_proof(LeafType::LeafBytes(value.clone()));
                ipfs_data.tree.push(MerkleTreeEntry {
                    account: value[0].clone(),
                    reward: value[1].clone(),
                    claimable: value[2].clone(),
                    proof,
                });
            });

            let ipfs_data_json = serde_json::to_string(&ipfs_data).map_err(|e| e.to_string())?;

            let cid = ipfs::upload_json_to_ipfs(
                &ipfs_data_json,
                &format!("rewards_{}.json", ipfs_data.root),
                &ipfs_url,
                &ipfs_api_key,
            )
            .await
            .map_err(|e| format!("Failed to upload IPFS: {}", e))?;

            let ipfs_hash = cid.hash().digest();

            let output = encode_trigger_output(
                trigger_id,
                solidity::AvsOutput {
                    root: serde_json::from_value(root_bytes.into()).unwrap(),
                    ipfsHashData: serde_json::from_value(ipfs_hash.into()).unwrap(),
                    ipfsHash: cid.to_string(),
                },
            );

            Ok(Some(output))
        })
    }
}

pub mod solidity {
    use alloy_sol_macro::sol;
    pub use ITypes::*;

    sol!("../../src/interfaces/ITypes.sol");
}

#[derive(Serialize)]
struct MerkleTreeIpfsData {
    id: String,
    metadata: serde_json::Value,
    root: String,
    tree: Vec<MerkleTreeEntry>,
}

#[derive(Serialize)]
struct MerkleTreeEntry {
    account: String,
    reward: String,
    claimable: String,
    proof: Vec<String>,
}

// {
//     "id": "A string id of the Merkle tree, can be random (you can use the root)",
//     "metadata": {
//       "info": "a key value mapping allowing you to add information"
//     },
//     "root": "The merkle root of the tree",
//     "tree": [
//       {
//         "account": "The address of the claimer",
//         "reward": "The address of the reward token",
//         "claimable": "The claimable amount as a big number string",
//         "proof": ["0x1...", "0x2...", "...", "0xN..."]
//       }
//     ]
//   }
