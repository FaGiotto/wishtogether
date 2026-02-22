import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { UserProvider, useUser } from '../lib/context/UserContext';
import { registerAndStorePushToken } from '../lib/hooks/usePushNotifications';

function RootLayoutNav() {
  const { user, session, loading } = useUser();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    const inAuth = segments[0] === '(auth)';

    if (!session) {
      if (!inAuth) router.replace('/(auth)/login');
    } else {
      if (inAuth) router.replace('/(app)');
    }
  }, [session, loading, segments]);

  useEffect(() => {
    if (session?.user?.id) {
      registerAndStorePushToken(session.user.id);
    }
  }, [session?.user?.id]);

  if (loading) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(app)" />
      <Stack.Screen name="wish/[id]" options={{ presentation: 'card' }} />
      <Stack.Screen
        name="modal/add-wish"
        options={{ presentation: 'modal', headerShown: false }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <UserProvider>
      <RootLayoutNav />
    </UserProvider>
  );
}
