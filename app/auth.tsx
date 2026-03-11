import { useState } from "react";
import { View, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { upgradeAccount, signIn } from "@/lib/services/auth";

type Mode = "signup" | "signin";

function getErrorMessage(error: Error, mode: Mode): string {
  const msg = error.message.toLowerCase();
  if (
    mode === "signup" &&
    (msg.includes("already registered") ||
      msg.includes("already exists") ||
      msg.includes("email address is already"))
  ) {
    return "An account with this email already exists. Try signing in instead.";
  }
  if (mode === "signin" && msg.includes("invalid login")) {
    return "Incorrect email or password.";
  }
  return "Something went wrong. Please try again.";
}

export default function AuthScreen() {
  const router = useRouter();
  const { mode: modeParam } = useLocalSearchParams<{ mode?: Mode }>();
  const [mode, setMode] = useState<Mode>(modeParam === "signin" ? "signin" : "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        await upgradeAccount(email.trim(), password);
      } else {
        await signIn(email.trim(), password);
      }
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace("/(tabs)/settings");
      }
    } catch (err) {
      setError(getErrorMessage(err instanceof Error ? err : new Error(String(err)), mode));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-background"
    >
      <View className="flex-1 px-6 pt-8 gap-6">
        {/* Mode toggle */}
        <View className="flex-row bg-muted rounded-lg p-1">
          <Button
            variant={mode === "signup" ? "default" : "ghost"}
            className="flex-1"
            onPress={() => { setMode("signup"); setError(null); }}
          >
            <Text>Create Account</Text>
          </Button>
          <Button
            variant={mode === "signin" ? "default" : "ghost"}
            className="flex-1"
            onPress={() => { setMode("signin"); setError(null); }}
          >
            <Text>Sign In</Text>
          </Button>
        </View>

        {/* Email field */}
        <View className="gap-2">
          <Label nativeID="email-label">Email</Label>
          <Input
            aria-labelledby="email-label"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            placeholder="you@example.com"
          />
        </View>

        {/* Password field */}
        <View className="gap-2">
          <Label nativeID="password-label">Password</Label>
          <Input
            aria-labelledby="password-label"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            placeholder="••••••"
          />
        </View>

        {/* Error */}
        {error && (
          <Text className="text-destructive text-sm text-center">{error}</Text>
        )}

        {/* Submit */}
        <Button onPress={handleSubmit} disabled={loading || !email || !password}>
          <Text>
            {loading
              ? mode === "signup" ? "Creating account..." : "Signing in..."
              : mode === "signup" ? "Create Account" : "Sign In"}
          </Text>
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}
