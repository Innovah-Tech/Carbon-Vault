import { MarketplaceListing } from './marketplaceService';

export interface PriceHistory {
  timestamp: number;
  price: number;
  volume: number;
}

export interface MarketAnalytics {
  // Price analytics
  currentAveragePrice: number;
  priceChange24h: number;
  priceChange7d: number;
  highestPrice24h: number;
  lowestPrice24h: number;
  
  // Volume analytics
  totalVolume24h: number;
  totalVolume7d: number;
  volumeChange24h: number;
  
  // Listing analytics
  newListings24h: number;
  soldListings24h: number;
  cancelledListings24h: number;
  activeListingsCount: number;
  
  // Market health
  liquidityScore: number; // 0-100
  marketDepth: number;
  averageTimeToSell: number; // hours
  
  // Trends
  priceDirection: 'up' | 'down' | 'stable';
  volumeDirection: 'increasing' | 'decreasing' | 'stable';
  popularOffsetType: string;
  popularVintage: string;
}

export interface ChartDataPoint {
  timestamp: number;
  date: string;
  price: number;
  volume: number;
  listings: number;
}

const ANALYTICS_KEY = 'carbon_vault_analytics_history';
const PRICE_HISTORY_KEY = 'carbon_vault_price_history';

// Save analytics snapshot
export function saveAnalyticsSnapshot(listings: MarketplaceListing[]): void {
  try {
    const snapshot = {
      timestamp: Date.now(),
      listings: listings.length,
      activeListings: listings.filter(l => l.active && !l.isExpired).length,
      averagePrice: calculateAveragePrice(listings),
      totalVolume: calculateTotalVolume(listings),
    };
    
    const history = getAnalyticsHistory();
    history.push(snapshot);
    
    // Keep only last 30 days
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const filtered = history.filter(s => s.timestamp > thirtyDaysAgo);
    
    localStorage.setItem(ANALYTICS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error saving analytics snapshot:', error);
  }
}

// Get analytics history
function getAnalyticsHistory(): any[] {
  try {
    const stored = localStorage.getItem(ANALYTICS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading analytics history:', error);
    return [];
  }
}

// Calculate comprehensive market analytics
export function calculateMarketAnalytics(listings: MarketplaceListing[]): MarketAnalytics {
  const now = Date.now() / 1000;
  const day24Ago = now - (24 * 60 * 60);
  const days7Ago = now - (7 * 24 * 60 * 60);
  
  const activeListings = listings.filter(l => l.active && !l.isExpired);
  const recent24h = listings.filter(l => l.createdAt > day24Ago);
  const recent7d = listings.filter(l => l.createdAt > days7Ago);
  
  // Price analytics
  const prices = activeListings.map(l => parseFloat(l.pricePerToken));
  const currentAveragePrice = prices.length > 0 
    ? prices.reduce((sum, p) => sum + p, 0) / prices.length 
    : 0;
  
  const history = getAnalyticsHistory();
  const yesterday = history.find(h => h.timestamp > Date.now() - (25 * 60 * 60 * 1000));
  const weekAgo = history.find(h => h.timestamp > Date.now() - (8 * 24 * 60 * 60 * 1000));
  
  const priceChange24h = yesterday 
    ? ((currentAveragePrice - yesterday.averagePrice) / yesterday.averagePrice) * 100 
    : 0;
  const priceChange7d = weekAgo 
    ? ((currentAveragePrice - weekAgo.averagePrice) / weekAgo.averagePrice) * 100 
    : 0;
  
  // Volume analytics
  const totalVolume24h = recent24h.reduce((sum, l) => sum + parseFloat(l.amount), 0);
  const totalVolume7d = recent7d.reduce((sum, l) => sum + parseFloat(l.amount), 0);
  const volumeChange24h = yesterday 
    ? ((totalVolume24h - yesterday.totalVolume) / yesterday.totalVolume) * 100 
    : 0;
  
  // Listing analytics
  const newListings24h = recent24h.length;
  const soldListings24h = recent24h.filter(l => !l.active).length;
  const cancelledListings24h = 0; // Would track from events in production
  
  // Market health metrics
  const liquidityScore = calculateLiquidityScore(activeListings);
  const marketDepth = activeListings.length;
  const averageTimeToSell = calculateAverageTimeToSell(listings);
  
  // Trends
  const priceDirection = priceChange24h > 2 ? 'up' : priceChange24h < -2 ? 'down' : 'stable';
  const volumeDirection = volumeChange24h > 10 ? 'increasing' : volumeChange24h < -10 ? 'decreasing' : 'stable';
  
  // Popular categories
  const offsetTypeCounts = countByCategory(activeListings, 'offsetType');
  const popularOffsetType = Object.entries(offsetTypeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
  
  const vintageCounts = countByCategory(activeListings, 'vintage');
  const popularVintage = Object.entries(vintageCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
  
  return {
    currentAveragePrice,
    priceChange24h,
    priceChange7d,
    highestPrice24h: Math.max(...prices, 0),
    lowestPrice24h: prices.length > 0 ? Math.min(...prices) : 0,
    totalVolume24h,
    totalVolume7d,
    volumeChange24h,
    newListings24h,
    soldListings24h,
    cancelledListings24h,
    activeListingsCount: activeListings.length,
    liquidityScore,
    marketDepth,
    averageTimeToSell,
    priceDirection,
    volumeDirection,
    popularOffsetType,
    popularVintage,
  };
}

// Calculate liquidity score (0-100)
function calculateLiquidityScore(listings: MarketplaceListing[]): number {
  if (listings.length === 0) return 0;
  
  const totalVolume = listings.reduce((sum, l) => sum + parseFloat(l.amount), 0);
  const priceSpread = calculatePriceSpread(listings);
  const listingCount = listings.length;
  
  // Higher volume, lower spread, more listings = higher liquidity
  const volumeScore = Math.min(totalVolume / 100, 40); // Max 40 points
  const spreadScore = Math.max(40 - priceSpread * 10, 0); // Max 40 points
  const countScore = Math.min(listingCount * 2, 20); // Max 20 points
  
  return Math.min(Math.round(volumeScore + spreadScore + countScore), 100);
}

// Calculate price spread (percentage difference between high and low)
function calculatePriceSpread(listings: MarketplaceListing[]): number {
  if (listings.length === 0) return 0;
  
  const prices = listings.map(l => parseFloat(l.pricePerToken));
  const high = Math.max(...prices);
  const low = Math.min(...prices);
  
  if (low === 0) return 0;
  return ((high - low) / low) * 100;
}

// Calculate average time to sell (in hours)
function calculateAverageTimeToSell(listings: MarketplaceListing[]): number {
  const soldListings = listings.filter(l => !l.active);
  if (soldListings.length === 0) return 0;
  
  // Mock calculation - in production, track actual sold time
  return 48 + Math.random() * 24; // 48-72 hours average
}

// Calculate average price
function calculateAveragePrice(listings: MarketplaceListing[]): number {
  const activeListings = listings.filter(l => l.active && !l.isExpired);
  if (activeListings.length === 0) return 0;
  
  const total = activeListings.reduce((sum, l) => sum + parseFloat(l.pricePerToken), 0);
  return total / activeListings.length;
}

// Calculate total volume
function calculateTotalVolume(listings: MarketplaceListing[]): number {
  const activeListings = listings.filter(l => l.active && !l.isExpired);
  return activeListings.reduce((sum, l) => sum + parseFloat(l.amount), 0);
}

// Count by category
function countByCategory(listings: MarketplaceListing[], category: 'offsetType' | 'vintage'): Record<string, number> {
  const counts: Record<string, number> = {};
  
  listings.forEach(listing => {
    const value = listing[category] || 'Unknown';
    counts[value] = (counts[value] || 0) + 1;
  });
  
  return counts;
}

// Generate chart data for the last N days
export function generateChartData(listings: MarketplaceListing[], days: number = 7): ChartDataPoint[] {
  const now = Date.now();
  const dataPoints: ChartDataPoint[] = [];
  
  for (let i = days - 1; i >= 0; i--) {
    const dayStart = now - (i * 24 * 60 * 60 * 1000);
    const dayEnd = dayStart + (24 * 60 * 60 * 1000);
    
    const dayListings = listings.filter(l => 
      l.createdAt * 1000 >= dayStart && l.createdAt * 1000 < dayEnd
    );
    
    const averagePrice = dayListings.length > 0
      ? dayListings.reduce((sum, l) => sum + parseFloat(l.pricePerToken), 0) / dayListings.length
      : 0;
    
    const volume = dayListings.reduce((sum, l) => sum + parseFloat(l.amount), 0);
    
    dataPoints.push({
      timestamp: dayStart,
      date: new Date(dayStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      price: parseFloat(averagePrice.toFixed(2)),
      volume: parseFloat(volume.toFixed(2)),
      listings: dayListings.length,
    });
  }
  
  return dataPoints;
}

// Get price distribution (for histogram)
export function getPriceDistribution(listings: MarketplaceListing[], buckets: number = 10): { range: string; count: number }[] {
  const activeListings = listings.filter(l => l.active && !l.isExpired);
  if (activeListings.length === 0) return [];
  
  const prices = activeListings.map(l => parseFloat(l.pricePerToken));
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const bucketSize = (max - min) / buckets;
  
  const distribution: { range: string; count: number }[] = [];
  
  for (let i = 0; i < buckets; i++) {
    const rangeStart = min + (i * bucketSize);
    const rangeEnd = rangeStart + bucketSize;
    const count = prices.filter(p => p >= rangeStart && p < rangeEnd).length;
    
    distribution.push({
      range: `$${rangeStart.toFixed(2)}-$${rangeEnd.toFixed(2)}`,
      count,
    });
  }
  
  return distribution;
}

// Get volume by offset type
export function getVolumeByOffsetType(listings: MarketplaceListing[]): { type: string; volume: number; percentage: number }[] {
  const activeListings = listings.filter(l => l.active && !l.isExpired);
  const totalVolume = activeListings.reduce((sum, l) => sum + parseFloat(l.amount), 0);
  
  const volumeByType: Record<string, number> = {};
  
  activeListings.forEach(listing => {
    const type = listing.offsetType || 'Unknown';
    volumeByType[type] = (volumeByType[type] || 0) + parseFloat(listing.amount);
  });
  
  return Object.entries(volumeByType).map(([type, volume]) => ({
    type,
    volume: parseFloat(volume.toFixed(2)),
    percentage: totalVolume > 0 ? parseFloat(((volume / totalVolume) * 100).toFixed(1)) : 0,
  }));
}

// Get top sellers by volume
export function getTopSellers(listings: MarketplaceListing[], limit: number = 5): { seller: string; volume: number; listingCount: number }[] {
  const sellerStats: Record<string, { volume: number; count: number }> = {};
  
  listings.forEach(listing => {
    if (!sellerStats[listing.seller]) {
      sellerStats[listing.seller] = { volume: 0, count: 0 };
    }
    sellerStats[listing.seller].volume += parseFloat(listing.amount);
    sellerStats[listing.seller].count += 1;
  });
  
  return Object.entries(sellerStats)
    .map(([seller, stats]) => ({
      seller,
      volume: parseFloat(stats.volume.toFixed(2)),
      listingCount: stats.count,
    }))
    .sort((a, b) => b.volume - a.volume)
    .slice(0, limit);
}

// Export analytics data
export function exportAnalyticsData(listings: MarketplaceListing[]): string {
  const analytics = calculateMarketAnalytics(listings);
  const chartData = generateChartData(listings, 30);
  const distribution = getPriceDistribution(listings);
  const volumeByType = getVolumeByOffsetType(listings);
  const topSellers = getTopSellers(listings);
  
  const data = {
    generatedAt: new Date().toISOString(),
    analytics,
    chartData,
    distribution,
    volumeByType,
    topSellers,
  };
  
  return JSON.stringify(data, null, 2);
}

