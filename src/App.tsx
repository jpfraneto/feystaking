/**
 * FEY Protocol Staking Interface - Main App Component
 *
 * This is the main app component for the FEY Protocol staking interface.
 * It provides a cyberpunk-themed interface for staking FEY tokens and
 * earning protocol fees through the xFeyVault on Base network.
 *
 * Key features:
 * - Real-time balance display for FEY and xFEY
 * - Stake FEY to earn protocol fees
 * - Unstake xFEY to receive FEY + rewards
 * - Live APY and protocol statistics
 * - Cyberpunk terminal aesthetic
 */

import { useState, useEffect } from "react";
import { useAccount, useConnect } from "wagmi";
import { sdk } from "@farcaster/miniapp-sdk";
import clsx from "clsx";

import { useFeyBalances, useProtocolStats } from "./hooks/useFeyProtocol";
import {
  formatFeyAmount,
  formatXFeyAmount,
  formatPercentage,
  formatCurrency,
} from "./utils/formatting";
import StakeFlow from "./components/StakeFlow";
import UnstakeFlow from "./components/UnstakeFlow";
import WalletConnect from "./components/WalletConnect";
import LoadingSpinner from "./components/LoadingSpinner";

// =============================================================================
// MAIN APP COMPONENT
// =============================================================================

function App() {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [currentView, setCurrentView] = useState<"home" | "stake" | "unstake">(
    "home"
  );

  const { isConnected } = useAccount();
  const { balances, isLoading: balancesLoading } = useFeyBalances();
  const { stats, isLoading: statsLoading } = useProtocolStats();

  // Initialize Farcaster miniapp SDK
  useEffect(() => {
    const initializeSdk = async () => {
      try {
        // Wait for SDK to be ready
        console.log("Initializing SDK");
        await sdk.actions.ready();
        setIsSDKLoaded(true);
      } catch (error) {
        console.error("Failed to initialize SDK:", error);
        setIsSDKLoaded(true); // Continue even if SDK fails
      }
    };

    initializeSdk();
  }, []);

  // Show loading screen while SDK initializes
  if (!isSDKLoaded) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <p className="text-green-400 font-mono mt-4">
            INITIALIZING PROTOCOL...
          </p>
        </div>
      </div>
    );
  }

  // Main app layout with cyberpunk terminal theme
  return (
    <main className="min-h-screen bg-black text-green-400 font-mono relative overflow-hidden">
      {/* Background grid pattern for cyberpunk effect */}
      <div className="fixed inset-0 bg-black bg-grid-pattern opacity-20 pointer-events-none" />

      {/* Main content */}
      <div className="relative z-10 container mx-auto px-4 py-6 max-w-md">
        {/* Header */}
        <header className="text-center mb-8">
          <div className="inline-block border border-green-400 rounded px-4 py-2 mb-4">
            <h1 className="text-xl font-bold tracking-wider">FEY PROTOCOL</h1>
            <p className="text-xs opacity-80">STAKING VAULT</p>
          </div>

          {/* Live stats */}
          {stats && (
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="border border-green-400/30 rounded p-2">
                <p className="opacity-60">APY</p>
                <p className="text-lg font-bold text-green-300">
                  {formatPercentage(stats.apy)}
                </p>
              </div>
              <div className="border border-green-400/30 rounded p-2">
                <p className="opacity-60">STAKED</p>
                <p className="text-lg font-bold text-green-300">
                  {formatPercentage(stats.stakedPercentage)}
                </p>
              </div>
            </div>
          )}
        </header>

        {/* Connection status and balance display */}
        {!isConnected ? (
          <WalletConnect />
        ) : (
          <>
            {/* Balance display */}
            <div className="space-y-4 mb-8">
              <div className="border border-green-400 rounded p-4 bg-green-900/10">
                <h2 className="text-sm opacity-60 mb-2">YOUR BALANCES</h2>

                {balancesLoading ? (
                  <div className="flex items-center gap-2">
                    <LoadingSpinner size="sm" />
                    <span className="text-sm">LOADING BALANCES...</span>
                  </div>
                ) : balances ? (
                  <div className="space-y-3">
                    {/* FEY Balance */}
                    <div className="flex justify-between items-center">
                      <span className="text-sm">FEY Balance:</span>
                      <span className="text-lg font-bold">
                        {formatFeyAmount(balances.feyBalance)} FEY
                      </span>
                    </div>

                    {/* xFEY Balance */}
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Your Staked (xFEY):</span>
                      <span className="text-lg font-bold">
                        {formatXFeyAmount(balances.xFeyBalance)} xFEY
                      </span>
                    </div>

                    {/* FEY Value of xFEY */}
                    {balances.xFeyBalance > 0n && (
                      <div className="flex justify-between items-center border-t border-green-400/30 pt-2">
                        <span className="text-sm">Value in FEY:</span>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-300">
                            {formatFeyAmount(balances.feyValue)} FEY
                          </div>
                          <div className="text-xs opacity-60">
                            +
                            {formatPercentage(
                              ((Number(balances.feyValue) -
                                Number(balances.xFeyBalance)) /
                                Number(balances.xFeyBalance)) *
                                100
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm opacity-60">Failed to load balances</p>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-4">
              {currentView === "home" && (
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setCurrentView("stake")}
                    className={clsx(
                      "border border-green-400 rounded px-6 py-4",
                      "hover:bg-green-400/10 active:bg-green-400/20",
                      "transition-colors duration-200",
                      "font-bold text-sm tracking-wide"
                    )}
                    disabled={
                      balancesLoading || !balances || balances.feyBalance === 0n
                    }
                  >
                    STAKE FEY
                  </button>

                  <button
                    onClick={() => setCurrentView("unstake")}
                    className={clsx(
                      "border border-green-400 rounded px-6 py-4",
                      "hover:bg-green-400/10 active:bg-green-400/20",
                      "transition-colors duration-200",
                      "font-bold text-sm tracking-wide"
                    )}
                    disabled={
                      balancesLoading ||
                      !balances ||
                      balances.xFeyBalance === 0n
                    }
                  >
                    UNSTAKE xFEY
                  </button>
                </div>
              )}

              {/* Flow components */}
              {currentView === "stake" && (
                <StakeFlow
                  onBack={() => setCurrentView("home")}
                  balances={balances}
                />
              )}

              {currentView === "unstake" && (
                <UnstakeFlow
                  onBack={() => setCurrentView("home")}
                  balances={balances}
                />
              )}
            </div>
          </>
        )}

        {/* Footer info */}
        <footer className="mt-8 pt-4 border-t border-green-400/30 text-xs opacity-60 text-center">
          <p>FEY Protocol captures 20% of trading fees</p>
          <p>from all tokens launched on Base network</p>
        </footer>
      </div>
    </main>
  );
}

export default App;
