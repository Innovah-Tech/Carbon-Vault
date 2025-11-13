import { useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import { CONTRACT_ADDRESSES, ERC20_ABI } from '@/lib/contracts';

/**
 * Hook to check if a contract has sufficient CVT balance
 * @param contractAddress The address of the contract to check
 * @param requiredAmount The amount needed in wei
 */
export function useContractCVTBalance(contractAddress: `0x${string}`) {
  const { data: balance, isLoading, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.CVTMinting as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [contractAddress],
  });

  const balanceFormatted = balance ? formatUnits(balance as bigint, 18) : '0';
  
  return {
    balance: balanceFormatted,
    balanceRaw: balance as bigint | undefined,
    isLoading,
    refetch,
    hasSufficientBalance: (requiredAmount: bigint) => {
      if (!balance) return false;
      return (balance as bigint) >= requiredAmount;
    },
  };
}

/**
 * Hook specifically for CVTStaking contract balance
 */
export function useStakingContractBalance() {
  return useContractCVTBalance(CONTRACT_ADDRESSES.CVTStaking as `0x${string}`);
}

/**
 * Hook specifically for ValidatorRewards contract balance
 */
export function useValidatorRewardsContractBalance() {
  return useContractCVTBalance(CONTRACT_ADDRESSES.ValidatorRewards as `0x${string}`);
}

