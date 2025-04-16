import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import useNotifications from '../hooks/useNotifications';
import { registerForPushNotificationsAsync } from '../hooks/useNotifications';
import { registerPushToken } from '../app/api/notifications';

export default function NotificationSetup() {
  const { 
    expoPushToken, 
    isRegistered, 
    isServerRegistered, 
    error 
  } = useNotifications();
  
  const [isRetrying, setIsRetrying] = React.useState(false);

  const handleRetry = async () => {
    try {
      setIsRetrying(true);
      const token = await registerForPushNotificationsAsync();
      
      if (token) {
        await registerPushToken(token);
      }
    } catch (error) {
      console.error('Error retrying notification setup:', error);
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notification Status</Text>
      
      {isRetrying ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <>
          <View style={styles.statusContainer}>
            <Text style={styles.statusLabel}>Device Registration:</Text>
            <Text style={[
              styles.statusValue,
              { color: isRegistered ? '#22c55e' : '#ef4444' }
            ]}>
              {isRegistered ? 'Registered' : 'Not Registered'}
            </Text>
          </View>
          
          <View style={styles.statusContainer}>
            <Text style={styles.statusLabel}>Server Registration:</Text>
            <Text style={[
              styles.statusValue,
              { color: isServerRegistered ? '#22c55e' : '#ef4444' }
            ]}>
              {isServerRegistered ? 'Registered' : 'Not Registered'}
            </Text>
          </View>
          
          {expoPushToken && (
            <View style={styles.tokenContainer}>
              <Text style={styles.tokenLabel}>Push Token:</Text>
              <Text style={styles.tokenValue} numberOfLines={2} ellipsizeMode="middle">
                {expoPushToken}
              </Text>
            </View>
          )}
          
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorLabel}>Error:</Text>
              <Text style={styles.errorValue}>{error.message}</Text>
            </View>
          )}
          
          {(!isRegistered || !isServerRegistered) && (
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={handleRetry}
            >
              <Text style={styles.retryButtonText}>Retry Setup</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginVertical: 8,
    marginHorizontal: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  statusValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  tokenContainer: {
    marginTop: 8,
    marginBottom: 8,
  },
  tokenLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  tokenValue: {
    fontSize: 12,
    padding: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
  },
  errorContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#fee2e2',
    borderRadius: 4,
  },
  errorLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#b91c1c',
  },
  errorValue: {
    fontSize: 12,
    color: '#b91c1c',
  },
  retryButton: {
    marginTop: 12,
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
}); 