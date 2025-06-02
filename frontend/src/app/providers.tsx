'use client';

import { ReactNode } from 'react';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  RainbowKitProvider,
  getDefaultWallets,
  connectorsForWallets,
  darkTheme
} from '@rainbow-me/rainbowkit';
import { Chain } from 'wagmi/chains';
import { getRpcUrl, getNetworkName, getWalletConnectProjectId } from '@/utils/environmentConfig';

// Define localhost chain
const localhost: Chain = {
  id: 17_000,
  name: getNetworkName(),
  nativeCurrency: {
    decimals: 18,
    name: 'Ethereum',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: { http: [getRpcUrl()] },
  },
  blockExplorers: {
    default: { name: getNetworkName(), url: '' },
  },
  testnet: true,
};

// Setup chains
const chains: readonly [Chain, ...Chain[]] = [localhost];

// Create the connectors
const { wallets } = getDefaultWallets();
const connectors = connectorsForWallets([...wallets], {
  appName: 'WAVS Rewards',
  projectId: getWalletConnectProjectId(),
});

// Create the wagmi config
export const config = createConfig({
  chains,
  connectors,
  transports: {
    [localhost.id]: http(getRpcUrl()),
    // [holesky.id]: http(),
  },
});

// Create a client for react-query
const queryClient = new QueryClient();

// Combine all providers
export function Providers({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme()}>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}