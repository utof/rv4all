import { View, Image, Pressable } from "react-native";
import { Link } from "expo-router";
import { Text } from "@/components/ui/text";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { SessionWithSubmission } from "@/db/types";
import { isRevealed } from "@/lib/services/sessions";

interface SessionCardProps {
  session: SessionWithSubmission;
}

export function SessionCard({ session }: SessionCardProps) {
  const revealed = isRevealed(session);
  const hasSubmission = session.submissions.length > 0;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Link href={`/session/${session.id}`} asChild>
      <Pressable>
        <Card className="overflow-hidden">
          <View className="flex-row">
            {/* Thumbnail */}
            <View className="w-24 h-24 bg-muted">
              {revealed ? (
                <Image
                  source={{ uri: session.image_url }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : (
                <View className="w-full h-full items-center justify-center bg-muted">
                  <Text className="text-4xl">?</Text>
                </View>
              )}
            </View>

            {/* Content */}
            <CardContent className="flex-1 p-3 justify-between">
              <View>
                <Text className="text-sm text-muted-foreground">
                  {formatDate(session.created_at)}
                </Text>
                {hasSubmission && (
                  <Text className="text-sm mt-1" numberOfLines={2}>
                    "{session.submissions[0].user_response}"
                  </Text>
                )}
              </View>

              {/* Status badges */}
              <View className="flex-row gap-2 mt-2">
                <Badge variant={revealed ? "default" : "secondary"}>
                  <Text className="text-xs">
                    {revealed ? "Revealed" : "Pending"}
                  </Text>
                </Badge>
                {hasSubmission && (
                  <Badge variant="outline">
                    <Text className="text-xs">Submitted</Text>
                  </Badge>
                )}
              </View>
            </CardContent>
          </View>
        </Card>
      </Pressable>
    </Link>
  );
}
