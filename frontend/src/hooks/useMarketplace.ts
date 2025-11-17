import { useState, useEffect, useCallback } from 'react';
import { useAccount, useReadContract, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits } from 'viem';
import { CONTRACT_ADDRESSES, CVT_MARKETPLACE_ABI, ERC20_ABI } from '@/lib/contracts';
import { MarketplaceListing, parseListing } from '@/services/marketplaceService';
import { useToast } from '@/hooks/use-toast';
import { addTransaction, updateTransactionStatus, getBlockExplorerUrl } from '@/services/transactionHistory';
import { updatePriceFromListings } from '@/services/priceService';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const;

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

  // Create contract calls for all listings
  const listingCalls = totalListings && totalListings > 0n
    ? Array.from({ length: Number(totalListings) }, (_, i) => ({
        address: CONTRACT_ADDRESSES.CVTMarketplace as `0x${string}`,
        abi: CVT_MARKETPLACE_ABI,
        functionName: 'getListing' as const,
        args: [BigInt(i + 1)],
      }))
    : [];

  // Fetch all listings using useReadContracts (batch read)
  const { data: listingsData, refetch: refetchListings } = useReadContracts({
    contracts: listingCalls,
    query: {
      enabled: listingCalls.length > 0,
    },
  });

  // Process fetched listings
  useEffect(() => {
    if (!listingsData || listingsData.length === 0) {
      if (totalListings === 0n) {
        setListings([]);
        setIsLoading(false);
      }
      return;
    }

    setIsLoading(true);
    try {
      const fetchedListings: MarketplaceListing[] = [];
      
      listingsData.forEach((result, index) => {
        if (result.status === 'success' && result.result) {
          try {
            const listingId = index + 1;
            // wagmi returns tuple as an array, but we need to handle it properly
            const listingTuple = result.result;
            const parsedListing = parseListing(listingId, listingTuple);
            fetchedListings.push(parsedListing);
          } catch (error) {
            console.error(`Error parsing listing ${index + 1}:`, error, result);
          }
        } else if (result.status === 'error') {
          console.warn(`Failed to fetch listing ${index + 1}:`, result.error);
        }
      });

      setListings(fetchedListings);
      setLastFetchTime(Date.now());
      
      // Update price from real marketplace listings
      if (fetchedListings.length > 0) {
        updatePriceFromListings(fetchedListings);
      }
    } catch (error) {
      console.error('Error processing listings:', error);
    } finally {
      setIsLoading(false);
    }
  }, [listingsData, totalListings]);

  // Auto-refetch every 30 seconds for production
  useEffect(() => {
    const interval = setInterval(() => {
      refetchTotal();
    }, 30000);

    return () => clearInterval(interval);
  }, [refetchTotal]);

  const refetch = useCallback(() => {
    refetchTotal();
    refetchListings();
  }, [refetchTotal, refetchListings]);

  return {
    listings,
    totalListings: Number(totalListings || 0),
    isLoading,
    lastFetchTime,
    refetch,
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
  const { address } = useAccount();
  const { toast } = useToast();
  const { writeContractAsync } = useWriteContract();
  const [isPending, setIsPending] = useState(false);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const { stablecoinAddress, isNativePayment } = useMarketplacePaymentAsset();

  // Get marketplace fee
  const { data: feeBps } = useReadContract({
    address: CONTRACT_ADDRESSES.CVTMarketplace as `0x${string}`,
    abi: CVT_MARKETPLACE_ABI,
    functionName: 'marketplaceFeeBps',
  });

  // Check stablecoin allowance
  const shouldCheckAllowance =
    !!address && !!stablecoinAddress && stablecoinAddress.toLowerCase() !== ZERO_ADDRESS.toLowerCase();

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: shouldCheckAllowance ? (stablecoinAddress as `0x${string}`) : undefined,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: shouldCheckAllowance ? [address, CONTRACT_ADDRESSES.CVTMarketplace as `0x${string}`] : undefined,
    query: {
      enabled: shouldCheckAllowance,
    },
  });

  const buyListing = useCallback(
    async (listingId: number, amount: string, pricePerToken: string) => {
      if (!writeContractAsync || !address) {
        toast({
          title: 'Error',
          description: 'Unable to write to contract',
          variant: 'destructive',
        });
        return;
      }

      if (!stablecoinAddress && !isNativePayment) {
        toast({
          title: 'Error',
          description: 'Stablecoin address not found',
          variant: 'destructive',
        });
        return;
      }
      
      const stablecoinAddr = (stablecoinAddress || ZERO_ADDRESS) as `0x${string}`;
      const needsApproval = !isNativePayment && stablecoinAddr.toLowerCase() !== address.toLowerCase();
      
      setIsPending(true);
      try {
        // Convert amount and price to wei (18 decimals)
        const amountWei = parseUnits(amount, 18);
        const priceWei = parseUnits(pricePerToken, 18);
        
        // Calculate total price (amount * price per token)
        // Both are in 18 decimals, so multiply and divide by 1e18 to get result in 18 decimals
        const oneEther = parseUnits('1', 18);
        const totalPriceWei = (amountWei * priceWei) / oneEther;
        
        // Calculate fee (in basis points)
        const feeBpsValue = feeBps ? Number(feeBps) : 250;
        const feeWei = (totalPriceWei * BigInt(feeBpsValue)) / BigInt(10000);
        
        // Total amount needed (price + fee)
        const totalNeededWei = totalPriceWei + feeWei;

        // Step 1: Approve stablecoin if needed (skip if stablecoin is user's address - mock setup)
        if (needsApproval) {
          // Check current allowance
          const currentAllowance = (allowance as bigint) || 0n;
          
          if (currentAllowance < totalNeededWei) {
            toast({
              title: 'Step 1 of 2: Approval Required',
              description: 'Please approve the marketplace to spend your stablecoin.',
            });

            const approveTx = await writeContractAsync({
              address: stablecoinAddr,
              abi: ERC20_ABI,
              functionName: 'approve',
              args: [CONTRACT_ADDRESSES.CVTMarketplace as `0x${string}`, totalNeededWei],
            });

            toast({
              title: 'Approval Submitted',
              description: 'Waiting for approval confirmation...',
            });

            // Wait for approval transaction to be confirmed
            // Wait a reasonable amount of time for the transaction to be mined
            await new Promise((resolve) => setTimeout(resolve, 5000));
            
            toast({
              title: 'Approval Submitted',
              description: 'Proceeding with purchase...',
            });
          }
        }

        // Step 2: Purchase CVT tokens
        toast({
          title: 'Step 2 of 2: Processing Purchase',
          description: 'Please confirm the purchase transaction...',
        });

        const buyTx = await writeContractAsync({
          address: CONTRACT_ADDRESSES.CVTMarketplace as `0x${string}`,
          abi: CVT_MARKETPLACE_ABI,
          functionName: 'buyCVT',
          args: [BigInt(listingId), amountWei],
          value: isNativePayment ? totalNeededWei : undefined,
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
        } else if (error?.message?.includes('allowance')) {
          errorMessage = 'Insufficient stablecoin allowance. Please approve the marketplace.';
        } else if (error?.message?.includes('Listing inactive')) {
          errorMessage = 'This listing is no longer active';
        } else if (error?.message?.includes('Insufficient tokens')) {
          errorMessage = 'Insufficient tokens available in this listing';
        } else if (error?.message?.includes('ERC20: transfer amount exceeds allowance')) {
          errorMessage = 'Insufficient stablecoin allowance. Please try again.';
        } else if (error?.message?.includes('External transactions to internal accounts')) {
          errorMessage = 'Stablecoin address is not properly configured. Please contact administrator to fix the marketplace configuration.';
        } else if (error?.message?.includes('transferFrom') || error?.message?.includes('ERC20')) {
          errorMessage = 'Stablecoin token error. The marketplace may not be properly configured with a valid stablecoin address.';
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
    [writeContractAsync, toast, address, stablecoinAddress, isNativePayment, feeBps, allowance, refetchAllowance]
  );

  return {
    buyListing,
    isPending: isPending || isConfirming,
    isConfirmed,
    txHash,
  };
}

export function useCancelListing() {
  const { address } = useAccount();
  const { toast } = useToast();
  const { writeContractAsync } = useWriteContract();
  const [isPending, setIsPending] = useState(false);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const cancelListing = useCallback(
    async (listingId: number) => {
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
          title: 'Cancelling Listing',
          description: 'Please confirm the transaction in your wallet.',
        });

        const cancelTx = await writeContractAsync({
          address: CONTRACT_ADDRESSES.CVTMarketplace as `0x${string}`,
          abi: CVT_MARKETPLACE_ABI,
          functionName: 'cancelListing',
          args: [BigInt(listingId)],
        });

        setTxHash(cancelTx);

        // Add to transaction history
        addTransaction({
          hash: cancelTx,
          type: 'cancel_listing',
          status: 'pending',
          timestamp: Date.now(),
          address: address,
        });

        toast({
          title: 'Transaction Submitted',
          description: 'Waiting for confirmation...',
        });

        setIsPending(false);
        return cancelTx;
      } catch (error: any) {
        console.error('Error cancelling listing:', error);
        
        let errorMessage = 'Failed to cancel listing';
        if (error?.message?.includes('user rejected')) {
          errorMessage = 'Transaction was rejected';
        } else if (error?.message?.includes('Not the seller')) {
          errorMessage = 'You are not the seller of this listing';
        } else if (error?.message?.includes('Listing not active')) {
          errorMessage = 'This listing is no longer active';
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
    },
    [writeContractAsync, address, toast]
  );

  // Show success toast when confirmed and update transaction history
  useEffect(() => {
    if (isConfirmed && txHash) {
      updateTransactionStatus(txHash, 'confirmed');
      
      const explorerUrl = getBlockExplorerUrl(txHash);
      
      toast({
        title: 'Listing Cancelled!',
        description: `Your tokens have been returned to your wallet. View on Explorer: ${explorerUrl}`,
        action: {
          label: 'View Transaction',
          onClick: () => window.open(explorerUrl, '_blank'),
        },
      });
    }
  }, [isConfirmed, txHash, toast]);

  return {
    cancelListing,
    isPending: isPending || isConfirming,
    isConfirming,
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

export function useMarketplacePaymentAsset() {
  const { data: stablecoinAddress } = useReadContract({
    address: CONTRACT_ADDRESSES.CVTMarketplace as `0x${string}`,
    abi: CVT_MARKETPLACE_ABI,
    functionName: 'stablecoin',
  });

  const addressStr = stablecoinAddress || ZERO_ADDRESS;
  const isNativePayment = addressStr.toLowerCase() === ZERO_ADDRESS.toLowerCase();

  return {
    stablecoinAddress: stablecoinAddress as `0x${string}` | undefined,
    isNativePayment,
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
