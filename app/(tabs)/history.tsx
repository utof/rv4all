import { useState, useCallback, useEffect, useRef } from "react";
import { View, RefreshControl, ActivityIndicator } from "react-native";
import { Stack } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import { Text } from "@/components/ui/text";
import { SessionCard } from "@/components/rv";
import { getRecentSessions } from "@/lib/services/sessions";
import type { SessionWithSubmission } from "@/db/types";
import { useSupabase } from "@/db/provider";

const PAGE_SIZE = 20;

export default function HistoryScreen() {
  const { user } = useSupabase();
  const [sessions, setSessions] = useState<SessionWithSubmission[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Using a ref instead of state for page number — incrementing state would
  // cause an extra re-render and a potential race in onEndReached
  const pageRef = useRef(0);

  const loadPage = useCallback(async (pageNum: number) => {
    // Set loading state synchronously before any await
    if (pageNum === 0) {
      setInitialLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      setError(null);
      const data = await getRecentSessions(PAGE_SIZE, pageNum);
      if (pageNum === 0) {
        setSessions(data);
      } else {
        setSessions((prev) => [...prev, ...data]);
      }
      setHasMore(data.length === PAGE_SIZE);
      pageRef.current = pageNum;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load sessions");
    } finally {
      if (pageNum === 0) {
        setInitialLoading(false);
      } else {
        setLoadingMore(false);
      }
    }
  }, []);

  useEffect(() => {
    pageRef.current = 0;
    loadPage(0);
  }, [loadPage, user?.id]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    pageRef.current = 0;
    setHasMore(true);
    await loadPage(0);
    setRefreshing(false);
  }, [loadPage]);

  const onEndReached = useCallback(() => {
    if (initialLoading || loadingMore || !hasMore) return;
    loadPage(pageRef.current + 1);
  }, [initialLoading, loadingMore, hasMore, loadPage]);

  if (initialLoading) {
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
        onEndReached={onEndReached}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={() => (
          <View className="flex-1 items-center justify-center py-20">
            <Text className="text-muted-foreground text-center">
              No sessions yet. Start your first remote viewing session!
            </Text>
          </View>
        )}
        ListHeaderComponent={() => <View className="h-4" />}
        ListFooterComponent={() => (
          <View className="h-8 items-center justify-center">
            {loadingMore && (
              <ActivityIndicator size="small" />
            )}
          </View>
        )}
      />
    </View>
  );
}
