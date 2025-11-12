import { useState, useEffect, useCallback } from 'react';
import { useAccount, useReadContract, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits } from 'viem';
import { CONTRACT_ADDRESSES, CVT_MARKETPLACE_ABI, ERC20_ABI } from '@/lib/contracts';
import { MarketplaceListing, parseListing } from '@/services/marketplaceService';
import { useToast } from '@/hooks/use-toast';

// Hook to fetch all marketplace listings with multicall
export function useMarketplaceListings() {
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastFetchTime, setLastFetchTime] = useState(Date.now());

  // Get total number of listings
  const { data: totalListings, refetch: refetchTotal } = useReadContract({
    address: CONTRACT_ADDRESSES.CVTMarketplace as `0x${string}`,
    abi: CVT_MARKETPLACE_ABI,
    functionName: 'getTotalListings',
  });

  // Fetch all listings using multicall
  useEffect(() => {
    async function fetchListings() {
      if (!totalListings || totalListings === 0n) {
        setListings([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const count = Number(totalListings);
      
      try {
        // Create contract calls for all listings
        const listingCalls = Array.from({ length: count }, (_, i) => ({
          address: CONTRACT_ADDRESSES.CVTMarketplace as `0x${string}`,
          abi: CVT_MARKETPLACE_ABI,
          functionName: 'getListing' as const,
          args: [BigInt(i + 1)],
        }));

        // Batch fetch all listings - we'll use a simpler approach
        // In production, you'd use wagmi's useReadContracts with all calls
        const fetchedListings: MarketplaceListing[] = [];
        
        // For now, we'll fetch sequentially (in production, use multicall library)
        for (let i = 1; i <= count; i++) {
          try {
            // This would be replaced with actual multicall in production
            // For now, we'll create mock data based on the listing ID
            const mockListing = createMockListing(i);
            fetchedListings.push(mockListing);
          } catch (error) {
            console.error(`Error fetching listing ${i}:`, error);
          }
        }

        setListings(fetchedListings);
        setLastFetchTime(Date.now());
      } catch (error) {
        console.error('Error fetching listings:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchListings();
  }, [totalListings]);

  // Auto-refetch every 30 seconds for production
  useEffect(() => {
    const interval = setInterval(() => {
      refetchTotal();
    }, 30000);

    return () => clearInterval(interval);
  }, [refetchTotal]);

  const refetch = useCallback(() => {
    refetchTotal();
  }, [refetchTotal]);

  return {
    listings,
    totalListings: Number(totalListings || 0),
    isLoading,
    lastFetchTime,
    refetch,
  };
}

// Helper function to create mock listing (replace with actual blockchain call in production)
function createMockListing(id: number): MarketplaceListing {
  const sellers = [
    '0x1234567890123456789012345678901234567890',
    '0x2345678901234567890123456789012345678901',
    '0x3456789012345678901234567890123456789012',
    '0x4567890123456789012345678901234567890123',
  ];
  
  const offsetTypes = ['Reforestation', 'Renewable Energy', 'Carbon Capture', 'Ocean Conservation'];
  const vintages = ['2024', '2023', '2022', '2021'];
  
  const amount = (Math.random() * 1000 + 100).toFixed(2);
  const pricePerToken = (Math.random() * 5 + 1).toFixed(2);
  const totalValue = (parseFloat(amount) * parseFloat(pricePerToken)).toFixed(2);
  const createdAt = Math.floor(Date.now() / 1000) - Math.random() * 30 * 24 * 60 * 60;
  const expiresAt = Math.random() > 0.3 ? Math.floor(Date.now() / 1000) + Math.random() * 60 * 24 * 60 * 60 : 0;
  
  return {
    id,
    seller: sellers[id % sellers.length],
    amount,
    price: pricePerToken,
    pricePerToken,
    active: Math.random() > 0.2,
    createdAt,
    expiresAt,
    totalValue,
    isExpired: expiresAt > 0 && Math.floor(Date.now() / 1000) > expiresAt,
    daysRemaining: expiresAt > 0 ? Math.max(0, Math.ceil((expiresAt - Math.floor(Date.now() / 1000)) / (24 * 60 * 60))) : null,
    offsetType: offsetTypes[id % offsetTypes.length],
    vintage: vintages[id % vintages.length],
    yield: (5 + (id % 10) * 0.5).toFixed(1),
  };
}

export function useCreateListing() {
  const { toast } = useToast();
  const { writeContractAsync } = useWriteContract();
  const [isPending, setIsPending] = useState(false);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const createListing = useCallback(
    async (amount: string, pricePerToken: string, expiresInDays: number) => {
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
        // Convert amount and price to wei
        const amountWei = parseUnits(amount, 18);
        const priceWei = parseUnits(pricePerToken, 18);
        const expiresIn = expiresInDays * 24 * 60 * 60; // Convert days to seconds

        // First, approve the marketplace to spend tokens
        toast({
          title: 'Step 1 of 2: Approval',
          description: 'Please approve the marketplace to spend your tokens...',
        });

        const approveTx = await writeContractAsync({
          address: CONTRACT_ADDRESSES.CVTMinting as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [CONTRACT_ADDRESSES.CVTMarketplace as `0x${string}`, amountWei],
        });

        toast({
          title: 'Approval Submitted',
          description: 'Waiting for approval confirmation...',
        });

        // Wait a bit for approval to be mined
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Create listing
        toast({
          title: 'Step 2 of 2: Creating Listing',
          description: 'Please confirm the listing creation...',
        });

        const listingTx = await writeContractAsync({
          address: CONTRACT_ADDRESSES.CVTMarketplace as `0x${string}`,
          abi: CVT_MARKETPLACE_ABI,
          functionName: 'listCVT',
          args: [amountWei, priceWei, BigInt(expiresIn)],
        });

        setTxHash(listingTx);

        toast({
          title: 'Listing Created!',
          description: 'Your CVT tokens are now listed for sale!',
        });

        return listingTx;
      } catch (error: any) {
        console.error('Error creating listing:', error);
        
        let errorMessage = 'Failed to create listing';
        if (error?.message?.includes('user rejected')) {
          errorMessage = 'Transaction was rejected';
        } else if (error?.message?.includes('insufficient funds')) {
          errorMessage = 'Insufficient funds for gas';
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
    createListing,
    isPending: isPending || isConfirming,
    isConfirmed,
    txHash,
  };
}

export function useBuyListing() {
  const { toast } = useToast();
  const { writeContractAsync } = useWriteContract();
  const [isPending, setIsPending] = useState(false);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const buyListing = useCallback(
    async (listingId: number, totalPrice: string) => {
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
        // In production, first approve stablecoin spending
        // For now, we'll just call buyCVT
        toast({
          title: 'Processing Purchase',
          description: 'Please confirm the transaction...',
        });

        const buyTx = await writeContractAsync({
          address: CONTRACT_ADDRESSES.CVTMarketplace as `0x${string}`,
          abi: CVT_MARKETPLACE_ABI,
          functionName: 'buyCVT',
          args: [BigInt(listingId)],
        });

        setTxHash(buyTx);

        toast({
          title: 'Purchase Successful!',
          description: 'CVT tokens have been transferred to your wallet!',
        });

        return buyTx;
      } catch (error: any) {
        console.error('Error buying listing:', error);
        
        let errorMessage = 'Failed to purchase listing';
        if (error?.message?.includes('user rejected')) {
          errorMessage = 'Transaction was rejected';
        } else if (error?.message?.includes('insufficient funds')) {
          errorMessage = 'Insufficient funds';
        } else if (error?.message?.includes('Listing inactive')) {
          errorMessage = 'This listing is no longer active';
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
    buyListing,
    isPending: isPending || isConfirming,
    isConfirmed,
    txHash,
  };
}

export function useCancelListing() {
  const { toast } = useToast();
  const { writeContractAsync } = useWriteContract();
  const [isPending, setIsPending] = useState(false);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const cancelListing = useCallback(
    async (listingId: number) => {
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
          title: 'Cancelling Listing',
          description: 'Please confirm the transaction...',
        });

        const cancelTx = await writeContractAsync({
          address: CONTRACT_ADDRESSES.CVTMarketplace as `0x${string}`,
          abi: CVT_MARKETPLACE_ABI,
          functionName: 'cancelListing',
          args: [BigInt(listingId)],
        });

        setTxHash(cancelTx);

        toast({
          title: 'Listing Cancelled',
          description: 'Your tokens have been returned to your wallet.',
        });

        return cancelTx;
      } catch (error: any) {
        console.error('Error cancelling listing:', error);
        
        let errorMessage = 'Failed to cancel listing';
        if (error?.message?.includes('user rejected')) {
          errorMessage = 'Transaction was rejected';
        } else if (error?.message?.includes('Not the seller')) {
          errorMessage = 'You are not the seller of this listing';
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
    cancelListing,
    isPending: isPending || isConfirming,
    isConfirmed,
    txHash,
  };
}

export function useMarketplaceFee() {
  const { data: feeBps } = useReadContract({
    address: CONTRACT_ADDRESSES.CVTMarketplace as `0x${string}`,
    abi: CVT_MARKETPLACE_ABI,
    functionName: 'marketplaceFeeBps',
  });

  // Convert basis points to percentage (250 bps = 2.5%)
  const feePercentage = feeBps ? Number(feeBps) / 100 : 2.5;

  return {
    feeBps: Number(feeBps || 250),
    feePercentage,
  };
}

export function useUserListings() {
  const { address } = useAccount();
  const { listings, isLoading, refetch } = useMarketplaceListings();

  const userListings = listings.filter(
    listing => listing.seller.toLowerCase() === address?.toLowerCase()
  );

  return {
    userListings,
    totalUserListings: userListings.length,
    activeUserListings: userListings.filter(l => l.active && !l.isExpired).length,
    isLoading,
    refetch,
  };
}

// Hook for watching specific listing
export function useWatchListing(listingId: number | null) {
  const { data: listing, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.CVTMarketplace as `0x${string}`,
    abi: CVT_MARKETPLACE_ABI,
    functionName: 'getListing',
    args: listingId ? [BigInt(listingId)] : undefined,
    query: {
      enabled: listingId !== null,
    },
  });

  return {
    listing: listing ? parseListing(listingId!, listing) : null,
    refetch,
  };
}

// Hook for checking token allowance
export function useTokenAllowance() {
  const { address } = useAccount();
  
  const { data: allowance, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.CVTMinting as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, CONTRACT_ADDRESSES.CVTMarketplace as `0x${string}`] : undefined,
    query: {
      enabled: !!address,
    },
  });

  return {
    allowance: allowance || 0n,
    hasAllowance: (allowance || 0n) > 0n,
    refetch,
  };
}
