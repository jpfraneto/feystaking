/**
 * Unstake Flow Component
 *
 * Handles the complete unstaking flow for xFEY shares:
 * 1. Input xFEY amount validation
 * 2. Preview FEY amount to be received
 * 3. Redeem transaction
 * 4. Success confirmation
 */

import { useState, useEffect } from "react";
import { ArrowLeft, AlertCircle, CheckCircle, TrendingUp } from "lucide-react";
import clsx from "clsx";

import { UserBalances } from "../hooks/useFeyProtocol";
import { useFeyUnstaking } from "../hooks/useFeyProtocol";
import {
  formatFeyAmount,
  formatXFeyAmount,
  parseTokenAmount,
  sanitizeNumberInput,
  isValidNumberInput,
  formatPercentageChange,
} from "../utils/formatting";
import { getExplorerTxUrl } from "../config/wagmi";
import LoadingSpinner from "./LoadingSpinner";

interface UnstakeFlowProps {
  onBack: () => void;
  balances: UserBalances | null;
}

type UnstakeStep = "input" | "unstaking" | "success";

/**
 * Complete unstaking flow component
 */
export default function UnstakeFlow({ onBack, balances }: UnstakeFlowProps) {
  const [currentStep, setCurrentStep] = useState<UnstakeStep>("input");
  const [unstakeAmount, setUnstakeAmount] = useState("");
  const [unstakeAmountWei, setUnstakeAmountWei] = useState(0n);

  const unstaking = useFeyUnstaking();

  useEffect(() => {
    if (unstaking.isSuccess && currentStep === "unstaking") {
      setCurrentStep("success");
    }
  }, [unstaking.isSuccess, currentStep]);

  // Handle amount input changes
  const handleAmountChange = (value: string) => {
    const sanitized = sanitizeNumberInput(value);

    if (isValidNumberInput(sanitized) && sanitized !== "") {
      // Floor the input value before parsing to avoid precision issues
      const num = parseFloat(sanitized.replace(/,/g, ""));
      if (!isNaN(num)) {
        const flooredNum = Math.floor(num);
        const flooredString = flooredNum.toString();
        setUnstakeAmount(flooredString);

        // Parse the floored value
        const amount = parseTokenAmount(flooredString);
        // Ensure it doesn't exceed balance
        const finalAmount =
          balances && amount > balances.xFeyBalance
            ? balances.xFeyBalance
            : amount;
        setUnstakeAmountWei(finalAmount);

        // Update display if final amount differs
        if (finalAmount !== amount) {
          const finalFormatted = formatXFeyAmount(finalAmount, 18);
          const finalNum = parseFloat(finalFormatted.replace(/,/g, ""));
          const finalFloored = isNaN(finalNum)
            ? finalFormatted
            : Math.floor(finalNum).toString();
          setUnstakeAmount(finalFloored);
        }
      } else {
        setUnstakeAmount(sanitized);
        setUnstakeAmountWei(0n);
      }
    } else {
      setUnstakeAmount(sanitized);
      setUnstakeAmountWei(0n);
    }
  };

  // Set max amount (all xFEY, floored to ensure it doesn't exceed balance)
  const handleMaxClick = () => {
    if (balances) {
      // Use the exact balance (already floored at bigint level)
      setUnstakeAmountWei(balances.xFeyBalance);
      // Format and floor the display value to remove any decimal precision issues
      const maxFormatted = formatXFeyAmount(balances.xFeyBalance, 18);
      const num = parseFloat(maxFormatted.replace(/,/g, ""));
      const flooredFormatted = isNaN(num)
        ? maxFormatted
        : Math.floor(num).toString();
      setUnstakeAmount(flooredFormatted);
    }
  };

  // Calculate expected FEY amount to receive
  const expectedFeyAmount =
    balances && unstakeAmountWei > 0n
      ? (balances.feyValue * unstakeAmountWei) / balances.xFeyBalance
      : 0n;

  // Calculate gain/loss
  const gainLoss =
    unstakeAmountWei > 0n && expectedFeyAmount > unstakeAmountWei
      ? formatPercentageChange(
          ((Number(expectedFeyAmount) - Number(unstakeAmountWei)) /
            Number(unstakeAmountWei)) *
            100
        )
      : null;

  // Validation
  const isValidAmount =
    unstakeAmountWei > 0n &&
    balances &&
    unstakeAmountWei <= balances.xFeyBalance;

  // Handle unstake
  const handleUnstake = async () => {
    if (!isValidAmount) return;

    try {
      setCurrentStep("unstaking");
      await unstaking.unstake(unstakeAmountWei);
    } catch (error) {
      console.error("Unstaking error:", error);
      setCurrentStep("input");
    }
  };

  // Render input step
  const renderInputStep = () => (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <button
          onClick={onBack}
          className="text-green-400 hover:text-green-300"
        >
          <ArrowLeft size={16} />
        </button>
        <h2 className="font-bold text-sm">UNSTAKE xFEY SHARES</h2>
      </div>

      <div className="border border-green-400 rounded p-2 bg-green-900/10">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[10px] opacity-60">Your xFEY Balance:</span>
          <span className="text-xs font-mono">
            {balances ? formatXFeyAmount(balances.xFeyBalance) : "0.0000"} xFEY
          </span>
        </div>

        <div className="space-y-1.5">
          <div className="flex border border-green-400/50 rounded">
            <input
              type="text"
              value={unstakeAmount}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="0.0000"
              className="flex-1 bg-transparent px-2 py-2 text-sm font-mono text-green-300 placeholder-green-400/50 focus:outline-none"
            />
            <div className="flex">
              <div className="px-2 py-2 text-[10px] opacity-60 border-l border-green-400/50">
                xFEY
              </div>
              <button
                onClick={handleMaxClick}
                className="px-2 py-1 text-[10px] border-l border-green-400/50 hover:bg-green-400/10 transition-colors"
              >
                MAX
              </button>
            </div>
          </div>

          {/* Preview of FEY to receive */}
          {unstakeAmountWei > 0n && expectedFeyAmount > 0n && (
            <div className="border border-green-300/30 rounded p-1.5 bg-green-900/5">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] opacity-60">
                  You will receive:
                </span>
                <span className="text-sm font-bold text-green-300">
                  {formatFeyAmount(expectedFeyAmount)} FEY
                </span>
              </div>

              {gainLoss && (
                <div
                  className={clsx(
                    "flex items-center justify-center gap-1 text-[9px]",
                    gainLoss.isPositive ? "text-green-300" : "text-red-400"
                  )}
                >
                  <TrendingUp size={10} />
                  <span>
                    {gainLoss.prefix}
                    {gainLoss.text} gain
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Validation messages */}
      {unstakeAmount !== "" && !isValidAmount && (
        <div className="flex items-center gap-1 text-red-400 text-[10px]">
          <AlertCircle size={12} />
          <span>
            {unstakeAmountWei === 0n
              ? "Please enter a valid amount"
              : unstakeAmountWei > (balances?.xFeyBalance || 0n)
              ? "Insufficient xFEY balance"
              : "Invalid amount"}
          </span>
        </div>
      )}

      <button
        onClick={handleUnstake}
        disabled={!isValidAmount}
        className={clsx(
          "w-full border border-green-400 rounded px-3 py-2",
          "hover:bg-green-400/10 active:bg-green-400/20",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "transition-colors duration-200",
          "font-bold text-xs tracking-wide"
        )}
      >
        UNSTAKE xFEY
      </button>
    </div>
  );

  // Render unstaking step
  const renderUnstakingStep = () => (
    <div className="space-y-2 text-center">
      <div className="border border-green-400 rounded p-2 bg-green-900/10">
        <h2 className="font-bold text-sm mb-1">UNSTAKING xFEY</h2>
        <p className="text-xs opacity-80 mb-1">
          Redeeming {formatXFeyAmount(unstakeAmountWei)} xFEY...
        </p>
        <p className="text-[9px] opacity-60">
          Expected: {formatFeyAmount(expectedFeyAmount)} FEY
        </p>
      </div>

      <div className="flex flex-col items-center gap-2">
        <LoadingSpinner size="sm" />
        <div className="text-xs">
          {unstaking.isLoading && <p>Preparing transaction...</p>}
          {unstaking.isPending && <p>Waiting for confirmation...</p>}
          {unstaking.isError && (
            <div className="text-red-400">
              <p>Unstaking failed</p>
              <p className="text-[9px] opacity-80 mt-0.5">{unstaking.error}</p>
            </div>
          )}
        </div>

        {unstaking.txHash && (
          <a
            href={getExplorerTxUrl(unstaking.txHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[9px] text-green-300 hover:text-green-200 underline"
          >
            View on Explorer →
          </a>
        )}
      </div>

      {unstaking.isError && (
        <div className="space-y-1.5">
          <button
            onClick={handleUnstake}
            className="w-full border border-green-400 rounded px-3 py-2 hover:bg-green-400/10 transition-colors text-xs"
          >
            TRY AGAIN
          </button>
          <button
            onClick={() => setCurrentStep("input")}
            className="w-full border border-green-400/50 rounded px-3 py-2 hover:bg-green-400/10 transition-colors text-[10px]"
          >
            CHANGE AMOUNT
          </button>
        </div>
      )}
    </div>
  );

  // Render success step
  const renderSuccessStep = () => (
    <div className="space-y-2 text-center">
      <div className="border border-green-400 rounded p-2 bg-green-900/10">
        <div className="flex items-center justify-center gap-1.5 mb-1">
          <CheckCircle className="text-green-400" size={16} />
          <h2 className="font-bold text-sm">UNSTAKING SUCCESSFUL!</h2>
        </div>
        <p className="text-xs opacity-80">
          Unstaked {formatXFeyAmount(unstakeAmountWei)} xFEY
        </p>
      </div>

      <div className="border border-green-400/30 rounded p-2 space-y-1 text-xs">
        <div className="flex justify-between">
          <span>xFEY Burned:</span>
          <span className="font-mono">
            {formatXFeyAmount(unstakeAmountWei)} xFEY
          </span>
        </div>
        <div className="flex justify-between">
          <span>FEY Received:</span>
          <span className="font-mono text-green-300">
            {formatFeyAmount(expectedFeyAmount)} FEY
          </span>
        </div>
        {gainLoss && gainLoss.isPositive && (
          <div className="flex justify-between text-[9px] text-green-300">
            <span>Rewards:</span>
            <span>+{gainLoss.text}</span>
          </div>
        )}
      </div>

      {unstaking.txHash && (
        <a
          href={getExplorerTxUrl(unstaking.txHash)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-[9px] text-green-300 hover:text-green-200 underline"
        >
          View Transaction →
        </a>
      )}

      <div className="space-y-1.5">
        <button
          onClick={() => {
            setCurrentStep("input");
            setUnstakeAmount("");
            setUnstakeAmountWei(0n);
          }}
          className="w-full border border-green-400 rounded px-3 py-2 hover:bg-green-400/10 transition-colors font-bold text-xs"
        >
          UNSTAKE MORE
        </button>
        <button
          onClick={onBack}
          className="w-full border border-green-400/50 rounded px-3 py-2 hover:bg-green-400/10 transition-colors text-[10px]"
        >
          BACK TO HOME
        </button>
      </div>
    </div>
  );

  // Render appropriate step
  switch (currentStep) {
    case "input":
      return renderInputStep();
    case "unstaking":
      return renderUnstakingStep();
    case "success":
      return renderSuccessStep();
    default:
      return renderInputStep();
  }
}
