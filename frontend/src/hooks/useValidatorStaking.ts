import { useState, useEffect, useCallback } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatUnits, parseUnits } from 'viem';
import { CONTRACT_ADDRESSES, VALIDATOR_REWARDS_ABI, ERC20_ABI } from '@/lib/contracts';
import { useToast } from '@/hooks/use-toast';
import { addTransaction, updateTransactionStatus, getBlockExplorerUrl } from '@/services/transactionHistory';

// Staking requirement constant
export const VALIDATOR_STAKE_REQUIRED = '500'; // 500 CVT

export function useValidatorStake() {
  const { address } = useAccount();

  // Get validator info
  const { data: validatorData, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.ValidatorRewards as `0x${string}`,
    abi: VALIDATOR_REWARDS_ABI,
    functionName: 'getValidator',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // Check if user is a validator
  const { data: isValidatorData } = useReadContract({
    address: CONTRACT_ADDRESSES.ValidatorRewards as `0x${string}`,
    abi: VALIDATOR_REWARDS_ABI,
    functionName: 'isValidator',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // Get user's CVT balance
  const { data: balance } = useReadContract({
    address: CONTRACT_ADDRESSES.CVTMinting as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  const formattedBalance = balance ? formatUnits(balance as bigint, 18) : '0';
  const hasEnoughBalance = parseFloat(formattedBalance) >= parseFloat(VALIDATOR_STAKE_REQUIRED);
  const isValidator = isValidatorData as boolean || false;

  let stakedAmount = '0';
  let rewards = '0';
  let verifiedProofsCount = 0;
  let stakedAt = 0;
  let isActive = false;

  if (validatorData && Array.isArray(validatorData)) {
    stakedAmount = formatUnits(validatorData[0] as bigint, 18);
    rewards = formatUnits(validatorData[1] as bigint, 18);
    verifiedProofsCount = Number(validatorData[2]);
    stakedAt = Number(validatorData[3]);
    isActive = validatorData[4] as boolean;
  }

  return {
    isValidator,
    stakedAmount,
    rewards,
    verifiedProofsCount,
    stakedAt,
    isActive,
    balance: formattedBalance,
    hasEnoughBalance,
    refetch,
  };
}

export function useRegisterValidator() {
  const { address } = useAccount();
  const { toast } = useToast();
  const { writeContractAsync } = useWriteContract();
  const [isPending, setIsPending] = useState(false);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const registerValidator = useCallback(async () => {
    if (!writeContractAsync || !address) {
      toast({
        title: 'Error',
        description: 'Unable to write to contract',
        variant: 'destructive',
      });
      return;
    }

    setIsPending(true);
    setTxHash(undefined);

    try {
      // Step 1: Approve CVT
      toast({
        title: 'Step 1 of 2: Approval',
        description: `Approving ${VALIDATOR_STAKE_REQUIRED} CVT...`,
      });

      const stakeAmount = parseUnits(VALIDATOR_STAKE_REQUIRED, 18);

      const approveTx = await writeContractAsync({
        address: CONTRACT_ADDRESSES.CVTMinting as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [CONTRACT_ADDRESSES.ValidatorRewards as `0x${string}`, stakeAmount],
      });

      toast({
        title: 'Approval Submitted',
        description: 'Waiting for confirmation...',
      });

      // Wait for approval
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 2: Register
      toast({
        title: 'Step 2 of 2: Registration',
        description: 'Registering as validator...',
      });

      const registerTx = await writeContractAsync({
        address: CONTRACT_ADDRESSES.ValidatorRewards as `0x${string}`,
        abi: VALIDATOR_REWARDS_ABI,
        functionName: 'registerValidator',
      });

      setTxHash(registerTx);

      // Add to transaction history
      addTransaction({
        hash: registerTx,
        type: 'stake',
        amount: VALIDATOR_STAKE_REQUIRED,
        status: 'pending',
        timestamp: Date.now(),
        address: address,
      });

      toast({
        title: 'Registration Submitted',
        description: 'Waiting for confirmation...',
      });

      setIsPending(false);
      return registerTx;
    } catch (error: any) {
      console.error('Error registering validator:', error);

      let errorMessage = 'Failed to register as validator';
      if (error?.message?.includes('user rejected')) {
        errorMessage = 'Transaction was rejected';
      } else if (error?.message?.includes('Insufficient CVT balance')) {
        errorMessage = `You need at least ${VALIDATOR_STAKE_REQUIRED} CVT to register`;
      } else if (error?.message?.includes('Already registered')) {
        errorMessage = 'You are already registered as a validator';
      } else if (error?.message?.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for gas fees';
      }

      toast({
        title: 'Registration Failed',
        description: errorMessage,
        variant: 'destructive',
      });

      setIsPending(false);
      setTxHash(undefined);
      throw error;
    }
  }, [writeContractAsync, address, toast]);

  // Show success toast when confirmed
  useEffect(() => {
    if (isConfirmed && txHash) {
      updateTransactionStatus(txHash, 'confirmed');

      const explorerUrl = getBlockExplorerUrl(txHash);

      toast({
        title: 'Registration Successful!',
        description: `You are now a validator! ${VALIDATOR_STAKE_REQUIRED} CVT has been staked.`,
        action: {
          label: 'View Transaction',
          onClick: () => window.open(explorerUrl, '_blank'),
        },
      });
    }
  }, [isConfirmed, txHash, toast]);

  return {
    registerValidator,
    isPending: isPending || isConfirming,
    isConfirming,
    isConfirmed,
    txHash,
  };
}

export function useUnregisterValidator() {
  const { address } = useAccount();
  const { toast } = useToast();
  const { writeContractAsync } = useWriteContract();
  const [isPending, setIsPending] = useState(false);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const unregisterValidator = useCallback(async () => {
    if (!writeContractAsync || !address) {
      toast({
        title: 'Error',
        description: 'Unable to write to contract',
        variant: 'destructive',
      });
      return;
    }

    setIsPending(true);
    setTxHash(undefined);

    try {
      toast({
        title: 'Unregistering',
        description: 'Please confirm the transaction...',
      });

      const tx = await writeContractAsync({
        address: CONTRACT_ADDRESSES.ValidatorRewards as `0x${string}`,
        abi: VALIDATOR_REWARDS_ABI,
        functionName: 'unregisterValidator',
      });

      setTxHash(tx);

      // Add to transaction history
      addTransaction({
        hash: tx,
        type: 'unstake',
        status: 'pending',
        timestamp: Date.now(),
        address: address,
      });

      toast({
        title: 'Unregistration Submitted',
        description: 'Waiting for confirmation...',
      });

      setIsPending(false);
      return tx;
    } catch (error: any) {
      console.error('Error unregistering validator:', error);

      let errorMessage = 'Failed to unregister';
      if (error?.message?.includes('user rejected')) {
        errorMessage = 'Transaction was rejected';
      } else if (error?.message?.includes('Not a registered validator')) {
        errorMessage = 'You are not registered as a validator';
      } else if (error?.message?.includes('Claim rewards first')) {
        errorMessage = 'Please claim your pending rewards before unregistering';
      } else if (error?.message?.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for gas fees';
      }

      toast({
        title: 'Unregistration Failed',
        description: errorMessage,
        variant: 'destructive',
      });

      setIsPending(false);
      setTxHash(undefined);
      throw error;
    }
  }, [writeContractAsync, address, toast]);

  // Show success toast when confirmed
  useEffect(() => {
    if (isConfirmed && txHash) {
      updateTransactionStatus(txHash, 'confirmed');

      const explorerUrl = getBlockExplorerUrl(txHash);

      toast({
        title: 'Unregistration Successful!',
        description: `Your stake has been returned to your wallet.`,
        action: {
          label: 'View Transaction',
          onClick: () => window.open(explorerUrl, '_blank'),
        },
      });
    }
  }, [isConfirmed, txHash, toast]);

  return {
    unregisterValidator,
    isPending: isPending || isConfirming,
    isConfirming,
    isConfirmed,
    txHash,
  };
}

export function useIncreaseStake() {
  const { address } = useAccount();
  const { toast } = useToast();
  const { writeContractAsync } = useWriteContract();
  const [isPending, setIsPending] = useState(false);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const increaseStake = useCallback(async (amount: string) => {
    if (!writeContractAsync || !address) {
      toast({
        title: 'Error',
        description: 'Unable to write to contract',
        variant: 'destructive',
      });
      return;
    }

    setIsPending(true);
    setTxHash(undefined);

    try {
      // Step 1: Approve CVT
      toast({
        title: 'Step 1 of 2: Approval',
        description: `Approving ${amount} CVT...`,
      });

      const stakeAmount = parseUnits(amount, 18);

      const approveTx = await writeContractAsync({
        address: CONTRACT_ADDRESSES.CVTMinting as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [CONTRACT_ADDRESSES.ValidatorRewards as `0x${string}`, stakeAmount],
      });

      // Wait for approval
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 2: Increase stake
      toast({
        title: 'Step 2 of 2: Increasing Stake',
        description: 'Please confirm the transaction...',
      });

      const tx = await writeContractAsync({
        address: CONTRACT_ADDRESSES.ValidatorRewards as `0x${string}`,
        abi: VALIDATOR_REWARDS_ABI,
        functionName: 'increaseStake',
        args: [stakeAmount],
      });

      setTxHash(tx);

      // Add to transaction history
      addTransaction({
        hash: tx,
        type: 'stake',
        amount: amount,
        status: 'pending',
        timestamp: Date.now(),
        address: address,
      });

      toast({
        title: 'Stake Increase Submitted',
        description: 'Waiting for confirmation...',
      });

      setIsPending(false);
      return tx;
    } catch (error: any) {
      console.error('Error increasing stake:', error);

      let errorMessage = 'Failed to increase stake';
      if (error?.message?.includes('user rejected')) {
        errorMessage = 'Transaction was rejected';
      } else if (error?.message?.includes('Not a registered validator')) {
        errorMessage = 'You must be a registered validator';
      } else if (error?.message?.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds';
      }

      toast({
        title: 'Transaction Failed',
        description: errorMessage,
        variant: 'destructive',
      });

      setIsPending(false);
      setTxHash(undefined);
      throw error;
    }
  }, [writeContractAsync, address, toast]);

  // Show success toast when confirmed
  useEffect(() => {
    if (isConfirmed && txHash) {
      updateTransactionStatus(txHash, 'confirmed');

      const explorerUrl = getBlockExplorerUrl(txHash);

      toast({
        title: 'Stake Increased!',
        description: 'Your validator stake has been increased.',
        action: {
          label: 'View Transaction',
          onClick: () => window.open(explorerUrl, '_blank'),
        },
      });
    }
  }, [isConfirmed, txHash, toast]);

  return {
    increaseStake,
    isPending: isPending || isConfirming,
    isConfirming,
    isConfirmed,
    txHash,
  };
}

