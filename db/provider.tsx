import { createClient, SupabaseClient, User } from "@supabase/supabase-js";
import React, { type PropsWithChildren, useContext, useEffect, useState } from "react";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

  // On native, use AsyncStorage
  return {
    getItem: (key: string): Promise<string | null> => {
      return AsyncStorage.getItem(key);
    },
    setItem: (key: string, value: string): Promise<void> => {
      return AsyncStorage.setItem(key, value);
    },
    removeItem: (key: string): Promise<void> => {
      return AsyncStorage.removeItem(key);
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
  user: User | null;
};

export const SupabaseContext = React.createContext<ContextType>({
  supabase: supabase,
  user: null,
});

export const useSupabase = () => useContext(SupabaseContext);

// Alias for backward compatibility with minimal layout changes
export const DatabaseContext = SupabaseContext;
export const useDatabase = useSupabase;

export function SupabaseProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (isServer) return;

    // Drive everything from onAuthStateChange to avoid a getSession race.
    // INITIAL_SESSION fires synchronously on mount with the persisted session (or null).
    // If null, sign in anonymously — the subsequent SIGNED_IN event sets the user.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (event === "INITIAL_SESSION" && !session) {
        supabase.auth.signInAnonymously();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <SupabaseContext.Provider value={{ supabase, user }}>
      {children}
    </SupabaseContext.Provider>
  );
}

// Alias for backward compatibility
export const DatabaseProvider = SupabaseProvider;
