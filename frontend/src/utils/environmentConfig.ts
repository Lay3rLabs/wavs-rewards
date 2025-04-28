/**
 * Environment configuration utility to centralize access to environment variables
 * This provides a single source of truth for all environment variables 
 * and ensures that required variables are present
 */

// Contract addresses
export const getRewardsDistributorAddress = (): `0x${string}` => {
  const address = process.env.NEXT_PUBLIC_REWARD_DISTRIBUTOR_ADDRESS;
  if (!address) {
    throw new Error(
      "NEXT_PUBLIC_REWARD_DISTRIBUTOR_ADDRESS environment variable is not set"
    );
  }
  return address as `0x${string}`;
};

export const getRewardTokenAddress = (): `0x${string}` => {
  const address = process.env.NEXT_PUBLIC_REWARD_TOKEN_ADDRESS;
  if (!address) {
    throw new Error(
      "NEXT_PUBLIC_REWARD_TOKEN_ADDRESS environment variable is not set"
    );
  }
  return address as `0x${string}`;
};

export const getRewardSourceNftAddress = (): `0x${string}` => {
  const address = process.env.NEXT_PUBLIC_REWARD_SOURCE_NFT_ADDRESS;
  if (!address) {
    throw new Error(
      "NEXT_PUBLIC_REWARD_SOURCE_NFT_ADDRESS environment variable is not set"
    );
  }
  return address as `0x${string}`;
};

// Network configuration
export const getRpcUrl = (): string => {
  const url = process.env.NEXT_PUBLIC_RPC_URL;
  if (!url) {
    throw new Error('NEXT_PUBLIC_RPC_URL environment variable is not set');
  }
  return url;
};

export const getNetworkName = (): string => {
  return process.env.NEXT_PUBLIC_NETWORK_NAME || 'Local';
};

export const getIpfsGateway = (): string => {
  return process.env.NEXT_PUBLIC_IPFS_GATEWAY_URL || 'https://ipfs.io/ipfs/';
};

// Optional environment variables with defaults
export const getWalletConnectProjectId = (): string => {
  return process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo-project-id';
};