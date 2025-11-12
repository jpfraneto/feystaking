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
      <div className="border border-green-400 rounded p-2 bg-green-900/10 text-center">
        <p className="text-xs opacity-60 mb-1">WALLET CONNECTED</p>
        <p className="font-mono text-[10px] text-green-300">
          {address.slice(0, 6)}...{address.slice(-4)}
        </p>
      </div>
    );
  }

  return (
    <div className="text-center space-y-2">
      {/* Terminal-style header */}
      <div className="border border-green-400 rounded p-2 bg-green-900/10">
        <h2 className="text-sm font-bold mb-1">WALLET ACCESS REQUIRED</h2>
        <p className="text-xs opacity-80">
          Connect your wallet to start staking FEY tokens
        </p>
      </div>

      {/* Connection button */}
      <button
        onClick={handleConnect}
        disabled={isPending || isConnecting}
        className={clsx(
          'w-full border border-green-400 rounded px-3 py-2',
          'hover:bg-green-400/10 active:bg-green-400/20',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'transition-colors duration-200',
          'font-bold text-xs tracking-wide'
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
        <div className="border border-red-400 rounded p-1.5 bg-red-900/10 text-red-400">
          <p className="text-[10px] font-mono">ERROR: {error.message}</p>
        </div>
      )}

      {/* Information about the protocol */}
      <div className="border border-green-400/30 rounded p-2 text-[9px] opacity-60">
        <h3 className="font-bold mb-1">About FEY Protocol:</h3>
        <ul className="space-y-0.5 text-left">
          <li>• Stake FEY → receive xFEY shares</li>
          <li>• Earn 20% of protocol trading fees</li>
          <li>• Unstake anytime for FEY + rewards</li>
        </ul>
      </div>
    </div>
  );
}