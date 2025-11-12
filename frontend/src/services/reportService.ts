import { formatUnits } from 'viem';
import { CONTRACT_ADDRESSES } from '@/lib/contracts';

export interface Report {
  id: string;
  type: 'ESG' | 'ZK Proof' | 'Transaction History';
  date: string;
  status: 'ready' | 'generating';
  size: string;
  data?: ReportData;
}

export interface ReportData {
  generatedAt: string;
  reportType: string;
  summary: {
    [key: string]: string | number;
  };
  details: any[];
}

export interface ESGReportData {
  totalCarbonCredits: string;
  stakedCredits: string;
  totalTransactions: number;
  complianceScore: number;
  carbonOffset: string;
  validationStatus: string;
  period: string;
  recommendations: string[];
}

export interface ZKProofReportData {
  totalProofs: number;
  verifiedProofs: number;
  pendingProofs: number;
  proofHistory: Array<{
    id: string;
    timestamp: string;
    status: string;
    verifier: string;
  }>;
  securityScore: number;
}

export interface TransactionReportData {
  totalTransactions: number;
  totalVolume: string;
  transactionHistory: Array<{
    id: string;
    type: string;
    amount: string;
    timestamp: string;
    status: string;
    hash?: string;
  }>;
  averageTransactionSize: string;
  period: string;
}

// LocalStorage keys
const REPORTS_KEY = 'carbon_vault_reports';

// Get all reports from localStorage
export function getStoredReports(): Report[] {
  try {
    const stored = localStorage.getItem(REPORTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading reports:', error);
    return [];
  }
}

// Save reports to localStorage
export function saveReports(reports: Report[]): void {
  try {
    localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
  } catch (error) {
    console.error('Error saving reports:', error);
  }
}

// Add a new report
export function addReport(report: Report): void {
  const reports = getStoredReports();
  reports.unshift(report); // Add to beginning
  saveReports(reports);
}

// Update report status
export function updateReportStatus(reportId: string, status: 'ready' | 'generating'): void {
  const reports = getStoredReports();
  const report = reports.find(r => r.id === reportId);
  if (report) {
    report.status = status;
    saveReports(reports);
  }
}

// Delete a report
export function deleteReport(reportId: string): void {
  const reports = getStoredReports();
  const filtered = reports.filter(r => r.id !== reportId);
  saveReports(filtered);
}

// Generate ESG Compliance Report
export async function generateESGReport(
  address: string,
  totalCVT: string,
  stakedCVT: string,
  pendingRewards: string
): Promise<ESGReportData> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  const totalTransactions = Math.floor(Math.random() * 50) + 10;
  const complianceScore = Math.min(100, Math.floor(
    (parseFloat(stakedCVT) / Math.max(parseFloat(totalCVT), 1)) * 100 +
    Math.random() * 20
  ));

  return {
    totalCarbonCredits: totalCVT,
    stakedCredits: stakedCVT,
    totalTransactions,
    complianceScore,
    carbonOffset: (parseFloat(totalCVT) * 2.5).toFixed(2) + ' tons CO₂',
    validationStatus: complianceScore > 70 ? 'Compliant' : 'Needs Improvement',
    period: 'Last 30 days',
    recommendations: [
      complianceScore < 50 ? 'Increase staking participation to improve compliance score' : 'Maintain current staking levels',
      'Consider purchasing additional carbon credits',
      'Enable ZK proof verification for enhanced security',
      'Review quarterly sustainability goals',
    ],
  };
}

// Generate ZK Proof Report
export async function generateZKProofReport(address: string): Promise<ZKProofReportData> {
  await new Promise(resolve => setTimeout(resolve, 1500));

  const totalProofs = Math.floor(Math.random() * 20) + 5;
  const verifiedProofs = Math.floor(totalProofs * 0.8);
  const pendingProofs = totalProofs - verifiedProofs;

  const proofHistory = Array.from({ length: Math.min(totalProofs, 10) }, (_, i) => ({
    id: `proof-${Date.now()}-${i}`,
    timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    status: i < verifiedProofs ? 'Verified' : 'Pending',
    verifier: CONTRACT_ADDRESSES.ValidatorRewards,
  }));

  return {
    totalProofs,
    verifiedProofs,
    pendingProofs,
    proofHistory: proofHistory.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ),
    securityScore: Math.floor((verifiedProofs / totalProofs) * 100),
  };
}

// Generate Transaction History Report
export async function generateTransactionReport(
  address: string,
  totalCVT: string,
  stakedCVT: string
): Promise<TransactionReportData> {
  await new Promise(resolve => setTimeout(resolve, 1500));

  const totalTransactions = Math.floor(Math.random() * 100) + 20;
  const totalVolume = (parseFloat(totalCVT) * (Math.random() * 5 + 1)).toFixed(2);

  const transactionTypes = ['Stake', 'Unstake', 'Transfer', 'Mint', 'Claim Rewards'];
  const transactionHistory = Array.from({ length: Math.min(totalTransactions, 50) }, (_, i) => ({
    id: `tx-${Date.now()}-${i}`,
    type: transactionTypes[Math.floor(Math.random() * transactionTypes.length)],
    amount: (Math.random() * parseFloat(totalCVT) * 0.1).toFixed(4),
    timestamp: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
    status: Math.random() > 0.05 ? 'Success' : 'Failed',
    hash: `0x${Math.random().toString(16).substr(2, 64)}`,
  }));

  return {
    totalTransactions,
    totalVolume,
    transactionHistory: transactionHistory.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ),
    averageTransactionSize: (parseFloat(totalVolume) / totalTransactions).toFixed(4),
    period: 'Last 90 days',
  };
}

// Export report as CSV
export function exportToCSV(report: Report): void {
  if (!report.data) return;

  let csvContent = '';
  const type = report.type;

  // Add header
  csvContent += `${type} Report\n`;
  csvContent += `Generated: ${new Date(report.date).toLocaleString()}\n`;
  csvContent += `\n`;

  // Add data based on report type
  if (type === 'ESG') {
    const data = report.data as any;
    csvContent += `Metric,Value\n`;
    csvContent += `Total Carbon Credits,${data.totalCarbonCredits}\n`;
    csvContent += `Staked Credits,${data.stakedCredits}\n`;
    csvContent += `Total Transactions,${data.totalTransactions}\n`;
    csvContent += `Compliance Score,${data.complianceScore}\n`;
    csvContent += `Carbon Offset,${data.carbonOffset}\n`;
    csvContent += `Validation Status,${data.validationStatus}\n`;
  } else if (type === 'ZK Proof') {
    const data = report.data as any;
    csvContent += `Metric,Value\n`;
    csvContent += `Total Proofs,${data.totalProofs}\n`;
    csvContent += `Verified Proofs,${data.verifiedProofs}\n`;
    csvContent += `Pending Proofs,${data.pendingProofs}\n`;
    csvContent += `Security Score,${data.securityScore}\n`;
    csvContent += `\n`;
    csvContent += `Proof History\n`;
    csvContent += `ID,Timestamp,Status,Verifier\n`;
    data.proofHistory?.forEach((proof: any) => {
      csvContent += `${proof.id},${new Date(proof.timestamp).toLocaleString()},${proof.status},${proof.verifier}\n`;
    });
  } else if (type === 'Transaction History') {
    const data = report.data as any;
    csvContent += `Summary\n`;
    csvContent += `Total Transactions,${data.totalTransactions}\n`;
    csvContent += `Total Volume,${data.totalVolume} CVT\n`;
    csvContent += `Average Transaction Size,${data.averageTransactionSize} CVT\n`;
    csvContent += `\n`;
    csvContent += `Transaction History\n`;
    csvContent += `ID,Type,Amount,Timestamp,Status,Hash\n`;
    data.transactionHistory?.forEach((tx: any) => {
      csvContent += `${tx.id},${tx.type},${tx.amount},${new Date(tx.timestamp).toLocaleString()},${tx.status},${tx.hash}\n`;
    });
  }

  // Create download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${type.replace(/\s+/g, '_')}_Report_${Date.now()}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Export report as JSON
export function exportToJSON(report: Report): void {
  const jsonContent = JSON.stringify(report, null, 2);
  
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${report.type.replace(/\s+/g, '_')}_Report_${Date.now()}.json`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Calculate file size estimate
export function calculateReportSize(data: any): string {
  const jsonString = JSON.stringify(data);
  const bytes = new Blob([jsonString]).size;
  
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

