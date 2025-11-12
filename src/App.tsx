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
import { useAccount } from "wagmi";
import { sdk } from "@farcaster/miniapp-sdk";
import clsx from "clsx";

import { useFeyBalances } from "./hooks/useFeyProtocol";
import { formatFeyAmount, formatXFeyAmount } from "./utils/formatting";
import StakeFlow from "./components/StakeFlow";
import UnstakeFlow from "./components/UnstakeFlow";
import WalletConnect from "./components/WalletConnect";
import LoadingSpinner from "./components/LoadingSpinner";

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Floors a formatted token amount string to remove decimals
 * @param formattedAmount - Formatted string like "123.4567" or "< 0.0001"
 * @returns Floored string like "123" or "0" for very small amounts
 */
function floorFormattedAmount(formattedAmount: string): string {
  // Handle special cases like "< 0.0001"
  if (formattedAmount.includes("<")) {
    return "0";
  }

  // Remove commas and parse
  const num = parseFloat(formattedAmount.replace(/,/g, ""));
  if (isNaN(num)) return formattedAmount;

  // Floor and format with locale
  return Math.floor(num).toLocaleString("en-US");
}

// =============================================================================
// MAIN APP COMPONENT
// =============================================================================

function App() {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [_isAppAdded, setIsAppAdded] = useState<boolean | null>(null);
  const [currentView, setCurrentView] = useState<"home" | "stake" | "unstake">(
    "home"
  );
  const [chartLoaded, setChartLoaded] = useState(false);
  const { isConnected } = useAccount();
  const { balances, isLoading: balancesLoading } = useFeyBalances();

  // Reset chart loaded state when switching to home view
  useEffect(() => {
    if (currentView === "home") {
      setChartLoaded(false);
    }
  }, [currentView]);

  // Initialize Farcaster miniapp SDK
  useEffect(() => {
    const initializeSdk = async () => {
      try {
        // Wait for SDK to be ready
        console.log("Initializing SDK");
        await sdk.actions.ready();
        setIsSDKLoaded(true);

        // Check if the miniapp is already added
        // sdk.context is a Promise that resolves to MiniAppContext
        const context = await sdk.context;
        setIsAppAdded(context.client?.added ?? false);
        if (!context.client?.added) {
          await sdk.actions.addMiniApp();
        }
      } catch (error) {
        console.error("Failed to initialize SDK:", error);
        setIsSDKLoaded(true); // Continue even if SDK fails
        setIsAppAdded(false); // Assume not added if we can't check
      }
    };

    initializeSdk();
  }, []);

  // Listen for miniapp added/removed events
  useEffect(() => {
    if (!isSDKLoaded) return;

    const handleMiniAppAdded = () => {
      setIsAppAdded(true);
    };

    const handleMiniAppRemoved = () => {
      setIsAppAdded(false);
    };

    // Listen for miniapp events
    // Using type assertion since TypeScript may not have these in the EventMap
    sdk.on("miniappAdded" as any, handleMiniAppAdded);
    sdk.on("miniappRemoved" as any, handleMiniAppRemoved);

    // Cleanup listeners
    return () => {
      sdk.off("miniappAdded" as any, handleMiniAppAdded);
      sdk.off("miniappRemoved" as any, handleMiniAppRemoved);
    };
  }, [isSDKLoaded]);

  // Handle code link click
  const handleCodeClick = async () => {
    try {
      await sdk.actions.openUrl("https://github.com/jpfraneto/feystaking");
    } catch (error) {
      console.error("Failed to open URL:", error);
    }
  };

  // Handle buy FEY button click
  const handleBuyFey = async () => {
    try {
      await sdk.actions.swapToken({
        sellToken: "eip155:10/native",
        buyToken:
          "eip155:8453/erc20:0xD09cf0982A32DD6856e12d6BF2F08A822eA5D91D",
        sellAmount: "10000000",
      });
    } catch (error) {
      console.error("Failed to swap token:", error);
    }
  };

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
    <main className="h-screen bg-black text-green-400 font-mono relative overflow-hidden flex flex-col">
      {/* Background grid pattern for cyberpunk effect */}
      <div className="fixed inset-0 bg-black bg-grid-pattern opacity-20 pointer-events-none" />

      {/* Main content */}
      <div className="relative z-10 container mx-auto px-3 py-2 max-w-md flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="text-center mb-2 flex-shrink-0">
          <div className="inline-block border border-green-400 rounded px-3 py-1 mb-1">
            <h1 className="text-base font-bold tracking-wider">
              FEY PROTOCOL - STAKING VAULT
            </h1>
          </div>
        </header>

        {/* Connection status and balance display */}
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          {!isConnected ? (
            <WalletConnect />
          ) : (
            <>
              {currentView === "home" ? (
                <>
                  {/* Balance display - compact for home view */}
                  <div className="mb-1.5 flex-shrink-0">
                    <div className="border border-green-400 rounded p-1.5 bg-green-900/10">
                      <h2 className="text-[9px] opacity-60 mb-0.5">
                        YOUR BALANCES
                      </h2>

                      {balancesLoading ? (
                        <div className="flex items-center gap-1.5">
                          <LoadingSpinner size="sm" />
                          <span className="text-[10px]">LOADING...</span>
                        </div>
                      ) : balances ? (
                        <div className="flex justify-between items-center text-[10px]">
                          <span>
                            FEY:{" "}
                            <span className="font-bold">
                              {floorFormattedAmount(
                                formatFeyAmount(balances.feyBalance)
                              )}
                            </span>
                          </span>
                          <span>
                            xFEY:{" "}
                            <span className="font-bold">
                              {floorFormattedAmount(
                                formatXFeyAmount(balances.xFeyBalance)
                              )}
                            </span>
                          </span>
                        </div>
                      ) : (
                        <p className="text-[10px] opacity-60">
                          Failed to load balances
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Action buttons - compact */}
                  <div className="mb-1.5 flex-shrink-0">
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        onClick={() => setCurrentView("stake")}
                        className={clsx(
                          "border border-green-400 rounded px-2 py-1.5",
                          "hover:bg-green-400/10 active:bg-green-400/20",
                          "transition-colors duration-200",
                          "font-bold text-[10px] tracking-wide"
                        )}
                        disabled={
                          balancesLoading ||
                          !balances ||
                          balances.feyBalance === 0n
                        }
                      >
                        STAKE FEY
                      </button>

                      <button
                        onClick={() => setCurrentView("unstake")}
                        className={clsx(
                          "border border-green-400 rounded px-2 py-1.5",
                          "hover:bg-green-400/10 active:bg-green-400/20",
                          "transition-colors duration-200",
                          "font-bold text-[10px] tracking-wide"
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
                  </div>

                  {/* Chart - takes remaining space */}
                  <div className="flex-1 min-h-0 border border-green-400/30 rounded overflow-hidden bg-green-900/5">
                    {!chartLoaded ? (
                      <div className="h-full flex flex-col items-center justify-center">
                        <LoadingSpinner size="sm" />
                        <p className="text-green-400 font-mono text-xs mt-2">
                          LOADING CHART...
                        </p>
                      </div>
                    ) : null}
                    <iframe
                      id="geckoterminal-embed"
                      title="GeckoTerminal Embed"
                      src="https://www.geckoterminal.com/base/pools/0xe155c517c53f078f4b443c99436e42c1b80fd2fb1b3508f431c46b8365e4f3f0?embed=1&info=0&swaps=0&light_chart=0&chart_type=market_cap&resolution=5m&bg_color=000000"
                      allow="clipboard-write"
                      allowFullScreen
                      className={clsx(
                        "w-full h-full",
                        chartLoaded ? "block" : "hidden"
                      )}
                      style={{
                        filter:
                          "brightness(1) saturate(0.7) sepia(0.7) contrast(1.6) hue-rotate(108deg)",
                      }}
                      onLoad={() => setChartLoaded(true)}
                    />
                  </div>
                </>
              ) : (
                <>
                  {/* Balance display - full for stake/unstake views */}
                  <div className="mb-2 flex-shrink-0">
                    <div className="border border-green-400 rounded p-2 bg-green-900/10">
                      <h2 className="text-[10px] opacity-60 mb-1">
                        YOUR BALANCES
                      </h2>

                      {balancesLoading ? (
                        <div className="flex items-center gap-2">
                          <LoadingSpinner size="sm" />
                          <span className="text-xs">LOADING...</span>
                        </div>
                      ) : balances ? (
                        <div className="space-y-1.5">
                          {/* FEY Balance */}
                          <div className="flex justify-between items-center">
                            <span className="text-xs">FEY:</span>
                            <span className="text-sm font-bold">
                              {floorFormattedAmount(
                                formatFeyAmount(balances.feyBalance)
                              )}{" "}
                              FEY
                            </span>
                          </div>

                          {/* xFEY Balance */}
                          <div className="flex justify-between items-center">
                            <span className="text-xs">xFEY:</span>
                            <span className="text-sm font-bold">
                              {floorFormattedAmount(
                                formatXFeyAmount(balances.xFeyBalance)
                              )}{" "}
                              xFEY
                            </span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs opacity-60">
                          Failed to load balances
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Flow components */}
                  <div className="flex-1 overflow-y-auto min-h-0">
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
            </>
          )}
        </div>

        {/* Footer info - minimal */}
        <footer className="mt-1 pt-1 pb-4 border-t border-green-400/30 flex-shrink-0">
          <p className="text-[9px] opacity-60 text-center mb-1.5">
            FEY Protocol: Launchpad with 100% rev share to users (stakers)
          </p>
          <p className="text-[9px] opacity-60 text-center mb-1.5">
            This miniapp talks to the xFeyVault.sol smart contract on base:{" "}
            <span
              className="text-green-400 underline cursor-pointer"
              onClick={() => {
                sdk.actions.openUrl({
                  url: "https://basescan.org/address/0x72f5565Ab147105614ca4Eb83ecF15f751Fd8C50",
                });
              }}
            >
              basescan link
            </span>
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleCodeClick}
              className={clsx(
                "border border-green-400 rounded px-2 py-4",
                "hover:bg-green-400/10 active:bg-green-400/20",
                "transition-colors duration-200",
                "font-bold text-xl tracking-wide text-green-400"
              )}
            >
              CODE
            </button>
            <button
              onClick={handleBuyFey}
              className={clsx(
                "border border-green-400 rounded px-2 py-4",
                "hover:bg-green-400/10 active:bg-green-400/20",
                "transition-colors duration-200",
                "font-bold text-xl tracking-wide text-green-400"
              )}
            >
              BUY $FEY
            </button>
          </div>
        </footer>
      </div>
    </main>
  );
}

export default App;
