'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { formatEther } from '@/utils/web3';
import { PendingReward } from '@/types';

interface PendingRewardsProps {
  pendingReward: PendingReward | null;
  isLoading: boolean;
  claimedAmount: string;
  onClaim: () => Promise<string | null>;
}

export function PendingRewards({ 
  pendingReward, 
  isLoading, 
  claimedAmount,
  onClaim 
}: PendingRewardsProps) {
  const { isConnected } = useAccount();
  const [isClaiming, setIsClaiming] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  const handleClaim = async () => {
    if (!pendingReward) return;
    
    setIsClaiming(true);
    try {
      const hash = await onClaim();
      if (hash) {
        setTxHash(hash);
      }
    } finally {
      setIsClaiming(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Pending Rewards</h2>
        <p className="text-gray-300">Connect your wallet to view your pending rewards</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Pending Rewards</h2>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  const hasClaimableRewards = pendingReward && 
    BigInt(pendingReward.claimable) > BigInt(claimedAmount);
  
  const remainingToClaim = hasClaimableRewards 
    ? BigInt(pendingReward.claimable) - BigInt(claimedAmount)
    : BigInt(0);

  return (
    <div className="card">
      <div className="flex items-center mb-5">
        <div className="rounded-full w-8 h-8 bg-primary/20 flex items-center justify-center mr-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary" viewBox="0 0 20 20" fill="currentColor">
            <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
          </svg>
        </div>
        <h2 className="text-xl font-bold">Pending Rewards</h2>
      </div>
      
      {!pendingReward ? (
        <div className="bg-card bg-opacity-70 p-6 rounded-lg border border-gray-700">
          <div className="flex justify-center items-center flex-col py-8">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-500 mb-3" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
            </svg>
            <p className="text-gray-300 text-center">No pending rewards found for your address</p>
            <p className="text-xs text-gray-500 text-center mt-2">Rewards will appear here once you're eligible</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-overlay rounded-lg p-4">
              <p className="data-label mb-1">Total Allocated</p>
              <div className="flex items-baseline">
                <p className="data-value text-white">
                  {formatEther(pendingReward.claimable)}
                </p>
                <span className="ml-1 text-xs text-gray-400">tokens</span>
              </div>
            </div>
            
            <div className="bg-overlay rounded-lg p-4">
              <p className="data-label mb-1">Already Claimed</p>
              <div className="flex items-baseline">
                <p className="data-value text-white">
                  {formatEther(claimedAmount)}
                </p>
                <span className="ml-1 text-xs text-gray-400">tokens</span>
              </div>
            </div>
          </div>
          
          <div className="relative glow-border overflow-hidden">
            <div className="bg-overlay bg-opacity-30 backdrop-blur-sm rounded-xl p-6 border border-primary/20">
              <p className="data-label mb-2">Available to Claim</p>
              <div className="flex items-center">
                <div className="flex-1">
                  <div className="flex items-baseline mb-1">
                    <p className="text-2xl font-mono font-bold bg-clip-text text-transparent bg-gradient-to-r from-secondary to-primary">
                      {formatEther(remainingToClaim.toString())}
                    </p>
                    <span className="ml-2 text-xs text-gray-300">tokens</span>
                  </div>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          
          <button
            className={`btn w-full ${hasClaimableRewards ? 'btn-primary' : 'btn-outline opacity-60'} group relative`}
            disabled={!hasClaimableRewards || isClaiming}
            onClick={handleClaim}
          >
            <span className="relative z-10 flex items-center justify-center">
              {isClaiming ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing Claim...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
                  </svg>
                  Claim Rewards
                </>
              )}
            </span>
            <span className="absolute inset-0 h-full w-full scale-0 rounded-md transition-all duration-300 group-hover:scale-100 group-hover:bg-white/10"></span>
          </button>
          
          {txHash && (
            <div className="mt-4 p-4 bg-secondary/10 border border-secondary/30 rounded-lg">
              <div className="flex items-center mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-secondary mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p className="font-medium text-secondary">Claim successful!</p>
              </div>
              <div className="flex items-center">
                <p className="text-sm text-gray-300 mr-2">Transaction:</p>
                <div className="address-pill overflow-hidden text-ellipsis text-xs py-1 flex-1">
                  {txHash}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}