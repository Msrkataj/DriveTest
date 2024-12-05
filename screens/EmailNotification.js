// screens/EmailNotification.js

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const EmailNotification = () => {
  const [email, setEmail] = useState('');
  const navigation = useNavigation();

  const handleEmailChange = (text) => {
    setEmail(text);
  };

  const handleContinue = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');

      if (!userData) {
        Alert.alert('Error', 'User data not found in storage');
        return;
      }

      const parsedUserData = JSON.parse(userData);
      const { licenseNumber } = parsedUserData;

      const updatedUserData = {
        ...parsedUserData,
        email,
      };

      await AsyncStorage.setItem('userData', JSON.stringify(updatedUserData));

        const serverUrl = 'https://drive-test-3bee5c1b0f36.herokuapp.com';

      const response = await fetch(`${serverUrl}/api/updateUserEmail`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ licenseNumber, email }),
      });

      if (response.ok) {
        console.log('User email updated successfully');
        navigation.navigate('HomeModule');
      } else {
        console.error('Failed to update user email');
        Alert.alert('Error', 'Failed to update user email');
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'An error occurred. Please try again.');
    }
  };

  const handleSkip = () => {
    navigation.navigate('HomeModule');
  };

  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        <Image
          source={require('../assets/email.png')}
          style={{ width: 300, height: 300 }}
          resizeMode="contain"
        />
      </View>
      <Text style={styles.subtitle}>Get notifications</Text>
      <Text style={styles.title}>Add e-mail</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type e-mail"
          placeholderTextColor="#999"
          value={email}
          onChangeText={handleEmailChange}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <View style={styles.inputIcon}>
          <Image
            source={require('../assets/envelope.png')}
            style={{ width: 40, height: 20 }}
            resizeMode="contain"
          />
        </View>
      </View>
      <View style={styles.footer}>
        {!email ? (
          <TouchableOpacity onPress={handleSkip}>
            <Text style={styles.skipLink}>Skip for now</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinue}
          >
            <Text style={styles.buttonText}>Continue</Text>
            <View style={styles.dragHandle}>
              <Text style={styles.arrow}>&rarr;</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0347ff',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  imageContainer: {
    width: '100%',
    maxWidth: 300,
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 8,
    color: '#fff',
    textAlign: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#fff',
    textAlign: 'center',
  },
  inputContainer: {
    position: 'relative',
    width: '100%',
    maxWidth: 400,
    marginTop: 20,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 15,
    fontSize: 16,
    color: '#000',
    paddingRight: 50,
  },
  inputIcon: {
    position: 'absolute',
    right: 15,
    top: '50%',
    transform: [{ translateY: -10 }],
  },
  footer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  skipLink: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 20,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: 300,
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 30,
    paddingHorizontal: 20,
  },
  buttonText: {
    color: '#0347ff',
    fontWeight: '600',
    fontSize: 16,
  },
  dragHandle: {
    width: 40,
    height: 40,
    backgroundColor: '#0347ff',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrow: {
    color: '#fff',
    fontSize: 16,
  },
});

export default EmailNotification;
