import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react';
import { useNetworkStatus, type UseNetworkStatusReturn } from '@/hooks/useNetworkStatus';
import { useToast } from '@/context/ToastContext';

export type NetworkContextValue = UseNetworkStatusReturn;

export const NetworkContext = createContext<NetworkContextValue | null>(null);

export interface NetworkProviderProps {
  children: ReactNode;
}

export function NetworkProvider({ children }: NetworkProviderProps) {
  const network = useNetworkStatus();
  const { push } = useToast();
  const wasOfflineRef = useRef<boolean>(false);

  useEffect(() => {
    if (!network.isOnline) {
      wasOfflineRef.current = true;
    } else if (wasOfflineRef.current) {
      wasOfflineRef.current = false;
      push("You're back online. Connection restored.", 'success', 4000);
    }
  }, [network.isOnline, push]);

  return (
    <NetworkContext.Provider value={network}>
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork(): NetworkContextValue {
  const ctx = useContext(NetworkContext);
  if (!ctx) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return ctx;
}
