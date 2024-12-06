import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  FlatList,
  Alert,
} from 'react-native';
import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NotificationsComponent = () => {
  const [notifications, setNotifications] = useState([]);

  // Pobierz powiadomienia z serwera
  const fetchNotifications = async () => {
    try {
      const userDataString = await AsyncStorage.getItem('userData');
      if (!userDataString) {
        console.warn('User not logged in. Skipping notification fetch.');
        return;
      }

      const storedUser = JSON.parse(userDataString);
      const response = await fetch(
          `https://drive-test-3bee5c1b0f36.herokuapp.com/api/notifications/new/${storedUser._id}`
      );
      const fcmToken = await messaging().getToken();
      console.log('FCM Token:', fcmToken);

      if (response.ok) {
        const data = await response.json();

        // Logika filtrowania dla `readApp` i `read`
        const unreadNotifications = data.filter(
            (notification) => !notification.readApp || !notification.read
        );

        console.log('Unread notifications:', unreadNotifications);
        setNotifications(unreadNotifications);
      } else {
        console.error('Failed to fetch notifications');
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };


  // Obsługa powiadomień push w foreground
  const handleForegroundNotification = () => {
    const unsubscribe = messaging().onMessage(async (remoteMessage) => {
      const userDataString = await AsyncStorage.getItem('userData');
      if (!userDataString) {
        console.warn('User not logged in. Ignoring foreground notification.');
        return;
      }

      Alert.alert(
          remoteMessage.notification.title,
          remoteMessage.notification.body
      );
      // Odśwież listę powiadomień
      fetchNotifications();
    });

    return unsubscribe;
  };

  // Obsługa powiadomień po kliknięciu w tle
  const handleBackgroundNotification = () => {
    const unsubscribe = messaging().onNotificationOpenedApp(
        async (remoteMessage) => {
          const userDataString = await AsyncStorage.getItem('userData');
          if (!userDataString) {
            console.warn('User not logged in. Ignoring background notification.');
            return;
          }

          Alert.alert(
              remoteMessage.notification.title,
              remoteMessage.notification.body
          );
          fetchNotifications();
        }
    );

    return unsubscribe;
  };

  // Obsługa powiadomień przy uruchomieniu aplikacji
  const handleInitialNotification = async () => {
    const userDataString = await AsyncStorage.getItem('userData');
    if (!userDataString) {
      console.warn('User not logged in. Ignoring initial notification.');
      return;
    }

    const remoteMessage = await messaging().getInitialNotification();
    if (remoteMessage) {
      Alert.alert(
          remoteMessage.notification.title,
          remoteMessage.notification.body
      );
      fetchNotifications();
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Obsługa powiadomień
    const unsubscribeForeground = handleForegroundNotification();
    const unsubscribeBackground = handleBackgroundNotification();
    handleInitialNotification();

    // Automatyczne odświeżanie powiadomień co 30 sekund
    const interval = setInterval(fetchNotifications, 30000);

    return () => {
      unsubscribeForeground();
      unsubscribeBackground();
      clearInterval(interval);
    };
  }, []);

  // Renderowanie pojedynczego powiadomienia
  const renderNotificationItem = ({ item }) => (
      <View style={styles.notificationCard}>
        <Image source={require('../assets/calendar.png')} style={styles.icon} />
        <View style={styles.textContainer}>
          <Text style={styles.notificationText}>{item.text}</Text>
          <Text style={styles.date}>
            {new Date(item.date).toLocaleString()}
          </Text>
        </View>
      </View>
  );

  return (
      <View style={styles.container}>
        <Text style={styles.title}>Your Notifications</Text>
        <FlatList
            data={notifications}
            renderItem={renderNotificationItem}
            keyExtractor={(item) => item._id}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No notifications available.</Text>
            }
        />
      </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    padding: 12,
    marginBottom: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  icon: {
    width: 40,
    height: 40,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  notificationText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    color: '#888',
  },
  emptyText: {
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
    marginVertical: 10, // Zmniejszenie marginesów
  },

});

export default NotificationsComponent;
