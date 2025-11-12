import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Activity, BarChart3, PieChart, Users } from "lucide-react";
import {
  MarketplaceListing,
  calculateMarketAnalytics,
  generateChartData,
  getVolumeByOffsetType,
  getTopSellers,
  MarketAnalytics as Analytics,
} from "@/services/analyticsService";
import { formatAddress } from "@/services/marketplaceService";

interface MarketplaceAnalyticsProps {
  listings: MarketplaceListing[];
}

export function MarketplaceAnalytics({ listings }: MarketplaceAnalyticsProps) {
  const analytics = useMemo(() => calculateMarketAnalytics(listings), [listings]);
  const chartData = useMemo(() => generateChartData(listings, 7), [listings]);
  const volumeByType = useMemo(() => getVolumeByOffsetType(listings), [listings]);
  const topSellers = useMemo(() => getTopSellers(listings, 3), [listings]);

  return (
    <div className="space-y-6">
      {/* Market Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between">
              <span>Avg Price (24h)</span>
              {analytics.priceDirection === 'up' ? (
                <TrendingUp className="h-4 w-4 text-success" />
              ) : analytics.priceDirection === 'down' ? (
                <TrendingDown className="h-4 w-4 text-destructive" />
              ) : (
                <Activity className="h-4 w-4 text-muted-foreground" />
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold">
                ${analytics.currentAveragePrice.toFixed(2)}
              </p>
              <span
                className={`text-sm font-medium ${
                  analytics.priceChange24h > 0
                    ? 'text-success'
                    : analytics.priceChange24h < 0
                    ? 'text-destructive'
                    : 'text-muted-foreground'
                }`}
              >
                {analytics.priceChange24h > 0 ? '+' : ''}
                {analytics.priceChange24h.toFixed(2)}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              7d: {analytics.priceChange7d > 0 ? '+' : ''}
              {analytics.priceChange7d.toFixed(2)}%
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between">
              <span>Volume (24h)</span>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold">
                {analytics.totalVolume24h.toFixed(0)} CVT
              </p>
              <span
                className={`text-sm font-medium ${
                  analytics.volumeChange24h > 0
                    ? 'text-success'
                    : analytics.volumeChange24h < 0
                    ? 'text-destructive'
                    : 'text-muted-foreground'
                }`}
              >
                {analytics.volumeChange24h > 0 ? '+' : ''}
                {analytics.volumeChange24h.toFixed(1)}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              7d: {analytics.totalVolume7d.toFixed(0)} CVT
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between">
              <span>Liquidity Score</span>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold">{analytics.liquidityScore}/100</p>
              <Badge
                variant={
                  analytics.liquidityScore > 70
                    ? 'default'
                    : analytics.liquidityScore > 40
                    ? 'secondary'
                    : 'outline'
                }
              >
                {analytics.liquidityScore > 70
                  ? 'High'
                  : analytics.liquidityScore > 40
                  ? 'Medium'
                  : 'Low'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics.activeListingsCount} active listings
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between">
              <span>Avg Time to Sell</span>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold">
                {analytics.averageTimeToSell.toFixed(0)}h
              </p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Market depth: {analytics.marketDepth}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Activity Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">New Listings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-success">{analytics.newListings24h}</p>
            <p className="text-xs text-muted-foreground mt-1">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Sold</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">{analytics.soldListings24h}</p>
            <p className="text-xs text-muted-foreground mt-1">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Price Range</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">
              ${analytics.lowestPrice24h.toFixed(2)} - ${analytics.highestPrice24h.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Current spread</p>
          </CardContent>
        </Card>
      </div>

      {/* Volume by Offset Type */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Volume by Offset Type
          </CardTitle>
          <CardDescription>Distribution of CVT tokens by category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {volumeByType.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{item.type}</span>
                  <span className="text-muted-foreground">
                    {item.volume.toFixed(2)} CVT ({item.percentage}%)
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Sellers */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Top Sellers
          </CardTitle>
          <CardDescription>Most active sellers by volume</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topSellers.map((seller, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg bg-muted hover:bg-muted/70 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                    #{index + 1}
                  </div>
                  <div>
                    <p className="font-medium font-mono text-sm">
                      {formatAddress(seller.seller)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {seller.listingCount} listing{seller.listingCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">{seller.volume.toFixed(2)} CVT</p>
                  <p className="text-xs text-muted-foreground">Total volume</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Market Trends */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Market Trends</CardTitle>
          <CardDescription>Current market indicators</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
              <span className="text-sm font-medium">Popular Offset Type</span>
              <Badge variant="outline">{analytics.popularOffsetType}</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
              <span className="text-sm font-medium">Popular Vintage</span>
              <Badge variant="outline">{analytics.popularVintage}</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
              <span className="text-sm font-medium">Price Trend</span>
              <Badge
                variant={
                  analytics.priceDirection === 'up'
                    ? 'default'
                    : analytics.priceDirection === 'down'
                    ? 'destructive'
                    : 'secondary'
                }
              >
                {analytics.priceDirection}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
              <span className="text-sm font-medium">Volume Trend</span>
              <Badge
                variant={
                  analytics.volumeDirection === 'increasing'
                    ? 'default'
                    : analytics.volumeDirection === 'decreasing'
                    ? 'destructive'
                    : 'secondary'
                }
              >
                {analytics.volumeDirection}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 7-Day Chart (Simple) */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>7-Day Overview</CardTitle>
          <CardDescription>Price and volume trends</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {chartData.map((point, index) => (
              <div key={index} className="flex items-center gap-4">
                <span className="text-xs text-muted-foreground w-16">{point.date}</span>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{
                          width: `${Math.min((point.price / analytics.highestPrice24h) * 100, 100)}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs font-medium w-12 text-right">
                      ${point.price.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {point.volume.toFixed(0)} CVT • {point.listings} listings
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

