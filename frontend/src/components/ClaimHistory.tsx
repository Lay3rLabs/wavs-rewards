'use client';

import { useAccount } from 'wagmi';
import { formatEther, shortenAddress } from '@/utils/web3';
import { RewardClaim } from '@/types';

interface ClaimHistoryProps {
  claims: RewardClaim[];
  isLoading: boolean;
  totalReceived: string;
}

export function ClaimHistory({ claims, isLoading, totalReceived }: ClaimHistoryProps) {
  const { isConnected } = useAccount();

  if (!isConnected) {
    return (
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Claim History</h2>
        <p className="text-gray-300">Connect your wallet to view your claim history</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Claim History</h2>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex items-center">
          <div className="rounded-full w-8 h-8 bg-tertiary/20 flex items-center justify-center mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-tertiary" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-xl font-bold">Claim History</h2>
        </div>
        
        <div className="bg-overlay border border-tertiary/20 px-5 py-3 rounded-lg shadow-md flex items-center gap-3">
          <div className="rounded-full w-8 h-8 bg-tertiary/20 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-tertiary" viewBox="0 0 20 20" fill="currentColor">
              <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <p className="data-label">Total Received</p>
            <div className="flex items-baseline">
              <p className="data-value text-tertiary">
                {formatEther(totalReceived)}
              </p>
              <span className="ml-1 text-xs text-gray-400">tokens</span>
            </div>
          </div>
        </div>
      </div>
      
      {claims.length === 0 ? (
        <div className="bg-overlay bg-opacity-30 p-6 rounded-lg border border-gray-700 flex justify-center items-center flex-col py-12">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-700 mb-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <p className="text-gray-300 text-center text-lg">No claims found for your address</p>
          <p className="text-gray-500 text-center mt-2 max-w-md">Your claim history will appear here once you've claimed rewards. Each claim will be recorded on the blockchain.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto bg-black/20 rounded-lg border border-gray-800">
            <table className="min-w-full">
              <thead>
                <tr className="bg-overlay">
                  <th className="px-4 py-3 text-left text-xs font-medium text-primary uppercase tracking-wider border-b border-gray-800">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-primary uppercase tracking-wider border-b border-gray-800">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-primary uppercase tracking-wider border-b border-gray-800">
                    Token
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-primary uppercase tracking-wider border-b border-gray-800">
                    Tx Hash
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {claims.map((claim, index) => (
                  <tr key={index} className="hover:bg-primary/5 transition-colors">
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      {claim.timestamp ? new Date(claim.timestamp * 1000).toLocaleDateString() : 'Unknown'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-secondary mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                        </svg>
                        <span className="font-mono font-medium">{formatEther(claim.claimed)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      <div className="address-pill py-1 text-xs inline-flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 text-primary" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                        </svg>
                        {shortenAddress(claim.reward)}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      <a 
                        href={`https://etherscan.io/tx/${claim.transactionHash}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:text-secondary transition-colors flex items-center"
                      >
                        <div className="address-pill py-1 px-3 text-xs">
                          {shortenAddress(claim.transactionHash, 6)}
                        </div>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                        </svg>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}