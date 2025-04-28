"use client";

import { useAccount } from "wagmi";
import { formatEther } from "@/utils/web3";
import { RewardSource } from "@/types";

interface RewardSourcesProps {
  sources: RewardSource[];
  isLoading: boolean;
}

const REWARD_SOURCE_NAME_MAP: Record<string, string | undefined> = {
  "ERC721": "NFT Holdings",
}

export function RewardSources({ sources, isLoading }: RewardSourcesProps) {
  const { isConnected } = useAccount();

  if (!isConnected) {
    return (
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Reward Sources</h2>
        <p className="text-gray-300">
          Connect your wallet to view reward sources
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Reward Sources</h2>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="text-xl font-bold mb-4">Reward Sources</h2>

      {sources.length === 0 ? (
        <p className="text-gray-300">No reward sources found</p>
      ) : (
        <div className="space-y-6">
          {sources.map((source, index) => (
            <div key={index} className="p-4 bg-gray-800 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold">{REWARD_SOURCE_NAME_MAP[source.name] || source.name}</h3>
                {source.balance && (
                  <div className="bg-blue-900 px-2 py-1 rounded text-sm">
                    Balance: {source.balance}
                  </div>
                )}
              </div>

              {source.metadata && (
                <>
                  <p className="text-gray-300 text-sm mb-2 break-all">
                    Address: {source.metadata?.address}
                  </p>

                  <div className="bg-gray-700 p-3 rounded mt-2">
                    <p className="text-sm text-gray-300">Rewards per token:</p>
                    <p className="font-mono">
                      {formatEther(source.metadata.rewards_per_token)} tokens
                    </p>
                  </div>

                  {source.balance && (
                    <div className="bg-gray-700 p-3 rounded mt-2">
                      <p className="text-sm text-gray-300">
                        Your rewards from this source:
                      </p>
                      <p className="font-mono text-lg">
                        {formatEther(
                          (
                            BigInt(source.balance) *
                            BigInt(source.metadata.rewards_per_token)
                          ).toString()
                        )}{" "}
                        tokens
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
