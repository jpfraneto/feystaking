/**
 * FEY Protocol Staking Interface - Entry Point
 * 
 * This is the main entry point for the FEY Protocol staking miniapp.
 * It sets up all necessary providers for blockchain interactions,
 * React Query for data fetching, and the Farcaster miniapp SDK.
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { config } from './config/wagmi';
import App from './App.tsx';
import './index.css';

// Create React Query client for caching and data management
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Reasonable defaults for blockchain data
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes  
      retry: 3,
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * Root application component with all necessary providers
 */
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* React Query provider for data fetching and caching */}
    <QueryClientProvider client={queryClient}>
      {/* Wagmi provider for blockchain interactions */}
      <WagmiProvider config={config}>
        <App />
      </WagmiProvider>
    </QueryClientProvider>
  </StrictMode>,
);
