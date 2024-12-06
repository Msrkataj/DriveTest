import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Switch,
  TextInput,
  Modal,
  Alert,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/FontAwesome';
import messaging from '@react-native-firebase/messaging';
import { PermissionsAndroid, Platform } from 'react-native';
import { colors } from '../styles/variables';

const Settings = () => {
  const [isEmailNotificationEnabled, setIsEmailNotificationEnabled] = useState(false);
  const [isPushNotificationsEnabled, setIsPushNotificationsEnabled] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [emailExists, setEmailExists] = useState(false);
  const navigation = useNavigation();
  const [isPremium, setIsPremium] = useState(false); // Dodane sprawdzenie Premium statusu
  const [isLogoutModalVisible, setIsLogoutModalVisible] = useState(false);

  useEffect(() => {
    const checkUserStatus = async () => {
      const userDataString = await AsyncStorage.getItem('userData');
      const pushNotificationSetting = await AsyncStorage.getItem('isPushNotificationsEnabled');
      console.log(userDataString);
      if (!userDataString) {
        Alert.alert('Error', 'User data not found');
        return;
      }

      const storedUser = JSON.parse(userDataString);
      if (pushNotificationSetting !== null) {
        setIsPushNotificationsEnabled(JSON.parse(pushNotificationSetting));
      }
      const serverUrl = 'https://drive-test-3bee5c1b0f36.herokuapp.com';

      try {
        const response = await fetch(`${serverUrl}/api/getUser`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ licenseNumber: storedUser.licenseNumber }),
        });

        if (response.ok) {
          const userData = await response.json();
          setIsPremium(userData.isPremium);
          setIsEmailNotificationEnabled(!!userData.email);
        } else {
          console.error('Failed to fetch user data');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    checkUserStatus();
  }, []);
  const handleLogout = async () => {
    try {
      await AsyncStorage.clear(); // Usuwa wszystkie dane z AsyncStorage
      setIsLogoutModalVisible(false); // Zamknij modal
      navigation.navigate('Onboarding'); // Przekierowanie do Onboarding
    } catch (error) {
      console.error('Error clearing AsyncStorage:', error);
      Alert.alert('Error', 'Failed to log out. Please try again.');
    }
  };

  useEffect(() => {
    const checkEmailNotificationStatus = async () => {
      const userDataString = await AsyncStorage.getItem('userData');

      if (!userDataString) {
        Alert.alert('Error', 'User data not found');
        return;
      }

      const storedUser = JSON.parse(userDataString);

      try {
        const response = await fetch('https://drive-test-3bee5c1b0f36.herokuapp.com/api/getUser', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ licenseNumber: storedUser.licenseNumber }),
        });

        if (response.ok) {
          const userData = await response.json();
          setEmailExists(!!userData.email);
          setIsEmailNotificationEnabled(!!userData.email);
          setEmail(userData.email || '');
        } else {
          console.error('Failed to fetch user data');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    checkEmailNotificationStatus();
  }, []);
  const handlePremiumRedirect = () => {
    navigation.navigate('PremiumSite');
  };

  const handleEmailToggle = async (value) => {
    setIsEmailNotificationEnabled(value);

    if (value && !emailExists) {
      setIsModalOpen(true);
    } else if (!value && emailExists) {
      // Remove email from AsyncStorage and database
      try {
        const userDataString = await AsyncStorage.getItem('userData');
        const storedUser = JSON.parse(userDataString);

        const response = await fetch('http://10.0.2.2:3000/api/removeUserEmail', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ licenseNumber: storedUser.licenseNumber }),
        });

        if (response.ok) {
          console.log('User email removed successfully');
          setEmailExists(false);
          setEmail('');
          // Update AsyncStorage
          const updatedUserData = {
            ...storedUser,
            email: null,
          };
          await AsyncStorage.setItem('userData', JSON.stringify(updatedUserData));
        } else {
          console.error('Failed to remove user email');
        }
      } catch (error) {
        console.error('Error removing user email:', error);
      }
    }
  };
  const requestUserPermission = async () => {
    const authStatus = await messaging().requestPermission();
    const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log('Authorization status:', authStatus);
      // Pobierz token FCM
      const fcmToken = await messaging().getToken();
      console.log('FCM Token:', fcmToken);
      // Zapisz token na serwerze, jeśli to konieczne
      await saveFcmTokenToServer(fcmToken);
    } else {
      console.log('User declined permissions');
    }
  };
  const requestAndroidNotificationPermission = async () => {
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      const result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      );
      return result === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  };
  const saveFcmTokenToServer = async (token) => {
    try {
      const userDataString = await AsyncStorage.getItem('userData');
      const storedUser = JSON.parse(userDataString);

      const response = await fetch('https://drive-test-3bee5c1b0f36.herokuapp.com/api/fcm/saveFcmToken', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ licenseNumber: storedUser.licenseNumber, fcmToken: token }),
      });

      if (response.ok) {
        console.log('FCM token saved successfully');
      } else {
        console.error('Failed to save FCM token');
      }
    } catch (error) {
      console.error('Error saving FCM token:', error);
    }
  };

  const handleEmailSubmit = async () => {
    setIsModalOpen(false);

    try {
      const userDataString = await AsyncStorage.getItem('userData');
      const storedUser = JSON.parse(userDataString);

      const response = await fetch('https://drive-test-3bee5c1b0f36.herokuapp.com/api/fcm/updateUserEmail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ licenseNumber: storedUser.licenseNumber, email }),
      });

      if (response.ok) {
        console.log('User email updated successfully');
        setEmailExists(true);
        // Update AsyncStorage
        const updatedUserData = {
          ...storedUser,
          email,
        };
        await AsyncStorage.setItem('userData', JSON.stringify(updatedUserData));
      } else {
        console.error('Failed to update user email');
      }
    } catch (error) {
      console.error('Error updating user email:', error);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsEmailNotificationEnabled(false);
  };

  const handlePushNotifications = async (value) => {
    setIsPushNotificationsEnabled(value);
    await AsyncStorage.setItem('isPushNotificationsEnabled', JSON.stringify(value));

    if (value) {
      let permissionGranted = true;

      if (Platform.OS === 'ios') {
        await requestUserPermission();
      } else if (Platform.OS === 'android') {
        permissionGranted = await requestAndroidNotificationPermission();
        if (permissionGranted) {
          const fcmToken = await messaging().getToken();
          console.log('FCM Token:', fcmToken);
          // Zapisz token na serwerze
          await saveFcmTokenToServer(fcmToken);
        } else {
          Alert.alert('Push Notifications', 'Permission denied!');
          setIsPushNotificationsEnabled(false);
          return;
        }
      }

      Alert.alert('Push Notifications', 'Push notifications enabled!');
    } else {
      Alert.alert('Push Notifications', 'Push notifications disabled!');
      // Usuń token FCM z serwera, jeśli to konieczne
      await removeFcmTokenFromServer();
    }
  };
  const removeFcmTokenFromServer = async () => {
    try {
      const userDataString = await AsyncStorage.getItem('userData');
      const storedUser = JSON.parse(userDataString);

      const response = await fetch('https://drive-test-3bee5c1b0f36.herokuapp.com/api/fcm/removeFcmToken', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ licenseNumber: storedUser.licenseNumber }),
      });

      if (response.ok) {
        console.log('FCM token removed successfully');
      } else {
        console.error('Failed to remove FCM token');
      }
    } catch (error) {
      console.error('Error removing FCM token:', error);
    }
  };


  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('HomeModule')} style={styles.headerButton}>
          <Icon name="chevron-left" size={24} color="#0347FF" />
        </TouchableOpacity>
        <View style={styles.headerTitles}>
          <Text style={styles.headerTitle}>Driving Test Dates</Text>
          <Text style={styles.headerSubtitle}>App settings</Text>
        </View>
      </View>
      <View style={styles.options}>
        {!isPremium && (
            <TouchableOpacity
                style={[styles.option, isPremium && styles.disabledOption]} // Dodany styl blokady
                onPress={!isPremium ? handlePremiumRedirect : undefined}
                activeOpacity={!isPremium ? 0.6 : 1}
            >
              <View style={styles.optionIcon}>
                <Image source={require('../assets/hexagon-check-premium.png')} style={{ width: 24, height: 24 }} />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Increase your possibilities</Text>
                <Text style={styles.optionStatus}>
                  {'Activate Premium'}
                </Text>
              </View>
            </TouchableOpacity>
        )}
        <TouchableOpacity
            style={[styles.option, !isPremium && styles.disabledOption]} // Dodany styl blokady
            onPress={!isPremium ? handlePremiumRedirect : undefined}
            activeOpacity={!isPremium ? 0.6 : 1}
        >
          <View style={styles.optionIcon}>
            <Image source={require('../assets/notification.png')} style={{ width: 24, height: 24 }} />
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>Push notifications</Text>
            <Text style={styles.optionStatus}>
              {isPremium ? (isPushNotificationsEnabled ? 'Activated' : 'Inactive') : 'Activate Premium'}
            </Text>
          </View>
          {isPremium && (
              <View style={styles.optionToggle}>
                <Switch
                    value={isPushNotificationsEnabled}
                    onValueChange={handlePushNotifications}
                />
              </View>
          )}
        </TouchableOpacity>

        {/* Box dla powiadomień email */}
        <TouchableOpacity
            style={[styles.option, !isPremium && styles.disabledOption]} // Dodany styl blokady
            onPress={!isPremium ? handlePremiumRedirect : undefined}
            activeOpacity={!isPremium ? 0.6 : 1}
        >
          <View style={styles.optionIcon}>
            <Image source={require('../assets/email-icon.png')} style={{ width: 24, height: 24 }} />
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>E-mail notifications</Text>
            <Text style={styles.optionStatus}>
              {isPremium ? (isEmailNotificationEnabled ? 'Activated' : 'Inactive') : 'Activate Premium'}
            </Text>
          </View>
          {isPremium && (
              <View style={styles.optionToggle}>
                <Switch
                    value={isEmailNotificationEnabled}
                    onValueChange={handleEmailToggle}
                />
              </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.option} onPress={() => navigation.navigate('Support')}>
          <View style={styles.optionIcon}>
            <Image source={require('../assets/customer-service.png')} style={{ width: 24, height: 24 }} />
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>Support</Text>
            <Text style={styles.optionStatus}>Contact us by e-mail</Text>
          </View>
        </TouchableOpacity>
      </View>
      <View style={styles.footer}>
        <TouchableOpacity onPress={() => Linking.openURL('https://yourwebsite.com/privacy-policy')}>
          <Text style={styles.footerLink}>Privacy Policy</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => Linking.openURL('https://yourwebsite.com/terms-conditions')}>
          <Text style={styles.footerLink}>Terms & Conditions</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity
          style={[styles.option, { backgroundColor: '#ff4d4f' }]}
          onPress={() => setIsLogoutModalVisible(true)}
      >
        <View style={styles.optionIcon}>
          <Icon name="sign-out" size={24} color="#fff" />
        </View>
        <View style={styles.optionContent}>
          <Text style={[styles.optionTitle, { color: '#fff' }]}>Logout</Text>
          <Text style={[styles.optionStatus, { color: '#fff' }]}>
            Sign out of your account
          </Text>
        </View>
      </TouchableOpacity>
      <Modal visible={isLogoutModalVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Logout</Text>
            <Text style={styles.modalPrivacyNotice}>
              Are you sure you want to log out? All your data will be removed from this device.
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 20 }}>
              <TouchableOpacity
                  style={[styles.modalSubmit, { backgroundColor: '#ccc' }]}
                  onPress={() => setIsLogoutModalVisible(false)}
              >
                <Text style={[styles.modalSubmitText, { color: '#000' }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                  style={[styles.modalSubmit, { backgroundColor: '#ff4d4f' }]}
                  onPress={handleLogout}
              >
                <Text style={styles.modalSubmitText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={isModalOpen} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.modalClose} onPress={closeModal}>
              <Text style={styles.modalCloseText}>&times;</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Enter Your Email Address</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
            <Text style={styles.modalPrivacyNotice}>
              By providing your email address, you consent to the processing of your personal data in
              accordance with our{' '}
              <Text style={styles.modalLink} onPress={() => Linking.openURL('https://yourwebsite.com/privacy-policy')}>
                Privacy Policy
              </Text>
              . Your data will be used solely for the purpose of sending notifications regarding available
              driving test dates and will not be shared with third parties without your explicit
              consent. We take the security of your data seriously and have implemented measures to
              protect it against unauthorized access or disclosure. You can withdraw your consent at
              any time by updating your preferences in the settings or contacting our support team.
            </Text>
            <TouchableOpacity style={styles.modalSubmit} onPress={handleEmailSubmit}>
              <Text style={styles.modalSubmitText}>Submit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
  flex: 1,
    backgroundColor: '#f9f9f9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingTop: 40,
    paddingRight: 10,
    paddingBottom: 30,
    paddingLeft: 0,
  },
  headerButton: {
    marginLeft: 10,
  },
  headerTitles: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  headerTitle: {
    fontSize: 16,
    color: '#999',
    marginBottom: 4,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#000',
    textAlign: 'center',
    fontWeight: '600',
  },
  options: {
    marginTop: 20,
    padding: 20,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 10,
    // Shadow properties
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  disabledOption: {
    opacity: 0.4,
  },
  optionIcon: {
    marginRight: 15,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    color: '#000',
    marginBottom: 4,
    fontWeight: '600',
  },
  optionStatus: {
    fontSize: 14,
    color: '#7d7d7d',
  },
  footer: {
    marginTop: 'auto',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
  },
  footerLink: {
    color: '#000',
    textDecorationLine: 'underline',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    paddingVertical: 60,
    paddingHorizontal: 20,
    borderRadius: 10,
    maxWidth: 400,
    width: '90%',
    textAlign: 'center',
    position: 'relative',
  },
  modalClose: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  modalCloseText: {
    fontSize: 24,
    color: '#0347ff',
  },
  modalTitle: {
    marginBottom: 40,
    color: '#0347ff',
    fontWeight: '600',
    fontSize: 22,
    textAlign: 'center',
  },
  modalInput: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    fontSize: 16,
    marginBottom: 20,
        color: 'black',
  },
  modalPrivacyNotice: {
    fontSize: 14,
    color: '#999',
    lineHeight: 20,
    marginVertical: 10,
  },
  modalLink: {
    color: '#0347ff',
    textDecorationLine: 'underline',
  },
  modalSubmit: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#0347ff',
    borderRadius: 5,
    marginTop: 20,
  },
  modalSubmitText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    textAlign: 'center',
  },
});

export default Settings;