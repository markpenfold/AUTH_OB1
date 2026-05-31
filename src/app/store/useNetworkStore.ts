// src/stores/useNetworkStore.ts
import { create } from 'zustand';
import { isReallyOnline } from '@/lib/utils/checkOnline';

interface NetworkState {
  isOnline: boolean;
  checkNetwork: () => Promise<boolean>;
  initNetworkListener: () => () => void;
}

export const useNetworkStore = create<NetworkState>((set, get) => ({
  // Default to true so Next.js SSR doesn't break layouts during build compilation
  isOnline: true, 

  // The single source of truth ping test
  checkNetwork: async () => {
    const online = await isReallyOnline();
    set({ isOnline: online });
    return online;
  },

  initNetworkListener: () => {
    if (typeof window === 'undefined') return () => {};

    const handler = () => get().checkNetwork();

    // 🌐 Hardware Reconnected: Run the real ping check to verify actual internet access
    window.addEventListener('online', handler);
    
    // ✈️ Hardware Disconnected: Drop state immediately (No ping required)
    window.addEventListener('offline', () => set({ isOnline: false }));

    // 🚀 Cold Boot Baseline: Check status once when the application mounts
    handler();

    // Clean up event listeners when the root layout unmounts
    return () => {
      window.removeEventListener('online', handler);
      window.removeEventListener('offline', () => set({ isOnline: false }));
    };
  }
}));