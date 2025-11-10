import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { StatCard } from "@/components/StatCard";
import { RecentTransactions } from "@/components/RecentTransactions";
import { Wallet, TrendingUp, Lock, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useDashboardData } from "@/hooks/useContractData";
import { useAccount } from "wagmi";
import { Skeleton } from "@/components/ui/skeleton";

const Index = () => {
  const { isConnected } = useAccount();
  const { 
    totalCVT, 
    availableCVT, 
    stakedCVT, 
    stakedPercentage, 
    pendingRewards, 
    apy, 
    isLoading 
  } = useDashboardData();

  // Mock USD price (in production, fetch from price oracle)
  const CVT_PRICE_USD = 1.25;

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-6 lg:p-8 space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Corporate Dashboard
            </h1>
            <p className="text-muted-foreground">
              Track your carbon credits, staking, and compliance reports
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total CVT Holdings"
              value={isLoading ? "..." : isConnected ? totalCVT : "0"}
              subtitle={isConnected ? `≈ $${(parseFloat(totalCVT) * CVT_PRICE_USD).toFixed(2)} USD` : "Connect wallet to view"}
              icon={Wallet}
            />
            <StatCard
              title="Staked CVT"
              value={isLoading ? "..." : isConnected ? stakedCVT : "0"}
              subtitle={isConnected ? `${stakedPercentage}% of holdings` : "Connect wallet to view"}
              icon={Lock}
            />
            <StatCard
              title="Current Yield"
              value={isLoading ? "..." : isConnected ? `${apy}%` : "0%"}
              subtitle="Annual Percentage Yield"
              icon={TrendingUp}
            />
            <StatCard
              title="Pending Rewards"
              value={isLoading ? "..." : isConnected ? `${pendingRewards} CVT` : "0 CVT"}
              subtitle={isConnected ? `≈ $${(parseFloat(pendingRewards) * CVT_PRICE_USD).toFixed(2)} USD` : "Connect wallet to view"}
              icon={Award}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Staking Card */}
            <Card className="shadow-card lg:col-span-2">
              <CardHeader>
                <CardTitle>Staking Overview</CardTitle>
                <CardDescription>Manage your staked CVT tokens</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {isConnected ? (
                  <>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Staked Progress</span>
                        <span className="font-medium text-foreground">
                          {isLoading ? "..." : `${stakedCVT} / ${totalCVT} CVT`}
                        </span>
                      </div>
                      <Progress 
                        value={parseFloat(totalCVT) > 0 ? (parseFloat(stakedCVT) / parseFloat(totalCVT)) * 100 : 0} 
                        className="h-2" 
                      />
                    </div>
                    
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Total Staked</p>
                        {isLoading ? (
                          <Skeleton className="h-8 w-24" />
                        ) : (
                          <p className="text-2xl font-bold text-foreground">{stakedCVT} CVT</p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Available to Stake</p>
                        {isLoading ? (
                          <Skeleton className="h-8 w-24" />
                        ) : (
                          <p className="text-2xl font-bold text-foreground">{availableCVT} CVT</p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button 
                        className="flex-1 gradient-primary"
                        disabled={parseFloat(availableCVT) === 0}
                      >
                        Stake More
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        disabled={parseFloat(stakedCVT) === 0}
                      >
                        Unstake
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">Connect your wallet to view staking details</p>
                    <Button className="gradient-primary">Connect Wallet</Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Compliance Card */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Compliance</CardTitle>
                <CardDescription>ESG & ZK proof reports</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                    <span className="text-sm font-medium text-foreground">ESG Status</span>
                    <span className="text-sm font-semibold text-muted-foreground">Not verified</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                    <span className="text-sm font-medium text-foreground">ZK Proof</span>
                    <span className="text-sm font-semibold text-muted-foreground">Inactive</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                    <span className="text-sm font-medium text-foreground">Last Report</span>
                    <span className="text-sm text-muted-foreground">Never</span>
                  </div>
                </div>

                <Button variant="outline" className="w-full">
                  Generate Report
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Recent Transactions */}
          <RecentTransactions />
        </div>
      </main>
      </div>
    </div>
  );
};

export default Index;
