'use client';

import { useEffect } from 'react';

// This is a development-only component to inject a mock Ethereum provider
// when running in the Docker container or environments without MetaMask
export function DevWallet() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if ((window as any).ethereum) {
      console.log('Real Ethereum provider detected, not injecting DevWallet');
      return;
    }
    
    console.log('DevWallet: Injecting mock Ethereum provider for development');
    
    // Create a mock Ethereum provider for development purposes
    const mockEthereum = {
      isMetaMask: true,
      networkVersion: '31337', // Anvil/Hardhat network ID
      chainId: '0x7a69', // 31337 in hex
      selectedAddress: null as string | null,
      _listeners: {} as Record<string, Function[]>,
      
      // Event methods
      on(event: string, listener: Function) {
        if (!this._listeners[event]) {
          this._listeners[event] = [];
        }
        this._listeners[event].push(listener);
        return this;
      },
      
      removeListener(event: string, listener: Function) {
        if (this._listeners[event]) {
          this._listeners[event] = this._listeners[event].filter(l => l !== listener);
        }
        return this;
      },
      
      // Emit an event to all listeners
      _emit(event: string, ...args: any[]) {
        if (this._listeners[event]) {
          this._listeners[event].forEach(listener => listener(...args));
        }
      },
      
      // RPC methods using the request format
      async request({ method, params }: { method: string; params?: any[] }) {
        console.log(`DevWallet: Request method ${method}`, params);
        
        // Test account - First Anvil test account
        const testAccount = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
        
        switch (method) {
          case 'eth_requestAccounts':
          case 'eth_accounts':
            if (!this.selectedAddress) {
              this.selectedAddress = testAccount;
              setTimeout(() => {
                this._emit('accountsChanged', [this.selectedAddress]);
              }, 10);
            }
            return [this.selectedAddress];
            
          case 'eth_chainId':
            return this.chainId;
            
          case 'net_version':
            return this.networkVersion;
            
          case 'eth_getBalance':
            return '0x56BC75E2D63100000'; // 100 ETH
            
          case 'eth_call':
            // Mock response for contract calls - depends on the contract method
            // Return a generic mock response
            if (params && params.length > 0 && (params[0] as any).data) {
              const data = (params[0] as any).data;
              // If balanceOf function (common in ERC20/ERC721)
              if (data.startsWith('0x70a08231')) {
                return '0x0000000000000000000000000000000000000000000000000de0b6b3a7640000'; // 1 token
              }
              // If decimals function
              if (data.startsWith('0x313ce567')) {
                return '0x0000000000000000000000000000000000000000000000000000000000000012'; // 18 decimals
              }
              // If symbol function
              if (data.startsWith('0x95d89b41')) {
                // "TEST" in hex
                return '0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000454455354000000000000000000000000000000000000000000000000000000000';
              }
              // If name function
              if (data.startsWith('0x06fdde03')) {
                // "Test Token" in hex
                return '0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000095465737420546f6b656e000000000000000000000000000000000000000000';
              }
            }
            // Default contract call response
            return '0x0000000000000000000000000000000000000000000000000000000000000000';
            
          case 'eth_sendTransaction':
            // Mock a successful tx
            return '0x' + '1'.repeat(64);
            
          case 'eth_blockNumber':
            // Return a recent block number
            return '0x123456';
            
          case 'eth_getCode':
            // Return non-empty code to indicate a contract
            return '0x6080604052...abbreviated...';
            
          case 'eth_getLogs':
            // Return an empty array for logs queries
            return [];
            
          default:
            console.warn(`DevWallet: Unhandled method ${method}`);
            // Default to returning a successful but empty response for unhandled methods
            return method.startsWith('eth_') ? '0x' : null;
        }
      },
      
      // Helper for disconnecting
      disconnect() {
        this.selectedAddress = null;
        this._emit('accountsChanged', []);
      },
      
      // For compatibility with ethers.js v6
      send: async function (method: string, params: any[]) {
        return this.request({ method, params });
      },
      
      // For backwards compatibility (ethers.js v5 style)
      sendAsync: function (payload: any, callback: Function) {
        const method = payload.method;
        const params = payload.params || [];
        
        this.request({ method, params })
          .then((result: any) => callback(null, { id: payload.id, jsonrpc: '2.0', result }))
          .catch((error: any) => callback(error));
      },
      
      // Required for ethers.js v6 BrowserProvider
      provider: {
        isMetaMask: true,
        isEip1193: true
      }
    };
    
    // Inject the mock provider
    (window as any).ethereum = mockEthereum;
    
    // Add a visible indicator that we're in dev mode
    const devModeIndicator = document.createElement('div');
    devModeIndicator.style.position = 'fixed';
    devModeIndicator.style.bottom = '10px';
    devModeIndicator.style.right = '10px';
    devModeIndicator.style.padding = '5px 10px';
    devModeIndicator.style.background = 'rgba(255, 165, 0, 0.8)';
    devModeIndicator.style.color = 'black';
    devModeIndicator.style.borderRadius = '4px';
    devModeIndicator.style.fontSize = '12px';
    devModeIndicator.style.zIndex = '9999';
    devModeIndicator.textContent = 'Dev Wallet Active';
    document.body.appendChild(devModeIndicator);
    
    // Cleanup
    return () => {
      document.body.removeChild(devModeIndicator);
      delete (window as any).ethereum;
    };
  }, []);
  
  return null; // This component doesn't render anything
}