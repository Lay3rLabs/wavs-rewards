'use client';

import { useState } from 'react';
import { cidToUrl } from '@/utils/ipfs';

interface DebugPanelProps {
  onSetTestIpfsHash: () => void;
  onRefresh: () => void;
  ipfsHash: string;
  root: string;
}

export function DebugPanel({ onSetTestIpfsHash, onRefresh, ipfsHash, root }: DebugPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!isExpanded) {
    return (
      <button 
        className="fixed bottom-2 left-2 bg-gray-700 text-white px-3 py-1 rounded-md text-xs"
        onClick={() => setIsExpanded(true)}
      >
        Debug
      </button>
    );
  }
  
  return (
    <div className="fixed bottom-2 left-2 bg-gray-800 p-4 rounded-md shadow-lg z-50 text-white max-w-md">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold">Debug Panel</h3>
        <button 
          className="text-gray-400 hover:text-white"
          onClick={() => setIsExpanded(false)}
        >
          Close
        </button>
      </div>
      
      <div className="space-y-2 text-sm">
        <div>
          <p className="text-gray-400">Current IPFS Hash:</p>
          <p className="font-mono text-xs truncate">{ipfsHash || 'None'}</p>
          {ipfsHash && (
            <a 
              href={cidToUrl(ipfsHash)} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-blue-400 hover:text-blue-300 text-xs"
            >
              View on IPFS Gateway
            </a>
          )}
        </div>
        
        <div>
          <p className="text-gray-400">Current Root:</p>
          <p className="font-mono text-xs truncate">{root || 'None'}</p>
        </div>
        
        <div className="pt-2 flex flex-col gap-2">
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs"
            onClick={onRefresh}
          >
            Refresh Data
          </button>
          
          <button
            className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1 rounded text-xs"
            onClick={onSetTestIpfsHash}
          >
            Use Test IPFS Hash
          </button>
          
          <button
            className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-xs"
            onClick={() => {
              console.log('Current state:');
              console.log('IPFS Hash:', ipfsHash);
              console.log('Root:', root);
              if (ipfsHash) {
                console.log('IPFS Gateway URL:', cidToUrl(ipfsHash));
              }
            }}
          >
            Log State
          </button>
        </div>
      </div>
    </div>
  );
}