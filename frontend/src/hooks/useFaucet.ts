import { useMemo, useState } from 'react';
import { useAccount, useWriteContract } from 'wagmi';
import { CONTRACT_ADDRESSES, CVT_MINTING_ABI } from '@/lib/contracts';
import { useToast } from '@/hooks/use-toast';
import { useFaucetInfo } from './useContractData';

export function useFaucet() {
  const { address, isConnected } = useAccount();
  const { toast } = useToast();
  const [isClaiming, setIsClaiming] = useState(false);
  const { writeContractAsync } = useWriteContract();
  const { faucetAmount, faucetCooldown, lastFaucetMint, refetch } = useFaucetInfo();

  const now = Math.floor(Date.now() / 1000);
  const nextEligible = lastFaucetMint ? Number(lastFaucetMint) + Number(faucetCooldown || 0n) : 0;
  const remainingCooldown = Math.max(0, nextEligible - now);

  const canClaim = useMemo(() => {
    if (!isConnected || !address) return false;
    if (!faucetAmount || faucetAmount === '0') return false;
    if (!lastFaucetMint) return true;
    return remainingCooldown === 0;
  }, [isConnected, address, faucetAmount, lastFaucetMint, remainingCooldown]);

  const claim = async () => {
    if (!isConnected || !address) {
      toast({
        title: 'Wallet not connected',
        description: 'Please connect your wallet to claim CVT.',
        variant: 'destructive',
      });
      return;
    }

    if (!canClaim) {
      toast({
        title: 'Faucet cooldown',
        description: 'Please wait until the cooldown expires.',
      });
      return;
    }

    setIsClaiming(true);
    try {
      const tx = await writeContractAsync({
        address: CONTRACT_ADDRESSES.CVTMinting as `0x${string}`,
        abi: CVT_MINTING_ABI,
        functionName: 'claimFaucet',
      });

      toast({
        title: 'Transaction submitted',
        description: 'Claiming 5 CVT...',
      });

      await tx.wait();

      toast({
        title: 'Faucet claimed',
        description: `You received ${parseFloat(faucetAmount).toFixed(2)} CVT.`,
      });

      refetch();
    } catch (error: any) {
      console.error('Faucet claim failed:', error);
      toast({
        title: 'Transaction failed',
        description: error?.message || 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsClaiming(false);
    }
  };

  return {
    claim,
    canClaim,
    isClaiming,
    faucetAmount,
    remainingCooldown,
  };
}

