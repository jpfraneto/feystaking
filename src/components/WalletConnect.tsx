/**
 * Wallet Connect Component
 * 
 * Handles wallet connection for the FEY Protocol staking interface.
 * Uses the Farcaster miniapp connector for seamless wallet integration.
 */

import { useAccount, useConnect } from 'wagmi';
import clsx from 'clsx';
import LoadingSpinner from './LoadingSpinner';

/**
 * Component to handle wallet connection in Farcaster miniapp
 */
export default function WalletConnect() {
  const { isConnected, isConnecting, address } = useAccount();
  const { connect, connectors, isPending, error } = useConnect();

  // Get the Farcaster miniapp connector
  const farcasterConnector = connectors?.[0];

  const handleConnect = () => {
    if (farcasterConnector) {
      connect({ connector: farcasterConnector });
    }
  };

  // If already connected, show connected state
  if (isConnected && address) {
    return (
      <div className="border border-green-400 rounded p-4 bg-green-900/10 text-center">
        <p className="text-sm opacity-60 mb-2">WALLET CONNECTED</p>
        <p className="font-mono text-xs text-green-300">
          {address.slice(0, 6)}...{address.slice(-4)}
        </p>
      </div>
    );
  }

  return (
    <div className="text-center space-y-6">
      {/* Terminal-style header */}
      <div className="border border-green-400 rounded p-4 bg-green-900/10">
        <h2 className="text-lg font-bold mb-2">WALLET ACCESS REQUIRED</h2>
        <p className="text-sm opacity-80">
          Connect your wallet to start staking FEY tokens and earning protocol fees
        </p>
      </div>

      {/* Connection button */}
      <button
        onClick={handleConnect}
        disabled={isPending || isConnecting}
        className={clsx(
          'w-full border border-green-400 rounded px-6 py-4',
          'hover:bg-green-400/10 active:bg-green-400/20',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'transition-colors duration-200',
          'font-bold text-sm tracking-wide'
        )}
      >
        {isPending || isConnecting ? (
          <div className="flex items-center justify-center gap-2">
            <LoadingSpinner size="sm" />
            <span>CONNECTING...</span>
          </div>
        ) : (
          'CONNECT WALLET'
        )}
      </button>

      {/* Error display */}
      {error && (
        <div className="border border-red-400 rounded p-3 bg-red-900/10 text-red-400">
          <p className="text-xs font-mono">ERROR: {error.message}</p>
        </div>
      )}

      {/* Information about the protocol */}
      <div className="border border-green-400/30 rounded p-4 text-xs opacity-60">
        <h3 className="font-bold mb-2">About FEY Protocol Staking:</h3>
        <ul className="space-y-1 text-left">
          <li>• Stake FEY tokens to receive xFEY shares</li>
          <li>• Earn 20% of all protocol trading fees</li>
          <li>• Current APY: ~34.2%</li>
          <li>• Unstake anytime to receive FEY + rewards</li>
          <li>• All transactions happen on Base network</li>
        </ul>
      </div>
    </div>
  );
}