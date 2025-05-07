/**
 * Environment configuration utility to centralize access to environment variables
 * This provides a single source of truth for all environment variables
 * and ensures that required variables are present
 */

// Contract addresses
export const getRewardDistributorAddress = (): `0x${string}` => {
  return (
    (process.env.NEXT_PUBLIC_REWARD_DISTRIBUTOR_ADDRESS as `0x${string}`) ||
    "0x0000000000000000000000000000000000000000"
  );
};

export const getRewardTokenAddress = (): `0x${string}` => {
  return (
    (process.env.NEXT_PUBLIC_REWARD_TOKEN_ADDRESS as `0x${string}`) ||
    "0x0000000000000000000000000000000000000000"
  );
};

export const getRewardSourceNftAddress = (): `0x${string}` => {
  return (
    (process.env.NEXT_PUBLIC_REWARD_SOURCE_NFT_ADDRESS as `0x${string}`) ||
    "0x0000000000000000000000000000000000000000"
  );
};

// Network configuration
export const getRpcUrl = (): string => {
  return process.env.NEXT_PUBLIC_RPC_URL || "http://localhost:8545";
};

export const getNetworkName = (): string => {
  return process.env.NEXT_PUBLIC_NETWORK_NAME || "Local";
};

export const getIpfsGateway = (): string => {
  return process.env.NEXT_PUBLIC_IPFS_GATEWAY_URL || "https://ipfs.io/ipfs/";
};

// Optional environment variables with defaults
export const getWalletConnectProjectId = (): string => {
  return process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "demo-project-id";
};
