'use client';

import { ConnectButton as RainbowKitConnectButton } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';

export function ConnectButton() {
  return (
    <RainbowKitConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        // Note: If your app doesn't use authentication, you
        // can remove all 'authenticationStatus' checks
        const ready = mounted && authenticationStatus !== 'loading';
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus ||
            authenticationStatus === 'authenticated');

        return (
          <div
            className="flex flex-col items-center"
            {...(!ready && {
              'aria-hidden': true,
              style: {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <div className="flex flex-col items-center gap-3">
                    <button 
                      onClick={openConnectModal}
                      className="btn btn-primary group relative overflow-hidden"
                    >
                      <span className="relative z-10 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-black" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13 7H7v6h6V7z" />
                          <path fillRule="evenodd" d="M7 2a1 1 0 012 0v1h2V2a1 1 0 112 0v1h2a2 2 0 012 2v2h1a1 1 0 110 2h-1v2h1a1 1 0 110 2h-1v2a2 2 0 01-2 2h-2v1a1 1 0 11-2 0v-1H9v1a1 1 0 11-2 0v-1H5a2 2 0 01-2-2v-2H2a1 1 0 110-2h1V9H2a1 1 0 010-2h1V5a2 2 0 012-2h2V2zM5 5h10v10H5V5z" clipRule="evenodd" />
                        </svg>
                        Connect Wallet
                      </span>
                      <span className="absolute inset-0 h-full w-full scale-0 rounded-md transition-all duration-300 group-hover:scale-100 group-hover:bg-white/10"></span>
                    </button>
                  </div>
                );
              }

              if (chain.unsupported) {
                return (
                  <button onClick={openChainModal} className="btn btn-error group relative overflow-hidden">
                    <span className="relative z-10 flex items-center">
                      Wrong network
                    </span>
                  </button>
                );
              }

              return (
                <div className="flex flex-col items-center gap-3">
                  <div className="relative glow-border overflow-hidden">
                    <div onClick={openAccountModal} className="address-pill flex items-center gap-2 py-2 px-4 cursor-pointer">
                      <span className="w-2 h-2 bg-secondary rounded-full animate-pulse"></span>
                      {account.displayName}
                      {account.displayBalance
                        ? ` (${account.displayBalance})`
                        : ''}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={openChainModal}
                      className="btn btn-outline btn-sm group flex items-center gap-2 text-sm"
                    >
                      {chain.hasIcon && (
                        <div
                          style={{
                            background: chain.iconBackground,
                            width: 18,
                            height: 18,
                            borderRadius: 999,
                            overflow: 'hidden',
                          }}
                        >
                          {chain.iconUrl && (
                            <img
                              alt={chain.name ?? 'Chain icon'}
                              src={chain.iconUrl}
                              style={{ width: 18, height: 18 }}
                            />
                          )}
                        </div>
                      )}
                      {chain.name}
                    </button>
                    
                    <button
                      onClick={openAccountModal}
                      className="btn btn-outline btn-sm group flex items-center gap-2 text-sm"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transition-transform group-hover:rotate-90" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V7.414a1 1 0 00-.293-.707L11.414 2.414A1 1 0 0010.707 2H4a1 1 0 00-1 1zm9 5a1 1 0 00-1-1H8a1 1 0 00-1 1v8a1 1 0 001 1h3a1 1 0 001-1v-3h-1v3H8V8h3v3h1V8z" clipRule="evenodd" />
                      </svg>
                      Account
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        );
      }}
    </RainbowKitConnectButton.Custom>
  );
}