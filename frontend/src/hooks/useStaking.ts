import { useState, useCallback, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseUnits } from 'viem';
import { CONTRACT_ADDRESSES, CVT_STAKING_ABI, ERC20_ABI } from '@/lib/contracts';
import { useToast } from '@/hooks/use-toast';
import { addTransaction, updateTransactionStatus, getBlockExplorerUrl } from '@/services/transactionHistory';
import { useStakingContractBalance } from './useContractBalance';

/**
 * Hook for staking CVT tokens
 */
export function useStake() {
  const { address } = useAccount();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  // Write contract hooks
  const { writeContractAsync: approve } = useWriteContract();
  const { writeContractAsync: stake } = useWriteContract();

  // Check allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: CONTRACT_ADDRESSES.CVTMinting as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, CONTRACT_ADDRESSES.CVTStaking as `0x${string}`] : undefined,
    query: {
      enabled: !!address,
    },
  });

  const stakeTokens = useCallback(
    async (amount: string) => {
      if (!address) {
        toast({
          title: 'Wallet Not Connected',
          description: 'Please connect your wallet to stake.',
          variant: 'destructive',
        });
        return;
      }

      if (!amount || parseFloat(amount) <= 0) {
        toast({
          title: 'Invalid Amount',
          description: 'Please enter a valid amount to stake.',
          variant: 'destructive',
        });
        return;
      }

      setIsProcessing(true);

      try {
        const amountInWei = parseUnits(amount, 18);
        const currentAllowance = (allowance as bigint) || BigInt(0);

        // Step 1: Approve if needed
        if (currentAllowance < amountInWei) {
          toast({
            title: 'Approval Required',
            description: 'Please approve the staking contract to spend your CVT tokens.',
          });

          const approveTx = await approve({
            address: CONTRACT_ADDRESSES.CVTMinting as `0x${string}`,
            abi: ERC20_ABI,
            functionName: 'approve',
            args: [CONTRACT_ADDRESSES.CVTStaking as `0x${string}`, amountInWei],
          });

          toast({
            title: 'Approval Submitted',
            description: 'Waiting for approval confirmation...',
          });

          // Wait for approval confirmation
          await new Promise((resolve) => setTimeout(resolve, 2000));
          await refetchAllowance();
        }

        // Step 2: Stake tokens
        toast({
          title: 'Staking Tokens',
          description: 'Please confirm the staking transaction in your wallet.',
        });

        const stakeTx = await stake({
          address: CONTRACT_ADDRESSES.CVTStaking as `0x${string}`,
          abi: CVT_STAKING_ABI,
          functionName: 'stake',
          args: [amountInWei],
        });

        toast({
          title: 'Staking Successful!',
          description: `Successfully staked ${amount} CVT tokens.`,
        });

        setIsProcessing(false);
        return stakeTx;
      } catch (error: any) {
        console.error('Staking error:', error);
        
        let errorMessage = 'Failed to stake tokens.';
        if (error.message?.includes('user rejected')) {
          errorMessage = 'Transaction was rejected.';
        } else if (error.message?.includes('insufficient funds')) {
          errorMessage = 'Insufficient funds for transaction.';
        }

        toast({
          title: 'Staking Failed',
          description: errorMessage,
          variant: 'destructive',
        });

        setIsProcessing(false);
        throw error;
      }
    },
    [address, allowance, approve, stake, refetchAllowance, toast]
  );

  return {
    stakeTokens,
    isProcessing,
  };
}

/**
 * Hook for unstaking CVT tokens
 */
export function useUnstake() {
  const { address } = useAccount();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const { writeContractAsync: unstake } = useWriteContract();

  const unstakeTokens = useCallback(
    async (amount: string) => {
      if (!address) {
        toast({
          title: 'Wallet Not Connected',
          description: 'Please connect your wallet to unstake.',
          variant: 'destructive',
        });
        return;
      }

      if (!amount || parseFloat(amount) <= 0) {
        toast({
          title: 'Invalid Amount',
          description: 'Please enter a valid amount to unstake.',
          variant: 'destructive',
        });
        return;
      }

      setIsProcessing(true);

      try {
        const amountInWei = parseUnits(amount, 18);

        toast({
          title: 'Unstaking Tokens',
          description: 'Please confirm the transaction in your wallet.',
        });

        const unstakeTx = await unstake({
          address: CONTRACT_ADDRESSES.CVTStaking as `0x${string}`,
          abi: CVT_STAKING_ABI,
          functionName: 'unstake',
          args: [amountInWei],
        });

        toast({
          title: 'Unstaking Successful!',
          description: `Successfully unstaked ${amount} CVT tokens.`,
        });

        setIsProcessing(false);
        return unstakeTx;
      } catch (error: any) {
        console.error('Unstaking error:', error);
        
        let errorMessage = 'Failed to unstake tokens.';
        if (error.message?.includes('user rejected')) {
          errorMessage = 'Transaction was rejected.';
        } else if (error.message?.includes('Insufficient staked amount')) {
          errorMessage = 'Insufficient staked amount.';
        }

        toast({
          title: 'Unstaking Failed',
          description: errorMessage,
          variant: 'destructive',
        });

        setIsProcessing(false);
        throw error;
      }
    },
    [address, unstake, toast]
  );

  return {
    unstakeTokens,
    isProcessing,
  };
}

/**
 * Hook for claiming yield rewards
 */
export function useClaimYield() {
  const { address } = useAccount();
  const { toast } = useToast();
  const [isPending, setIsPending] = useState(false);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();

  const { writeContractAsync: claimYield } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });
  const { balanceRaw: contractBalance } = useStakingContractBalance();

  const claimRewards = useCallback(async () => {
    if (!address) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet to claim rewards.',
        variant: 'destructive',
      });
      return;
    }

    // Check if contract has sufficient balance (warning only, don't block)
    if (contractBalance && contractBalance < BigInt(10 ** 18)) { // Less than 1 CVT
      toast({
        title: 'Low Contract Balance',
        description: 'The staking contract may have insufficient CVT. The transaction might fail.',
        variant: 'destructive',
      });
    }

    setIsPending(true);
    setTxHash(undefined);

    try {
      toast({
        title: 'Claiming Rewards',
        description: 'Please confirm the transaction in your wallet.',
      });

      const claimTx = await claimYield({
        address: CONTRACT_ADDRESSES.CVTStaking as `0x${string}`,
        abi: CVT_STAKING_ABI,
        functionName: 'claimYield',
      });

      setTxHash(claimTx);

      // Add to transaction history
      addTransaction({
        hash: claimTx,
        type: 'claim_staking',
        status: 'pending',
        timestamp: Date.now(),
        address: address,
      });

      toast({
        title: 'Transaction Submitted',
        description: 'Waiting for confirmation...',
      });

      setIsPending(false);
      return claimTx;
    } catch (error: any) {
      console.error('Claim error:', error);
      
      let errorMessage = 'Failed to claim rewards.';
      if (error.message?.includes('user rejected')) {
        errorMessage = 'Transaction was rejected.';
      } else if (error.message?.includes('No rewards to claim')) {
        errorMessage = 'No rewards available to claim.';
      } else if (error.message?.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for gas fees.';
      }

      toast({
        title: 'Claim Failed',
        description: errorMessage,
        variant: 'destructive',
      });

      setIsPending(false);
      setTxHash(undefined);
      throw error;
    }
  }, [address, claimYield, toast, contractBalance]);

  // Show success toast when confirmed and update transaction history
  useEffect(() => {
    if (isConfirmed && txHash) {
      updateTransactionStatus(txHash, 'confirmed');
      
      const explorerUrl = getBlockExplorerUrl(txHash);
      
      toast({
        title: 'Claim Successful!',
        description: `Your staking rewards have been transferred. View on Explorer: ${explorerUrl}`,
        action: {
          label: 'View Transaction',
          onClick: () => window.open(explorerUrl, '_blank'),
        },
      });
    }
  }, [isConfirmed, txHash, toast]);

  return {
    claimRewards,
    isProcessing: isPending || isConfirming,
    isPending,
    isConfirming,
    isConfirmed,
    txHash,
  };
}

