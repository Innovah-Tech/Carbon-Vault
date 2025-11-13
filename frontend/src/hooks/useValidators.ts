import { useState, useEffect, useCallback } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatUnits } from 'viem';
import { CONTRACT_ADDRESSES, VALIDATOR_REWARDS_ABI } from '@/lib/contracts';
import { useToast } from '@/hooks/use-toast';
import { addTransaction, updateTransactionStatus, getBlockExplorerUrl } from '@/services/transactionHistory';
import { useValidatorRewardsContractBalance } from './useContractBalance';

export function useValidatorRewards() {
  const { address } = useAccount();
  const { toast } = useToast();

  // Get pending rewards
  const { data: pendingRewards, refetch: refetchRewards } = useReadContract({
    address: CONTRACT_ADDRESSES.ValidatorRewards as `0x${string}`,
    abi: VALIDATOR_REWARDS_ABI,
    functionName: 'getPendingRewards',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // Get verified proofs count
  const { data: verifiedCount, refetch: refetchCount } = useReadContract({
    address: CONTRACT_ADDRESSES.ValidatorRewards as `0x${string}`,
    abi: VALIDATOR_REWARDS_ABI,
    functionName: 'getVerifiedProofsCount',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // Get reward per proof
  const { data: rewardPerProof } = useReadContract({
    address: CONTRACT_ADDRESSES.ValidatorRewards as `0x${string}`,
    abi: VALIDATOR_REWARDS_ABI,
    functionName: 'rewardPerProof',
  });

  const formattedRewards = pendingRewards ? formatUnits(pendingRewards as bigint, 18) : '0';
  const formattedRewardPerProof = rewardPerProof ? formatUnits(rewardPerProof as bigint, 18) : '1';
  const proofCount = Number(verifiedCount || 0);

  // Update validator storage when data changes
  useEffect(() => {
    if (address && verifiedCount !== undefined && pendingRewards !== undefined) {
      import('@/services/validatorStorage').then(({ updateValidator }) => {
        const totalRewards = (proofCount * parseFloat(formattedRewardPerProof)).toFixed(2);
        updateValidator(address, proofCount, totalRewards, formattedRewards);
      });
    }
  }, [address, verifiedCount, pendingRewards, proofCount, formattedRewards, formattedRewardPerProof]);

  const refetch = useCallback(() => {
    refetchRewards();
    refetchCount();
  }, [refetchRewards, refetchCount]);

  return {
    pendingRewards: formattedRewards,
    pendingRewardsRaw: pendingRewards as bigint | undefined,
    verifiedProofsCount: proofCount,
    rewardPerProof: formattedRewardPerProof,
    rewardPerProofRaw: rewardPerProof as bigint | undefined,
    refetch,
  };
}

export function useClaimRewards() {
  const { address } = useAccount();
  const { toast } = useToast();
  const { writeContractAsync } = useWriteContract();
  const [isPending, setIsPending] = useState(false);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });
  const { balanceRaw: contractBalance } = useValidatorRewardsContractBalance();

  const claimRewards = useCallback(async () => {
    if (!writeContractAsync || !address) {
      toast({
        title: 'Error',
        description: 'Unable to write to contract',
        variant: 'destructive',
      });
      return;
    }

    // Check if contract has sufficient balance (warning only, don't block)
    if (contractBalance && contractBalance < BigInt(10 ** 18)) { // Less than 1 CVT
      toast({
        title: 'Low Contract Balance',
        description: 'The validator rewards contract may have insufficient CVT. The transaction might fail.',
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

      const tx = await writeContractAsync({
        address: CONTRACT_ADDRESSES.ValidatorRewards as `0x${string}`,
        abi: VALIDATOR_REWARDS_ABI,
        functionName: 'claimReward',
      });

      setTxHash(tx);

      // Add to transaction history
      addTransaction({
        hash: tx,
        type: 'claim_validator',
        status: 'pending',
        timestamp: Date.now(),
        address: address,
      });

      toast({
        title: 'Transaction Submitted',
        description: 'Waiting for confirmation...',
      });

      setIsPending(false);
      return tx;
    } catch (error: any) {
      console.error('Error claiming rewards:', error);

      let errorMessage = 'Failed to claim rewards';
      if (error?.message?.includes('user rejected')) {
        errorMessage = 'Transaction was rejected';
      } else if (error?.message?.includes('No rewards to claim')) {
        errorMessage = 'You have no rewards to claim';
      } else if (error?.message?.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for gas fees';
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
  }, [writeContractAsync, address, toast, contractBalance]);

  // Show success toast when confirmed and update transaction history
  useEffect(() => {
    if (isConfirmed && txHash) {
      updateTransactionStatus(txHash, 'confirmed');
      
      const explorerUrl = getBlockExplorerUrl(txHash);
      
      toast({
        title: 'Rewards Claimed!',
        description: `Your validator rewards have been transferred. View on Explorer: ${explorerUrl}`,
        action: {
          label: 'View Transaction',
          onClick: () => window.open(explorerUrl, '_blank'),
        },
      });
    }
  }, [isConfirmed, txHash, toast]);

  return {
    claimRewards,
    isPending: isPending || isConfirming,
    isConfirming,
    isConfirmed,
    txHash,
  };
}

export function useSubmitProof() {
  const { toast } = useToast();
  const { writeContractAsync } = useWriteContract();
  const [isPending, setIsPending] = useState(false);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const submitProof = useCallback(
    async (validatorAddress: string) => {
      if (!writeContractAsync) {
        toast({
          title: 'Error',
          description: 'Unable to write to contract',
          variant: 'destructive',
        });
        return;
      }

      setIsPending(true);
      try {
        toast({
          title: 'Submitting Proof',
          description: 'Please confirm the transaction...',
        });

        const tx = await writeContractAsync({
          address: CONTRACT_ADDRESSES.ValidatorRewards as `0x${string}`,
          abi: VALIDATOR_REWARDS_ABI,
          functionName: 'submitProof',
          args: [validatorAddress as `0x${string}`],
        });

        setTxHash(tx);

        toast({
          title: 'Proof Submitted!',
          description: 'Verification proof has been recorded on-chain.',
        });

        return tx;
      } catch (error: any) {
        console.error('Error submitting proof:', error);

        let errorMessage = 'Failed to submit proof';
        if (error?.message?.includes('user rejected')) {
          errorMessage = 'Transaction was rejected';
        } else if (error?.message?.includes('Not authorized')) {
          errorMessage = 'You are not authorized to submit proofs';
        }

        toast({
          title: 'Transaction Failed',
          description: errorMessage,
          variant: 'destructive',
        });
        throw error;
      } finally {
        setIsPending(false);
      }
    },
    [writeContractAsync, toast]
  );

  return {
    submitProof,
    isPending: isPending || isConfirming,
    isConfirmed,
    txHash,
  };
}

// Hook for all validators leaderboard data
export function useValidatorsLeaderboard() {
  const [validators, setValidators] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { address: currentAddress } = useAccount();

  const loadValidators = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // Import storage functions dynamically to avoid issues
      const { 
        getLeaderboardData, 
        calculateValidatorMetrics,
        updateValidator,
        registerValidator 
      } = await import('@/services/validatorStorage');
      
      // Get stored validators
      const storedValidators = getLeaderboardData('proofs');
      
      // Register current user if connected
      if (currentAddress) {
        registerValidator(currentAddress);
      }
      
      // Transform data for display
      const transformedValidators = storedValidators.map((v, index) => {
        const metrics = calculateValidatorMetrics(v);
        
        return {
          address: v.address,
          verifiedProofsCount: v.verifiedProofsCount,
          totalRewards: v.totalRewards,
          pendingRewards: v.pendingRewards,
          avgRewardPerProof: metrics.avgRewardPerProof,
          proofsPerDay: metrics.proofsPerDay,
          reputation: metrics.reputation,
          isActive: metrics.isActive,
          rank: index + 1,
          daysSinceJoined: metrics.daysSinceJoined,
          successRate: '0', // Can be calculated from submission data if available
          lastUpdated: v.lastUpdated,
        };
      });
      
      setValidators(transformedValidators);
    } catch (error) {
      console.error('Error loading validators:', error);
      setValidators([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentAddress]);

  useEffect(() => {
    loadValidators();
  }, [loadValidators]);

  return {
    validators,
    isLoading,
    refetch: loadValidators,
  };
}

// Hook for validator statistics
export function useValidatorStats() {
  const { address } = useAccount();
  const { pendingRewards, verifiedProofsCount, rewardPerProof } = useValidatorRewards();

  // Calculate additional stats
  const totalEarnings = (verifiedProofsCount * parseFloat(rewardPerProof)).toFixed(2);
  const avgRewardPerProof = verifiedProofsCount > 0
    ? (parseFloat(totalEarnings) / verifiedProofsCount).toFixed(2)
    : '0';

  // Mock success rate (in production, calculate from actual data)
  const successRate = verifiedProofsCount > 0
    ? Math.min(95, 70 + Math.random() * 20).toFixed(1)
    : '0';

  return {
    pendingRewards,
    verifiedProofsCount,
    rewardPerProof,
    totalEarnings,
    avgRewardPerProof,
    successRate,
    hasRewards: parseFloat(pendingRewards) > 0,
  };
}

// Hook for auto-refresh
export function useAutoRefreshValidators(interval: number = 30000) {
  const { refetch } = useValidatorRewards();

  useEffect(() => {
    const timer = setInterval(() => {
      refetch();
    }, interval);

    return () => clearInterval(timer);
  }, [refetch, interval]);
}

