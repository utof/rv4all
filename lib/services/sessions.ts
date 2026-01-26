import { supabase } from "@/db/provider";
import type { Session, SessionWithSubmission, Submission } from "@/db/types";
import { getRandomPhoto, getOptimizedImageUrl } from "./unsplash";

/**
 * Calculates the next reveal time (10 PM today, or tomorrow if past 10 PM)
 * In dev mode, reveals after 30 seconds for testing
 */
export function calculateRevealTime(): Date {
  const now = new Date();

  // Dev mode: reveal in 30 seconds for quick testing
  if (__DEV__) {
    return new Date(now.getTime() + 2 * 1000);
  }

  const revealTime = new Date(now);
  revealTime.setHours(22, 0, 0, 0); // 10 PM

  // If it's already past 10 PM, set reveal for tomorrow
  if (now >= revealTime) {
    revealTime.setDate(revealTime.getDate() + 1);
  }

  return revealTime;
}

/**
 * Checks if a session has been revealed (current time >= reveal_time)
 */
export function isRevealed(session: Session): boolean {
  return new Date() >= new Date(session.reveal_time);
}

/**
 * Creates a new session by fetching a random image from Unsplash
 */
export async function createSession(): Promise<Session> {
  const photo = await getRandomPhoto();
  const imageUrl = getOptimizedImageUrl(photo);
  const revealTime = calculateRevealTime();

  const { data, error } = await supabase
    .from("sessions")
    .insert({
      image_url: imageUrl,
      unsplash_photo_id: photo.id,
      reveal_time: revealTime.toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create session: ${error.message}`);
  }

  return data as Session;
}

/**
 * Fetches a session by ID with its submissions
 */
export async function getSession(id: string): Promise<SessionWithSubmission | null> {
  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", id)
    .single();

  if (sessionError) {
    if (sessionError.code === "PGRST116") {
      return null; // Not found
    }
    throw new Error(`Failed to fetch session: ${sessionError.message}`);
  }

  const { data: submissions, error: submissionsError } = await supabase
    .from("submissions")
    .select("*")
    .eq("session_id", id)
    .order("submitted_at", { ascending: false });

  if (submissionsError) {
    throw new Error(`Failed to fetch submissions: ${submissionsError.message}`);
  }

  return {
    ...session,
    submissions: submissions || [],
  } as SessionWithSubmission;
}

/**
 * Submits a response to a session
 */
export async function submitResponse(
  sessionId: string,
  userResponse: string
): Promise<Submission> {
  const { data, error } = await supabase
    .from("submissions")
    .insert({
      session_id: sessionId,
      user_response: userResponse,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to submit response: ${error.message}`);
  }

  return data as Submission;
}

/**
 * Fetches recent sessions with their submission status
 */
export async function getRecentSessions(limit: number = 20): Promise<SessionWithSubmission[]> {
  const { data: sessions, error: sessionError } = await supabase
    .from("sessions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (sessionError) {
    throw new Error(`Failed to fetch sessions: ${sessionError.message}`);
  }

  if (!sessions || sessions.length === 0) {
    return [];
  }

  // Fetch all submissions for these sessions
  const sessionIds = sessions.map((s) => s.id);
  const { data: submissions, error: submissionsError } = await supabase
    .from("submissions")
    .select("*")
    .in("session_id", sessionIds);

  if (submissionsError) {
    throw new Error(`Failed to fetch submissions: ${submissionsError.message}`);
  }

  // Group submissions by session
  const submissionsBySession = (submissions || []).reduce(
    (acc, sub) => {
      if (!acc[sub.session_id]) {
        acc[sub.session_id] = [];
      }
      acc[sub.session_id].push(sub);
      return acc;
    },
    {} as Record<string, Submission[]>
  );

  return sessions.map((session) => ({
    ...session,
    submissions: submissionsBySession[session.id] || [],
  })) as SessionWithSubmission[];
}

/**
 * Gets time remaining until reveal in a human-readable format
 */
export function getTimeUntilReveal(revealTime: Date | string): {
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
} {
  const reveal = typeof revealTime === "string" ? new Date(revealTime) : revealTime;
  const now = new Date();
  const diff = reveal.getTime() - now.getTime();

  if (diff <= 0) {
    return { hours: 0, minutes: 0, seconds: 0, total: 0 };
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { hours, minutes, seconds, total: diff };
}
