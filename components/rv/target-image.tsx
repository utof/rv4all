import { Image, View } from "react-native";
import { Text } from "@/components/ui/text";

interface TargetImageProps {
  imageUrl: string;
  revealed: boolean;
  hiddenLabel?: string;
}

export function TargetImage({ imageUrl, revealed, hiddenLabel = "Hidden until reveal" }: TargetImageProps) {
  if (revealed) {
    return (
      <Image
        source={{ uri: imageUrl }}
        className="w-full aspect-video rounded-lg"
        resizeMode="contain"
      />
    );
  }

  return (
    <View className="w-full aspect-video bg-muted rounded-lg items-center justify-center">
      <Text className="text-6xl mb-2">?</Text>
      <Text className="text-muted-foreground">{hiddenLabel}</Text>
    </View>
  );
}
