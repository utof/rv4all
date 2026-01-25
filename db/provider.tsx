import { createClient, SupabaseClient } from "@supabase/supabase-js";
import React, { type PropsWithChildren, useContext, useState, useEffect } from "react";
import { Platform } from "react-native";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// Check if we're on the server (SSR)
const isServer = typeof window === "undefined";

// Create a storage adapter that works on both client and server
const createStorageAdapter = () => {
  // On server, return a no-op storage
  if (isServer) {
    return {
      getItem: (_key: string): string | null => null,
      setItem: (_key: string, _value: string): void => {},
      removeItem: (_key: string): void => {},
    };
  }

  // On web client, use localStorage
  if (Platform.OS === "web") {
    return {
      getItem: (key: string): string | null => {
        try {
          return localStorage.getItem(key);
        } catch {
          return null;
        }
      },
      setItem: (key: string, value: string): void => {
        try {
          localStorage.setItem(key, value);
        } catch {}
      },
      removeItem: (key: string): void => {
        try {
          localStorage.removeItem(key);
        } catch {}
      },
    };
  }

  // On native, use MMKV (lazy import to avoid SSR issues)
  const { storage } = require("@/lib/storage");
  return {
    getItem: (key: string): string | null => {
      return storage.getString(key) ?? null;
    },
    setItem: (key: string, value: string): void => {
      storage.set(key, value);
    },
    removeItem: (key: string): void => {
      storage.delete(key);
    },
  };
};

// Create Supabase client with platform-appropriate storage
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: createStorageAdapter(),
    autoRefreshToken: true,
    persistSession: !isServer,
    detectSessionInUrl: false,
  },
});

type ContextType = {
  supabase: SupabaseClient;
};

export const SupabaseContext = React.createContext<ContextType>({
  supabase: supabase,
});

export const useSupabase = () => useContext(SupabaseContext);

// Alias for backward compatibility with minimal layout changes
export const DatabaseContext = SupabaseContext;
export const useDatabase = useSupabase;

export function SupabaseProvider({ children }: PropsWithChildren) {
  return (
    <SupabaseContext.Provider value={{ supabase }}>
      {children}
    </SupabaseContext.Provider>
  );
}

// Alias for backward compatibility
export const DatabaseProvider = SupabaseProvider;
