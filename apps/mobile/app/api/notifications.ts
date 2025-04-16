import Constants from 'expo-constants';
import { getAuthToken } from './auth';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'https://fd5f-2a02-8429-91a1-4601-ec6b-6113-8a6e-f425.ngrok-free.app' || 'http://localhost:3000';

/**
 * Register the Expo push token with the server
 */
export async function registerPushToken(expoPushToken: string): Promise<boolean> {
  try {
    const authToken = await getAuthToken();
    
    if (!authToken) {
      console.log('No auth token found, cannot register push token');
      return false;
    }
    
    const response = await fetch(`${API_URL}/api/notifications/register-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ expoPushToken }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error registering push token:', errorData);
      return false;
    }
    
    const data = await response.json();
    console.log('Push token registered successfully:', data);
    return true;
  } catch (error) {
    console.error('Failed to register push token:', error);
    return false;
  }
} 