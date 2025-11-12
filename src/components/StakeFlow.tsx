/**
 * Stake Flow Component
 *
 * Handles the complete staking flow for FEY tokens:
 * 1. Input amount validation
 * 2. Token approval (if needed)
 * 3. Deposit transaction
 * 4. Success confirmation
 */

import { useState, useEffect, useRef } from "react";
import { ArrowLeft, AlertCircle, CheckCircle } from "lucide-react";
import clsx from "clsx";

import { UserBalances } from "../hooks/useFeyProtocol";
import { useFeyApproval, useFeyStaking } from "../hooks/useFeyProtocol";
import {
  formatFeyAmount,
  parseTokenAmount,
  sanitizeNumberInput,
  isValidNumberInput,
} from "../utils/formatting";
import { getExplorerTxUrl } from "../config/wagmi";
import LoadingSpinner from "./LoadingSpinner";

interface StakeFlowProps {
  onBack: () => void;
  balances: UserBalances | null;
}

type StakeStep = "input" | "approve" | "deposit" | "success";

/**
 * Complete staking flow component
 */
export default function StakeFlow({ onBack, balances }: StakeFlowProps) {
  const [currentStep, setCurrentStep] = useState<StakeStep>("input");
  const [stakeAmount, setStakeAmount] = useState("");
  const [stakeAmountWei, setStakeAmountWei] = useState(0n);
  const [percentage, setPercentage] = useState(0);
  const hasTriggeredStaking = useRef(false);

  const approval = useFeyApproval();
  const staking = useFeyStaking();

  // Automatically transition to deposit step and trigger staking when approval succeeds
  useEffect(() => {
    if (
      approval.isSuccess &&
      currentStep === "approve" &&
      stakeAmountWei > 0n &&
      !hasTriggeredStaking.current
    ) {
      hasTriggeredStaking.current = true;
      setCurrentStep("deposit");
      // Automatically trigger staking transaction after approval
      // Use setTimeout to ensure state update completes first
      setTimeout(() => {
        staking.stake(stakeAmountWei).catch((error) => {
          console.error("Auto-staking after approval failed:", error);
          hasTriggeredStaking.current = false; // Reset on error so user can retry
        });
      }, 100);
    }
  }, [approval.isSuccess, currentStep, stakeAmountWei, staking]);

  // Transition to success step when staking succeeds
  useEffect(() => {
    if (staking.isSuccess && currentStep === "deposit") {
      setCurrentStep("success");
    }
  }, [staking.isSuccess, currentStep]);

  // Reset the ref and percentage when user goes back to input step
  useEffect(() => {
    if (currentStep === "input") {
      hasTriggeredStaking.current = false;
      // Reset percentage if amount is cleared
      if (stakeAmountWei === 0n) {
        setPercentage(0);
      }
    }
  }, [currentStep, stakeAmountWei]);

  // Calculate percentage from stake amount
  const calculatePercentage = (amountWei: bigint): number => {
    if (!balances || balances.feyBalance === 0n) return 0;
    const pct = (Number(amountWei) / Number(balances.feyBalance)) * 100;
    return Math.round(pct * 100) / 100; // Round to 2 decimal places
  };

  // Handle amount input changes
  const handleAmountChange = (value: string) => {
    const sanitized = sanitizeNumberInput(value);

    if (isValidNumberInput(sanitized) && sanitized !== "") {
      // Floor the input value before parsing to avoid precision issues
      const num = parseFloat(sanitized.replace(/,/g, ""));
      if (!isNaN(num)) {
        const flooredNum = Math.floor(num);
        const flooredString = flooredNum.toString();
        setStakeAmount(flooredString);

        // Parse the floored value
        const amount = parseTokenAmount(flooredString);
        // Ensure it doesn't exceed balance
        const finalAmount =
          balances && amount > balances.feyBalance
            ? balances.feyBalance
            : amount;
        setStakeAmountWei(finalAmount);
        setPercentage(calculatePercentage(finalAmount));

        // Update display if final amount differs
        if (finalAmount !== amount) {
          const finalFormatted = formatFeyAmount(finalAmount, 18);
          const finalNum = parseFloat(finalFormatted.replace(/,/g, ""));
          const finalFloored = isNaN(finalNum)
            ? finalFormatted
            : Math.floor(finalNum).toString();
          setStakeAmount(finalFloored);
        }
      } else {
        setStakeAmount(sanitized);
        setStakeAmountWei(0n);
        setPercentage(0);
      }
    } else {
      setStakeAmount(sanitized);
      setStakeAmountWei(0n);
      setPercentage(0);
    }
  };

  // Handle percentage slider change
  const handlePercentageChange = (value: number) => {
    if (!balances || balances.feyBalance === 0n) return;

    const pct = Math.round(value * 100) / 100; // Round to 2 decimal places
    setPercentage(pct);

    // Calculate amount based on percentage using Math.floor to ensure it doesn't exceed balance
    // Convert to number, calculate, then floor back to bigint
    const balanceNum = Number(balances.feyBalance);
    const amountNum = Math.floor((balanceNum * pct) / 100);
    const amountWei = BigInt(amountNum);

    // Ensure we don't exceed balance
    const flooredAmountWei =
      amountWei > balances.feyBalance ? balances.feyBalance : amountWei;

    setStakeAmountWei(flooredAmountWei);

    // Update the input field with floored value
    const amountFormatted = formatFeyAmount(flooredAmountWei, 18);
    setStakeAmount(amountFormatted);
  };

  // Set max amount (floored to ensure it doesn't exceed balance)
  const handleMaxClick = () => {
    if (balances) {
      setPercentage(100);
      // Use the exact balance (already floored at bigint level)
      setStakeAmountWei(balances.feyBalance);
      // Format with floor to remove any decimal precision issues
      const maxFormatted = formatFeyAmount(balances.feyBalance, 18);
      // Floor the formatted string to ensure clean display
      const num = parseFloat(maxFormatted.replace(/,/g, ""));
      const flooredFormatted = isNaN(num)
        ? maxFormatted
        : Math.floor(num).toString();
      setStakeAmount(flooredFormatted);
    }
  };

  // Check if approval is needed
  const needsApproval = balances && stakeAmountWei > balances.allowance;

  // Validation
  const isValidAmount =
    stakeAmountWei > 0n && balances && stakeAmountWei <= balances.feyBalance;

  // Handle proceed button click
  const handleProceed = async () => {
    if (!isValidAmount) return;

    try {
      if (needsApproval) {
        setCurrentStep("approve");
        await approval.approve(stakeAmountWei);
      } else {
        setCurrentStep("deposit");
        await staking.stake(stakeAmountWei);
      }
    } catch (error) {
      console.error("Staking flow error:", error);
    }
  };

  // Handle deposit after approval
  const handleDeposit = async () => {
    try {
      await staking.stake(stakeAmountWei);
    } catch (error) {
      console.error("Deposit error:", error);
    }
  };

  // Render input step
  const renderInputStep = () => (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <button
          onClick={onBack}
          className="text-green-400 hover:text-green-300"
        >
          <ArrowLeft size={14} />
        </button>
        <h2 className="font-bold text-xs">← STAKE FEY</h2>
      </div>

      <div className="border border-green-400 rounded p-1.5 bg-green-900/10">
        <div className="flex justify-between items-center mb-0.5">
          <span className="text-[9px] opacity-60">Available:</span>
          <span className="text-[10px] font-mono">
            {balances ? formatFeyAmount(balances.feyBalance) : "0.0000"} FEY
          </span>
        </div>

        <div className="space-y-1">
          <div className="flex border border-green-400/50 rounded">
            <input
              type="text"
              value={stakeAmount}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="0.0000"
              className="flex-1 bg-transparent px-1.5 py-1.5 text-xs font-mono text-green-300 placeholder-green-400/50 focus:outline-none"
            />
            <button
              onClick={handleMaxClick}
              className="px-1.5 py-1 text-[9px] border-l border-green-400/50 hover:bg-green-400/10 transition-colors"
            >
              MAX
            </button>
          </div>

          {/* Percentage slider */}
          {balances && balances.feyBalance > 0n && (
            <div className="space-y-0.5">
              <div className="flex items-center justify-between text-[8px] opacity-60">
                <span>0%</span>
                <span className="font-bold text-green-300">
                  {percentage.toFixed(0)}%
                </span>
                <span>100%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="0.1"
                value={percentage}
                onChange={(e) =>
                  handlePercentageChange(parseFloat(e.target.value))
                }
                className="w-full appearance-none cursor-pointer accent-green-400"
                style={{
                  height: "4px",
                  background: `linear-gradient(to right, #22c55e 0%, #22c55e ${percentage}%, rgba(34, 197, 94, 0.3) ${percentage}%, rgba(34, 197, 94, 0.3) 100%)`,
                }}
              />
            </div>
          )}

          {stakeAmountWei > 0n && (
            <div className="text-[8px] opacity-60 leading-tight">
              <p>Receive ~{formatFeyAmount(stakeAmountWei)} xFEY</p>
            </div>
          )}
        </div>
      </div>

      {/* Validation messages */}
      {stakeAmount !== "" && !isValidAmount && (
        <div className="flex items-center gap-1 text-red-400 text-[9px]">
          <AlertCircle size={10} />
          <span>
            {stakeAmountWei === 0n
              ? "Enter valid amount"
              : stakeAmountWei > (balances?.feyBalance || 0n)
              ? "Insufficient balance"
              : "Invalid amount"}
          </span>
        </div>
      )}

      {/* Approval info */}
      {needsApproval && isValidAmount && (
        <div className="border border-yellow-400/50 rounded p-1 bg-yellow-900/10 text-yellow-400">
          <div className="flex items-start gap-1">
            <AlertCircle size={10} className="mt-0.5 flex-shrink-0" />
            <div className="text-[8px] leading-tight">
              <p className="font-semibold">Approval Required</p>
              <p>One-time transaction to approve vault</p>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={handleProceed}
        disabled={!isValidAmount}
        className={clsx(
          "w-full border border-green-400 rounded px-2 py-1.5",
          "hover:bg-green-400/10 active:bg-green-400/20",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "transition-colors duration-200",
          "font-bold text-[10px] tracking-wide"
        )}
      >
        {needsApproval ? "APPROVE & STAKE" : "STAKE FEY"}
      </button>
    </div>
  );

  // Render approval step
  const renderApprovalStep = () => (
    <div className="space-y-1.5 text-center">
      <div className="border border-green-400 rounded p-1.5 bg-green-900/10">
        <h2 className="font-bold text-xs mb-0.5">APPROVING FEY</h2>
        <p className="text-[9px] opacity-80">
          {formatFeyAmount(stakeAmountWei)} FEY...
        </p>
      </div>

      <div className="flex flex-col items-center gap-1.5">
        <LoadingSpinner size="sm" />
        <div className="text-[10px]">
          {approval.isLoading && <p>Preparing...</p>}
          {approval.isPending && <p>Confirming...</p>}
          {approval.isError && (
            <div className="text-red-400">
              <p>Failed</p>
              <p className="text-[8px] opacity-80 mt-0.5">{approval.error}</p>
            </div>
          )}
        </div>

        {approval.txHash && (
          <a
            href={getExplorerTxUrl(approval.txHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[8px] text-green-300 hover:text-green-200 underline"
          >
            View Tx →
          </a>
        )}
      </div>

      {approval.isError && (
        <button
          onClick={() => setCurrentStep("input")}
          className="w-full border border-green-400 rounded px-2 py-1.5 hover:bg-green-400/10 transition-colors text-[10px]"
        >
          TRY AGAIN
        </button>
      )}
    </div>
  );

  // Render deposit step
  const renderDepositStep = () => (
    <div className="space-y-1.5 text-center">
      <div className="border border-green-400 rounded p-1.5 bg-green-900/10">
        <h2 className="font-bold text-xs mb-0.5">STAKING FEY</h2>
        <p className="text-[9px] opacity-80">
          {formatFeyAmount(stakeAmountWei)} FEY...
        </p>
      </div>

      <div className="flex flex-col items-center gap-1.5">
        <LoadingSpinner size="sm" />
        <div className="text-[10px]">
          {staking.isLoading && <p>Preparing...</p>}
          {staking.isPending && <p>Confirming...</p>}
          {staking.isError && (
            <div className="text-red-400">
              <p>Failed</p>
              <p className="text-[8px] opacity-80 mt-0.5">{staking.error}</p>
            </div>
          )}
        </div>

        {staking.txHash && (
          <a
            href={getExplorerTxUrl(staking.txHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[8px] text-green-300 hover:text-green-200 underline"
          >
            View Tx →
          </a>
        )}
      </div>

      {staking.isError && (
        <div className="space-y-1">
          <button
            onClick={handleDeposit}
            className="w-full border border-green-400 rounded px-2 py-1.5 hover:bg-green-400/10 transition-colors text-[10px]"
          >
            TRY AGAIN
          </button>
          <button
            onClick={() => setCurrentStep("input")}
            className="w-full border border-green-400/50 rounded px-2 py-1 hover:bg-green-400/10 transition-colors text-[9px]"
          >
            CHANGE AMOUNT
          </button>
        </div>
      )}
    </div>
  );

  // Render success step
  const renderSuccessStep = () => (
    <div className="space-y-1.5 text-center">
      <div className="border border-green-400 rounded p-1.5 bg-green-900/10">
        <div className="flex items-center justify-center gap-1 mb-0.5">
          <CheckCircle className="text-green-400" size={14} />
          <h2 className="font-bold text-xs">SUCCESS!</h2>
        </div>
        <p className="text-[9px] opacity-80">
          Staked {formatFeyAmount(stakeAmountWei)} FEY
        </p>
      </div>

      <div className="border border-green-400/30 rounded p-1.5 space-y-0.5 text-[10px]">
        <div className="flex justify-between">
          <span>Staked:</span>
          <span className="font-mono">
            {formatFeyAmount(stakeAmountWei)} FEY
          </span>
        </div>
        <div className="flex justify-between">
          <span>xFEY:</span>
          <span className="font-mono text-green-300">
            ~{formatFeyAmount(stakeAmountWei)} xFEY
          </span>
        </div>
      </div>

      {staking.txHash && (
        <a
          href={getExplorerTxUrl(staking.txHash)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-[8px] text-green-300 hover:text-green-200 underline"
        >
          View Tx →
        </a>
      )}

      <button
        onClick={onBack}
        className="w-full border border-green-400 rounded px-2 py-1.5 hover:bg-green-400/10 transition-colors font-bold text-[10px]"
      >
        CONTINUE STAKING
      </button>
    </div>
  );

  // Render appropriate step
  switch (currentStep) {
    case "input":
      return renderInputStep();
    case "approve":
      return renderApprovalStep();
    case "deposit":
      return renderDepositStep();
    case "success":
      return renderSuccessStep();
    default:
      return renderInputStep();
  }
}
