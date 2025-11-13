// Development tools for testing and debugging
// These functions are exposed globally in development mode

import { resetToDefaultPrice, setCVTPrice, clearPriceHistory } from '@/services/priceService';

// Clear all marketplace listings from localStorage
function clearAllListings() {
  // Clear marketplace-related localStorage keys
  const keysToRemove = [
    'carbon_vault_watchlist',
    'carbon_vault_notifications',
    'carbon_vault_analytics_history',
  ];
  
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
  });
  
  console.log('✅ All marketplace listings and related data cleared');
}

// Make functions available in browser console
if (typeof window !== 'undefined') {
  (window as any).devTools = {
    // Reset CVT price to default ($1.0)
    resetPrice: () => {
      resetToDefaultPrice();
      console.log('✅ Price reset to $1.0');
      console.log('✅ Historical data regenerated (range: $0.2 - $1.8)');
      window.location.reload();
    },
    
    // Set custom price
    setPrice: (price: number) => {
      setCVTPrice({
        current: price,
        high24h: price * 1.05,
        low24h: price * 0.95,
      });
      console.log(`✅ Price set to $${price}`);
      window.location.reload();
    },
    
    // Update graph with new data
    updateGraph: () => {
      clearPriceHistory();
      console.log('✅ Graph data regenerated');
      window.location.reload();
    },
    
    // Clear all marketplace listings
    clearListings: () => {
      clearAllListings();
      console.log('✅ Marketplace listings cleared');
      window.location.reload();
    },
    
    // Clear localStorage
    clearStorage: () => {
      localStorage.clear();
      console.log('✅ localStorage cleared');
      window.location.reload();
    },
    
    // Show help
    help: () => {
      console.log(`
🛠️  Carbon Vault Dev Tools
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Available Commands:
  
  devTools.resetPrice()
    → Reset CVT price to default ($1.0) and reload
    → Price range: $0.2 - $1.8
  
  devTools.setPrice(amount)
    → Set custom price and reload (e.g., devTools.setPrice(1.5))
  
  devTools.updateGraph()
    → Regenerate graph data and reload
  
  devTools.clearListings()
    → Clear all marketplace listings and reload
  
  devTools.clearStorage()
    → Clear all localStorage data and reload
  
  devTools.help()
    → Show this help message

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      `);
    },
  };
  
  // Show welcome message
  console.log('%c🛠️  Carbon Vault Dev Tools Loaded', 'color: #22c55e; font-weight: bold; font-size: 14px;');
  console.log('%cType devTools.help() for available commands', 'color: #888; font-size: 12px;');
}

