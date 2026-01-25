import { useEffect, useState, useCallback } from "react";
import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { Progress } from "@/components/ui/progress";
import { getTimeUntilReveal } from "@/lib/services/sessions";

interface CountdownProps {
  revealTime: string;
  onReveal?: () => void;
  createdAt?: string;
}

export function Countdown({ revealTime, onReveal, createdAt }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState(() => getTimeUntilReveal(revealTime));
  const [hasTriggered, setHasTriggered] = useState(false);

  // Calculate progress percentage
  const calculateProgress = useCallback(() => {
    if (!createdAt) return 0;

    const created = new Date(createdAt).getTime();
    const reveal = new Date(revealTime).getTime();
    const now = new Date().getTime();

    const totalDuration = reveal - created;
    const elapsed = now - created;

    if (totalDuration <= 0) return 100;
    const progress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
    return progress;
  }, [createdAt, revealTime]);

  const [progress, setProgress] = useState(calculateProgress);

  useEffect(() => {
    const interval = setInterval(() => {
      const newTimeLeft = getTimeUntilReveal(revealTime);
      setTimeLeft(newTimeLeft);
      setProgress(calculateProgress());

      // Trigger onReveal when countdown reaches zero
      if (newTimeLeft.total <= 0 && !hasTriggered) {
        setHasTriggered(true);
        onReveal?.();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [revealTime, onReveal, hasTriggered, calculateProgress]);

  const formatNumber = (n: number): string => n.toString().padStart(2, "0");

  if (timeLeft.total <= 0) {
    return (
      <View className="items-center py-4">
        <Text className="text-2xl font-semibold text-primary">
          Target Revealed!
        </Text>
      </View>
    );
  }

  return (
    <View className="gap-4">
      <View className="items-center">
        <Text className="text-sm text-muted-foreground mb-2">
          Target reveals in
        </Text>
        <View className="flex-row items-center gap-2">
          <View className="bg-muted rounded-lg px-3 py-2 min-w-[60px] items-center">
            <Text className="text-2xl font-bold text-foreground">
              {formatNumber(timeLeft.hours)}
            </Text>
            <Text className="text-xs text-muted-foreground">hrs</Text>
          </View>
          <Text className="text-2xl font-bold text-muted-foreground">:</Text>
          <View className="bg-muted rounded-lg px-3 py-2 min-w-[60px] items-center">
            <Text className="text-2xl font-bold text-foreground">
              {formatNumber(timeLeft.minutes)}
            </Text>
            <Text className="text-xs text-muted-foreground">min</Text>
          </View>
          <Text className="text-2xl font-bold text-muted-foreground">:</Text>
          <View className="bg-muted rounded-lg px-3 py-2 min-w-[60px] items-center">
            <Text className="text-2xl font-bold text-foreground">
              {formatNumber(timeLeft.seconds)}
            </Text>
            <Text className="text-xs text-muted-foreground">sec</Text>
          </View>
        </View>
      </View>

      {createdAt && (
        <View className="px-4">
          <Progress value={progress} className="h-2" />
        </View>
      )}
    </View>
  );
}
