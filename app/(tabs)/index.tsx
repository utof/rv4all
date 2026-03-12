import { useState, useCallback, useEffect } from "react";
import { View, Image, ScrollView, RefreshControl } from "react-native";
import { useSupabase } from "@/db/provider";
import { Stack } from "expo-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormField, FormTextarea } from "@/components/ui/form";
import { Countdown } from "@/components/rv";
import {
  createSession,
  getSession,
  submitResponse,
  isRevealed,
  getPendingSession,
  getUnviewedRevealedSession,
} from "@/lib/services/sessions";
import { setItem, removeItem } from "@/lib/storage";
import type { SessionWithSubmission } from "@/db/types";

const CURRENT_SESSION_KEY = "current_session_id";

const submissionSchema = z.object({
  response: z.string().min(1, "Please describe what you see"),
});

type SubmissionForm = z.infer<typeof submissionSchema>;

export default function ViewScreen() {
  const { user } = useSupabase();
  const [session, setSession] = useState<SessionWithSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  // Session that's revealed but user hasn't viewed yet
  const [awaitingViewSession, setAwaitingViewSession] = useState<SessionWithSubmission | null>(null);

  const form = useForm<SubmissionForm>({
    resolver: zodResolver(submissionSchema),
    defaultValues: {
      response: "",
    },
  });

  const hasSubmission = session?.submissions && session.submissions.length > 0;
  // Only reveal if user has submitted - prevents cheating by waiting
  const revealed = hasSubmission && session ? isRevealed(session) : false;

  // Load current session on mount
  const loadSession = useCallback(async () => {
    try {
      setError(null);
      setAwaitingViewSession(null);

      // First, check if there's a pending session (not yet revealed)
      const pendingSession = await getPendingSession();
      if (pendingSession) {
        setSession(pendingSession);
        await setItem(CURRENT_SESSION_KEY, pendingSession.id);
        return;
      }

      // No pending session - check if there's a revealed session to view
      const revealedSession = await getUnviewedRevealedSession();
      if (revealedSession) {
        // Don't load it into main session yet - show "View Your Image" button
        setAwaitingViewSession(revealedSession);
        setSession(null);
        return;
      }

      // No sessions at all - clear any stale local storage
      await removeItem(CURRENT_SESSION_KEY);
      setSession(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load session");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSession();
  }, [loadSession, user?.id]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadSession();
    setRefreshing(false);
  }, [loadSession]);

  const handleStartSession = async () => {
    try {
      setLoading(true);
      setError(null);
      const newSession = await createSession();
      await setItem(CURRENT_SESSION_KEY, newSession.id);
      // Refetch with submissions array
      const fullSession = await getSession(newSession.id);
      setSession(fullSession);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start session");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: SubmissionForm) => {
    if (!session) return;

    try {
      setSubmitting(true);
      setError(null);
      await submitResponse(session.id, data.response);
      // Refresh session to get the new submission
      const updatedSession = await getSession(session.id);
      setSession(updatedSession);
      form.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit response");
    } finally {
      setSubmitting(false);
    }
  };

  const handleNewSession = async () => {
    await removeItem(CURRENT_SESSION_KEY);
    setSession(null);
    setAwaitingViewSession(null);
    form.reset();
  };

  const handleViewRevealedSession = () => {
    if (awaitingViewSession) {
      setSession(awaitingViewSession);
      setAwaitingViewSession(null);
    }
  };

  const handleReveal = useCallback(async () => {
    // Refresh session state when reveal happens
    if (session) {
      const updatedSession = await getSession(session.id);
      setSession(updatedSession);
    }
  }, [session]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Stack.Screen options={{ title: "View" }} />
        <Text>Loading...</Text>
      </View>
    );
  }

  // No active session - show start button or "view your image" if one is awaiting
  if (!session) {
    // Has a revealed session waiting to be viewed
    if (awaitingViewSession) {
      return (
        <View className="flex-1 bg-background p-6">
          <Stack.Screen options={{ title: "Remote Viewing" }} />
          <View className="flex-1 items-center justify-center gap-6">
            <Text className="text-2xl font-semibold text-foreground text-center">
              Your image is ready!
            </Text>
            <Text className="text-muted-foreground text-center px-8">
              The target has been revealed. View your session to see how you did.
            </Text>
            <Button onPress={handleViewRevealedSession} className="px-8">
              <Text>View Your Image</Text>
            </Button>
            {error && (
              <Text className="text-destructive text-center">{error}</Text>
            )}
          </View>
        </View>
      );
    }

    // No session at all - can start a new one
    return (
      <View className="flex-1 bg-background p-6">
        <Stack.Screen options={{ title: "Remote Viewing" }} />
        <View className="flex-1 items-center justify-center gap-6">
          <Text className="text-2xl font-semibold text-foreground text-center">
            Ready to begin?
          </Text>
          <Text className="text-muted-foreground text-center px-8">
            Start a new session to receive a random target image. Describe what
            you perceive before the reveal at 10 PM.
          </Text>
          <Button onPress={handleStartSession} className="px-8">
            <Text>Start Session</Text>
          </Button>
          {error && (
            <Text className="text-destructive text-center">{error}</Text>
          )}
        </View>
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
      <Stack.Screen options={{ title: "Remote Viewing" }} />

      <View className="p-6 gap-6">
        {/* Target Image / Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle>Target</CardTitle>
          </CardHeader>
          <CardContent>
            {revealed ? (
              <Image
                source={{ uri: session.image_url }}
                className="w-full aspect-video rounded-lg"
                resizeMode="contain"
              />
            ) : (
              <View className="w-full aspect-video bg-muted rounded-lg items-center justify-center">
                <Text className="text-6xl mb-2">?</Text>
                <Text className="text-muted-foreground">
                  {hasSubmission ? "Waiting for reveal..." : "Submit your response first"}
                </Text>
              </View>
            )}
          </CardContent>
        </Card>

        {/* Countdown Timer - only show after submission */}
        {hasSubmission && !revealed && (
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

        {/* Submission Form or Existing Submission */}
        {hasSubmission ? (
          <Card>
            <CardHeader>
              <CardTitle>Your Response</CardTitle>
            </CardHeader>
            <CardContent>
              <Text className="text-foreground">
                "{session.submissions[0].user_response}"
              </Text>
              <Text className="text-sm text-muted-foreground mt-2">
                Submitted{" "}
                {new Date(session.submissions[0].submitted_at).toLocaleString()}
              </Text>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>What do you see?</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <View className="gap-4">
                  <FormField
                    control={form.control}
                    name="response"
                    render={({ field }) => (
                      <FormTextarea
                        {...field}
                        placeholder="Describe your impressions, colors, shapes, feelings..."
                        className="min-h-[120px]"
                      />
                    )}
                  />
                  <Button
                    onPress={form.handleSubmit(handleSubmit)}
                    disabled={submitting}
                  >
                    <Text>{submitting ? "Submitting..." : "Submit"}</Text>
                  </Button>
                </View>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* Error Display */}
        {error && (
          <Text className="text-destructive text-center">{error}</Text>
        )}

        {/* New Session Button (after reveal) */}
        {revealed && (
          <Button variant="outline" onPress={handleNewSession}>
            <Text>Start New Session</Text>
          </Button>
        )}
      </View>
    </ScrollView>
  );
}
