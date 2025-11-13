import { useState, useEffect } from 'react';
import { getCVTPrice, CVTPrice, updatePriceFromListings, resetToDefaultPrice } from '@/services/priceService';
import { useMarketplaceListings } from './useMarketplace';

/**
 * Hook to get current CVT price
 * Automatically updates when price changes in localStorage
 * Integrates real data from marketplace listings
 */
export function useCVTPrice() {
  const { listings } = useMarketplaceListings();
  const [price, setPrice] = useState<CVTPrice>(getCVTPrice());
  const [isLoading, setIsLoading] = useState(false);

  // Update price from marketplace listings when they change
  useEffect(() => {
    if (listings && listings.length > 0) {
      updatePriceFromListings(listings);
      setPrice(getCVTPrice());
    }
  }, [listings]);

  useEffect(() => {
    // Initial load
    setPrice(getCVTPrice());

    // Listen for storage changes (if price is updated in another tab/component)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'carbon_vault_cvt_price' || e.key === 'carbon_vault_price_history') {
        setPrice(getCVTPrice());
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Optional: Auto-refresh price every minute
    const interval = setInterval(() => {
      setPrice(getCVTPrice());
    }, 60000); // 60 seconds

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const refetch = () => {
    setIsLoading(true);
    setPrice(getCVTPrice());
    setIsLoading(false);
  };

  const resetPrice = () => {
    resetToDefaultPrice();
    setPrice(getCVTPrice());
  };

  return {
    price,
    isLoading,
    refetch,
    resetPrice,
  };
}

/**
 * Hook to calculate USD value of CVT amount
 */
export function useCVTtoUSD(cvtAmount: number | string) {
  const { price } = useCVTPrice();
  
  const amount = typeof cvtAmount === 'string' ? parseFloat(cvtAmount) : cvtAmount;
  const usdValue = amount * price.current;
  
  return {
    usd: usdValue,
    formatted: `$${usdValue.toFixed(2)}`,
  };
}

