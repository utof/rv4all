import { useState, useCallback, useEffect } from "react";
import { View, ScrollView, RefreshControl } from "react-native";
import { Stack, useLocalSearchParams, router } from "expo-router";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Countdown, TargetImage } from "@/components/rv";
import { getSession, isRevealed } from "@/lib/services/sessions";
import type { SessionWithSubmission } from "@/db/types";

export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [session, setSession] = useState<SessionWithSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const revealed = session ? isRevealed(session) : false;
  const hasSubmission = session?.submissions && session.submissions.length > 0;

  const loadSession = useCallback(async () => {
    if (!id) return;

    try {
      setError(null);
      const data = await getSession(id);
      setSession(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load session");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadSession();
    setRefreshing(false);
  }, [loadSession]);

  const handleReveal = useCallback(async () => {
    await loadSession();
  }, [loadSession]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Stack.Screen options={{ title: "Session" }} />
        <Text>Loading session...</Text>
      </View>
    );
  }

  if (error || !session) {
    return (
      <View className="flex-1 items-center justify-center bg-background p-6 gap-4">
        <Stack.Screen options={{ title: "Session" }} />
        <Text className="text-destructive text-center">
          {error || "Session not found"}
        </Text>
        <Button onPress={() => router.back()}>
          <Text>Go Back</Text>
        </Button>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Stack.Screen
        options={{
          title: `Session ${formatDate(session.created_at).split(",")[0]}`,
        }}
      />

      <View className="p-6 gap-6">
        {/* Status Badges */}
        <View className="flex-row gap-2">
          <Badge variant={revealed ? "default" : "secondary"}>
            <Text className="text-xs">{revealed ? "Revealed" : "Pending"}</Text>
          </Badge>
          {hasSubmission && (
            <Badge variant="outline">
              <Text className="text-xs">Submitted</Text>
            </Badge>
          )}
        </View>

        {/* Session Info */}
        <Card>
          <CardHeader>
            <CardTitle>Session Details</CardTitle>
          </CardHeader>
          <CardContent className="gap-2">
            <Text className="text-sm text-muted-foreground">
              Created: {formatDate(session.created_at)}
            </Text>
            <Text className="text-sm text-muted-foreground">
              Reveal: {formatDate(session.reveal_time)}
            </Text>
          </CardContent>
        </Card>

        {/* Target Image */}
        <Card>
          <CardHeader>
            <CardTitle>Target</CardTitle>
          </CardHeader>
          <CardContent>
            <TargetImage
              imageUrl={session.image_url}
              revealed={revealed}
            />
          </CardContent>
        </Card>

        {/* Countdown (if not revealed) */}
        {!revealed && (
          <Card>
            <CardContent className="pt-6">
              <Countdown
                revealTime={session.reveal_time}
                createdAt={session.created_at}
                onReveal={handleReveal}
              />
            </CardContent>
          </Card>
        )}

        {/* User's Submission */}
        {hasSubmission && (
          <Card>
            <CardHeader>
              <CardTitle>Your Response</CardTitle>
            </CardHeader>
            <CardContent className="gap-2">
              <Text className="text-foreground">
                "{session.submissions[0].user_response}"
              </Text>
              <Text className="text-sm text-muted-foreground">
                Submitted:{" "}
                {formatDate(session.submissions[0].submitted_at)}
              </Text>
            </CardContent>
          </Card>
        )}

        {/* No submission message */}
        {!hasSubmission && (
          <Card>
            <CardContent className="py-6">
              <Text className="text-muted-foreground text-center">
                No response was submitted for this session.
              </Text>
            </CardContent>
          </Card>
        )}
      </View>
    </ScrollView>
  );
}
