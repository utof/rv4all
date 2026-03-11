import { Alert } from "react-native";
import { useRouter } from "expo-router";
import List, { ListHeader } from "@/components/ui/list";
import ListItem from "@/components/ui/list-item";
import { Muted } from "@/components/ui/typography";
import { useSupabase } from "@/db/provider";
import { signOut } from "@/lib/services/auth";
import { Shield } from "@/lib/icons";

export function AuthSection() {
  const router = useRouter();
  const { user } = useSupabase();

  const isAnonymous = !user?.email;

  const handleSignOut = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure? You'll lose access to your history on this device until you sign in again.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            await signOut();
          },
        },
      ]
    );
  };

  return (
    <List>
      <ListHeader>
        <Muted>Account</Muted>
      </ListHeader>

      {isAnonymous ? (
        <>
          <ListItem
            itemLeft={(props) => <Shield {...props} />}
            label="Create Account"
            onPress={() => router.push("/auth?mode=signup")}
          />
          <ListItem
            itemLeft={(props) => <Shield {...props} />}
            label="Sign In"
            onPress={() => router.push("/auth?mode=signin")}
          />
        </>
      ) : (
        <>
          <ListItem
            label={user.email!}
          />
          <ListItem
            label="Sign Out"
            onPress={handleSignOut}
          />
        </>
      )}
    </List>
  );
}
