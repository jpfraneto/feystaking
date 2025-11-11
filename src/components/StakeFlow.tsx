/**
 * Stake Flow Component
 * 
 * Handles the complete staking flow for FEY tokens:
 * 1. Input amount validation
 * 2. Token approval (if needed)
 * 3. Deposit transaction
 * 4. Success confirmation
 */

import { useState, useEffect } from 'react';
import { ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import clsx from 'clsx';

import { UserBalances } from '../hooks/useFeyProtocol';
import { useFeyApproval, useFeyStaking } from '../hooks/useFeyProtocol';
import { formatFeyAmount, parseTokenAmount, sanitizeNumberInput, isValidNumberInput } from '../utils/formatting';
import { getExplorerTxUrl } from '../config/wagmi';
import LoadingSpinner from './LoadingSpinner';

interface StakeFlowProps {
  onBack: () => void;
  balances: UserBalances | null;
}

type StakeStep = 'input' | 'approve' | 'deposit' | 'success';

/**
 * Complete staking flow component
 */
export default function StakeFlow({ onBack, balances }: StakeFlowProps) {
  const [currentStep, setCurrentStep] = useState<StakeStep>('input');
  const [stakeAmount, setStakeAmount] = useState('');
  const [stakeAmountWei, setStakeAmountWei] = useState(0n);

  const approval = useFeyApproval();
  const staking = useFeyStaking();

  // Reset states when balances change
  useEffect(() => {
    if (approval.isSuccess && currentStep === 'approve') {
      setCurrentStep('deposit');
    }
  }, [approval.isSuccess, currentStep]);

  useEffect(() => {
    if (staking.isSuccess && currentStep === 'deposit') {
      setCurrentStep('success');
    }
  }, [staking.isSuccess, currentStep]);

  // Handle amount input changes
  const handleAmountChange = (value: string) => {
    const sanitized = sanitizeNumberInput(value);
    setStakeAmount(sanitized);
    
    if (isValidNumberInput(sanitized) && sanitized !== '') {
      setStakeAmountWei(parseTokenAmount(sanitized));
    } else {
      setStakeAmountWei(0n);
    }
  };

  // Set max amount
  const handleMaxClick = () => {
    if (balances) {
      const maxAmount = formatFeyAmount(balances.feyBalance, 18);
      handleAmountChange(maxAmount);
    }
  };

  // Check if approval is needed
  const needsApproval = balances && stakeAmountWei > balances.allowance;

  // Validation
  const isValidAmount = stakeAmountWei > 0n && balances && stakeAmountWei <= balances.feyBalance;

  // Handle proceed button click
  const handleProceed = async () => {
    if (!isValidAmount) return;

    try {
      if (needsApproval) {
        setCurrentStep('approve');
        await approval.approve(stakeAmountWei);
      } else {
        setCurrentStep('deposit');
        await staking.stake(stakeAmountWei);
      }
    } catch (error) {
      console.error('Staking flow error:', error);
    }
  };

  // Handle deposit after approval
  const handleDeposit = async () => {
    try {
      await staking.stake(stakeAmountWei);
    } catch (error) {
      console.error('Deposit error:', error);
    }
  };

  // Render input step
  const renderInputStep = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-green-400 hover:text-green-300">
          <ArrowLeft size={20} />
        </button>
        <h2 className="font-bold text-lg">STAKE FEY TOKENS</h2>
      </div>

      <div className="border border-green-400 rounded p-4 bg-green-900/10">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm opacity-60">Available Balance:</span>
          <span className="text-sm font-mono">
            {balances ? formatFeyAmount(balances.feyBalance) : '0.0000'} FEY
          </span>
        </div>

        <div className="space-y-3">
          <div className="flex border border-green-400/50 rounded">
            <input
              type="text"
              value={stakeAmount}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="0.0000"
              className="flex-1 bg-transparent px-3 py-3 text-lg font-mono text-green-300 placeholder-green-400/50 focus:outline-none"
            />
            <button
              onClick={handleMaxClick}
              className="px-3 py-2 text-xs border-l border-green-400/50 hover:bg-green-400/10 transition-colors"
            >
              MAX
            </button>
          </div>

          {stakeAmountWei > 0n && (
            <div className="text-xs opacity-60">
              <p>You will receive approximately {formatFeyAmount(stakeAmountWei)} xFEY</p>
              <p>(Share price may vary slightly at execution time)</p>
            </div>
          )}
        </div>
      </div>

      {/* Validation messages */}
      {stakeAmount !== '' && !isValidAmount && (
        <div className="flex items-center gap-2 text-red-400 text-sm">
          <AlertCircle size={16} />
          <span>
            {stakeAmountWei === 0n ? 'Please enter a valid amount' :
             stakeAmountWei > (balances?.feyBalance || 0n) ? 'Insufficient FEY balance' :
             'Invalid amount'}
          </span>
        </div>
      )}

      {/* Approval info */}
      {needsApproval && isValidAmount && (
        <div className="border border-yellow-400/50 rounded p-3 bg-yellow-900/10 text-yellow-400">
          <div className="flex items-start gap-2">
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
            <div className="text-xs">
              <p className="font-semibold mb-1">Approval Required</p>
              <p>You need to approve the vault to spend your FEY tokens. This is a one-time transaction.</p>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={handleProceed}
        disabled={!isValidAmount}
        className={clsx(
          'w-full border border-green-400 rounded px-6 py-4',
          'hover:bg-green-400/10 active:bg-green-400/20',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'transition-colors duration-200',
          'font-bold text-sm tracking-wide'
        )}
      >
        {needsApproval ? 'APPROVE & STAKE' : 'STAKE FEY'}
      </button>
    </div>
  );

  // Render approval step
  const renderApprovalStep = () => (
    <div className="space-y-6 text-center">
      <div className="border border-green-400 rounded p-4 bg-green-900/10">
        <h2 className="font-bold text-lg mb-2">APPROVING FEY TOKENS</h2>
        <p className="text-sm opacity-80">
          Approving vault to spend {formatFeyAmount(stakeAmountWei)} FEY...
        </p>
      </div>

      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner size="lg" />
        <div className="text-sm">
          {approval.isLoading && <p>Preparing approval transaction...</p>}
          {approval.isPending && <p>Waiting for confirmation...</p>}
          {approval.isError && (
            <div className="text-red-400">
              <p>Approval failed</p>
              <p className="text-xs opacity-80 mt-1">{approval.error}</p>
            </div>
          )}
        </div>

        {approval.txHash && (
          <a
            href={getExplorerTxUrl(approval.txHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-green-300 hover:text-green-200 underline"
          >
            View on Block Explorer →
          </a>
        )}
      </div>

      {approval.isError && (
        <button
          onClick={() => setCurrentStep('input')}
          className="w-full border border-green-400 rounded px-6 py-4 hover:bg-green-400/10 transition-colors"
        >
          TRY AGAIN
        </button>
      )}
    </div>
  );

  // Render deposit step
  const renderDepositStep = () => (
    <div className="space-y-6 text-center">
      <div className="border border-green-400 rounded p-4 bg-green-900/10">
        <h2 className="font-bold text-lg mb-2">STAKING FEY TOKENS</h2>
        <p className="text-sm opacity-80">
          Depositing {formatFeyAmount(stakeAmountWei)} FEY to vault...
        </p>
      </div>

      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner size="lg" />
        <div className="text-sm">
          {staking.isLoading && <p>Preparing stake transaction...</p>}
          {staking.isPending && <p>Waiting for confirmation...</p>}
          {staking.isError && (
            <div className="text-red-400">
              <p>Staking failed</p>
              <p className="text-xs opacity-80 mt-1">{staking.error}</p>
            </div>
          )}
        </div>

        {staking.txHash && (
          <a
            href={getExplorerTxUrl(staking.txHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-green-300 hover:text-green-200 underline"
          >
            View on Block Explorer →
          </a>
        )}
      </div>

      {staking.isError && (
        <div className="space-y-3">
          <button
            onClick={handleDeposit}
            className="w-full border border-green-400 rounded px-6 py-4 hover:bg-green-400/10 transition-colors"
          >
            TRY AGAIN
          </button>
          <button
            onClick={() => setCurrentStep('input')}
            className="w-full border border-green-400/50 rounded px-6 py-4 hover:bg-green-400/10 transition-colors text-sm"
          >
            CHANGE AMOUNT
          </button>
        </div>
      )}
    </div>
  );

  // Render success step
  const renderSuccessStep = () => (
    <div className="space-y-6 text-center">
      <div className="border border-green-400 rounded p-4 bg-green-900/10">
        <div className="flex items-center justify-center gap-2 mb-2">
          <CheckCircle className="text-green-400" size={24} />
          <h2 className="font-bold text-lg">STAKING SUCCESSFUL!</h2>
        </div>
        <p className="text-sm opacity-80">
          You have successfully staked {formatFeyAmount(stakeAmountWei)} FEY
        </p>
      </div>

      <div className="border border-green-400/30 rounded p-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Staked Amount:</span>
          <span className="font-mono">{formatFeyAmount(stakeAmountWei)} FEY</span>
        </div>
        <div className="flex justify-between">
          <span>xFEY Received:</span>
          <span className="font-mono text-green-300">~{formatFeyAmount(stakeAmountWei)} xFEY</span>
        </div>
        <div className="flex justify-between text-xs opacity-60">
          <span>Start Earning:</span>
          <span>Immediately</span>
        </div>
      </div>

      {staking.txHash && (
        <a
          href={getExplorerTxUrl(staking.txHash)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-sm text-green-300 hover:text-green-200 underline"
        >
          View Transaction →
        </a>
      )}

      <button
        onClick={onBack}
        className="w-full border border-green-400 rounded px-6 py-4 hover:bg-green-400/10 transition-colors font-bold"
      >
        CONTINUE STAKING
      </button>
    </div>
  );

  // Render appropriate step
  switch (currentStep) {
    case 'input':
      return renderInputStep();
    case 'approve':
      return renderApprovalStep();
    case 'deposit':
      return renderDepositStep();
    case 'success':
      return renderSuccessStep();
    default:
      return renderInputStep();
  }
}