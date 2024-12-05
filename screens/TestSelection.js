import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert, // Można użyć np. @react-native-picker/picker dla pełnej funkcjonalności
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../styles/variables'; // Importuj swoje zmienne kolorów
import { Picker } from '@react-native-picker/picker';

// Definicja testTypes i podtypów
const testTypes = [
  { id: 1, name: 'Car (manual and automatic)', icon: require('../assets/sports-car.png') },
  { id: 2, name: 'Motorcycles', icon: require('../assets/motorcycle-icon.png') },
  { id: 3, name: 'Lorries', icon: require('../assets/lorry.png') },
  { id: 4, name: 'Buses and coaches', icon: require('../assets/bus.png') },
];

const subTestOptions = {
  2: [
    { label: 'A1 light bike mod 1', value: 'EUA1M1' },
    { label: 'A1 light bike mod 2', value: 'EUA1M2' },
    { label: 'A2 standard bike mod 1', value: 'EUA2M1' },
    { label: 'A2 standard bike mod 2', value: 'EUA2M2' },
    { label: 'A unrestricted bike mod 1', value: 'EUAM1' },
    { label: 'A unrestricted bike mod 2', value: 'EUAM2' },
    { label: 'AM moped mod 1', value: 'EUAMM1' },
    { label: 'AM moped mod 2', value: 'EUAMM2' },
  ],
  3: [
    { label: 'C1: Medium lorry (off-road)', value: 'C1M' },
    { label: 'C1: Medium lorry (on-road)', value: 'C1' },
    { label: 'C1E: Medium lorry and trailer (off-road)', value: 'C1+EM' },
    { label: 'C1E: Medium lorry and trailer (on-road)', value: 'C1+E' },
    { label: 'C: Large lorry (off-road)', value: 'CM' },
    { label: 'C: Large lorry (on-road)', value: 'C' },
    { label: 'CE: Large lorry and trailer (off-road)', value: 'C+EM' },
    { label: 'CE: Large lorry and trailer (on-road)', value: 'C+E' },
    { label: 'Lorry CPC', value: 'CCPC' },
  ],
  4: [
    { label: 'D1: Minibus (off-road)', value: 'D1M' },
    { label: 'D1: Minibus (on-road)', value: 'D1' },
    { label: 'D1E: Minibus and trailer (off-road)', value: 'D1+EM' },
    { label: 'D1E: Minibus and trailer (on-road)', value: 'D1+E' },
    { label: 'D: Bus (off-road)', value: 'DM' },
    { label: 'D: Bus (on-road)', value: 'D' },
    { label: 'DE: Bus and trailer (off-road)', value: 'D+EM' },
    { label: 'DE: Bus and trailer (on-road)', value: 'D+E' },
    { label: 'Bus CPC', value: 'DCPC' },
  ],
};

const TestSelection = () => {
  const [selectedTest, setSelectedTest] = useState(null);
  const [selectedSubTest, setSelectedSubTest] = useState('');
  const navigation = useNavigation();

  const handleSelect = (test) => {
    // Ustawienie poprawnego stanu wybranego testu
    setSelectedTest(test);
    setSelectedSubTest(''); // Resetuj podtyp przy zmianie głównego typu testu
  };

  const handleContinue = async () => {
    try {
      if (!selectedTest) {
        Alert.alert('Error', 'Please select a test type.');
        return;
      }

      const parsedData = {
        selectedTestId: selectedTest.id,
        selectedSubTest: selectedSubTest || '', // Jeśli nie wybrano podtypu, zapisz pusty string
      };

      // Asynchroniczny zapis danych
      await AsyncStorage.setItem('userData', JSON.stringify(parsedData));

      console.log('User test type saved locally:', parsedData);

      // Nawigacja w zależności od wybranego testu
      if (selectedTest.id === 1) {
        navigation.navigate('LicenseDetails');
      } else {
        navigation.navigate('InfoScreen');
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error: An error occurred. Please try again.');
    }
  };




  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose type of test</Text>
      <View style={styles.options}>
        {testTypes.map((test) => (
          <TouchableOpacity
            key={test.id}
            style={[styles.option, selectedTest?.id === test.id && styles.selectedOption]}
            onPress={() => handleSelect(test)}
          >
            <Image source={test.icon} style={styles.optionIcon} />
            <Text style={[styles.optionText, selectedTest?.id === test.id && styles.selectedOptionText]}>
              {test.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Jeśli wybrany test ma opcje podtypów, pokaż komponent wyboru */}
      {selectedTest && subTestOptions[selectedTest.id] && (
        <View style={styles.subTestPickerContainer}>
          <Text style={styles.subTestLabel}>Choose specific test type:</Text>
          <Picker
            selectedValue={selectedSubTest}
            onValueChange={(itemValue) => setSelectedSubTest(itemValue)}
            style={styles.subTestPicker}
          >
            <Picker.Item label="Select an option" value="" />
            {subTestOptions[selectedTest.id].map((option) => (
              <Picker.Item key={option.value} label={option.label} value={option.value} />
            ))}
          </Picker>
        </View>
      )}

      <View style={styles.continueContainer}>
        {selectedTest && (selectedTest.id === 1 || selectedSubTest) ? (
            <TouchableOpacity style={[styles.button, styles.buttonActive]} onPress={handleContinue}>
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
    </View>
  );
};

export default TestSelection;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    paddingTop: 100,
    paddingHorizontal: 20,
    justifyContent: 'flex-start',
  },
  title: {
    fontSize: 26,
    color: 'black',
    fontWeight: 'bold',
    marginBottom: 60,
    textAlign: 'center',
  },
  options: {
    width: '100%',
    maxWidth: 400,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    marginBottom: 20,
    width: '100%',
    backgroundColor: '#fff',
  },
  selectedOption: {
    backgroundColor: colors.main,
    borderColor: colors.main,
  },
  optionText: {
    marginLeft: 10,
    flex: 1,
    textAlign: 'left',
    color: '#000',
  },
  selectedOptionText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  optionIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  // Styl dla wyboru podtypu testu
  subTestPickerContainer: {
    marginVertical: 20,
    width: '100%',
    maxWidth: 400,
    paddingHorizontal: 20,
    alignItems: 'center',
    color: '#000',

  },
  subTestLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
    alignSelf: 'flex-start',

  },
  subTestPicker: {
    width: '100%',
    height: 50,
    borderColor: '#e0e0e0',
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: '#fff',
    justifyContent: 'center',
    color: '#000',
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
