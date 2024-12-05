import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../styles/variables';

const VehicleInformation = () => {
  const [vehicleLength, setVehicleLength] = useState('');
  const [vehicleWidth, setVehicleWidth] = useState('');
  const [vehicleHeight, setVehicleHeight] = useState('');
  const [currentTest, setCurrentTest] = useState(null);
  const navigation = useNavigation();

  // Mapping test-specific data
  const testMappings = {
    C1M: { title: 'C1: Medium lorry (off-road)', length: [5, 14], width: [0, 5], height: [0, 5] },
    C1: { title: 'C1: Medium lorry (on-road)', length: [5, 14], width: [0, 5], height: [0, 5] },
    'C1+EM': { title: 'C1E: Medium lorry and trailer (off-road)', length: [8, 18], width: [0, 5], height: [0, 5] },
    'C1+E': { title: 'C1E: Medium lorry and trailer (on-road)', length: [8, 18], width: [0, 5], height: [0, 5] },
    CM: { title: 'C: Large lorry (off-road)', length: [8, 12], width: [0, 5], height: [0, 5] },
    C: { title: 'C: Large lorry (on-road)', length: [8, 12], width: [0, 5], height: [0, 5] },
    'C+EM': { title: 'CE: Large lorry and trailer (off-road)', length: [14, 20], width: [2, 5], height: [2, 5] },
    'C+E': { title: 'CE: Large lorry and trailer (on-road)', length: [14, 20], width: [2, 5], height: [2, 5] },
    D1M: { title: 'D1: Minibus (off-road)', length: [5, 10], width: [0, 5], height: [0, 5] },
    D1: { title: 'D1: Minibus (on-road)', length: [5, 10], width: [0, 5], height: [0, 5] },
    'D1+EM': { title: 'D1E: Minibus and trailer (off-road)', length: [5, 20], width: [2, 5], height: [2, 5] },
    'D1+E': { title: 'D1E: Minibus and trailer (on-road)', length: [5, 20], width: [2, 5], height: [2, 5] },
    DM: { title: 'D: Bus (off-road)', length: [8, 12], width: [2.4, 5], height: [2.4, 5] },
    D: { title: 'D: Bus (on-road)', length: [8, 12], width: [2.4, 5], height: [2.4, 5] },
    'D+EM': { title: 'DE: Bus and trailer (off-road)', length: [10, 20], width: [2.4, 5], height: [2.4, 5] },
    'D+E': { title: 'DE: Bus and trailer (on-road)', length: [10, 20], width: [2.4, 5], height: [2.4, 5] },
  };

  // Fetch `selectedSubTest` from AsyncStorage
  useEffect(() => {
    const loadData = async () => {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const parsedUserData = JSON.parse(userData);
        const selectedSubTest = parsedUserData.selectedSubTest;
        setCurrentTest(testMappings[selectedSubTest] || null);
      }
    };

    loadData();
  }, []);

  const validateInput = (value, min, max) => {
    const numericValue = parseFloat(value);
    return numericValue >= min && numericValue <= max;
  };

  const isFormComplete =
      currentTest &&
      validateInput(vehicleLength, currentTest.length[0], currentTest.length[1]) &&
      validateInput(vehicleWidth, currentTest.width[0], currentTest.width[1]) &&
      validateInput(vehicleHeight, currentTest.height[0], currentTest.height[1]);

  const handleContinue = async () => {
    if (!isFormComplete) {
      Alert.alert('Validation Error', 'Please enter valid values for all fields.');
      return;
    }

    try {
      const userData = await AsyncStorage.getItem('userData');
      if (!userData) {
        Alert.alert('Error', 'User data not found in storage');
        return;
      }

      const parsedUserData = JSON.parse(userData);
      const updatedUserData = {
        ...parsedUserData,
        vehicleData: {
          vehicleLength,
          vehicleWidth,
          vehicleHeight,
        },
      };
      await AsyncStorage.setItem('userData', JSON.stringify(updatedUserData));
      navigation.navigate('LicenseDetails'); // Change to the desired screen name
    } catch (error) {
      Alert.alert('Error', 'Failed to save vehicle information.');
    }
  };

  if (!currentTest) {
    return (
        <View style={styles.loadingContainer}>
          <Text>Loading...</Text>
        </View>
    );
  }

  return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{currentTest.title}</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            Vehicle length ({currentTest.length[0]}m - {currentTest.length[1]}m)
          </Text>
          <TextInput
              style={styles.input}
              value={vehicleLength}
              onChangeText={setVehicleLength}
              placeholder="Enter vehicle length"
              keyboardType="numeric"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            Vehicle width ({currentTest.width[0]}m - {currentTest.width[1]}m)
          </Text>
          <TextInput
              style={styles.input}
              value={vehicleWidth}
              onChangeText={setVehicleWidth}
              placeholder="Enter vehicle width"
              keyboardType="numeric"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            Vehicle height ({currentTest.height[0]}m - {currentTest.height[1]}m)
          </Text>
          <TextInput
              style={styles.input}
              value={vehicleHeight}
              onChangeText={setVehicleHeight}
              placeholder="Enter vehicle height"
              keyboardType="numeric"
          />
        </View>

        <View style={styles.continueContainer}>
          {isFormComplete ? (
              <TouchableOpacity
                  style={[styles.button, styles.buttonActive]}
                  onPress={handleContinue}
              >
                <Text style={styles.buttonTextActive}>Continue</Text>
                <View style={styles.dragHandle}>
                  <Text style={styles.arrow}>&rarr;</Text>
                </View>
              </TouchableOpacity>
          ) : (
              <View style={[styles.button, styles.buttonDisabled]}>
                <Text style={styles.buttonTextDisabled}>Choose to continue</Text>
                <View style={styles.dragHandleDisabled}>
                  <Text style={styles.arrowDisabled}>&rarr;</Text>
                </View>
              </View>
          )}
        </View>
      </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'space-between',
    alignItems: 'center',

    padding: 20,
    backgroundColor: '#f9f9f9',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: '#555',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  continueContainer: {
    marginTop: 'auto',
    alignItems: 'center',
    paddingBottom: 50,
  },
  button: {
    position: 'relative',
    width: 300,
    height: 50,
    backgroundColor: colors.white,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  buttonActive: {
    backgroundColor: colors.main,
  },
  buttonDisabled: {
    backgroundColor: 'rgba(3, 71, 255, 0.1)',
  },
  buttonTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  buttonTextDisabled: {
    color: 'rgba(3, 71, 255, 0.4)',
    fontWeight: '600',
  },
  dragHandle: {
    position: 'relative',
    zIndex: 2,
    width: 40,
    height: 40,
    backgroundColor: colors.white,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 2,
  },
  dragHandleDisabled: {
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  arrow: {
    fontSize: 16,
    color: colors.main,
  },
  arrowDisabled: {
    fontSize: 16,
    color: 'rgba(3, 71, 255, 0.4)',
  },
});

export default VehicleInformation;
