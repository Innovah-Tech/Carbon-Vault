import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { StatCard } from "@/components/StatCard";
import { RecentTransactions } from "@/components/RecentTransactions";
import { Wallet, TrendingUp, Lock, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useDashboardData } from "@/hooks/useContractData";
import { useFaucet } from "@/hooks/useFaucet";
import { useAccount } from "wagmi";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStake, useUnstake, useClaimYield } from "@/hooks/useStaking";
import { useCVTPrice } from "@/hooks/useCVTPrice";
import { CVTPriceChart } from "@/components/CVTPriceChart";

const Index = () => {
  const navigate = useNavigate();
  const { isConnected } = useAccount();
  const { 
    totalCVT, 
    availableCVT, 
    stakedCVT, 
    stakedPercentage, 
    pendingRewards, 
    apy, 
    isLoading,
    refetch 
  } = useDashboardData();

  // Staking hooks
  const { stakeTokens, isProcessing: isStaking } = useStake();
  const { unstakeTokens, isProcessing: isUnstaking } = useUnstake();
  const { claimRewards, isProcessing: isClaiming } = useClaimYield();

  // Price hook
  const { price } = useCVTPrice();
  const {
    claim: claimFaucet,
    canClaim: faucetAvailable,
    isClaiming: isClaimingFaucet,
    faucetAmount,
    remainingCooldown,
  } = useFaucet();
  const CVT_PRICE_USD = price.current;

  // Dialog states
  const [stakeDialogOpen, setStakeDialogOpen] = useState(false);
  const [unstakeDialogOpen, setUnstakeDialogOpen] = useState(false);
  const [stakeAmount, setStakeAmount] = useState("");
  const [unstakeAmount, setUnstakeAmount] = useState("");

  // Handler functions
  const handleStake = async () => {
    try {
      await stakeTokens(stakeAmount);
      setStakeDialogOpen(false);
      setStakeAmount("");
      // Refetch dashboard data after successful stake
      setTimeout(() => refetch(), 2000);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleUnstake = async () => {
    try {
      await unstakeTokens(unstakeAmount);
      setUnstakeDialogOpen(false);
      setUnstakeAmount("");
      // Refetch dashboard data after successful unstake
      setTimeout(() => refetch(), 2000);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleClaimRewards = async () => {
    try {
      await claimRewards();
      // Refetch dashboard data after successful claim
      setTimeout(() => refetch(), 2000);
    } catch (error) {
      // Error handled by hook
    }
  };

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
            <Card className="shadow-card lg:col-span-3">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>CVT Faucet</CardTitle>
                    <CardDescription>
                      Claim a small amount of CVT every hour to explore the platform.
                    </CardDescription>
                  </div>
                  <Badge variant={faucetAvailable ? "success" : "secondary"}>
                    {faucetAvailable ? "Ready" : "Cooldown"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {parseFloat(faucetAmount).toFixed(2)} CVT
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {faucetAvailable
                      ? "Available now"
                      : `Next claim in ${Math.ceil(remainingCooldown / 60)} min`}
                  </p>
                </div>
                <Button
                  className="gradient-primary"
                  disabled={!isConnected || !faucetAvailable || isClaimingFaucet}
                  onClick={async () => {
                    try {
                      await claimFaucet();
                      setTimeout(() => refetch(), 2000);
                    } catch {
                      // handled in hook
                    }
                  }}
                >
                  {isClaimingFaucet ? "Claiming..." : "Claim 5 CVT"}
                </Button>
              </CardContent>
            </Card>
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

                    <div className="space-y-3 pt-2">
                      <div className="flex gap-3">
                        <Button 
                          className="flex-1 gradient-primary"
                          disabled={parseFloat(availableCVT) === 0 || isStaking}
                          onClick={() => setStakeDialogOpen(true)}
                        >
                          {isStaking ? "Staking..." : "Stake More"}
                        </Button>
                        <Button 
                          variant="outline" 
                          className="flex-1"
                          disabled={parseFloat(stakedCVT) === 0 || isUnstaking}
                          onClick={() => setUnstakeDialogOpen(true)}
                        >
                          {isUnstaking ? "Unstaking..." : "Unstake"}
                        </Button>
                      </div>
                      {parseFloat(pendingRewards) > 0 && (
                        <Button
                          variant="secondary"
                          className="w-full"
                          onClick={handleClaimRewards}
                          disabled={isClaiming}
                        >
                          {isClaiming ? "Claiming..." : `Claim ${pendingRewards} CVT Rewards`}
                        </Button>
                      )}
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

                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate('/reports')}
                >
                  Generate Report
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* CVT Price Chart */}
          <CVTPriceChart />

          {/* Recent Transactions */}
          <RecentTransactions />
        </div>
      </main>
      </div>

      {/* Stake Dialog */}
      <Dialog open={stakeDialogOpen} onOpenChange={setStakeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Stake CVT Tokens</DialogTitle>
            <DialogDescription>
              Enter the amount of CVT tokens you want to stake. You'll earn rewards based on the current APY.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="stake-amount">Amount</Label>
              <Input
                id="stake-amount"
                type="number"
                placeholder="0.00"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(e.target.value)}
                step="0.01"
                min="0"
                max={availableCVT}
              />
              <p className="text-sm text-muted-foreground">
                Available: {availableCVT} CVT
              </p>
            </div>
            <Button
              variant="link"
              className="h-auto p-0 text-sm"
              onClick={() => setStakeAmount(availableCVT)}
            >
              Stake Max
            </Button>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setStakeDialogOpen(false);
                setStakeAmount("");
              }}
              disabled={isStaking}
            >
              Cancel
            </Button>
            <Button
              onClick={handleStake}
              disabled={!stakeAmount || parseFloat(stakeAmount) <= 0 || parseFloat(stakeAmount) > parseFloat(availableCVT) || isStaking}
              className="gradient-primary"
            >
              {isStaking ? "Staking..." : "Stake"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unstake Dialog */}
      <Dialog open={unstakeDialogOpen} onOpenChange={setUnstakeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unstake CVT Tokens</DialogTitle>
            <DialogDescription>
              Enter the amount of CVT tokens you want to unstake. Your tokens will be returned to your wallet.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="unstake-amount">Amount</Label>
              <Input
                id="unstake-amount"
                type="number"
                placeholder="0.00"
                value={unstakeAmount}
                onChange={(e) => setUnstakeAmount(e.target.value)}
                step="0.01"
                min="0"
                max={stakedCVT}
              />
              <p className="text-sm text-muted-foreground">
                Staked: {stakedCVT} CVT
              </p>
            </div>
            <Button
              variant="link"
              className="h-auto p-0 text-sm"
              onClick={() => setUnstakeAmount(stakedCVT)}
            >
              Unstake Max
            </Button>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setUnstakeDialogOpen(false);
                setUnstakeAmount("");
              }}
              disabled={isUnstaking}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUnstake}
              disabled={!unstakeAmount || parseFloat(unstakeAmount) <= 0 || parseFloat(unstakeAmount) > parseFloat(stakedCVT) || isUnstaking}
              className="gradient-primary"
            >
              {isUnstaking ? "Unstaking..." : "Unstake"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
