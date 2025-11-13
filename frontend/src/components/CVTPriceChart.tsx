import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { 
  getPriceForRange, 
  getCVTPrice, 
  formatPrice, 
  formatPriceChange,
  getPriceChangeColor,
  interpolatePriceData,
  getSmoothPriceData,
  CONTRACT_DEPLOYMENT_DATE,
} from '@/services/priceService';

type TimeRange = '5s' | '1m' | '5m' | '1h' | '24h' | '7d' | '30d' | 'all';

interface ChartDataPoint {
  time: string;
  price: number;
  timestamp: number;
}

export function CVTPriceChart() {
  const [timeRange, setTimeRange] = useState<TimeRange>('1h');
  const [smoothing, setSmoothing] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [key, setKey] = useState(0); // Force re-render
  const price = getCVTPrice();
  
  // Refresh chart data
  const handleRefresh = () => {
    setIsRefreshing(true);
    setKey(prev => prev + 1);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Dynamic auto-refresh based on time range
  useEffect(() => {
    // Faster refresh for shorter time ranges
    const refreshInterval = timeRange === '5s' ? 1000 : // 1 second for 5s view
                           timeRange === '1m' ? 2000 : // 2 seconds for 1m view
                           timeRange === '5m' ? 5000 : // 5 seconds for 5m view
                           timeRange === '1h' ? 10000 : // 10 seconds for 1h view
                           30000; // 30 seconds for longer views
    
    const interval = setInterval(() => {
      setKey(prev => prev + 1);
    }, refreshInterval);
    return () => clearInterval(interval);
  }, [timeRange]);
  
  const chartData = useMemo(() => {
    let rawData = getPriceForRange(timeRange);
    
    if (rawData.length === 0) return [];

    // Determine target points based on time range
    const targetPoints = timeRange === '5s' ? 10 : 
                        timeRange === '1m' ? 30 :
                        timeRange === '5m' ? 60 :
                        timeRange === '1h' ? 120 :
                        timeRange === '24h' ? 288 : 
                        timeRange === '7d' ? 336 : 
                        timeRange === '30d' ? 720 :
                        1000; // 'all' - from deployment
    
    // Interpolate to get continuous data
    let processedData = interpolatePriceData(rawData, Math.min(targetPoints, rawData.length * 2));
    
    // Apply smoothing if enabled (disable for very short ranges)
    if (smoothing && !['5s', '1m'].includes(timeRange)) {
      const windowSize = timeRange === '5m' ? 2 :
                        timeRange === '1h' ? 3 :
                        timeRange === '24h' ? 5 : 
                        timeRange === '7d' ? 7 : 
                        9;
      processedData = getSmoothPriceData(processedData, windowSize);
    }

    // Format for chart
    return processedData.map(point => ({
      time: formatTimeForRange(point.timestamp, timeRange),
      price: parseFloat(point.price.toFixed(4)),
      timestamp: point.timestamp,
    }));
  }, [timeRange, smoothing, key]);

  const { minPrice, maxPrice, avgPrice } = useMemo(() => {
    if (chartData.length === 0) return { minPrice: 0, maxPrice: 2, avgPrice: 1 };
    
    const prices = chartData.map(d => d.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const avg = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    
    return {
      minPrice: min,
      maxPrice: max,
      avgPrice: avg,
    };
  }, [chartData]);

  const isPositive = price.change24h >= 0;
  const chartColor = isPositive ? '#22c55e' : '#ef4444';
  const areaColor = isPositive ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)';

  // Calculate price range for better scaling
  const priceRange = maxPrice - minPrice;
  const padding = priceRange * 0.1; // 10% padding
  const yAxisDomain = [
    Math.max(0, minPrice - padding),
    maxPrice + padding,
  ];

  return (
    <Card className="shadow-card">
      <CardHeader>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>CVT Price</CardTitle>
              <CardDescription>Real-time token price with {chartData.length} data points</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)} className="w-full">
            <TabsList className="grid grid-cols-8 w-full">
              <TabsTrigger value="5s">5S</TabsTrigger>
              <TabsTrigger value="1m">1M</TabsTrigger>
              <TabsTrigger value="5m">5M</TabsTrigger>
              <TabsTrigger value="1h">1H</TabsTrigger>
              <TabsTrigger value="24h">24H</TabsTrigger>
              <TabsTrigger value="7d">7D</TabsTrigger>
              <TabsTrigger value="30d">30D</TabsTrigger>
              <TabsTrigger value="all">ALL</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Price Display */}
        <div className="space-y-2">
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-bold">${formatPrice(price.current, 4)}</span>
            <div className={`flex items-center gap-1 text-sm font-medium ${getPriceChangeColor(price.change24h)}`}>
              {isPositive ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span>{formatPriceChange(price.change24h)}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">24h High</p>
              <p className="font-semibold text-success">${formatPrice(price.high24h, 4)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">24h Low</p>
              <p className="font-semibold text-destructive">${formatPrice(price.low24h, 4)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Average</p>
              <p className="font-semibold">${formatPrice(avgPrice, 4)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Volume 24h</p>
              <p className="font-semibold">${formatPrice(price.volume24h, 0)}</p>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="relative w-full h-64 bg-muted/10 rounded-lg p-4">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart 
                data={chartData}
                margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartColor} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={chartColor} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-muted-foreground/20" />
                <XAxis 
                  dataKey="time" 
                  stroke="currentColor"
                  className="text-muted-foreground text-xs"
                  tick={{ fontSize: 11 }}
                  interval="preserveStartEnd"
                  minTickGap={50}
                />
                <YAxis 
                  domain={yAxisDomain}
                  stroke="currentColor"
                  className="text-muted-foreground text-xs"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(value) => `$${value.toFixed(2)}`}
                  width={60}
                />
                <Tooltip 
                  content={<CustomTooltip />}
                  cursor={{ stroke: chartColor, strokeWidth: 1, strokeDasharray: '5 5' }}
                />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke={chartColor}
                  strokeWidth={2}
                  fill="url(#colorPrice)"
                  animationDuration={300}
                  dot={false}
                  activeDot={{ r: 4, fill: chartColor }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground text-sm">No price data available</p>
            </div>
          )}
        </div>

        {/* Chart Controls */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>
              {timeRange === '5s' && 'Last 5 seconds'}
              {timeRange === '1m' && 'Last 1 minute'}
              {timeRange === '5m' && 'Last 5 minutes'}
              {timeRange === '1h' && 'Last 1 hour'}
              {timeRange === '24h' && 'Last 24 hours'}
              {timeRange === '7d' && 'Last 7 days'}
              {timeRange === '30d' && 'Last 30 days'}
              {timeRange === 'all' && `Since deployment (${new Date(CONTRACT_DEPLOYMENT_DATE).toLocaleDateString()})`}
            </span>
            <span className="text-xs">
              Range: ${formatPrice(minPrice, 4)} - ${formatPrice(maxPrice, 4)}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSmoothing(!smoothing)}
            className="h-6 text-xs"
            disabled={['5s', '1m'].includes(timeRange)}
          >
            {smoothing ? 'Smoothed' : 'Raw Data'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Custom tooltip component
function CustomTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    const data = payload[0].payload as ChartDataPoint;
    const date = new Date(data.timestamp);
    
    return (
      <div className="bg-background border border-border rounded-lg shadow-lg p-3">
        <p className="text-xs text-muted-foreground mb-1">
          {date.toLocaleString()}
        </p>
        <p className="text-sm font-semibold">
          ${data.price.toFixed(4)}
        </p>
      </div>
    );
  }
  return null;
}

// Format time based on range
function formatTimeForRange(timestamp: number, range: TimeRange): string {
  const date = new Date(timestamp);
  
  if (range === '5s' || range === '1m') {
    // Show seconds for very short ranges
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  } else if (range === '5m' || range === '1h') {
    // Show time without seconds
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  } else if (range === '24h') {
    // Show hour:minute
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  } else if (range === '7d') {
    // Show day and time
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit'
    });
  } else if (range === '30d') {
    // Show date
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  } else {
    // 'all' - show date
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: '2-digit'
    });
  }
}

