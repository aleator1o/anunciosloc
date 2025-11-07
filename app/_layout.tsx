import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{
      headerShown: false,
    }}>
      <Stack.Screen name="login" options={{
        headerShown: true,
        headerTitle: "AnunciosLoc",
        headerTitleAlign: 'center',
        headerShadowVisible: false,
      }}/>
      <Stack.Screen name="register" options={{
        headerShown: true,
        headerTitle: "AnunciosLoc",
        headerTitleAlign: 'center',
        headerShadowVisible: false,
      }}/>
      <Stack.Screen name="home" />
      <Stack.Screen name="announcements" />
      <Stack.Screen name="new-announcements" options={{
        headerShown: true,
        headerTitle: "",
        headerShadowVisible: false,
      }}/>
      <Stack.Screen name="profile" />
      <Stack.Screen name="locations" />
      <Stack.Screen name="create-location" options={{
        headerShown: true,
        headerTitle: "",
        headerShadowVisible: false,
      }}/>
    </Stack>
  );
}