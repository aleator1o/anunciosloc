import { Stack } from "expo-router";
import { AuthProvider } from "./context/AuthContext";

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen
          name="login"
          options={{
            headerShown: true,
            headerTitle: "AnunciosLoc",
            headerTitleAlign: "center",
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="register"
          options={{
            headerShown: true,
            headerTitle: "AnunciosLoc",
            headerTitleAlign: "center",
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen name="home" />
        <Stack.Screen name="announcements" />
        <Stack.Screen
          name="new-announcement"
          options={{
            headerShown: true,
            headerTitle: "",
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen name="profile" />
        <Stack.Screen name="locations" />
        <Stack.Screen
          name="create-location"
          options={{
            headerShown: true,
            headerTitle: "",
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="announcement/[id]"
          options={{
            headerShown: true,
            headerTitle: "Anúncio",
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="edit-announcement"
          options={{
            headerShown: true,
            headerTitle: "Editar Anúncio",
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="edit-profile"
          options={{
            headerShown: true,
            headerTitle: "Editar Perfil",
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="settings"
          options={{
            headerShown: true,
            headerTitle: "Configurações",
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="forgot-password"
          options={{
            headerShown: true,
            headerTitle: "Recuperar Senha",
            headerShadowVisible: false,
          }}
        />
      </Stack>
    </AuthProvider>
  );
}