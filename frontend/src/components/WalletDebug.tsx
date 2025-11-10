import { useConnect } from "wagmi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function WalletDebug() {
  const { connectors } = useConnect();

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-sm">Debug Info</CardTitle>
      </CardHeader>
      <CardContent className="text-xs space-y-2">
        <div>
          <strong>Window.ethereum:</strong> {typeof window.ethereum !== 'undefined' ? '✅ Found' : '❌ Not Found'}
        </div>
        <div>
          <strong>Is MetaMask:</strong> {window.ethereum?.isMetaMask ? '✅ Yes' : '❌ No'}
        </div>
        <div>
          <strong>Available Connectors:</strong>
          <ul className="ml-4 mt-1">
            {connectors.map((connector) => (
              <li key={connector.id}>
                • {connector.name} (id: {connector.id})
              </li>
            ))}
          </ul>
        </div>
        {connectors.length === 0 && (
          <div className="text-red-500">
            ⚠️ No connectors found! Try refreshing the page.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

