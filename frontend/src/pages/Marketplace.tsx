import { useState, useMemo, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  ShoppingCart, 
  TrendingUp, 
  Plus, 
  X, 
  Loader2, 
  Filter, 
  Download,
  Calendar,
  User,
  DollarSign,
  Star,
  Bell,
  BarChart3,
  RefreshCw,
  Heart
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAccount } from "wagmi";
import { useToast } from "@/hooks/use-toast";
import { useCVTBalance } from "@/hooks/useContractData";
import {
  useMarketplaceListings,
  useCreateListing,
  useBuyListing,
  useCancelListing,
  useMarketplaceFee,
} from "@/hooks/useMarketplace";
import { useWatchlist } from "@/hooks/useWatchlist";
import {
  filterListingsBySearch,
  filterListingsByType,
  filterListingsByVintage,
  sortListings,
  SortOption,
  validateListingParams,
  calculateMarketplaceFee,
  formatAddress,
  timeAgo,
  getExpirationStatus,
  calculateMarketplaceStats,
  exportListingsToCSV,
} from "@/services/marketplaceService";
import { MarketplaceAnalytics } from "@/components/MarketplaceAnalytics";
import { saveAnalyticsSnapshot } from "@/services/analyticsService";

const Marketplace = () => {
  const { toast } = useToast();
  const { address, isConnected } = useAccount();
  const { balance } = useCVTBalance();
  
  // Marketplace hooks
  const { listings: allListings, isLoading: loadingListings, lastFetchTime, refetch } = useMarketplaceListings();
  const { createListing, isPending: isCreatingListing, isConfirmed: listingCreated } = useCreateListing();
  const { buyListing, isPending: isBuying, isConfirmed: purchaseCompleted } = useBuyListing();
  const { cancelListing, isPending: isCancelling, isConfirmed: cancelCompleted } = useCancelListing();
  const { feePercentage } = useMarketplaceFee();
  
  // Watchlist hooks
  const { 
    watchlist, 
    notifications, 
    unreadCount, 
    isWatching, 
    toggleListing: toggleWatch 
  } = useWatchlist();

  // State
  const [searchTerm, setSearchTerm] = useState("");
  const [offsetTypeFilter, setOffsetTypeFilter] = useState("all");
  const [vintageFilter, setVintageFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [showOnlyActive, setShowOnlyActive] = useState(true);
  const [showMyListings, setShowMyListings] = useState(false);
  const [showWatchlistOnly, setShowWatchlistOnly] = useState(false);

  // Create listing dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newListingAmount, setNewListingAmount] = useState("");
  const [newListingPrice, setNewListingPrice] = useState("");
  const [newListingExpires, setNewListingExpires] = useState("30");

  // Buy confirmation dialog state
  const [buyDialogOpen, setBuyDialogOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<any>(null);

  // Cancel confirmation dialog state
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [listingToCancel, setListingToCancel] = useState<any>(null);

  // Save analytics snapshot periodically
  useEffect(() => {
    if (allListings.length > 0) {
      saveAnalyticsSnapshot(allListings);
    }
  }, [allListings]);

  // Refetch when transactions complete
  useEffect(() => {
    if (listingCreated || purchaseCompleted || cancelCompleted) {
      setTimeout(() => refetch(), 3000);
    }
  }, [listingCreated, purchaseCompleted, cancelCompleted, refetch]);

  // Filter and sort listings
  const filteredListings = useMemo(() => {
    let filtered = allListings;

    // Filter by active status
    if (showOnlyActive) {
      filtered = filtered.filter(l => l.active && !l.isExpired);
    }

    // Filter by user's listings
    if (showMyListings && address) {
      filtered = filtered.filter(l => l.seller.toLowerCase() === address.toLowerCase());
    }

    // Filter by watchlist
    if (showWatchlistOnly) {
      const watchedIds = watchlist.map(w => w.listingId);
      filtered = filtered.filter(l => watchedIds.includes(l.id));
    }

    // Apply search filter
    filtered = filterListingsBySearch(filtered, searchTerm);

    // Apply offset type filter
    filtered = filterListingsByType(filtered, offsetTypeFilter);

    // Apply vintage filter
    filtered = filterListingsByVintage(filtered, vintageFilter);

    // Sort
    filtered = sortListings(filtered, sortBy);

    return filtered;
  }, [allListings, searchTerm, offsetTypeFilter, vintageFilter, sortBy, showOnlyActive, showMyListings, showWatchlistOnly, address, watchlist]);

  // Calculate stats
  const stats = useMemo(() => calculateMarketplaceStats(allListings), [allListings]);

  // Handle create listing
  const handleCreateListing = async () => {
    const params = {
      amount: newListingAmount,
      pricePerToken: newListingPrice,
      expiresInDays: parseInt(newListingExpires),
    };

    const error = validateListingParams(params);
    if (error) {
      toast({
        title: "Validation Error",
        description: error,
        variant: "destructive",
      });
      return;
    }

    if (parseFloat(newListingAmount) > parseFloat(balance)) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough CVT tokens to create this listing.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createListing(newListingAmount, newListingPrice, parseInt(newListingExpires));
      setCreateDialogOpen(false);
      setNewListingAmount("");
      setNewListingPrice("");
      setNewListingExpires("30");
    } catch (error) {
      // Error handled by hook
    }
  };

  // Handle buy listing
  const handleBuyClick = (listing: any) => {
    if (!isConnected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to purchase listings.",
        variant: "destructive",
      });
      return;
    }

    if (listing.seller.toLowerCase() === address?.toLowerCase()) {
      toast({
        title: "Cannot Buy Own Listing",
        description: "You cannot purchase your own listing.",
        variant: "destructive",
      });
      return;
    }

    setSelectedListing(listing);
    setBuyDialogOpen(true);
  };

  const confirmBuy = async () => {
    if (!selectedListing) return;

    try {
      await buyListing(selectedListing.id, selectedListing.totalValue);
      setBuyDialogOpen(false);
      setSelectedListing(null);
    } catch (error) {
      // Error handled by hook
    }
  };

  // Handle cancel listing
  const handleCancelClick = (listing: any) => {
    setListingToCancel(listing);
    setCancelDialogOpen(true);
  };

  const confirmCancel = async () => {
    if (!listingToCancel) return;

    try {
      await cancelListing(listingToCancel.id);
      setCancelDialogOpen(false);
      setListingToCancel(null);
    } catch (error) {
      // Error handled by hook
    }
  };

  const isUserListing = (listing: any) => {
    return address && listing.seller.toLowerCase() === address.toLowerCase();
  };

  const handleToggleWatch = (listingId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWatch(listingId);
  };

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
                  Marketplace
                </h1>
                <p className="text-muted-foreground flex items-center gap-2">
                  Buy and sell carbon credit tokens
                  {lastFetchTime && (
                    <span className="text-xs">
                      • Last updated {new Date(lastFetchTime).toLocaleTimeString()}
                    </span>
                  )}
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refetch}
                  disabled={loadingListings}
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${loadingListings ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button
                  variant="outline"
                  onClick={() => exportListingsToCSV(filteredListings)}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
                <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gradient-primary" disabled={!isConnected}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Listing
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Listing</DialogTitle>
                      <DialogDescription>
                        List your CVT tokens for sale on the marketplace
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="amount">Amount (CVT)</Label>
                        <Input
                          id="amount"
                          type="number"
                          placeholder="0.00"
                          value={newListingAmount}
                          onChange={(e) => setNewListingAmount(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                          Available: {balance} CVT
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="price">Price per Token (USD)</Label>
                        <Input
                          id="price"
                          type="number"
                          placeholder="0.00"
                          value={newListingPrice}
                          onChange={(e) => setNewListingPrice(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="expires">Expires In (Days)</Label>
                        <Select value={newListingExpires} onValueChange={setNewListingExpires}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="7">7 days</SelectItem>
                            <SelectItem value="14">14 days</SelectItem>
                            <SelectItem value="30">30 days</SelectItem>
                            <SelectItem value="60">60 days</SelectItem>
                            <SelectItem value="90">90 days</SelectItem>
                            <SelectItem value="0">Never</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {newListingAmount && newListingPrice && (
                        <div className="p-3 rounded-lg bg-muted space-y-1">
                          <p className="text-sm text-muted-foreground">Total Value</p>
                          <p className="text-2xl font-bold text-foreground">
                            ${(parseFloat(newListingAmount) * parseFloat(newListingPrice)).toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Fee: {feePercentage}% • You receive: ${((parseFloat(newListingAmount) * parseFloat(newListingPrice)) * (1 - feePercentage / 100)).toFixed(2)}
                          </p>
                        </div>
                      )}
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setCreateDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        className="gradient-primary"
                        onClick={handleCreateListing}
                        disabled={isCreatingListing || !newListingAmount || !newListingPrice}
                      >
                        {isCreatingListing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          "Create Listing"
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Tabs for Listings and Analytics */}
            <Tabs defaultValue="listings" className="space-y-6">
              <TabsList>
                <TabsTrigger value="listings" className="gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Listings
                  {unreadCount > 0 && (
                    <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
                      {unreadCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="analytics" className="gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Analytics
                </TabsTrigger>
                <TabsTrigger value="watchlist" className="gap-2">
                  <Star className="h-4 w-4" />
                  Watchlist ({watchlist.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="listings" className="space-y-6">
                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-4">
                  <Card className="shadow-card">
                    <CardHeader className="pb-2">
                      <CardDescription>Total Listings</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{stats.totalListings}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {stats.activeListings} active
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="shadow-card">
                    <CardHeader className="pb-2">
                      <CardDescription>Total Volume</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{stats.totalVolume} CVT</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Available for purchase
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="shadow-card">
                    <CardHeader className="pb-2">
                      <CardDescription>Average Price</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">${stats.averagePrice}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Per CVT token
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="shadow-card">
                    <CardHeader className="pb-2">
                      <CardDescription>Price Range</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">
                        ${stats.lowestPrice} - ${stats.highestPrice}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Min - Max
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Filters */}
                <Card className="shadow-card">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-5">
                        <div className="relative md:col-span-2">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search listings..."
                            className="pl-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                        </div>
                        <Select value={offsetTypeFilter} onValueChange={setOffsetTypeFilter}>
                          <SelectTrigger>
                            <SelectValue placeholder="Offset Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="reforestation">Reforestation</SelectItem>
                            <SelectItem value="renewable energy">Renewable Energy</SelectItem>
                            <SelectItem value="carbon capture">Carbon Capture</SelectItem>
                            <SelectItem value="ocean conservation">Ocean Conservation</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select value={vintageFilter} onValueChange={setVintageFilter}>
                          <SelectTrigger>
                            <SelectValue placeholder="Vintage Year" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Years</SelectItem>
                            <SelectItem value="2024">2024</SelectItem>
                            <SelectItem value="2023">2023</SelectItem>
                            <SelectItem value="2022">2022</SelectItem>
                            <SelectItem value="2021">2021</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Sort By" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="newest">Newest First</SelectItem>
                            <SelectItem value="oldest">Oldest First</SelectItem>
                            <SelectItem value="price-low">Price: Low to High</SelectItem>
                            <SelectItem value="price-high">Price: High to Low</SelectItem>
                            <SelectItem value="amount-low">Amount: Low to High</SelectItem>
                            <SelectItem value="amount-high">Amount: High to Low</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          variant={showOnlyActive ? "default" : "outline"}
                          size="sm"
                          onClick={() => setShowOnlyActive(!showOnlyActive)}
                        >
                          <Filter className="mr-2 h-3 w-3" />
                          Active Only
                        </Button>
                        {isConnected && (
                          <Button
                            variant={showMyListings ? "default" : "outline"}
                            size="sm"
                            onClick={() => setShowMyListings(!showMyListings)}
                          >
                            <User className="mr-2 h-3 w-3" />
                            My Listings
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Listings Grid */}
                {loadingListings ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-3 text-muted-foreground">Loading listings...</span>
                  </div>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredListings.length === 0 ? (
                      <Card className="shadow-card md:col-span-2 lg:col-span-3">
                        <CardContent className="flex flex-col items-center justify-center py-12">
                          <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
                          <p className="text-lg font-medium text-foreground mb-2">
                            No listings found
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Try adjusting your filters or create a new listing
                          </p>
                        </CardContent>
                      </Card>
                    ) : (
                      filteredListings.map((listing) => {
                        const expirationStatus = getExpirationStatus(listing);
                        const feeInfo = calculateMarketplaceFee(listing.totalValue, feePercentage);
                        const isOwner = isUserListing(listing);
                        const isWatched = isWatching(listing.id);
                        
                        return (
                          <Card key={listing.id} className="shadow-card hover:shadow-hover transition-smooth">
                            <CardHeader>
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <CardTitle className="text-lg flex items-center gap-2">
                                    {parseFloat(listing.amount).toFixed(2)} CVT
                                    {isOwner && (
                                      <Badge variant="outline" className="text-xs">Your Listing</Badge>
                                    )}
                                  </CardTitle>
                                  <CardDescription className="mt-1 flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    {formatAddress(listing.seller)}
                                  </CardDescription>
                                </div>
                                <div className="flex flex-col gap-2 items-end">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={(e) => handleToggleWatch(listing.id, e)}
                                  >
                                    <Heart
                                      className={`h-4 w-4 ${isWatched ? 'fill-red-500 text-red-500' : ''}`}
                                    />
                                  </Button>
                                  <Badge variant="secondary" className="bg-success/10 text-success">
                                    <TrendingUp className="mr-1 h-3 w-3" />
                                    {listing.yield}% APY
                                  </Badge>
                                  <Badge variant={expirationStatus.variant}>
                                    {expirationStatus.text}
                                  </Badge>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="flex gap-2 flex-wrap">
                                <Badge variant="outline">{listing.offsetType}</Badge>
                                <Badge variant="outline">Vintage {listing.vintage}</Badge>
                              </div>
                              
                              <div className="flex items-center justify-between pt-2">
                                <div>
                                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                                    <DollarSign className="h-3 w-3" />
                                    Price per CVT
                                  </p>
                                  <p className="text-2xl font-bold text-foreground">
                                    ${listing.pricePerToken}
                                  </p>
                                </div>
                                {isOwner ? (
                                  <Button
                                    variant="destructive"
                                    onClick={() => handleCancelClick(listing)}
                                    disabled={!listing.active || isCancelling}
                                  >
                                    {isCancelling ? (
                                      <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Cancelling...
                                      </>
                                    ) : (
                                      <>
                                        <X className="h-4 w-4 mr-2" />
                                        Cancel
                                      </>
                                    )}
                                  </Button>
                                ) : (
                                  <Button
                                    className="gradient-primary"
                                    onClick={() => handleBuyClick(listing)}
                                    disabled={!listing.active || isBuying}
                                  >
                                    {isBuying ? (
                                      <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Buying...
                                      </>
                                    ) : (
                                      <>
                                        <ShoppingCart className="h-4 w-4 mr-2" />
                                        Buy Now
                                      </>
                                    )}
                                  </Button>
                                )}
                              </div>

                              <div className="pt-2 border-t border-border space-y-1">
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Total Value:</span>
                                  <span className="font-medium">${listing.totalValue}</span>
                                </div>
                                <div className="flex justify-between text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {timeAgo(listing.createdAt)}
                                  </span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="analytics">
                <MarketplaceAnalytics listings={allListings} />
              </TabsContent>

              <TabsContent value="watchlist" className="space-y-6">
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle>Your Watchlist</CardTitle>
                    <CardDescription>
                      Track your favorite listings and get notified of changes
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {watchlist.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Star className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-lg font-medium text-foreground mb-2">No listings watched</p>
                        <p className="text-sm text-muted-foreground">
                          Click the heart icon on any listing to add it to your watchlist
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {watchlist.map((item) => {
                          const listing = allListings.find(l => l.id === item.listingId);
                          if (!listing) return null;
                          
                          return (
                            <div
                              key={item.listingId}
                              className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                            >
                              <div className="flex-1">
                                <p className="font-medium">
                                  Listing #{listing.id} • {parseFloat(listing.amount).toFixed(2)} CVT
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  ${listing.pricePerToken} per token • {listing.offsetType} • Vintage {listing.vintage}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Added {new Date(item.addedAt).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleBuyClick(listing)}
                                  disabled={!listing.active}
                                >
                                  <ShoppingCart className="h-4 w-4 mr-2" />
                                  Buy
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleWatch(item.listingId)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Notifications */}
                {notifications.length > 0 && (
                  <Card className="shadow-card">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        Notifications
                        {unreadCount > 0 && (
                          <Badge variant="destructive">{unreadCount} new</Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {notifications.slice(0, 5).map((notif) => (
                          <div
                            key={notif.id}
                            className={`p-3 rounded-lg border ${
                              notif.read ? 'bg-background' : 'bg-muted'
                            }`}
                          >
                            <p className="text-sm">{notif.message}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(notif.timestamp).toLocaleString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>

      {/* Buy Confirmation Dialog */}
      <AlertDialog open={buyDialogOpen} onOpenChange={setBuyDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Purchase</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to purchase {selectedListing?.amount} CVT tokens
            </AlertDialogDescription>
          </AlertDialogHeader>
          {selectedListing && (
            <div className="space-y-3 py-4">
              <div className="p-4 rounded-lg bg-muted space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Amount:</span>
                  <span className="font-medium">{selectedListing.amount} CVT</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Price per Token:</span>
                  <span className="font-medium">${selectedListing.pricePerToken}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Subtotal:</span>
                  <span className="font-medium">${selectedListing.totalValue}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Marketplace Fee ({feePercentage}%):
                  </span>
                  <span className="font-medium">
                    ${calculateMarketplaceFee(selectedListing.totalValue, feePercentage).fee}
                  </span>
                </div>
                <div className="pt-2 border-t border-border flex justify-between">
                  <span className="font-medium">Total:</span>
                  <span className="text-lg font-bold">${selectedListing.totalValue}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                By confirming, you agree to purchase these tokens at the listed price.
                The transaction will be processed on the blockchain.
              </p>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBuy}
              className="gradient-primary"
            >
              Confirm Purchase
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Listing Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Listing</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this listing? Your {listingToCancel?.amount} CVT tokens will be returned to your wallet.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, Keep Listing</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCancel}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Yes, Cancel Listing
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Marketplace;
