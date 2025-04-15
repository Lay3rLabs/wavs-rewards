use std::collections::HashSet;

use alloy_primitives::U256;
use anyhow::Result;
use async_trait::async_trait;

pub mod erc721;

/// A source of rewards.
#[async_trait(?Send)]
pub trait Source {
    /// Get all accounts that have rewards from this source.
    fn get_accounts(&self) -> Result<Vec<String>>;

    /// Get the rewards for an account.
    async fn get_rewards(&self, account: &str) -> Result<U256>;
}

/// A registry that manages multiple reward sources.
pub struct SourceRegistry {
    sources: Vec<Box<dyn Source>>,
}

impl SourceRegistry {
    /// Create a new empty registry.
    pub fn new() -> Self {
        Self { sources: Vec::new() }
    }

    /// Add a new source to the registry.
    pub fn add_source<S: Source + 'static>(&mut self, source: S) {
        self.sources.push(Box::new(source));
    }

    /// Get aggregated accounts from all sources (deduplicated).
    pub fn get_accounts(&self) -> Result<Vec<String>> {
        let mut accounts = HashSet::new();
        for source in &self.sources {
            accounts.extend(source.get_accounts()?);
        }
        Ok(accounts.into_iter().collect())
    }

    /// Get rewards for an account across all sources.
    pub async fn get_rewards(&self, account: &str) -> Result<U256> {
        let mut total = U256::ZERO;

        for source in &self.sources {
            let source_rewards = source.get_rewards(account).await?;
            total = total
                .checked_add(source_rewards)
                .ok_or(anyhow::anyhow!("Total rewards overflow"))?;
        }

        Ok(total)
    }
}
