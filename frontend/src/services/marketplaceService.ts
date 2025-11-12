import { formatUnits, parseUnits } from 'viem';

export interface MarketplaceListing {
  id: number;
  seller: string;
  amount: string;
  price: string;
  pricePerToken: string;
  active: boolean;
  createdAt: number;
  expiresAt: number;
  totalValue: string;
  isExpired: boolean;
  daysRemaining: number | null;
  offsetType?: string;
  vintage?: string;
  yield?: string;
}

export interface CreateListingParams {
  amount: string;
  pricePerToken: string;
  expiresInDays: number;
}

// Mock offset types and vintages for listings
const OFFSET_TYPES = ['Reforestation', 'Renewable Energy', 'Carbon Capture', 'Ocean Conservation'];
const VINTAGE_YEARS = ['2024', '2023', '2022', '2021'];

// Generate random mock data for listings
function generateMockListingData(listingId: number): Pick<MarketplaceListing, 'offsetType' | 'vintage' | 'yield'> {
  return {
    offsetType: OFFSET_TYPES[listingId % OFFSET_TYPES.length],
    vintage: VINTAGE_YEARS[listingId % VINTAGE_YEARS.length],
    yield: (5 + (listingId % 10) * 0.5).toFixed(1),
  };
}

// Parse listing data from smart contract
export function parseListing(
  listingId: number,
  listingData: any
): MarketplaceListing {
  const [seller, amount, price, active, createdAt, expiresAt] = listingData;
  
  const amountFormatted = formatUnits(amount, 18);
  const priceFormatted = formatUnits(price, 18);
  const totalValue = (parseFloat(amountFormatted) * parseFloat(priceFormatted)).toFixed(2);
  
  const now = Math.floor(Date.now() / 1000);
  const isExpired = expiresAt > 0 && now > expiresAt;
  const daysRemaining = expiresAt > 0 
    ? Math.max(0, Math.ceil((Number(expiresAt) - now) / (24 * 60 * 60)))
    : null;

  const mockData = generateMockListingData(listingId);

  return {
    id: listingId,
    seller,
    amount: amountFormatted,
    price: priceFormatted,
    pricePerToken: priceFormatted,
    active: active && !isExpired,
    createdAt: Number(createdAt),
    expiresAt: Number(expiresAt),
    totalValue,
    isExpired,
    daysRemaining,
    ...mockData,
  };
}

// Filter listings by search term
export function filterListingsBySearch(
  listings: MarketplaceListing[],
  searchTerm: string
): MarketplaceListing[] {
  if (!searchTerm) return listings;
  
  const term = searchTerm.toLowerCase();
  return listings.filter(listing => 
    listing.seller.toLowerCase().includes(term) ||
    listing.offsetType?.toLowerCase().includes(term) ||
    listing.vintage?.toLowerCase().includes(term) ||
    listing.amount.includes(term) ||
    listing.price.includes(term)
  );
}

// Filter listings by offset type
export function filterListingsByType(
  listings: MarketplaceListing[],
  offsetType: string
): MarketplaceListing[] {
  if (!offsetType || offsetType === 'all') return listings;
  
  return listings.filter(listing => 
    listing.offsetType?.toLowerCase() === offsetType.toLowerCase()
  );
}

// Filter listings by vintage year
export function filterListingsByVintage(
  listings: MarketplaceListing[],
  vintage: string
): MarketplaceListing[] {
  if (!vintage || vintage === 'all') return listings;
  
  return listings.filter(listing => 
    listing.vintage === vintage
  );
}

// Sort listings
export type SortOption = 'newest' | 'oldest' | 'price-low' | 'price-high' | 'amount-low' | 'amount-high';

export function sortListings(
  listings: MarketplaceListing[],
  sortBy: SortOption
): MarketplaceListing[] {
  const sorted = [...listings];
  
  switch (sortBy) {
    case 'newest':
      return sorted.sort((a, b) => b.createdAt - a.createdAt);
    case 'oldest':
      return sorted.sort((a, b) => a.createdAt - b.createdAt);
    case 'price-low':
      return sorted.sort((a, b) => parseFloat(a.pricePerToken) - parseFloat(b.pricePerToken));
    case 'price-high':
      return sorted.sort((a, b) => parseFloat(b.pricePerToken) - parseFloat(a.pricePerToken));
    case 'amount-low':
      return sorted.sort((a, b) => parseFloat(a.amount) - parseFloat(b.amount));
    case 'amount-high':
      return sorted.sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount));
    default:
      return sorted;
  }
}

// Validate listing creation parameters
export function validateListingParams(params: CreateListingParams): string | null {
  const { amount, pricePerToken, expiresInDays } = params;
  
  if (!amount || parseFloat(amount) <= 0) {
    return 'Amount must be greater than 0';
  }
  
  if (!pricePerToken || parseFloat(pricePerToken) <= 0) {
    return 'Price must be greater than 0';
  }
  
  if (expiresInDays < 0) {
    return 'Expiration days cannot be negative';
  }
  
  if (expiresInDays > 365) {
    return 'Expiration cannot exceed 365 days';
  }
  
  return null;
}

// Calculate marketplace fee
export function calculateMarketplaceFee(
  totalPrice: string,
  feePercentage: number
): { fee: string; sellerReceives: string; buyerPays: string } {
  const total = parseFloat(totalPrice);
  const fee = (total * feePercentage) / 100;
  const sellerReceives = total - fee;
  
  return {
    fee: fee.toFixed(2),
    sellerReceives: sellerReceives.toFixed(2),
    buyerPays: totalPrice,
  };
}

// Format address for display
export function formatAddress(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Format date from timestamp
export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// Calculate time ago
export function timeAgo(timestamp: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = now - timestamp;
  
  const minutes = Math.floor(diff / 60);
  const hours = Math.floor(diff / 3600);
  const days = Math.floor(diff / 86400);
  
  if (days > 0) return `${days} day${days !== 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  return 'Just now';
}

// Parse amount to wei
export function parseAmount(amount: string): bigint {
  return parseUnits(amount, 18);
}

// Format amount from wei
export function formatAmount(amount: bigint): string {
  return formatUnits(amount, 18);
}

// Get expiration status and color
export function getExpirationStatus(listing: MarketplaceListing): {
  text: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
} {
  if (listing.expiresAt === 0) {
    return { text: 'No Expiration', variant: 'default' };
  }
  
  if (listing.isExpired) {
    return { text: 'Expired', variant: 'destructive' };
  }
  
  if (listing.daysRemaining !== null) {
    if (listing.daysRemaining === 0) {
      return { text: 'Expires Today', variant: 'destructive' };
    }
    if (listing.daysRemaining <= 3) {
      return { text: `${listing.daysRemaining}d left`, variant: 'secondary' };
    }
    return { text: `${listing.daysRemaining}d left`, variant: 'outline' };
  }
  
  return { text: 'Active', variant: 'default' };
}

// Statistics calculation
export interface MarketplaceStats {
  totalListings: number;
  activeListings: number;
  totalVolume: string;
  averagePrice: string;
  lowestPrice: string;
  highestPrice: string;
}

export function calculateMarketplaceStats(listings: MarketplaceListing[]): MarketplaceStats {
  const activeListings = listings.filter(l => l.active && !l.isExpired);
  
  const totalVolume = activeListings.reduce(
    (sum, listing) => sum + parseFloat(listing.amount),
    0
  );
  
  const prices = activeListings.map(l => parseFloat(l.pricePerToken));
  const averagePrice = prices.length > 0
    ? (prices.reduce((sum, price) => sum + price, 0) / prices.length).toFixed(2)
    : '0';
  
  const lowestPrice = prices.length > 0 ? Math.min(...prices).toFixed(2) : '0';
  const highestPrice = prices.length > 0 ? Math.max(...prices).toFixed(2) : '0';
  
  return {
    totalListings: listings.length,
    activeListings: activeListings.length,
    totalVolume: totalVolume.toFixed(2),
    averagePrice,
    lowestPrice,
    highestPrice,
  };
}

// Export listing data
export function exportListingsToCSV(listings: MarketplaceListing[]): void {
  let csvContent = 'Listing ID,Seller,Amount (CVT),Price per CVT,Total Value,Offset Type,Vintage,Status,Created At,Expires At\n';
  
  listings.forEach(listing => {
    csvContent += `${listing.id},`;
    csvContent += `${listing.seller},`;
    csvContent += `${listing.amount},`;
    csvContent += `${listing.pricePerToken},`;
    csvContent += `${listing.totalValue},`;
    csvContent += `${listing.offsetType || 'N/A'},`;
    csvContent += `${listing.vintage || 'N/A'},`;
    csvContent += `${listing.active ? 'Active' : 'Inactive'},`;
    csvContent += `${formatTimestamp(listing.createdAt)},`;
    csvContent += `${listing.expiresAt > 0 ? formatTimestamp(listing.expiresAt) : 'Never'}\n`;
  });
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `marketplace_listings_${Date.now()}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

