'use client';

import { useAccount } from 'wagmi';
import { ConnectButton } from '@/components/ConnectButton';
import { PendingRewards } from '@/components/PendingRewards';
import { ClaimHistory } from '@/components/ClaimHistory';
import { RewardSources } from '@/components/RewardSources';
import { MerkleTreeViewer } from '@/components/MerkleTreeViewer';
import { DevWallet } from '@/components/DevWallet';
import { useRewards } from '@/hooks/useRewards';

// Get contract addresses from environment config
import { 
  getRewardDistributorAddress, 
} from '@/utils/environmentConfig';

const REWARD_DISTRIBUTOR_ADDRESS = getRewardDistributorAddress();

export default function Home() {
  const { isConnected } = useAccount();
  
  const {
    isLoading,
    error,
    merkleRoot,
    currentIpfsHash,
    merkleData,
    pendingReward,
    claimedAmount,
    claimHistory,
    rewardSources,
    claim,
    refresh,
  } = useRewards({ distributorAddress: REWARD_DISTRIBUTOR_ADDRESS });

  return (
    <div className="space-y-8">
      {/* DevWallet for environments without MetaMask */}
      <DevWallet />
      
      
      {/* Hero section with animated gradient border */}
      <div className="relative glow-border overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-card p-8 rounded-xl backdrop-blur-md bg-opacity-90">
          <div>
            <h1 className="text-4xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-primary via-tertiary to-secondary">WAVS Reward System</h1>
            <p className="text-gray-300 text-lg">
              Claim rewards based on your NFT holdings and other sources
            </p>
            <div className="flex flex-wrap gap-2 mt-4">
              <span className="crypto-tag">
                <span className="w-2 h-2 bg-primary rounded-full mr-1.5"></span>
                NFT Rewards
              </span>
              <span className="crypto-tag">
                <span className="w-2 h-2 bg-secondary rounded-full mr-1.5"></span>
                Token Staking
              </span>
              <span className="crypto-tag">
                <span className="w-2 h-2 bg-tertiary rounded-full mr-1.5"></span>
                Community Rewards
              </span>
            </div>
          </div>
          <div className="md:min-w-[220px]">
            <ConnectButton />
          </div>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-900/30 border border-red-500/50 text-white p-5 rounded-xl backdrop-blur-sm">
          <div className="flex items-center mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="font-bold">Error</p>
          </div>
          <p>{error}</p>
        </div>
      )}
      
      {/* Main content cards with crypto grid background */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="relative crypto-grid-bg">
          <PendingRewards 
            pendingReward={pendingReward}
            isLoading={isLoading}
            claimedAmount={claimedAmount}
            onClaim={claim}
          />
        </div>
        
        <div className="relative crypto-grid-bg">
          <RewardSources 
            sources={rewardSources}
            isLoading={isLoading}
          />
        </div>
      </div>
      
      {/* Claim history with animated gradient border */}
      <div className="relative glow-border">
        <ClaimHistory 
          claims={claimHistory}
          isLoading={isLoading}
          totalReceived={claimedAmount}
        />
      </div>
      
      {/* Merkle Tree Viewer for debugging */}
      <div className="relative bg-overlay border border-primary/10 rounded-xl p-1">
        <MerkleTreeViewer 
          merkleTreeData={merkleData}
          isLoading={isLoading}
        />
      </div>
      
      {isConnected && (
        <div className="flex justify-center mt-8">
          <button
            onClick={refresh}
            className="btn btn-tertiary flex items-center gap-2"
            disabled={isLoading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
            {isLoading ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>
      )}
      
      {/* System info with blockchain style */}
      <div className="mt-8 p-6 bg-card rounded-xl backdrop-blur-sm bg-opacity-80 border border-gray-800">
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L7.586 10 5.293 7.707a1 1 0 010-1.414zM11 12a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
          </svg>
          Rewards System Info
        </h2>
        <div className="space-y-3 bg-black/20 p-4 rounded-lg border border-gray-700">
          <div className="flex flex-col">
            <span className="data-label">Distributor Contract</span>
            <div className="address-pill mt-1 overflow-x-auto">
              {REWARD_DISTRIBUTOR_ADDRESS}
            </div>
          </div>
          
          {merkleRoot && (
            <div className="flex flex-col">
              <span className="data-label">Current Merkle Root</span>
              <div className="address-pill mt-1 overflow-x-auto text-xs">
                {merkleRoot}
              </div>
            </div>
          )}
          
          {currentIpfsHash && (
            <div className="flex flex-col">
              <span className="data-label">IPFS Data</span>
              <div className="address-pill mt-1 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-primary" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                </svg>
                <span className="text-xs overflow-hidden text-ellipsis">{currentIpfsHash}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}