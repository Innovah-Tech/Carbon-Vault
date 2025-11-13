// Transaction history storage service

const TX_HISTORY_KEY = 'carbon_vault_tx_history';
const MAX_HISTORY = 100; // Keep last 100 transactions

export interface Transaction {
  hash: string;
  type: 'stake' | 'unstake' | 'claim_staking' | 'claim_validator' | 'buy_listing' | 'create_listing' | 'cancel_listing';
  amount?: string;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: number;
  address: string;
  blockNumber?: number;
  gasUsed?: string;
}

// Get transaction history
export function getTransactionHistory(address?: string): Transaction[] {
  try {
    const stored = localStorage.getItem(TX_HISTORY_KEY);
    if (!stored) return [];
    
    const history: Transaction[] = JSON.parse(stored);
    
    // Filter by address if provided
    if (address) {
      return history.filter(tx => tx.address.toLowerCase() === address.toLowerCase());
    }
    
    return history;
  } catch (error) {
    console.error('Error reading transaction history:', error);
    return [];
  }
}

// Add transaction to history
export function addTransaction(tx: Transaction): void {
  try {
    const history = getTransactionHistory();
    
    // Add to beginning
    history.unshift(tx);
    
    // Keep only last MAX_HISTORY transactions
    const trimmed = history.slice(0, MAX_HISTORY);
    
    localStorage.setItem(TX_HISTORY_KEY, JSON.stringify(trimmed));
  } catch (error) {
    console.error('Error adding transaction to history:', error);
  }
}

// Update transaction status
export function updateTransactionStatus(
  hash: string,
  status: 'confirmed' | 'failed',
  blockNumber?: number,
  gasUsed?: string
): void {
  try {
    const history = getTransactionHistory();
    const txIndex = history.findIndex(tx => tx.hash.toLowerCase() === hash.toLowerCase());
    
    if (txIndex >= 0) {
      history[txIndex].status = status;
      if (blockNumber) history[txIndex].blockNumber = blockNumber;
      if (gasUsed) history[txIndex].gasUsed = gasUsed;
      
      localStorage.setItem(TX_HISTORY_KEY, JSON.stringify(history));
    }
  } catch (error) {
    console.error('Error updating transaction status:', error);
  }
}

// Get recent transactions
export function getRecentTransactions(address: string, limit: number = 10): Transaction[] {
  const history = getTransactionHistory(address);
  return history.slice(0, limit);
}

// Get transactions by type
export function getTransactionsByType(address: string, type: Transaction['type']): Transaction[] {
  const history = getTransactionHistory(address);
  return history.filter(tx => tx.type === type);
}

// Get pending transactions
export function getPendingTransactions(address: string): Transaction[] {
  const history = getTransactionHistory(address);
  return history.filter(tx => tx.status === 'pending');
}

// Clear old transactions (older than 30 days)
export function clearOldTransactions(): void {
  try {
    const history = getTransactionHistory();
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    
    const filtered = history.filter(tx => tx.timestamp > thirtyDaysAgo);
    
    localStorage.setItem(TX_HISTORY_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error clearing old transactions:', error);
  }
}

// Get transaction stats
export function getTransactionStats(address: string) {
  const history = getTransactionHistory(address);
  
  const stats = {
    total: history.length,
    confirmed: history.filter(tx => tx.status === 'confirmed').length,
    pending: history.filter(tx => tx.status === 'pending').length,
    failed: history.filter(tx => tx.status === 'failed').length,
    byType: {
      stake: history.filter(tx => tx.type === 'stake').length,
      unstake: history.filter(tx => tx.type === 'unstake').length,
      claim_staking: history.filter(tx => tx.type === 'claim_staking').length,
      claim_validator: history.filter(tx => tx.type === 'claim_validator').length,
      buy_listing: history.filter(tx => tx.type === 'buy_listing').length,
      create_listing: history.filter(tx => tx.type === 'create_listing').length,
      cancel_listing: history.filter(tx => tx.type === 'cancel_listing').length,
    },
  };
  
  return stats;
}

// Format transaction type for display
export function formatTransactionType(type: Transaction['type']): string {
  const typeMap: Record<Transaction['type'], string> = {
    stake: 'Stake CVT',
    unstake: 'Unstake CVT',
    claim_staking: 'Claim Staking Rewards',
    claim_validator: 'Claim Validator Rewards',
    buy_listing: 'Buy Listing',
    create_listing: 'Create Listing',
    cancel_listing: 'Cancel Listing',
  };
  
  return typeMap[type] || type;
}

// Get block explorer URL
export function getBlockExplorerUrl(txHash: string, chainId: number = 5003): string {
  // Mantle Sepolia
  if (chainId === 5003) {
    return `https://explorer.sepolia.mantle.xyz/tx/${txHash}`;
  }
  
  // Default
  return `https://explorer.sepolia.mantle.xyz/tx/${txHash}`;
}

// Export history as CSV
export function exportTransactionHistoryCSV(address: string): string {
  const history = getTransactionHistory(address);
  
  const headers = ['Hash', 'Type', 'Amount', 'Status', 'Date', 'Block Number'];
  const rows = history.map(tx => [
    tx.hash,
    formatTransactionType(tx.type),
    tx.amount || 'N/A',
    tx.status,
    new Date(tx.timestamp).toLocaleString(),
    tx.blockNumber?.toString() || 'N/A',
  ]);
  
  const csv = [
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ].join('\n');
  
  return csv;
}

