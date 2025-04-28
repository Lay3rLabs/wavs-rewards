'use client';

import { useState } from 'react';
import { MerkleTreeData, PendingReward } from '@/types';
import { formatEther, shortenAddress } from '@/utils/web3';

interface MerkleTreeViewerProps {
  merkleTreeData: MerkleTreeData | null;
  isLoading: boolean;
}

export function MerkleTreeViewer({ merkleTreeData, isLoading }: MerkleTreeViewerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'account' | 'amount'>('amount');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  if (isLoading) {
    return (
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Merkle Tree Data</h2>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!merkleTreeData) {
    return (
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Merkle Tree Data</h2>
        <p className="text-gray-300">No merkle tree data available</p>
      </div>
    );
  }

  // Filter entries based on search term
  const filteredEntries = merkleTreeData.tree.filter(entry => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      entry.account.toLowerCase().includes(searchLower) ||
      entry.reward.toLowerCase().includes(searchLower) ||
      entry.claimable.includes(searchTerm)
    );
  });

  // Sort entries
  const sortedEntries = [...filteredEntries].sort((a, b) => {
    if (sortBy === 'account') {
      return sortOrder === 'asc' 
        ? a.account.localeCompare(b.account)
        : b.account.localeCompare(a.account);
    } else {
      // Sort by amount (numeric)
      const amountA = BigInt(a.claimable);
      const amountB = BigInt(b.claimable);
      return sortOrder === 'asc'
        ? amountA < amountB ? -1 : amountA > amountB ? 1 : 0
        : amountB < amountA ? -1 : amountB > amountA ? 1 : 0;
    }
  });

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Merkle Tree Data</h2>
        <button 
          className="btn btn-secondary text-sm"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? 'Hide Debug Data' : 'Show Debug Data'}
        </button>
      </div>
      
      {merkleTreeData && (
        <div className="space-y-4">
          <div className="p-4 bg-gray-800 rounded-lg">
            <h3 className="font-bold mb-2">Metadata</h3>
            <div className="space-y-1 text-sm">
              <p><span className="text-gray-400">Root:</span> {merkleTreeData.root}</p>
              <p><span className="text-gray-400">ID:</span> {merkleTreeData.id}</p>
              <p><span className="text-gray-400">Account Count:</span> {merkleTreeData.tree.length}</p>
              {merkleTreeData.metadata && Object.entries(merkleTreeData.metadata).map(([key, value]) => (
                <p key={key} className="break-all">
                  <span className="text-gray-400">{key}:</span> {typeof value === 'object' ? JSON.stringify(value) : value.toString()}
                </p>
              ))}
            </div>
          </div>
          
          {isExpanded && (
            <>
              <div className="space-y-2 py-2">
                <div className="flex items-center space-x-4">
                  <input 
                    type="text"
                    placeholder="Search by address or amount..."
                    className="bg-gray-700 text-white px-3 py-2 rounded w-full"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                  
                  <div className="flex items-center space-x-2">
                    <label className="text-sm text-gray-400">Sort by:</label>
                    <select 
                      className="bg-gray-700 text-white px-3 py-2 rounded"
                      value={sortBy}
                      onChange={e => setSortBy(e.target.value as 'account' | 'amount')}
                    >
                      <option value="account">Account</option>
                      <option value="amount">Amount</option>
                    </select>
                    
                    <button
                      className="bg-gray-700 px-3 py-2 rounded text-sm"
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    >
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </button>
                  </div>
                </div>
                
                <div className="text-sm text-gray-400">
                  Showing {filteredEntries.length} of {merkleTreeData.tree.length} entries
                </div>
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-gray-800 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Account
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Reward Token
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Proof Length
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {sortedEntries.map((entry, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 whitespace-nowrap text-sm font-mono">
                          {shortenAddress(entry.account)}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm font-mono">
                          {formatEther(entry.claimable)}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm font-mono">
                          {shortenAddress(entry.reward)}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">
                          {entry.proof.length}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {searchTerm && filteredEntries.length === 1 && (
                <div className="mt-4 p-4 bg-gray-800 rounded-lg">
                  <h4 className="font-bold mb-2">Merkle Proof for {shortenAddress(filteredEntries[0].account)}</h4>
                  <div className="max-h-40 overflow-y-auto">
                    <ul className="list-disc list-inside text-xs font-mono">
                      {filteredEntries[0].proof.map((proofItem, index) => (
                        <li key={index} className="truncate">
                          {proofItem}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}