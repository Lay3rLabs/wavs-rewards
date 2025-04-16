use crate::bindings::host::get_eth_chain_config;
use alloy_network::Ethereum;
use alloy_primitives::{Address, TxKind, U256};
use alloy_provider::{Provider, RootProvider};
use alloy_rpc_types::TransactionInput;
use alloy_sol_types::{sol, SolCall};
use anyhow::Result;
use async_trait::async_trait;
use std::str::FromStr;
use wavs_wasi_chain::ethereum::new_eth_provider;

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
    fn get_accounts(&self) -> Result<Vec<String>> {
        // Default Anvil account we're deploying and testing with.
        Ok(vec!["0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266".to_string()])
    }

    async fn get_rewards(&self, account: &str) -> Result<U256> {
        let address = Address::from_str(account).unwrap();
        let nft_balance = self.query_nft_ownership(address).await?;
        Ok(self.rewards_per_token * nft_balance)
    }
}

impl Erc721Source {
    async fn query_nft_ownership(&self, owner: Address) -> Result<U256> {
        let chain_config = get_eth_chain_config("local").unwrap();
        let provider: RootProvider<Ethereum> =
            new_eth_provider::<Ethereum>(chain_config.http_endpoint.unwrap());

        let balance_call = IERC721::balanceOfCall { owner };
        let tx = alloy_rpc_types::eth::TransactionRequest {
            to: Some(TxKind::Call(self.address)),
            input: TransactionInput { input: Some(balance_call.abi_encode().into()), data: None },
            ..Default::default()
        };

        let result = provider.call(&tx).await?;

        Ok(U256::from_be_slice(&result))
    }
}

sol! {
    interface IERC721 {
        function balanceOf(address owner) external view returns (uint256);
    }
}
