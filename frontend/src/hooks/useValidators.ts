import { useState, useEffect, useCallback } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatUnits } from 'viem';
import { CONTRACT_ADDRESSES, VALIDATOR_REWARDS_ABI } from '@/lib/contracts';
import { useToast } from '@/hooks/use-toast';

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

  const refetch = useCallback(() => {
    refetchRewards();
    refetchCount();
  }, [refetchRewards, refetchCount]);

  return {
    pendingRewards: formattedRewards,
    pendingRewardsRaw: pendingRewards as bigint | undefined,
    verifiedProofsCount: Number(verifiedCount || 0),
    rewardPerProof: formattedRewardPerProof,
    rewardPerProofRaw: rewardPerProof as bigint | undefined,
    refetch,
  };
}

export function useClaimRewards() {
  const { toast } = useToast();
  const { writeContractAsync } = useWriteContract();
  const [isPending, setIsPending] = useState(false);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const claimRewards = useCallback(async () => {
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
        title: 'Claiming Rewards',
        description: 'Please confirm the transaction...',
      });

      const tx = await writeContractAsync({
        address: CONTRACT_ADDRESSES.ValidatorRewards as `0x${string}`,
        abi: VALIDATOR_REWARDS_ABI,
        functionName: 'claimReward',
      });

      setTxHash(tx);

      toast({
        title: 'Rewards Claimed!',
        description: 'Your rewards have been transferred to your wallet.',
      });

      return tx;
    } catch (error: any) {
      console.error('Error claiming rewards:', error);

      let errorMessage = 'Failed to claim rewards';
      if (error?.message?.includes('user rejected')) {
        errorMessage = 'Transaction was rejected';
      } else if (error?.message?.includes('No rewards to claim')) {
        errorMessage = 'You have no rewards to claim';
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
  }, [writeContractAsync, toast]);

  return {
    claimRewards,
    isPending: isPending || isConfirming,
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

  useEffect(() => {
    // In production, fetch from blockchain or subgraph
    // For now, using mock data
    const mockValidators = Array.from({ length: 10 }, (_, i) => ({
      address: `0x${Math.random().toString(16).substr(2, 40)}`,
      verifiedProofsCount: Math.floor(Math.random() * 150) + 10,
      totalRewards: (Math.random() * 100 + 10).toFixed(2),
      successRate: (70 + Math.random() * 25).toFixed(1),
      reputation: Math.floor(Math.random() * 40) + 60,
      rank: i + 1,
    }));

    mockValidators.sort((a, b) => b.verifiedProofsCount - a.verifiedProofsCount);
    mockValidators.forEach((v, i) => (v.rank = i + 1));

    setValidators(mockValidators);
    setIsLoading(false);
  }, []);

  return {
    validators,
    isLoading,
    refetch: () => {
      // Implement refetch logic
    },
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

