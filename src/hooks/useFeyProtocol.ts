/**
 * FEY Protocol React Hooks
 * 
 * This file contains React hooks for interacting with the FEY Protocol
 * smart contracts on Base network. These hooks provide a clean interface
 * for staking, unstaking, and fetching protocol data.
 */

import { useAccount, useReadContract, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useState, useMemo } from 'react';
import { formatUnits } from 'viem';
import {
  FEY_TOKEN_CONFIG,
  XFEY_VAULT_CONFIG,
  XFEY_VAULT_ADDRESS,
  MAX_UINT256,
  FEY_DECIMALS,
} from '../config/contracts';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface UserBalances {
  feyBalance: bigint;
  xFeyBalance: bigint;
  feyValue: bigint;
  allowance: bigint;
  isApproved: boolean;
}

export interface ProtocolStats {
  totalAssets: bigint;
  totalSupply: bigint;
  sharePrice: number;
  stakedPercentage: number;
  apy: number;
}

export interface TransactionState {
  isLoading: boolean;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  txHash?: string;
  error?: string;
}

// =============================================================================
// USER BALANCE HOOK
// =============================================================================

/**
 * Hook to fetch user's FEY and xFEY balances
 * @returns User balance data and loading state
 */
export function useFeyBalances() {
  const { address } = useAccount();

  // Fetch multiple contract reads in parallel for efficiency
  const { data, isLoading, error, refetch } = useReadContracts({
    contracts: [
      // User's FEY balance
      {
        ...FEY_TOKEN_CONFIG,
        functionName: 'balanceOf',
        args: address ? [address] : undefined,
      },
      // User's xFEY balance
      {
        ...XFEY_VAULT_CONFIG,
        functionName: 'balanceOf',
        args: address ? [address] : undefined,
      },
      // User's FEY allowance for vault
      {
        ...FEY_TOKEN_CONFIG,
        functionName: 'allowance',
        args: address ? [address, XFEY_VAULT_ADDRESS] : undefined,
      },
    ],
    query: {
      enabled: !!address,
      // Refetch every 5 seconds to keep balances updated
      refetchInterval: 5000,
    },
  });

  // Convert xFEY to FEY value
  const { data: feyValue } = useReadContract({
    ...XFEY_VAULT_CONFIG,
    functionName: 'convertToAssets',
    args: data?.[1]?.result ? [data[1].result as bigint] : [0n],
    query: {
      enabled: !!data?.[1]?.result,
    },
  });

  const balances: UserBalances | null = useMemo(() => {
    if (!data || !address) return null;

    const [feyResult, xFeyResult, allowanceResult] = data;
    
    const feyBalance = feyResult.result as bigint || 0n;
    const xFeyBalance = xFeyResult.result as bigint || 0n;
    const allowance = allowanceResult.result as bigint || 0n;

    return {
      feyBalance,
      xFeyBalance,
      feyValue: feyValue || 0n,
      allowance,
      isApproved: allowance > 0n,
    };
  }, [data, feyValue, address]);

  return {
    balances,
    isLoading,
    error,
    refetch,
  };
}

// =============================================================================
// PROTOCOL STATS HOOK
// =============================================================================

/**
 * Hook to fetch protocol-wide statistics
 * @returns Protocol stats like total assets, APY, etc.
 */
export function useProtocolStats() {
  const { data, isLoading, error } = useReadContracts({
    contracts: [
      // Total FEY assets in vault
      {
        ...XFEY_VAULT_CONFIG,
        functionName: 'totalAssets',
      },
      // Total FEY supply
      {
        ...FEY_TOKEN_CONFIG,
        functionName: 'totalSupply',
      },
      // Total xFEY shares
      {
        ...XFEY_VAULT_CONFIG,
        functionName: 'totalSupply',
      },
    ],
    query: {
      // Refetch every 30 seconds for protocol stats
      refetchInterval: 30000,
    },
  });

  const stats: ProtocolStats | null = useMemo(() => {
    if (!data) return null;

    const [assetsResult, supplyResult, sharesResult] = data;
    
    const totalAssets = assetsResult.result as bigint || 0n;
    const totalSupply = supplyResult.result as bigint || 0n;
    const totalShares = sharesResult.result as bigint || 0n;

    // Calculate share price (FEY per xFEY)
    const sharePrice = totalShares > 0n 
      ? Number(formatUnits(totalAssets, FEY_DECIMALS)) / Number(formatUnits(totalShares, FEY_DECIMALS))
      : 1;

    // Calculate percentage of total supply that's staked
    const stakedPercentage = totalSupply > 0n
      ? (Number(formatUnits(totalAssets, FEY_DECIMALS)) / Number(formatUnits(totalSupply, FEY_DECIMALS))) * 100
      : 0;

    return {
      totalAssets,
      totalSupply,
      sharePrice,
      stakedPercentage,
      apy: 34.2, // This would be calculated from historical data in production
    };
  }, [data]);

  return {
    stats,
    isLoading,
    error,
  };
}

// =============================================================================
// APPROVAL HOOK
// =============================================================================

/**
 * Hook to handle FEY token approval for the vault
 * @returns Approval transaction functions and state
 */
export function useFeyApproval() {
  const [txState, setTxState] = useState<TransactionState>({
    isLoading: false,
    isPending: false,
    isSuccess: false,
    isError: false,
  });

  const { writeContract } = useWriteContract({
    mutation: {
      onMutate: () => {
        setTxState({
          isLoading: true,
          isPending: false,
          isSuccess: false,
          isError: false,
        });
      },
      onSuccess: (txHash) => {
        setTxState(prev => ({
          ...prev,
          isPending: true,
          txHash,
        }));
      },
      onError: (error) => {
        setTxState({
          isLoading: false,
          isPending: false,
          isSuccess: false,
          isError: true,
          error: error.message,
        });
      },
    },
  });

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txState.txHash as `0x${string}`,
    query: {
      enabled: !!txState.txHash,
    },
  });

  // Update state when transaction is confirmed
  if (isConfirmed && !txState.isSuccess) {
    setTxState(prev => ({
      ...prev,
      isLoading: false,
      isPending: false,
      isSuccess: true,
    }));
  }

  const approve = async (amount?: bigint) => {
    try {
      await writeContract({
        ...FEY_TOKEN_CONFIG,
        functionName: 'approve',
        args: [XFEY_VAULT_ADDRESS, amount || MAX_UINT256],
      });
    } catch (error) {
      console.error('Approval failed:', error);
    }
  };

  return {
    approve,
    ...txState,
    isPending: txState.isPending || isConfirming,
  };
}

// =============================================================================
// STAKING HOOK
// =============================================================================

/**
 * Hook to handle FEY staking (deposit into vault)
 * @returns Staking transaction functions and state
 */
export function useFeyStaking() {
  const { address } = useAccount();
  const [txState, setTxState] = useState<TransactionState>({
    isLoading: false,
    isPending: false,
    isSuccess: false,
    isError: false,
  });

  const { writeContract } = useWriteContract({
    mutation: {
      onMutate: () => {
        setTxState({
          isLoading: true,
          isPending: false,
          isSuccess: false,
          isError: false,
        });
      },
      onSuccess: (txHash) => {
        setTxState(prev => ({
          ...prev,
          isPending: true,
          txHash,
        }));
      },
      onError: (error) => {
        setTxState({
          isLoading: false,
          isPending: false,
          isSuccess: false,
          isError: true,
          error: error.message,
        });
      },
    },
  });

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txState.txHash as `0x${string}`,
    query: {
      enabled: !!txState.txHash,
    },
  });

  // Update state when transaction is confirmed
  if (isConfirmed && !txState.isSuccess) {
    setTxState(prev => ({
      ...prev,
      isLoading: false,
      isPending: false,
      isSuccess: true,
    }));
  }

  const stake = async (amount: bigint) => {
    if (!address) throw new Error('Wallet not connected');
    
    try {
      await writeContract({
        ...XFEY_VAULT_CONFIG,
        functionName: 'deposit',
        args: [amount, address],
      });
    } catch (error) {
      console.error('Staking failed:', error);
    }
  };

  return {
    stake,
    ...txState,
    isPending: txState.isPending || isConfirming,
  };
}

// =============================================================================
// UNSTAKING HOOK
// =============================================================================

/**
 * Hook to handle xFEY unstaking (redeem from vault)
 * @returns Unstaking transaction functions and state
 */
export function useFeyUnstaking() {
  const { address } = useAccount();
  const [txState, setTxState] = useState<TransactionState>({
    isLoading: false,
    isPending: false,
    isSuccess: false,
    isError: false,
  });

  const { writeContract } = useWriteContract({
    mutation: {
      onMutate: () => {
        setTxState({
          isLoading: true,
          isPending: false,
          isSuccess: false,
          isError: false,
        });
      },
      onSuccess: (txHash) => {
        setTxState(prev => ({
          ...prev,
          isPending: true,
          txHash,
        }));
      },
      onError: (error) => {
        setTxState({
          isLoading: false,
          isPending: false,
          isSuccess: false,
          isError: true,
          error: error.message,
        });
      },
    },
  });

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txState.txHash as `0x${string}`,
    query: {
      enabled: !!txState.txHash,
    },
  });

  // Update state when transaction is confirmed
  if (isConfirmed && !txState.isSuccess) {
    setTxState(prev => ({
      ...prev,
      isLoading: false,
      isPending: false,
      isSuccess: true,
    }));
  }

  const unstake = async (shares: bigint) => {
    if (!address) throw new Error('Wallet not connected');
    
    try {
      await writeContract({
        ...XFEY_VAULT_CONFIG,
        functionName: 'redeem',
        args: [shares, address, address],
      });
    } catch (error) {
      console.error('Unstaking failed:', error);
    }
  };

  const previewUnstake = async (shares: bigint): Promise<bigint> => {
    // This would use the previewRedeem function
    // For now, we can approximate using convertToAssets
    return shares; // Simplified - in reality use previewRedeem
  };

  return {
    unstake,
    previewUnstake,
    ...txState,
    isPending: txState.isPending || isConfirming,
  };
}