'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@/components/ConnectButton';
import { useRewards } from '@/hooks/useRewards';
import { 
  useWriteContract, 
  useReadContract, 
  useWaitForTransactionReceipt 
} from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { ERC20_ABI, ERC721_ABI, REWARDS_DISTRIBUTOR_ABI } from '@/contracts/abis';
import { getEthBalance, requestFaucetEth } from '@/utils/wagmi-utils';

// Get contract addresses from environment config
import { 
  getRewardDistributorAddress, 
  getRewardTokenAddress, 
  getRewardSourceNftAddress 
} from '@/utils/environmentConfig';

const REWARD_DISTRIBUTOR_ADDRESS = getRewardDistributorAddress();
const REWARD_TOKEN_ADDRESS = getRewardTokenAddress();
const REWARD_SOURCE_NFT_ADDRESS = getRewardSourceNftAddress();

export default function AdminPage() {
  const { isConnected, address } = useAccount();
  const [nftTokenId, setNftTokenId] = useState('1');
  const [mintAmount, setMintAmount] = useState('1000');
  const [ethAmount, setEthAmount] = useState('10');
  const [ethBalance, setEthBalance] = useState<string>('0');
  const [isLoading, setIsLoading] = useState(false);
  const [isFaucetLoading, setIsFaucetLoading] = useState(false);
  const [isTriggerLoading, setIsTriggerLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  const {
    isLoading: isLoadingRewards,
    error: rewardsError,
    merkleRoot,
    currentIpfsHash,
    merkleData,
    refresh,
  } = useRewards({ distributorAddress: REWARD_DISTRIBUTOR_ADDRESS });

  // Contract write hooks
  const { 
    data: mintNftTx, 
    error: mintNftError, 
    writeContractAsync: writeNftMint 
  } = useWriteContract();

  const { 
    data: mintErc20Tx, 
    error: mintErc20Error, 
    writeContractAsync: writeErc20Mint 
  } = useWriteContract();

  const { 
    data: addTriggerTx, 
    error: addTriggerError, 
    writeContractAsync: writeAddTrigger 
  } = useWriteContract();

  // Transaction tracking
  const { 
    status: nftTxStatus, 
    isLoading: isNftTxLoading 
  } = useWaitForTransactionReceipt({ 
    hash: mintNftTx, 
    query: {
      enabled: !!mintNftTx
    }
  });

  const { 
    status: erc20TxStatus, 
    isLoading: isErc20TxLoading 
  } = useWaitForTransactionReceipt({ 
    hash: mintErc20Tx, 
    query: {
      enabled: !!mintErc20Tx
    }
  });

  const { 
    status: addTriggerTxStatus, 
    isLoading: isAddTriggerTxLoading 
  } = useWaitForTransactionReceipt({ 
    hash: addTriggerTx, 
    query: {
      enabled: !!addTriggerTx
    }
  });

  // Fetch distributor token balance
  const { data: distributorBalance, refetch: refetchDistributorBalance } = useReadContract({
    address: REWARD_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [REWARD_DISTRIBUTOR_ADDRESS],
    query: {
      enabled: isConnected
    }
  });

  // Update balance when TX changes
  useEffect(() => {
    refetchDistributorBalance();
  }, [mintErc20Tx, erc20TxStatus]);
  
  // Fetch ETH balance when account changes
  useEffect(() => {
    const fetchEthBalance = async () => {
      if (isConnected && address) {
        try {
          const balance = await getEthBalance(address);
          setEthBalance(balance);
        } catch (error) {
          console.error('Error fetching ETH balance:', error);
        }
      }
    };
    
    fetchEthBalance();
    
    // Set up an interval to refresh balance
    const intervalId = setInterval(fetchEthBalance, 10000);
    return () => clearInterval(intervalId);
  }, [isConnected, address]);

  // Handle success messages
  useEffect(() => {
    if (nftTxStatus === 'success') {
      setSuccessMessage('NFT minted successfully!');
      setTimeout(() => setSuccessMessage(''), 5000);
    } else if (erc20TxStatus === 'success') {
      setSuccessMessage('Reward tokens minted successfully!');
      setTimeout(() => setSuccessMessage(''), 5000);
    } else if (addTriggerTxStatus === 'success') {
      setSuccessMessage('AVS triggered successfully!');
      setTimeout(() => setSuccessMessage(''), 5000);
    }
  }, [nftTxStatus, erc20TxStatus, addTriggerTxStatus]);

  // Handle error messages
  useEffect(() => {
    if (mintNftError || mintErc20Error || addTriggerError) {
      const errorMsg = (mintNftError || mintErc20Error || addTriggerError)?.message || 'Transaction failed';
      setErrorMessage(errorMsg);
    }
  }, [mintNftError, mintErc20Error, addTriggerError]);

  const handleMintNft = async () => {
    if (!address) return;
    
    try {
      setIsLoading(true);
      setErrorMessage('');

      console.log(`Minting NFT to ${address} with token ID ${nftTokenId}`);
      
      await writeNftMint({
        address: REWARD_SOURCE_NFT_ADDRESS as `0x${string}`,
        abi: ERC721_ABI,
        functionName: 'mint',
        args: [address, BigInt(nftTokenId)]
      });
    } catch (error) {
      console.error('Error minting NFT:', error);
      setErrorMessage(String(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleMintRewardTokens = async () => {
    if (!address) return;
    
    try {
      setIsLoading(true);
      setErrorMessage('');
      
      const amount = parseEther(mintAmount);

      await writeErc20Mint({
        address: REWARD_TOKEN_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'mint',
        args: [REWARD_DISTRIBUTOR_ADDRESS, amount]
      });
    } catch (error) {
      console.error('Error minting reward tokens:', error);
      setErrorMessage(String(error));
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRequestEth = async () => {
    if (!address) return;
    
    try {
      setIsFaucetLoading(true);
      setErrorMessage('');
      
      // Pass the user-specified amount
      const result = await requestFaucetEth(ethAmount);
      
      setSuccessMessage(`Successfully set balance to ${ethAmount} ETH via anvil_setBalance`);
      setTimeout(() => setSuccessMessage(''), 5000);
      
      // Force refresh balance immediately
      const balance = await getEthBalance(address);
      setEthBalance(balance);
      
    } catch (error) {
      console.error('Error setting ETH balance:', error);
      setErrorMessage(String(error));
    } finally {
      setIsFaucetLoading(false);
    }
  };

  const handleAddTrigger = async () => {
    if (!address) return;
    
    try {
      setIsTriggerLoading(true);
      setErrorMessage('');

      await writeAddTrigger({
        address: REWARD_DISTRIBUTOR_ADDRESS,
        abi: REWARDS_DISTRIBUTOR_ABI,
        functionName: 'addTrigger',
        args: [REWARD_TOKEN_ADDRESS, REWARD_SOURCE_NFT_ADDRESS]
      });
    } catch (error) {
      console.error('Error adding trigger:', error);
      setErrorMessage(String(error));
    } finally {
      setIsTriggerLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Admin Panel Header */}
      <div className="relative glow-border overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-card p-8 rounded-xl backdrop-blur-md bg-opacity-90">
          <div>
            <h1 className="text-4xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-primary via-tertiary to-secondary">Admin Panel</h1>
            <p className="text-gray-300 text-lg">
              Manage reward sources, tokens, and system configuration
            </p>
          </div>
          <div className="md:min-w-[220px]">
            <ConnectButton />
          </div>
        </div>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="p-4 bg-green-500/20 border border-green-500/30 rounded-lg text-green-300">
          {successMessage}
        </div>
      )}
      
      {errorMessage && (
        <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 break-words">
          {errorMessage}
        </div>
      )}

      {!isConnected ? (
        <div className="bg-card p-8 rounded-xl text-center">
          <p className="text-xl mb-4">Please connect your wallet to access admin features</p>
          <div className="flex justify-center">
            <ConnectButton />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-8">
            {/* NFT Minting */}
            <div className="card">
              <h2 className="text-xl font-bold mb-4 text-primary flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
                  <path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
                Mint Reward Source NFT
              </h2>
              
              <div className="mb-4 p-4 bg-black/30 border border-primary/20 rounded-lg">
                <p className="text-sm text-gray-400 mb-2">Mint NFTs to your wallet to test the rewards claiming system. Each NFT counts towards your reward allocation.</p>
              </div>
              
              <div className="mb-3">
                <label className="block text-sm text-gray-400 mb-1">NFT Contract</label>
                <div className="address-pill py-2 px-3 text-xs bg-black/40">
                  {REWARD_SOURCE_NFT_ADDRESS}
                </div>
              </div>
              
              <div className="mb-3">
                <label className="block text-sm text-gray-400 mb-1">Token ID</label>
                <input
                  type="number"
                  value={nftTokenId}
                  onChange={(e) => setNftTokenId(e.target.value)}
                  className="w-full bg-black/40 border border-gray-700 rounded-md px-3 py-2 text-white"
                />
                <p className="text-xs text-gray-500 mt-1">Each token ID must be unique. If you get an error, try a different ID.</p>
              </div>
              
              <button 
                onClick={handleMintNft}
                disabled={isLoading || isNftTxLoading}
                className="btn btn-primary w-full"
              >
                {isLoading || isNftTxLoading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Minting...
                  </div>
                ) : (
                  "Mint NFT to My Wallet"
                )}
              </button>
            </div>
            
            {/* ERC20 Token Minting */}
            <div className="card">
              <h2 className="text-xl font-bold mb-4 text-secondary flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                </svg>
                Mint Reward Tokens
              </h2>
              
              <div className="mb-4 p-4 bg-black/30 border border-secondary/20 rounded-lg">
                <p className="text-sm text-gray-400 mb-2">Mint reward tokens to the distributor contract so they can be claimed by users. The distributor needs tokens to distribute rewards.</p>
              </div>
              
              <div className="mb-3">
                <label className="block text-sm text-gray-400 mb-1">Token Contract</label>
                <div className="address-pill py-2 px-3 text-xs bg-black/40">
                  {REWARD_TOKEN_ADDRESS}
                </div>
              </div>
              
              <div className="mb-3">
                <label className="block text-sm text-gray-400 mb-1">Distributor Contract</label>
                <div className="address-pill py-2 px-3 text-xs bg-black/40">
                  {REWARD_DISTRIBUTOR_ADDRESS}
                </div>
              </div>
              
              <div className="mb-3">
                <label className="block text-sm text-gray-400 mb-1">Current Balance</label>
                <div className="bg-black/40 border border-gray-700 rounded-md px-3 py-2 font-mono">
                  {distributorBalance ? formatEther(distributorBalance) : '...'} tokens
                </div>
              </div>
              
              <div className="mb-3">
                <label className="block text-sm text-gray-400 mb-1">Amount to Mint</label>
                <input
                  type="text"
                  value={mintAmount}
                  onChange={(e) => setMintAmount(e.target.value)}
                  className="w-full bg-black/40 border border-gray-700 rounded-md px-3 py-2 text-white"
                />
              </div>
              
              <button 
                onClick={handleMintRewardTokens}
                disabled={isLoading || isErc20TxLoading}
                className="btn btn-secondary w-full"
              >
                {isLoading || isErc20TxLoading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Minting...
                  </div>
                ) : (
                  "Mint Tokens to Distributor"
                )}
              </button>
            </div>
          </div>
          
          {/* Right Column */}
          <div className="space-y-8">
            {/* System Information */}
            <div className="card">
              <h2 className="text-xl font-bold mb-4 text-tertiary flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L7.586 10 5.293 7.707a1 1 0 010-1.414zM11 12a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                </svg>
                System Information
              </h2>
              
              <div className="space-y-4 bg-black/30 p-5 rounded-lg border border-tertiary/20">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Distributor Contract</label>
                  <div className="address-pill py-2 px-3 text-xs bg-black/40 overflow-x-auto">
                    {REWARD_DISTRIBUTOR_ADDRESS}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Current Merkle Root</label>
                  <div className="address-pill py-2 px-3 text-xs bg-black/40 overflow-x-auto">
                    {merkleRoot || 'No merkle root set'}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-1">IPFS Hash</label>
                  <div className="address-pill py-2 px-3 text-xs bg-black/40 overflow-x-auto">
                    {currentIpfsHash || 'No IPFS hash set'}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Admin Actions */}
            <div className="card">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" />
                </svg>
                Admin Actions
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button 
                  onClick={refresh}
                  className="btn btn-outline flex justify-center items-center"
                  disabled={isLoadingRewards}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 mr-2 ${isLoadingRewards ? 'animate-spin' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                  </svg>
                  Refresh Data
                </button>

                <button 
                  onClick={handleAddTrigger}
                  disabled={isTriggerLoading || isAddTriggerTxLoading}
                  className="btn btn-primary flex justify-center items-center"
                >
                  {isTriggerLoading || isAddTriggerTxLoading ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Triggering AVS...
                    </div>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                      </svg>
                      Trigger AVS
                    </>
                  )}
                </button>
              </div>
              
              <div className="mt-4">
                <a 
                  href="/"
                  className="btn btn-outline w-full flex justify-center items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                  </svg>
                  Return to Home Page
                </a>
              </div>
            </div>
            
            {/* ETH Balance & Faucet */}
            <div className="card">
              <h2 className="text-xl font-bold mb-4 text-tertiary flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                </svg>
                ETH Balance & Faucet
              </h2>
              
              <div className="mb-4 p-4 bg-black/30 border border-tertiary/20 rounded-lg">
                <p className="text-sm text-gray-400 mb-2">Check your ETH balance and request more from the local Anvil faucet for testing.</p>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-1">Current ETH Balance</label>
                <div className="bg-black/40 border border-gray-700 rounded-md px-3 py-2 font-mono flex items-center justify-between">
                  <span>{formatEther(BigInt(ethBalance))} ETH</span>
                  <button 
                    className="text-xs text-blue-400 hover:text-blue-300"
                    onClick={async () => {
                      if (address) {
                        const balance = await getEthBalance(address);
                        setEthBalance(balance);
                      }
                    }}
                  >
                    Refresh
                  </button>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-1">ETH Amount to Set</label>
                <input
                  type="number"
                  value={ethAmount}
                  onChange={(e) => setEthAmount(e.target.value)}
                  className="w-full bg-black/40 border border-gray-700 rounded-md px-3 py-2 text-white"
                  min="0"
                  step="0.1"
                />
                <p className="text-xs text-gray-500 mt-1">Enter amount in ETH (e.g., 10 for 10 ETH)</p>
              </div>
              
              <button 
                onClick={handleRequestEth}
                disabled={isFaucetLoading}
                className="btn btn-tertiary w-full"
              >
                {isFaucetLoading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Setting Balance...
                  </div>
                ) : (
                  "Set ETH Balance"
                )}
              </button>
              
              <div className="mt-4 text-xs text-gray-500">
                <p>This function uses Anvil's <code>anvil_setBalance</code> RPC method to directly set your wallet's ETH balance. This only works on a local Anvil development chain.</p>
              </div>
            </div>

            {/* Environment */}
            <div className="card">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L7.586 10 5.293 7.707a1 1 0 010-1.414zM11 12a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                </svg>
                Environment
              </h2>
              
              <div className="text-xs font-mono text-gray-400 bg-black/50 p-4 rounded-md">
                <p>RPC: {process.env.NEXT_PUBLIC_RPC_URL || 'http://localhost:8545'}</p>
                <p>Env: {process.env.NODE_ENV}</p>
                <p>Wallet: {address || 'Not connected'}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}