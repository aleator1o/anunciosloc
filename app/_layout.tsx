import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="login" options={{
        headerTitle: "AnunciosLoc",
        headerTitleAlign: 'center',
        headerShadowVisible: false,
      }}/>
      <Stack.Screen name="register" options={{
        headerTitle: "AnunciosLoc",
        headerTitleAlign: 'center',
         headerShadowVisible: false,
      }}/>
      <Stack.Screen name="register" options={{
        headerTitle: "AnunciosLoc",
        headerTitleAlign: 'center',
         headerShadowVisible: false,
      }}/>
    </Stack>
  );
}
