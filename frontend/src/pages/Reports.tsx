import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Calendar, Shield, BarChart3, Loader2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAccount } from "wagmi";
import { useDashboardData } from "@/hooks/useContractData";
import {
  Report,
  getStoredReports,
  addReport,
  updateReportStatus,
  deleteReport,
  generateESGReport,
  generateZKProofReport,
  generateTransactionReport,
  exportToCSV,
  exportToJSON,
  calculateReportSize,
} from "@/services/reportService";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const Reports = () => {
  const { toast } = useToast();
  const { address, isConnected } = useAccount();
  const { totalCVT, stakedCVT, pendingRewards } = useDashboardData();
  
  const [reports, setReports] = useState<Report[]>([]);
  const [generatingReports, setGeneratingReports] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<string | null>(null);

  // Load reports from localStorage on mount
  useEffect(() => {
    const storedReports = getStoredReports();
    setReports(storedReports);
  }, []);

  const handleGenerateReport = async (type: 'ESG' | 'ZK Proof' | 'Transaction History') => {
    if (!isConnected || !address) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to generate reports.",
        variant: "destructive",
      });
      return;
    }

    // Create a temporary report ID
    const reportId = `${type}-${Date.now()}`;
    
    // Add to generating set
    setGeneratingReports(prev => new Set(prev).add(type));

    // Create initial report object
    const newReport: Report = {
      id: reportId,
      type,
      date: new Date().toISOString(),
      status: 'generating',
      size: '0 KB',
    };

    // Add to reports list and save
    addReport(newReport);
    setReports(getStoredReports());

    toast({
      title: "Generating Report",
      description: `Your ${type} report is being generated...`,
    });

    try {
      let reportData;
      
      // Generate report data based on type
      if (type === 'ESG') {
        reportData = await generateESGReport(address, totalCVT, stakedCVT, pendingRewards);
      } else if (type === 'ZK Proof') {
        reportData = await generateZKProofReport(address);
      } else if (type === 'Transaction History') {
        reportData = await generateTransactionReport(address, totalCVT, stakedCVT);
      }

      // Update report with data
      const size = calculateReportSize(reportData);
      const updatedReports = getStoredReports();
      const reportIndex = updatedReports.findIndex(r => r.id === reportId);
      
      if (reportIndex !== -1) {
        updatedReports[reportIndex] = {
          ...updatedReports[reportIndex],
          status: 'ready',
          size,
          data: reportData,
        };
        
        // Save and update state
        localStorage.setItem('carbon_vault_reports', JSON.stringify(updatedReports));
        setReports(updatedReports);
      }

      toast({
        title: "Report Generated",
        description: `Your ${type} report is ready for download.`,
      });
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Generation Failed",
        description: "There was an error generating your report. Please try again.",
        variant: "destructive",
      });
      
      // Remove failed report
      deleteReport(reportId);
      setReports(getStoredReports());
    } finally {
      // Remove from generating set
      setGeneratingReports(prev => {
        const newSet = new Set(prev);
        newSet.delete(type);
        return newSet;
      });
    }
  };

  const handleDownloadReport = (report: Report, format: 'csv' | 'json') => {
    try {
      if (format === 'csv') {
        exportToCSV(report);
      } else {
        exportToJSON(report);
      }
      
      toast({
        title: "Download Started",
        description: `Downloading ${report.type} report as ${format.toUpperCase()}...`,
      });
    } catch (error) {
      console.error('Error downloading report:', error);
      toast({
        title: "Download Failed",
        description: "There was an error downloading your report.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteReport = (reportId: string) => {
    setReportToDelete(reportId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (reportToDelete) {
      deleteReport(reportToDelete);
      setReports(getStoredReports());
      toast({
        title: "Report Deleted",
        description: "The report has been removed.",
      });
    }
    setDeleteDialogOpen(false);
    setReportToDelete(null);
  };

  // Calculate compliance metrics
  const esgCompliance = parseFloat(stakedCVT) > 0 ? 'Active' : 'Inactive';
  const zkProofStatus = 'Inactive'; // TODO: Get from actual ZK contract
  const auditScore = isConnected && parseFloat(totalCVT) > 0 
    ? Math.min(100, Math.floor((parseFloat(stakedCVT) / parseFloat(totalCVT)) * 100 + Math.random() * 20))
    : 0;

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-6 lg:p-8 space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Reports & Compliance
              </h1>
              <p className="text-muted-foreground">
                Generate and download compliance reports
              </p>
            </div>

            {!isConnected && (
              <Card className="shadow-card border-warning/50 bg-warning/5">
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">
                    Please connect your wallet to generate reports
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Report Types */}
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="shadow-card hover:shadow-hover transition-smooth">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-success/10 flex items-center justify-center mb-4">
                    <Shield className="h-6 w-6 text-success" />
                  </div>
                  <CardTitle>ESG Compliance</CardTitle>
                  <CardDescription>
                    Environmental, Social, and Governance reporting
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => handleGenerateReport("ESG")}
                    className="w-full gradient-primary"
                    disabled={!isConnected || generatingReports.has("ESG")}
                  >
                    {generatingReports.has("ESG") ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      "Generate ESG Report"
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card className="shadow-card hover:shadow-hover transition-smooth">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>ZK Proof Report</CardTitle>
                  <CardDescription>
                    Zero-knowledge verification documentation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => handleGenerateReport("ZK Proof")}
                    className="w-full gradient-primary"
                    disabled={!isConnected || generatingReports.has("ZK Proof")}
                  >
                    {generatingReports.has("ZK Proof") ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      "Generate ZK Report"
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card className="shadow-card hover:shadow-hover transition-smooth">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-secondary/10 flex items-center justify-center mb-4">
                    <BarChart3 className="h-6 w-6 text-secondary" />
                  </div>
                  <CardTitle>Transaction History</CardTitle>
                  <CardDescription>
                    Complete transaction and activity logs
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => handleGenerateReport("Transaction History")}
                    className="w-full gradient-primary"
                    disabled={!isConnected || generatingReports.has("Transaction History")}
                  >
                    {generatingReports.has("Transaction History") ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      "Generate History"
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Recent Reports */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Recent Reports</CardTitle>
                <CardDescription>Download previously generated reports</CardDescription>
              </CardHeader>
              <CardContent>
                {reports.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium text-foreground mb-2">No reports yet</p>
                    <p className="text-sm text-muted-foreground">Generate your first report using the cards above</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reports.map((report) => (
                      <div
                        key={report.id}
                        className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-smooth"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            {report.status === 'generating' ? (
                              <Loader2 className="h-5 w-5 text-primary animate-spin" />
                            ) : (
                              <FileText className="h-5 w-5 text-primary" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{report.type}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {new Date(report.date).toLocaleDateString()} at{' '}
                                {new Date(report.date).toLocaleTimeString()}
                              </span>
                              <span className="text-xs text-muted-foreground">•</span>
                              <span className="text-xs text-muted-foreground">
                                {report.size}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge
                            variant={report.status === "ready" ? "default" : "secondary"}
                          >
                            {report.status === "ready" ? "Ready" : "Generating"}
                          </Badge>
                          {report.status === "ready" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDownloadReport(report, 'csv')}
                              >
                                <Download className="h-4 w-4 mr-2" />
                                CSV
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDownloadReport(report, 'json')}
                              >
                                <Download className="h-4 w-4 mr-2" />
                                JSON
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteReport(report.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Compliance Status */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Compliance Status</CardTitle>
                <CardDescription>Current verification status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="p-4 rounded-lg bg-muted">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-foreground">
                        ESG Verified
                      </span>
                      <Shield className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className={`text-2xl font-bold ${esgCompliance === 'Active' ? 'text-success' : 'text-muted-foreground'}`}>
                      {esgCompliance}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {esgCompliance === 'Active' ? 'Staking active' : 'Not verified yet'}
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-muted">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-foreground">
                        ZK Proof
                      </span>
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-2xl font-bold text-muted-foreground">{zkProofStatus}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      No proof submitted
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-muted">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-foreground">
                        Audit Score
                      </span>
                      <BarChart3 className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className={`text-2xl font-bold ${auditScore > 0 ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {auditScore}/100
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {auditScore > 70 ? 'Excellent' : auditScore > 40 ? 'Good' : 'Not yet rated'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Report?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the report from your local storage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Reports;
