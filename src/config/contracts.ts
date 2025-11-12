/**
 * FEY Protocol Contract Configuration
 * 
 * This file contains all contract addresses, ABIs, and configuration
 * for interacting with the FEY Protocol staking system on Base network.
 * 
 * Key contracts:
 * - FEY Token: ERC20 token that users stake
 * - xFeyVault: ERC4626 vault that receives FEY and returns xFEY shares
 */

import { Address } from 'viem';

// =============================================================================
// NETWORK CONFIGURATION
// =============================================================================

export const CHAIN_ID = 8453; // Base Mainnet
export const CHAIN_NAME = 'base';

// RPC URLs for Base network
export const BASE_RPC = 'https://mainnet.base.org';
export const BASE_RPC_BACKUP = 'https://base.publicnode.com';

// Block Explorer
export const BASE_EXPLORER = 'https://basescan.org';

// =============================================================================
// CONTRACT ADDRESSES (Base Mainnet)
// =============================================================================

export const FEY_TOKEN_ADDRESS: Address = '0xD09cf0982A32DD6856e12d6BF2F08A822eA5D91D';
export const XFEY_VAULT_ADDRESS: Address = '0x72f5565Ab147105614ca4Eb83ecF15f751Fd8C50';
export const FACTORY_ADDRESS: Address = '0x5B409184204b86f708d3aeBb3cad3F02835f68cC';
export const FEE_LOCKER_ADDRESS: Address = '0xf739FC4094F3Df0a1Be08E2925b609F3C3Aa13c6';

// =============================================================================
// TOKEN CONFIGURATION
// =============================================================================

export const FEY_DECIMALS = 18;
export const XFEY_DECIMALS = 18;

// =============================================================================
// CONTRACT ABIS
// =============================================================================

/**
 * ERC20 ABI for FEY token interactions
 * Used for: balance checks, approvals, allowance checks
 */
export const ERC20_ABI = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'name',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

/**
 * ERC4626 Vault ABI for xFeyVault interactions
 * Used for: staking (deposit), unstaking (redeem), balance checks, conversions
 */
export const VAULT_ABI = [
  // ERC20 functions for xFEY shares
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  
  // ERC4626 core functions
  {
    inputs: [],
    name: 'totalAssets',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'shares', type: 'uint256' }],
    name: 'convertToAssets',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'assets', type: 'uint256' }],
    name: 'convertToShares',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'shares', type: 'uint256' }],
    name: 'previewRedeem',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'assets', type: 'uint256' }],
    name: 'previewDeposit',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  
  // Core staking functions
  {
    inputs: [
      { name: 'assets', type: 'uint256' },
      { name: 'receiver', type: 'address' },
    ],
    name: 'deposit',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'shares', type: 'uint256' },
      { name: 'receiver', type: 'address' },
      { name: 'owner', type: 'address' },
    ],
    name: 'redeem',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  
  // Max functions
  {
    inputs: [{ name: 'owner', type: 'address' }],
    name: 'maxDeposit',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'owner', type: 'address' }],
    name: 'maxRedeem',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// =============================================================================
// CONTRACT INSTANCES CONFIGURATION
// =============================================================================

/**
 * Contract configuration objects for use with wagmi/viem
 */
export const FEY_TOKEN_CONFIG = {
  address: FEY_TOKEN_ADDRESS,
  abi: ERC20_ABI,
} as const;

export const XFEY_VAULT_CONFIG = {
  address: XFEY_VAULT_ADDRESS,
  abi: VAULT_ABI,
} as const;

// =============================================================================
// UTILITY CONSTANTS
// =============================================================================

// Maximum uint256 value for approvals
export const MAX_UINT256 = 2n ** 256n - 1n;

// Minimum amounts for validation
export const MIN_STAKE_AMOUNT = 1000000000000000n; // 0.001 FEY
export const MIN_UNSTAKE_AMOUNT = 1000000000000000n; // 0.001 xFEY