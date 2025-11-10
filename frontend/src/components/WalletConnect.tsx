import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from "wagmi";
import { Button } from "@/components/ui/button";
import { Wallet, LogOut, AlertCircle } from "lucide-react";
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

export function WalletConnect() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { toast } = useToast();

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
          <span className="hidden sm:inline">
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>My Wallet</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-xs text-muted-foreground font-mono">
          {address}
        </DropdownMenuItem>
        <DropdownMenuItem className="text-xs text-muted-foreground">
          Network: Mantle Sepolia
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
