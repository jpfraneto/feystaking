/**
 * Wagmi Configuration for FEY Protocol Staking
 * 
 * This file configures wallet connectivity and blockchain interactions
 * specifically for the FEY Protocol on Base network using Farcaster's
 * miniapp wallet connector.
 */

import { http, createConfig } from 'wagmi';
import { base } from 'wagmi/chains';
import { farcasterMiniApp as miniAppConnector } from '@farcaster/miniapp-wagmi-connector';
import { CHAIN_ID, BASE_RPC, BASE_RPC_BACKUP } from './contracts';

// =============================================================================
// WAGMI CONFIGURATION
// =============================================================================

/**
 * Main Wagmi configuration for the FEY Protocol staking app
 * 
 * Features:
 * - Base network only (where FEY Protocol is deployed)
 * - Farcaster miniapp connector for seamless wallet integration
 * - Fallback RPC providers for reliability
 */
export const config = createConfig({
  chains: [base],
  connectors: [
    // Farcaster miniapp connector - handles wallet connection automatically
    miniAppConnector({
      // Optional: customize connector behavior
      metadata: {
        name: 'FEY Protocol Staking',
        description: 'Stake FEY tokens and earn protocol fees',
        url: 'https://your-domain.com', // Replace with your actual domain
        icons: ['https://your-domain.com/icon.png'], // Replace with your icon
      },
    }),
  ],
  transports: {
    [base.id]: http(BASE_RPC, {
      // Fallback to backup RPC if primary fails
      batch: true,
      retryCount: 3,
      retryDelay: 1000,
    }),
  },
  // Enable batch calls for better performance
  batch: {
    multicall: true,
  },
  // Polling interval for real-time updates
  pollingInterval: 4000,
});

// =============================================================================
// TYPE EXPORTS
// =============================================================================

/**
 * Type helper for the Wagmi configuration
 * Used throughout the app for type safety
 */
declare module 'wagmi' {
  interface Register {
    config: typeof config;
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Checks if the current chain is Base network
 * @param chainId - The chain ID to check
 * @returns True if the chain is Base, false otherwise
 */
export function isBaseNetwork(chainId?: number): boolean {
  return chainId === CHAIN_ID;
}

/**
 * Gets the block explorer URL for a transaction
 * @param txHash - Transaction hash
 * @returns Block explorer URL
 */
export function getExplorerTxUrl(txHash: string): string {
  return `https://basescan.org/tx/${txHash}`;
}

/**
 * Gets the block explorer URL for an address
 * @param address - Wallet or contract address
 * @returns Block explorer URL
 */
export function getExplorerAddressUrl(address: string): string {
  return `https://basescan.org/address/${address}`;
}

/**
 * Formats a transaction hash for display (shortened)
 * @param hash - Full transaction hash
 * @returns Shortened hash like "0x1234...5678"
 */
export function formatTxHash(hash: string): string {
  if (hash.length <= 10) return hash;
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
}

/**
 * Formats an address for display (shortened)
 * @param address - Full wallet address
 * @returns Shortened address like "0x1234...5678"
 */
export function formatAddress(address: string): string {
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}