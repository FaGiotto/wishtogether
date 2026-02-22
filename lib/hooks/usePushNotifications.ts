import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from '../supabase';

export async function registerAndStorePushToken(userId: string) {
  try {
    if (Platform.OS === 'web') return;

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') return;

    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;

    await supabase.from('users').update({ push_token: token }).eq('id', userId);
  } catch (e) {
    console.warn('[pushNotifications] Could not register push token:', e);
  }
}

export async function sendPush(partnerToken: string, title: string, body: string) {
  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: partnerToken,
        title,
        body,
        sound: 'default',
      }),
    });
  } catch (e) {
    console.warn('[pushNotifications] Failed to send push:', e);
  }
}
