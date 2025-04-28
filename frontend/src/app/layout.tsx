'use client';

import './globals.css';
import '@rainbow-me/rainbowkit/styles.css';
import { Providers } from './providers';
import { getNetworkName } from '@/utils/environmentConfig';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // SVG for decorative elements
  const hexagonPattern = `
    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <pattern id="hexagons" width="50" height="43.4" patternUnits="userSpaceOnUse" patternTransform="scale(5) rotate(0)">
        <polygon points="24.8,22 37.3,29.2 37.3,43.7 24.8,50.9 12.4,43.7 12.4,29.2" fill="none" stroke="rgba(0, 215, 254, 0.2)" stroke-width="0.5" />
      </pattern>
      <rect width="100%" height="100%" fill="url(#hexagons)" />
    </svg>
  `;

  // Circuit board pattern
  const circuitPattern = `
    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" opacity="0.05">
      <defs>
        <pattern id="circuit" patternUnits="userSpaceOnUse" width="100" height="100">
          <path d="M20 10h60M20 50h10M80 50h10M30 10v80M70 10v80M10 30h20M70 30h20M10 70h20M70 70h20" stroke="#00D7FE" fill="none" stroke-width="1"/>
          <circle cx="30" cy="30" r="2" fill="#00D7FE"/>
          <circle cx="70" cy="30" r="2" fill="#00D7FE"/>
          <circle cx="30" cy="70" r="2" fill="#00D7FE"/>
          <circle cx="70" cy="70" r="2" fill="#00D7FE"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#circuit)"/>
    </svg>
  `;

  return (
    <html lang="en">
      <head>
        <title>WAVS Rewards</title>
        <meta name="description" content="Web3 reward distribution system" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Providers>
          {/* Background decorative elements */}
          <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-[-2]">
            <div className="blob-glow top-1/4 left-1/4" style={{background: 'radial-gradient(circle at center, rgba(0, 215, 254, 0.15), transparent 70%)'}}></div>
            <div className="blob-glow bottom-1/4 right-1/4" style={{background: 'radial-gradient(circle at center, rgba(156, 124, 252, 0.1), transparent 70%)'}}></div>
            <div className="blob-glow top-3/4 right-1/3" style={{background: 'radial-gradient(circle at center, rgba(0, 255, 178, 0.1), transparent 70%)'}}></div>
            <div dangerouslySetInnerHTML={{ __html: hexagonPattern }} className="fixed top-0 left-0 w-full h-full z-[-2] opacity-5" />
          </div>

          <div className="min-h-screen relative z-0 flex flex-col">
            {/* Header with glowing border */}
            <header className="bg-card bg-opacity-90 backdrop-blur-sm border-b border-primary/10 sticky top-0 z-10 py-4">
              <div className="container mx-auto px-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-black font-bold">W</div>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">WAVS Rewards</h1>
                  </div>
                  
                  {/* Navigation */}
                  <div className="flex items-center gap-4">
                    <a 
                      href="/" 
                      className="text-gray-300 hover:text-primary transition-colors"
                    >
                      Home
                    </a>
                    <a 
                      href="/admin" 
                      className="text-gray-300 hover:text-primary transition-colors flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                      </svg>
                      Admin
                    </a>
                    
                    {/* Network indicator */}
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                      <span className="w-2 h-2 bg-secondary rounded-full mr-2 animate-pulse"></span>
                      {getNetworkName()}
                    </span>
                  </div>
                </div>
              </div>
            </header>

            {/* Circuit board pattern under content */}
            <div dangerouslySetInnerHTML={{ __html: circuitPattern }} className="fixed top-0 left-0 w-full h-full z-[-1]" />

            {/* Main content */}
            <main className="container mx-auto px-4 py-8 flex-grow relative z-0">{children}</main>

            {/* Footer with gradient border top */}
            <footer className="bg-card bg-opacity-80 backdrop-blur-sm border-t border-primary/10 mt-auto relative z-0">
              <div className="container mx-auto px-4 py-6">
                <div className="flex flex-col md:flex-row justify-between items-center">
                  <p className="text-gray-400 text-sm">
                    WAVS Reward Distribution
                  </p>
                  <div className="flex space-x-4 mt-4 md:mt-0">
                    <span className="text-xs text-primary/70">Powered by WAVS</span>
                  </div>
                </div>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}