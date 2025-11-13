import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from "wagmi";
import { Button } from "@/components/ui/button";
import { Wallet, LogOut, AlertCircle, Coins } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { mantleSepolia } from "@/lib/wagmi";
import { useCVTBalance } from "@/hooks/useContractData";
import { Skeleton } from "@/components/ui/skeleton";

export function WalletConnect() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { toast } = useToast();
  const { balance, isLoading: balanceLoading } = useCVTBalance();

  const connectWallet = async () => {
    try {
      // Check if MetaMask is installed
      if (typeof window.ethereum === 'undefined') {
        toast({
          title: "MetaMask Not Found",
          description: "Please install MetaMask extension from metamask.io",
          variant: "destructive",
        });
        window.open('https://metamask.io/download/', '_blank');
        return;
      }

      // Find the injected connector (MetaMask)
      const metaMaskConnector = connectors.find((c) => c.id === "injected" || c.name === "MetaMask");
      
      if (metaMaskConnector) {
        connect({ connector: metaMaskConnector });
        toast({
          title: "Connecting...",
          description: "Please approve the connection in MetaMask",
        });
      } else {
        // Fallback: try to connect with the first available connector
        if (connectors.length > 0) {
          connect({ connector: connectors[0] });
          toast({
            title: "Connecting...",
            description: "Please approve the connection in your wallet",
          });
        } else {
          toast({
            title: "No Wallet Found",
            description: "Please refresh the page and try again",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to connect wallet",
        variant: "destructive",
      });
    }
  };

  const disconnectWallet = () => {
    disconnect();
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected",
    });
  };

  const handleSwitchNetwork = () => {
    try {
      switchChain({ chainId: mantleSepolia.id });
      toast({
        title: "Switching Network",
        description: "Please approve the network switch in MetaMask",
      });
    } catch (error) {
      toast({
        title: "Network Switch Failed",
        description: error instanceof Error ? error.message : "Failed to switch network",
        variant: "destructive",
      });
    }
  };

  // Show wrong network warning
  const isWrongNetwork = isConnected && chainId !== mantleSepolia.id;

  if (!isConnected) {
    return (
      <Button onClick={connectWallet} className="gradient-primary">
        <Wallet className="mr-2 h-4 w-4" />
        Connect Wallet
      </Button>
    );
  }

  if (isWrongNetwork) {
    return (
      <Button onClick={handleSwitchNetwork} variant="destructive" className="gap-2">
        <AlertCircle className="h-4 w-4" />
        <span className="hidden sm:inline">Wrong Network</span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Wallet className="h-4 w-4" />
          <div className="hidden sm:flex flex-col items-start">
            <span className="text-xs font-normal text-muted-foreground leading-none mb-0.5">
              {balanceLoading ? (
                <Skeleton className="h-3 w-12" />
              ) : (
                `${parseFloat(balance).toFixed(2)} CVT`
              )}
            </span>
            <span className="text-xs font-medium leading-none">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </span>
          </div>
          <span className="sm:hidden">
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>My Wallet</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-xs text-muted-foreground font-mono flex-col items-start gap-1">
          <span className="font-semibold text-foreground">Address:</span>
          <span className="break-all">{address}</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="text-xs text-muted-foreground flex items-center justify-between">
          <span>Network:</span>
          <span className="font-medium text-foreground">Mantle Sepolia</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="text-xs text-muted-foreground flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Coins className="h-3 w-3" />
            <span>CVT Balance:</span>
          </div>
          <span className="font-semibold text-foreground">
            {balanceLoading ? (
              <Skeleton className="h-3 w-16" />
            ) : (
              `${parseFloat(balance).toFixed(2)} CVT`
            )}
          </span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={disconnectWallet} className="text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
