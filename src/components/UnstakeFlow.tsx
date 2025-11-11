/**
 * Unstake Flow Component
 * 
 * Handles the complete unstaking flow for xFEY shares:
 * 1. Input xFEY amount validation
 * 2. Preview FEY amount to be received
 * 3. Redeem transaction
 * 4. Success confirmation
 */

import { useState, useEffect } from 'react';
import { ArrowLeft, AlertCircle, CheckCircle, TrendingUp } from 'lucide-react';
import clsx from 'clsx';

import { UserBalances } from '../hooks/useFeyProtocol';
import { useFeyUnstaking } from '../hooks/useFeyProtocol';
import { formatFeyAmount, formatXFeyAmount, parseTokenAmount, sanitizeNumberInput, isValidNumberInput, formatPercentageChange } from '../utils/formatting';
import { getExplorerTxUrl } from '../config/wagmi';
import LoadingSpinner from './LoadingSpinner';

interface UnstakeFlowProps {
  onBack: () => void;
  balances: UserBalances | null;
}

type UnstakeStep = 'input' | 'unstaking' | 'success';

/**
 * Complete unstaking flow component
 */
export default function UnstakeFlow({ onBack, balances }: UnstakeFlowProps) {
  const [currentStep, setCurrentStep] = useState<UnstakeStep>('input');
  const [unstakeAmount, setUnstakeAmount] = useState('');
  const [unstakeAmountWei, setUnstakeAmountWei] = useState(0n);

  const unstaking = useFeyUnstaking();

  useEffect(() => {
    if (unstaking.isSuccess && currentStep === 'unstaking') {
      setCurrentStep('success');
    }
  }, [unstaking.isSuccess, currentStep]);

  // Handle amount input changes
  const handleAmountChange = (value: string) => {
    const sanitized = sanitizeNumberInput(value);
    setUnstakeAmount(sanitized);
    
    if (isValidNumberInput(sanitized) && sanitized !== '') {
      setUnstakeAmountWei(parseTokenAmount(sanitized));
    } else {
      setUnstakeAmountWei(0n);
    }
  };

  // Set max amount (all xFEY)
  const handleMaxClick = () => {
    if (balances) {
      const maxAmount = formatXFeyAmount(balances.xFeyBalance, 18);
      handleAmountChange(maxAmount);
    }
  };

  // Calculate expected FEY amount to receive
  const expectedFeyAmount = balances && unstakeAmountWei > 0n 
    ? (balances.feyValue * unstakeAmountWei) / balances.xFeyBalance
    : 0n;

  // Calculate gain/loss
  const gainLoss = unstakeAmountWei > 0n && expectedFeyAmount > unstakeAmountWei
    ? formatPercentageChange(
        ((Number(expectedFeyAmount) - Number(unstakeAmountWei)) / Number(unstakeAmountWei)) * 100
      )
    : null;

  // Validation
  const isValidAmount = unstakeAmountWei > 0n && balances && unstakeAmountWei <= balances.xFeyBalance;

  // Handle unstake
  const handleUnstake = async () => {
    if (!isValidAmount) return;

    try {
      setCurrentStep('unstaking');
      await unstaking.unstake(unstakeAmountWei);
    } catch (error) {
      console.error('Unstaking error:', error);
      setCurrentStep('input');
    }
  };

  // Render input step
  const renderInputStep = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-green-400 hover:text-green-300">
          <ArrowLeft size={20} />
        </button>
        <h2 className="font-bold text-lg">UNSTAKE xFEY SHARES</h2>
      </div>

      <div className="border border-green-400 rounded p-4 bg-green-900/10">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm opacity-60">Your xFEY Balance:</span>
          <span className="text-sm font-mono">
            {balances ? formatXFeyAmount(balances.xFeyBalance) : '0.0000'} xFEY
          </span>
        </div>

        <div className="space-y-3">
          <div className="flex border border-green-400/50 rounded">
            <input
              type="text"
              value={unstakeAmount}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="0.0000"
              className="flex-1 bg-transparent px-3 py-3 text-lg font-mono text-green-300 placeholder-green-400/50 focus:outline-none"
            />
            <div className="flex">
              <div className="px-3 py-3 text-xs opacity-60 border-l border-green-400/50">
                xFEY
              </div>
              <button
                onClick={handleMaxClick}
                className="px-3 py-2 text-xs border-l border-green-400/50 hover:bg-green-400/10 transition-colors"
              >
                MAX
              </button>
            </div>
          </div>

          {/* Preview of FEY to receive */}
          {unstakeAmountWei > 0n && expectedFeyAmount > 0n && (
            <div className="border border-green-300/30 rounded p-3 bg-green-900/5">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm opacity-60">You will receive:</span>
                <span className="text-lg font-bold text-green-300">
                  {formatFeyAmount(expectedFeyAmount)} FEY
                </span>
              </div>
              
              {gainLoss && (
                <div className={clsx(
                  'flex items-center justify-center gap-1 text-xs',
                  gainLoss.isPositive ? 'text-green-300' : 'text-red-400'
                )}>
                  <TrendingUp size={12} />
                  <span>
                    {gainLoss.prefix}{gainLoss.text} gain from staking rewards
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Current position summary */}
      {balances && balances.xFeyBalance > 0n && (
        <div className="border border-green-400/30 rounded p-4 space-y-2 text-sm">
          <h3 className="font-bold mb-2">Your Staking Position:</h3>
          <div className="flex justify-between">
            <span>Total xFEY:</span>
            <span className="font-mono">{formatXFeyAmount(balances.xFeyBalance)} xFEY</span>
          </div>
          <div className="flex justify-between">
            <span>Current Value:</span>
            <span className="font-mono text-green-300">{formatFeyAmount(balances.feyValue)} FEY</span>
          </div>
          <div className="flex justify-between text-xs opacity-60">
            <span>Total Gains:</span>
            <span>
              +{formatPercentageChange(
                ((Number(balances.feyValue) - Number(balances.xFeyBalance)) / Number(balances.xFeyBalance)) * 100
              ).text}
            </span>
          </div>
        </div>
      )}

      {/* Validation messages */}
      {unstakeAmount !== '' && !isValidAmount && (
        <div className="flex items-center gap-2 text-red-400 text-sm">
          <AlertCircle size={16} />
          <span>
            {unstakeAmountWei === 0n ? 'Please enter a valid amount' :
             unstakeAmountWei > (balances?.xFeyBalance || 0n) ? 'Insufficient xFEY balance' :
             'Invalid amount'}
          </span>
        </div>
      )}

      {/* Important note */}
      <div className="border border-yellow-400/50 rounded p-3 bg-yellow-900/10 text-yellow-400">
        <div className="flex items-start gap-2">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          <div className="text-xs">
            <p className="font-semibold mb-1">Unstaking Information</p>
            <p>Unstaking converts your xFEY shares back to FEY tokens. You'll receive your original stake plus any earned rewards. The exact amount depends on the current share price.</p>
          </div>
        </div>
      </div>

      <button
        onClick={handleUnstake}
        disabled={!isValidAmount}
        className={clsx(
          'w-full border border-green-400 rounded px-6 py-4',
          'hover:bg-green-400/10 active:bg-green-400/20',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'transition-colors duration-200',
          'font-bold text-sm tracking-wide'
        )}
      >
        UNSTAKE xFEY
      </button>
    </div>
  );

  // Render unstaking step
  const renderUnstakingStep = () => (
    <div className="space-y-6 text-center">
      <div className="border border-green-400 rounded p-4 bg-green-900/10">
        <h2 className="font-bold text-lg mb-2">UNSTAKING xFEY</h2>
        <p className="text-sm opacity-80 mb-2">
          Redeeming {formatXFeyAmount(unstakeAmountWei)} xFEY from vault...
        </p>
        <p className="text-xs opacity-60">
          Expected to receive: {formatFeyAmount(expectedFeyAmount)} FEY
        </p>
      </div>

      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner size="lg" />
        <div className="text-sm">
          {unstaking.isLoading && <p>Preparing unstake transaction...</p>}
          {unstaking.isPending && <p>Waiting for confirmation...</p>}
          {unstaking.isError && (
            <div className="text-red-400">
              <p>Unstaking failed</p>
              <p className="text-xs opacity-80 mt-1">{unstaking.error}</p>
            </div>
          )}
        </div>

        {unstaking.txHash && (
          <a
            href={getExplorerTxUrl(unstaking.txHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-green-300 hover:text-green-200 underline"
          >
            View on Block Explorer →
          </a>
        )}
      </div>

      {unstaking.isError && (
        <div className="space-y-3">
          <button
            onClick={handleUnstake}
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
          <h2 className="font-bold text-lg">UNSTAKING SUCCESSFUL!</h2>
        </div>
        <p className="text-sm opacity-80">
          You have successfully unstaked {formatXFeyAmount(unstakeAmountWei)} xFEY
        </p>
      </div>

      <div className="border border-green-400/30 rounded p-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span>xFEY Burned:</span>
          <span className="font-mono">{formatXFeyAmount(unstakeAmountWei)} xFEY</span>
        </div>
        <div className="flex justify-between">
          <span>FEY Received:</span>
          <span className="font-mono text-green-300">{formatFeyAmount(expectedFeyAmount)} FEY</span>
        </div>
        {gainLoss && gainLoss.isPositive && (
          <div className="flex justify-between text-xs text-green-300">
            <span>Rewards Earned:</span>
            <span>+{gainLoss.text}</span>
          </div>
        )}
      </div>

      <div className="border border-green-300/30 rounded p-3 bg-green-900/5 text-xs">
        <p className="opacity-80">
          Your FEY tokens are now back in your wallet and ready to use.
          You can stake them again anytime to continue earning protocol fees!
        </p>
      </div>

      {unstaking.txHash && (
        <a
          href={getExplorerTxUrl(unstaking.txHash)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-sm text-green-300 hover:text-green-200 underline"
        >
          View Transaction →
        </a>
      )}

      <div className="space-y-3">
        <button
          onClick={() => {
            setCurrentStep('input');
            setUnstakeAmount('');
            setUnstakeAmountWei(0n);
          }}
          className="w-full border border-green-400 rounded px-6 py-4 hover:bg-green-400/10 transition-colors font-bold"
        >
          UNSTAKE MORE
        </button>
        <button
          onClick={onBack}
          className="w-full border border-green-400/50 rounded px-6 py-4 hover:bg-green-400/10 transition-colors text-sm"
        >
          BACK TO HOME
        </button>
      </div>
    </div>
  );

  // Render appropriate step
  switch (currentStep) {
    case 'input':
      return renderInputStep();
    case 'unstaking':
      return renderUnstakingStep();
    case 'success':
      return renderSuccessStep();
    default:
      return renderInputStep();
  }
}