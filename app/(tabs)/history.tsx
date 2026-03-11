import { useState, useCallback, useEffect } from "react";
import { View, RefreshControl } from "react-native";
import { Stack } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import { Text } from "@/components/ui/text";
import { SessionCard } from "@/components/rv";
import { getRecentSessions } from "@/lib/services/sessions";
import type { SessionWithSubmission } from "@/db/types";
import { useSupabase } from "@/db/provider";

export default function HistoryScreen() {
  const { user } = useSupabase();
  const [sessions, setSessions] = useState<SessionWithSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSessions = useCallback(async () => {
    try {
      setError(null);
      const data = await getRecentSessions(50);
      setSessions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load sessions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions, user?.id]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadSessions();
    setRefreshing(false);
  }, [loadSessions]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Stack.Screen options={{ title: "History" }} />
        <Text>Loading sessions...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-background p-6">
        <Stack.Screen options={{ title: "History" }} />
        <Text className="text-destructive text-center">{error}</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ title: "History" }} />
      <FlashList
        data={sessions}
        renderItem={({ item }) => (
          <View className="px-4 py-2">
            <SessionCard session={item} />
          </View>
        )}
        estimatedItemSize={100}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={() => (
          <View className="flex-1 items-center justify-center py-20">
            <Text className="text-muted-foreground text-center">
              No sessions yet. Start your first remote viewing session!
            </Text>
          </View>
        )}
        ListHeaderComponent={() => <View className="h-4" />}
        ListFooterComponent={() => <View className="h-4" />}
      />
    </View>
  );
}
