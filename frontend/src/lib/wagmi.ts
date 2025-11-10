import { createConfig, http } from 'wagmi'
import { mantleSepoliaTestnet } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'

// Alchemy API key for enhanced RPC
const ALCHEMY_API_KEY = 'ZUEe32o7aGcGrnalTBdzF'

// Define Mantle Sepolia Testnet
export const mantleSepolia = {
  id: 5003,
  name: 'Mantle Sepolia Testnet',
  network: 'mantle-sepolia',
  nativeCurrency: {
    decimals: 18,
    name: 'Mantle',
    symbol: 'MNT',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.sepolia.mantle.xyz'],
    },
    public: {
      http: ['https://rpc.sepolia.mantle.xyz'],
    },
    alchemy: {
      http: [`https://mantle-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`],
    },
  },
  blockExplorers: {
    default: { 
      name: 'Mantle Sepolia Explorer', 
      url: 'https://explorer.sepolia.mantle.xyz' 
    },
  },
  testnet: true,
} as const

// Create wagmi config with Alchemy RPC for better performance
export const config = createConfig({
  chains: [mantleSepolia],
  connectors: [
    injected({
      shimDisconnect: true,
    }),
  ],
  transports: {
    [mantleSepolia.id]: http(`https://mantle-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`),
  },
})

