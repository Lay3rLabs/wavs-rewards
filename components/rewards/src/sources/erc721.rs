use crate::bindings::host::get_evm_chain_config;
use alloy_network::Ethereum;
use alloy_provider::{Provider, RootProvider};
use alloy_rpc_types::TransactionInput;
use alloy_sol_types::{sol, SolCall, SolType};
use anyhow::Result;
use async_trait::async_trait;
use std::str::FromStr;
use wavs_wasi_utils::evm::{
    alloy_primitives::{Address, TxKind, U256},
    new_evm_provider,
};

use super::Source;

/// Compute rewards from an ERC721 token.
pub struct Erc721Source {
    /// Contract address.
    pub address: Address,
    /// Rewards per token.
    pub rewards_per_token: U256,
}

impl Erc721Source {
    pub fn new(address: &str, rewards_per_token: U256) -> Self {
        let nft_contract = Address::from_str(address).unwrap();
        Self { address: nft_contract, rewards_per_token }
    }
}

#[async_trait(?Send)]
impl Source for Erc721Source {
    fn get_name(&self) -> &str {
        "ERC721"
    }

    async fn get_accounts(&self) -> Result<Vec<String>> {
        let holders = self.query_holders().await?;
        Ok(holders)
    }

    async fn get_rewards(&self, account: &str) -> Result<U256> {
        let address = Address::from_str(account).unwrap();
        let nft_balance = self.query_nft_ownership(address).await?;
        Ok(self.rewards_per_token * nft_balance)
    }

    async fn get_metadata(&self) -> Result<serde_json::Value> {
        Ok(serde_json::json!({
            "address": self.address.to_string(),
            "rewards_per_token": self.rewards_per_token.to_string(),
        }))
    }
}

impl Erc721Source {
    async fn query_nft_ownership(&self, owner: Address) -> Result<U256> {
        let chain_config = get_evm_chain_config("local").unwrap();
        let provider: RootProvider<Ethereum> =
            new_evm_provider::<Ethereum>(chain_config.http_endpoint.unwrap());

        let balance_call = IERC721::balanceOfCall { owner };
        let tx = alloy_rpc_types::eth::TransactionRequest {
            to: Some(TxKind::Call(self.address)),
            input: TransactionInput { input: Some(balance_call.abi_encode().into()), data: None },
            ..Default::default()
        };

        let result = provider.call(tx).await?;

        Ok(U256::from_be_slice(&result))
    }

    async fn query_holders(&self) -> Result<Vec<String>> {
        let chain_config = get_evm_chain_config("local").unwrap();
        let provider: RootProvider<Ethereum> =
            new_evm_provider::<Ethereum>(chain_config.http_endpoint.unwrap());

        let holders_call = IRewardSourceNft::getAllHoldersCall {};
        let tx = alloy_rpc_types::eth::TransactionRequest {
            to: Some(TxKind::Call(self.address)),
            input: TransactionInput { input: Some(holders_call.abi_encode().into()), data: None },
            ..Default::default()
        };

        let result = provider.call(tx).await?.to_vec();

        let holders: Vec<Address> = <sol! { address[] }>::abi_decode(&result)?;
        Ok(holders.into_iter().map(|h| h.to_string()).collect())
    }
}

sol! {
    interface IERC721 {
        function balanceOf(address owner) external view returns (uint256);
    }
    interface IRewardSourceNft {
        function getAllHolders() external view returns (address[] memory);
    }
}
