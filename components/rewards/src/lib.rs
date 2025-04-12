pub mod bindings;
mod ipfs;
mod merkle;
mod trigger;

use crate::bindings::{export, Guest, TriggerAction};
use merkle::get_merkle_tree;
use merkle_tree_rs::standard::LeafType;
use serde::Serialize;
use serde_json::json;
use trigger::{decode_trigger_event, encode_trigger_output};
use wavs_wasi_chain::ethereum::alloy_primitives::hex;
use wstd::runtime::block_on;

struct Component;
export!(Component with_types_in bindings);

impl Guest for Component {
    fn run(action: TriggerAction) -> std::result::Result<Option<Vec<u8>>, String> {
        let (trigger_id, _req) = decode_trigger_event(action.data).map_err(|e| e.to_string())?;

        // each value is [address, token, amount]
        let values = vec![
            vec![
                "0x0000000000000000000000000000000000000000".to_string(),
                "0x0000000000000000000000000000000000000000".to_string(),
                "1000000000000000000".to_string(),
            ],
            vec![
                "0x0000000000000000000000000000000000000001".to_string(),
                "0x0000000000000000000000000000000000000000".to_string(),
                "2000000000000000000".to_string(),
            ],
        ];

        let tree = get_merkle_tree(values.clone())?;
        let root = tree.root();
        let root_bytes = hex::decode(&root).map_err(|e| e.to_string())?;

        let mut ipfs_data = MerkleTreeIpfsData {
            id: root.clone(),
            metadata: json!({ "info": "test" }),
            root: root.clone(),
            tree: vec![],
        };

        // get proof for each value
        values.into_iter().for_each(|value| {
            let proof = tree.get_proof(LeafType::LeafBytes(value.clone()));
            ipfs_data.tree.push(MerkleTreeEntry {
                account: value[0].clone(),
                reward: value[1].clone(),
                claimable: value[2].clone(),
                proof,
            });
        });

        let ipfs_data_json = serde_json::to_string(&ipfs_data).map_err(|e| e.to_string())?;
        let ipfs_url = std::env::var("WAVS_ENV_LIGHTHOUSE_API_URL")
            .unwrap_or_else(|_| "https://node.lighthouse.storage/api/v0/add".to_string());

        block_on(async move {
            let cid = ipfs::upload_json_to_ipfs(&ipfs_data_json, &ipfs_url)
                .await
                .map_err(|e| format!("Failed to upload IPFS: {}", e))?;

            let ipfs_hash = cid.hash().digest();

            let output = encode_trigger_output(
                trigger_id,
                solidity::AvsOutput {
                    root: serde_json::from_value(root_bytes.into()).unwrap(),
                    ipfsHash: serde_json::from_value(ipfs_hash.into()).unwrap(),
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
