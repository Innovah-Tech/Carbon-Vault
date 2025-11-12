import { useState, useMemo, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Upload,
  CheckCircle2,
  XCircle,
  Clock,
  Award,
  TrendingUp,
  Users,
  DollarSign,
  Star,
  Activity,
  BarChart3,
  Trophy,
  Zap,
  Shield,
  Download,
  RefreshCw,
  Loader2,
  Crown,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAccount } from "wagmi";
import {
  useValidatorRewards,
  useClaimRewards,
  useValidatorsLeaderboard,
  useValidatorStats,
  useAutoRefreshValidators,
} from "@/hooks/useValidators";
import {
  getSubmissions,
  addSubmission,
  getSubmissionsByValidator,
  calculateValidatorStats,
  generateMockValidators,
  calculateGlobalStats,
  formatValidatorAddress,
  getReputationTier,
  timeAgo,
  exportValidatorsToCSV,
  exportSubmissionsToCSV,
  validateProofSubmission,
  calculateEstimatedReward,
  ProofSubmission,
} from "@/services/validatorService";

const statusConfig = {
  pending: { icon: Clock, color: "text-warning", bg: "bg-warning/10", label: "Pending" },
  verified: { icon: CheckCircle2, color: "text-success", bg: "bg-success/10", label: "Verified" },
  rejected: { icon: XCircle, color: "text-destructive", bg: "bg-destructive/10", label: "Rejected" },
};

const Validators = () => {
  const { toast } = useToast();
  const { address, isConnected } = useAccount();
  
  // Blockchain hooks
  const { 
    pendingRewards, 
    verifiedProofsCount, 
    rewardPerProof,
    refetch: refetchRewards 
  } = useValidatorRewards();
  const { claimRewards, isPending: isClaiming } = useClaimRewards();
  const validatorStats = useValidatorStats();
  const { validators: leaderboard, isLoading: loadingLeaderboard } = useValidatorsLeaderboard();
  
  // Auto-refresh
  useAutoRefreshValidators();

  // Local state
  const [submissions, setSubmissions] = useState<ProofSubmission[]>([]);
  const [mockValidators, setMockValidators] = useState(generateMockValidators(20));
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  
  // Form state
  const [projectId, setProjectId] = useState("");
  const [emissionData, setEmissionData] = useState("");
  const [documentation, setDocumentation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Leaderboard filters
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"rank" | "proofs" | "rewards" | "reputation">("rank");
  const [filterActive, setFilterActive] = useState("all");

  // Load submissions
  useEffect(() => {
    setSubmissions(getSubmissions());
  }, []);

  // Calculate user's stats
  const userStats = useMemo(() => {
    if (!address) return null;
    return calculateValidatorStats(address, verifiedProofsCount, pendingRewards);
  }, [address, verifiedProofsCount, pendingRewards, submissions]);

  // Get user submissions
  const userSubmissions = useMemo(() => {
    if (!address) return [];
    return getSubmissionsByValidator(address);
  }, [address, submissions]);

  // Global stats
  const globalStats = useMemo(() => calculateGlobalStats(mockValidators), [mockValidators]);

  // Filter and sort leaderboard
  const filteredLeaderboard = useMemo(() => {
    let filtered = mockValidators;

    // Filter by search
    if (searchTerm) {
      filtered = filtered.filter(v =>
        v.address.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (filterActive === "active") {
      filtered = filtered.filter(v => v.isActive);
    } else if (filterActive === "inactive") {
      filtered = filtered.filter(v => !v.isActive);
    }

    // Sort
    const sorted = [...filtered];
    switch (sortBy) {
      case "proofs":
        sorted.sort((a, b) => b.verifiedProofsCount - a.verifiedProofsCount);
        break;
      case "rewards":
        sorted.sort((a, b) => parseFloat(b.totalRewards) - parseFloat(a.totalRewards));
        break;
      case "reputation":
        sorted.sort((a, b) => b.reputation - a.reputation);
        break;
      default:
        sorted.sort((a, b) => a.rank - b.rank);
    }

    return sorted;
  }, [mockValidators, searchTerm, sortBy, filterActive]);

  // Handle proof submission
  const handleSubmitProof = async () => {
    const validationError = validateProofSubmission({
      projectId,
      emissionData,
      documentation,
    });

    if (validationError) {
      toast({
        title: "Validation Error",
        description: validationError,
        variant: "destructive",
      });
      return;
    }

    if (!address) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to submit proofs.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const newSubmission = addSubmission({
        validator: address,
        projectId,
        emissionData,
        documentation,
        reward: calculateEstimatedReward(parseFloat(emissionData), parseFloat(rewardPerProof)),
      });

      setSubmissions(getSubmissions());

      toast({
        title: "Proof Submitted",
        description: "Your verification proof has been submitted for review.",
      });

      // Clear form
      setProjectId("");
      setEmissionData("");
      setDocumentation("");
      setSubmitDialogOpen(false);
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your proof.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle claim rewards
  const handleClaimRewards = async () => {
    if (parseFloat(pendingRewards) === 0) {
      toast({
        title: "No Rewards",
        description: "You don't have any rewards to claim.",
        variant: "destructive",
      });
      return;
    }

    try {
      await claimRewards();
      refetchRewards();
    } catch (error) {
      // Error handled by hook
    }
  };

  // Get user's reputation tier
  const userReputationTier = userStats
    ? getReputationTier(
        (userStats.verifiedProofs / (userStats.verifiedProofs + userStats.rejectedProofs)) * 100
      )
    : null;

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-6 lg:p-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  Validator Dashboard
                </h1>
                <p className="text-muted-foreground">
                  Verify carbon offset proofs and earn rewards
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refetchRewards}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
                <Dialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gradient-primary" disabled={!isConnected}>
                      <Upload className="mr-2 h-4 w-4" />
                      Submit Proof
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Submit Verification Proof</DialogTitle>
                      <DialogDescription>
                        Upload project documentation and emission data for verification
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="projectId">Project ID</Label>
                        <Input
                          id="projectId"
                          placeholder="e.g., PRJ-2024-001"
                          value={projectId}
                          onChange={(e) => setProjectId(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="emissionData">Emission Data (tCO2e)</Label>
                        <Input
                          id="emissionData"
                          type="number"
                          placeholder="e.g., 1250"
                          value={emissionData}
                          onChange={(e) => setEmissionData(e.target.value)}
                        />
                        {emissionData && (
                          <p className="text-xs text-muted-foreground">
                            Estimated reward: ~
                            {calculateEstimatedReward(
                              parseFloat(emissionData),
                              parseFloat(rewardPerProof)
                            )}{" "}
                            CVT
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="documentation">Documentation</Label>
                        <Textarea
                          id="documentation"
                          placeholder="Provide project details, verification methodology, and supporting evidence..."
                          rows={6}
                          value={documentation}
                          onChange={(e) => setDocumentation(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                          {documentation.length}/50 characters minimum
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label>Upload Supporting Files (Optional)</Label>
                        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-smooth cursor-pointer">
                          <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">
                            Click to upload or drag and drop
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            PDF, CSV, or JSON files (Max 10MB)
                          </p>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setSubmitDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        className="gradient-primary"
                        onClick={handleSubmitProof}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          "Submit Proof"
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList>
                <TabsTrigger value="overview" className="gap-2">
                  <Activity className="h-4 w-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="submissions" className="gap-2">
                  <Upload className="h-4 w-4" />
                  My Submissions
                  {userSubmissions.length > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {userSubmissions.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="leaderboard" className="gap-2">
                  <Trophy className="h-4 w-4" />
                  Leaderboard
                </TabsTrigger>
                <TabsTrigger value="analytics" className="gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Analytics
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                {/* Stats Cards */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                  <Card className="shadow-card">
                    <CardHeader className="pb-2">
                      <CardDescription>Pending Rewards</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-baseline gap-2">
                        <p className="text-3xl font-bold">{pendingRewards}</p>
                        <span className="text-sm text-muted-foreground">CVT</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        ≈ ${(parseFloat(pendingRewards) * 1.25).toFixed(2)} USD
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="shadow-card">
                    <CardHeader className="pb-2">
                      <CardDescription>Verified Proofs</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold">{userStats?.verifiedProofs || 0}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {userStats?.pendingProofs || 0} pending review
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="shadow-card">
                    <CardHeader className="pb-2">
                      <CardDescription>Success Rate</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-baseline gap-2">
                        <p className="text-3xl font-bold">
                          {userStats?.successRate.toFixed(1) || 0}
                        </p>
                        <span className="text-sm text-muted-foreground">%</span>
                      </div>
                      <Progress
                        value={userStats?.successRate || 0}
                        className="h-2 mt-2"
                      />
                    </CardContent>
                  </Card>

                  <Card className="shadow-card">
                    <CardHeader className="pb-2">
                      <CardDescription>Total Earned</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-baseline gap-2">
                        <p className="text-3xl font-bold">
                          {userStats?.totalEarned || "0"}
                        </p>
                        <span className="text-sm text-muted-foreground">CVT</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        All-time earnings
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Main Content Grid */}
                <div className="grid gap-6 lg:grid-cols-3">
                  {/* Rewards Card */}
                  <Card className="shadow-card lg:col-span-2">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5" />
                        Reward Tracker
                      </CardTitle>
                      <CardDescription>Your validation earnings and performance</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {isConnected ? (
                        <>
                          <div className="flex items-center justify-between p-6 rounded-lg bg-gradient-to-r from-primary/10 to-secondary/10">
                            <div>
                              <p className="text-sm text-muted-foreground mb-1">
                                Available to Claim
                              </p>
                              <p className="text-4xl font-bold text-foreground">
                                {pendingRewards} CVT
                              </p>
                              <p className="text-sm text-muted-foreground mt-1">
                                ≈ ${(parseFloat(pendingRewards) * 1.25).toFixed(2)} USD
                              </p>
                            </div>
                            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                              <DollarSign className="h-10 w-10 text-primary" />
                            </div>
                          </div>

                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                              <p className="text-sm text-muted-foreground">
                                Reward Per Proof
                              </p>
                              <p className="text-2xl font-bold">{rewardPerProof} CVT</p>
                            </div>
                            <div className="space-y-2">
                              <p className="text-sm text-muted-foreground">
                                Avg Reward/Proof
                              </p>
                              <p className="text-2xl font-bold">
                                {validatorStats.avgRewardPerProof} CVT
                              </p>
                            </div>
                          </div>

                          <Button
                            className="w-full gradient-primary"
                            onClick={handleClaimRewards}
                            disabled={parseFloat(pendingRewards) === 0 || isClaiming}
                          >
                            {isClaiming ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Claiming...
                              </>
                            ) : (
                              <>
                                <DollarSign className="mr-2 h-4 w-4" />
                                Claim Rewards
                              </>
                            )}
                          </Button>
                        </>
                      ) : (
                        <div className="text-center py-12">
                          <Shield className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                          <p className="text-lg font-medium mb-2">
                            Connect Your Wallet
                          </p>
                          <p className="text-sm text-muted-foreground mb-4">
                            Connect your wallet to view and claim your validator rewards
                          </p>
                          <Button className="gradient-primary">Connect Wallet</Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Reputation Card */}
                  <Card className="shadow-card">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Star className="h-5 w-5" />
                        Reputation
                      </CardTitle>
                      <CardDescription>Your validator standing</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {isConnected && userReputationTier ? (
                        <>
                          <div className="text-center space-y-3">
                            <div className="text-6xl">{userReputationTier.icon}</div>
                            <div>
                              <Badge className={userReputationTier.color}>
                                {userReputationTier.tier}
                              </Badge>
                              <p className="text-3xl font-bold mt-2">
                                {Math.round((userStats?.successRate || 0))}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Reputation Score
                              </p>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">
                                Verified
                              </span>
                              <span className="text-sm font-semibold">
                                {userStats?.verifiedProofs || 0}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">
                                Pending
                              </span>
                              <span className="text-sm font-semibold text-warning">
                                {userStats?.pendingProofs || 0}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">
                                Success Rate
                              </span>
                              <span className="text-sm font-semibold text-success">
                                {userStats?.successRate.toFixed(1) || 0}%
                              </span>
                            </div>
                          </div>

                          <Button variant="outline" className="w-full">
                            <Trophy className="mr-2 h-4 w-4" />
                            View Rank
                          </Button>
                        </>
                      ) : (
                        <div className="text-center py-8">
                          <Star className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                          <p className="text-sm text-muted-foreground">
                            Connect wallet to view reputation
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Global Stats */}
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Network Statistics
                    </CardTitle>
                    <CardDescription>Overall validator network metrics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-6 md:grid-cols-4">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-foreground">
                          {globalStats.totalValidators}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Total Validators
                        </p>
                        <p className="text-xs text-success mt-1">
                          {globalStats.activeValidators} active
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-3xl font-bold text-foreground">
                          {globalStats.totalProofsVerified}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Proofs Verified
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-3xl font-bold text-foreground">
                          {globalStats.totalRewardsDistributed}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          CVT Distributed
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-3xl font-bold text-foreground">
                          {globalStats.averageRewardPerProof}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Avg Reward/Proof
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Submissions Tab */}
              <TabsContent value="submissions" className="space-y-6">
                <Card className="shadow-card">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>My Proof Submissions</CardTitle>
                        <CardDescription>
                          Track the status of your verification proofs
                        </CardDescription>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => exportSubmissionsToCSV(userSubmissions)}
                        disabled={userSubmissions.length === 0}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Export
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {userSubmissions.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-lg font-medium text-foreground mb-2">
                          No submissions yet
                        </p>
                        <p className="text-sm text-muted-foreground mb-4">
                          Submit your first verification proof to get started
                        </p>
                        <Button
                          className="gradient-primary"
                          onClick={() => setSubmitDialogOpen(true)}
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          Submit Proof
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {userSubmissions.map((submission) => {
                          const config = statusConfig[submission.status];
                          const StatusIcon = config.icon;

                          return (
                            <Card
                              key={submission.id}
                              className="border border-border hover:shadow-md transition-smooth"
                            >
                              <CardContent className="pt-6">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1 space-y-3">
                                    <div className="flex items-center gap-3">
                                      <Badge
                                        variant="outline"
                                        className={config.bg}
                                      >
                                        <StatusIcon
                                          className={`mr-1 h-3 w-3 ${config.color}`}
                                        />
                                        {config.label}
                                      </Badge>
                                      <span className="font-mono text-sm text-muted-foreground">
                                        {submission.projectId}
                                      </span>
                                    </div>
                                    <div className="grid gap-2 md:grid-cols-3">
                                      <div>
                                        <p className="text-xs text-muted-foreground">
                                          Emission Data
                                        </p>
                                        <p className="text-sm font-medium">
                                          {submission.emissionData} tCO2e
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-muted-foreground">
                                          Submitted
                                        </p>
                                        <p className="text-sm font-medium">
                                          {timeAgo(submission.submittedAt)}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-muted-foreground">
                                          Reward
                                        </p>
                                        <p className="text-sm font-medium">
                                          {submission.reward || "Pending"} CVT
                                        </p>
                                      </div>
                                    </div>
                                    {submission.notes && (
                                      <p className="text-xs text-muted-foreground">
                                        {submission.notes}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Leaderboard Tab */}
              <TabsContent value="leaderboard" className="space-y-6">
                {/* Filters */}
                <Card className="shadow-card">
                  <CardContent className="pt-6">
                    <div className="grid gap-4 md:grid-cols-4">
                      <div className="md:col-span-2">
                        <Input
                          placeholder="Search by address..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                      <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="rank">Sort by Rank</SelectItem>
                          <SelectItem value="proofs">Sort by Proofs</SelectItem>
                          <SelectItem value="rewards">Sort by Rewards</SelectItem>
                          <SelectItem value="reputation">
                            Sort by Reputation
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <Select
                        value={filterActive}
                        onValueChange={setFilterActive}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Validators</SelectItem>
                          <SelectItem value="active">Active Only</SelectItem>
                          <SelectItem value="inactive">Inactive Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Leaderboard Table */}
                <Card className="shadow-card">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Trophy className="h-5 w-5" />
                          Validator Leaderboard
                        </CardTitle>
                        <CardDescription>
                          Top validators ranked by performance
                        </CardDescription>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => exportValidatorsToCSV(filteredLeaderboard)}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Export
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {loadingLeaderboard ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-16">Rank</TableHead>
                            <TableHead>Validator</TableHead>
                            <TableHead>Proofs</TableHead>
                            <TableHead>Success Rate</TableHead>
                            <TableHead>Reputation</TableHead>
                            <TableHead>Total Rewards</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredLeaderboard.slice(0, 50).map((validator, index) => {
                            const tier = getReputationTier(validator.reputation);
                            const isCurrentUser =
                              address &&
                              validator.address.toLowerCase() ===
                                address.toLowerCase();

                            return (
                              <TableRow
                                key={validator.address}
                                className={
                                  isCurrentUser ? "bg-primary/5" : undefined
                                }
                              >
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    {validator.rank === 1 && (
                                      <Crown className="h-4 w-4 text-yellow-500" />
                                    )}
                                    <span className="font-bold">
                                      #{validator.rank}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-sm">
                                      {formatValidatorAddress(validator.address)}
                                    </span>
                                    {isCurrentUser && (
                                      <Badge variant="outline">You</Badge>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="font-semibold">
                                  {validator.verifiedProofsCount}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <span>{validator.successRate}%</span>
                                    {validator.successRate >= 90 && (
                                      <Zap className="h-3 w-3 text-success" />
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <span className="text-2xl">{tier.icon}</span>
                                    <div>
                                      <p className="text-sm font-medium">
                                        {validator.reputation}
                                      </p>
                                      <p className={`text-xs ${tier.color}`}>
                                        {tier.tier}
                                      </p>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="font-semibold">
                                  {validator.totalRewards} CVT
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant={
                                      validator.isActive ? "default" : "secondary"
                                    }
                                  >
                                    {validator.isActive ? "Active" : "Inactive"}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Analytics Tab */}
              <TabsContent value="analytics" className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <Card className="shadow-card">
                    <CardHeader>
                      <CardTitle>Performance Trends</CardTitle>
                      <CardDescription>Your verification activity over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-12 text-muted-foreground">
                        <BarChart3 className="h-12 w-12 mx-auto mb-4" />
                        <p>Performance charts coming soon</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="shadow-card">
                    <CardHeader>
                      <CardTitle>Reward History</CardTitle>
                      <CardDescription>Your earnings breakdown</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-12 text-muted-foreground">
                        <TrendingUp className="h-12 w-12 mx-auto mb-4" />
                        <p>Reward analytics coming soon</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Validators;
