import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../styles/variables';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/FontAwesome';

const LicenseDetails = () => {
  const [extendedTest, setExtendedTest] = useState(null);
  const [specialRequirements, setSpecialRequirements] = useState(null);
  const navigation = useNavigation();

  const isFormComplete = extendedTest !== null && specialRequirements !== null;

  const [specialNeedsOptions, setSpecialNeedsOptions] = useState({
    welshExaminer: false,
    alternateName: false,
    pregnant: false,
    movementRestriction: false,
    dyslexia: false,
    epilepsy: false,
    missingLimbs: false,
    paraplegia: false,
    specialLearning: false,
    nonRestriction: false,
    hardOfHearing: false,
    deaf: false,
  });
  // welsh-examiner: false,
  // special-needs-alternate-name: false,
  // special-needs-pregnant: false,
  // special-needs-restriction: false,
  // special-needs-dyslexia: false,
  // special-needs-epilepsy: false,
  // special-needs-missing-limbs: false,
  // special-needs-paraplegia: false,
  // special-needs-learning: false,
  // special-needs-non-restriction: false,
  // special-needs-hearing: false,
  // special-needs-deaf: false,
  const handleSpecialNeedChange = (option) => {
    setSpecialNeedsOptions((prevOptions) => ({
      ...prevOptions,
      [option]: !prevOptions[option],
    }));
  };

  const handleSubmit = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (!userData) {
        Alert.alert('Error', 'User data not found in storage');
        return;
      }

      const parsedUserData = JSON.parse(userData);

      const updatedUserData = {
        ...parsedUserData,
        extendedTest,
        specialRequirements,
        specialNeedsOptions,
      };

      await AsyncStorage.setItem('userData', JSON.stringify(updatedUserData));

      if (specialRequirements === 'yes') {
        navigation.navigate('SpecialRequirementsDetails');
      } else {
        navigation.navigate('Login');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred. Please try again.');
    }
  };


  return (
      <View style={styles.container}>
        <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>License details</Text>
          <Text style={styles.subtitle}>Car test</Text>

          {/* Pytanie o test sądowy */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Have you been ordered by a court to take an extended test?</Text>
            <View style={styles.radioGroup}>
              <TouchableOpacity
                  style={[styles.radioOption, extendedTest === 'no' && styles.selectedOption]}
                  onPress={() => setExtendedTest('no')}
              >
                <Icon name="times-circle" style={extendedTest === 'no' ? styles.selectedIcon : styles.unselectedIcon} />
                <Text style={[styles.radioText, extendedTest === 'no' && styles.selectedOptionText]}>No</Text>
              </TouchableOpacity>
              <TouchableOpacity
                  style={[styles.radioOption, extendedTest === 'yes' && styles.selectedOption]}
                  onPress={() => setExtendedTest('yes')}
              >
                <Icon name="check-circle" style={extendedTest === 'yes' ? styles.selectedIcon : styles.unselectedIcon} />
                <Text style={[styles.radioText, extendedTest === 'yes' && styles.selectedOptionText]}>Yes</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Pytanie o specjalne wymagania */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Do you have any special requirements?</Text>
            <View style={styles.radioGroup}>
              <TouchableOpacity
                  style={[styles.radioOption, specialRequirements === 'no' && styles.selectedOption]}
                  onPress={() => setSpecialRequirements('no')}
              >
                <Icon name="times-circle" style={specialRequirements === 'no' ? styles.selectedIcon : styles.unselectedIcon} />
                <Text style={[styles.radioText, specialRequirements === 'no' && styles.selectedOptionText]}>No</Text>
              </TouchableOpacity>
              <TouchableOpacity
                  style={[styles.radioOption, specialRequirements === 'yes' && styles.selectedOption]}
                  onPress={() => setSpecialRequirements('yes')}
              >
                <Icon name="check-circle" style={specialRequirements === 'yes' ? styles.selectedIcon : styles.unselectedIcon} />
                <Text style={[styles.radioText, specialRequirements === 'yes' && styles.selectedOptionText]}>Yes</Text>
              </TouchableOpacity>

              {specialRequirements === 'yes' && (
                  <View style={styles.specialNeedsContainer}>
                    {/* Sekcja "Please tell us if" */}
                    <Text style={styles.sectionTitle}>Please tell us if:</Text>
                    {['welshExaminer', 'alternateName', 'pregnant'].map((option) => (
                        <TouchableOpacity
                            key={option}
                            style={styles.checkboxItem}
                            onPress={() => handleSpecialNeedChange(option)}
                        >
                          <Icon
                              name={specialNeedsOptions[option] ? "check-square" : "square"}
                              style={specialNeedsOptions[option] ? styles.checkboxIcon : styles.uncheckedIcon}
                          />
                          <Text style={styles.checkboxLabel}>{getSpecialNeedLabel(option)}</Text>
                        </TouchableOpacity>
                    ))}

                    {/* Sekcja "Do you have" */}
                    <Text style={styles.sectionTitle}>Do you have:</Text>
                    {['movementRestriction', 'dyslexia', 'epilepsy', 'missingLimbs', 'paraplegia', 'specialLearning', 'nonRestriction'].map((option) => (
                        <TouchableOpacity
                            key={option}
                            style={styles.checkboxItem}
                            onPress={() => handleSpecialNeedChange(option)}
                        >
                          <Icon
                              name={specialNeedsOptions[option] ? "check-square" : "square"}
                              style={specialNeedsOptions[option] ? styles.checkboxIcon : styles.uncheckedIcon}
                          />
                          <Text style={styles.checkboxLabel}>{getSpecialNeedLabel(option)}</Text>
                        </TouchableOpacity>
                    ))}

                    {/* Sekcja "Are you" */}
                    <Text style={styles.sectionTitle}>Are you:</Text>
                    {['hardOfHearing', 'deaf'].map((option) => (
                        <TouchableOpacity
                            key={option}
                            style={styles.checkboxItem}
                            onPress={() => handleSpecialNeedChange(option)}
                        >
                          <Icon
                              name={specialNeedsOptions[option] ? "check-square" : "square"}
                              style={specialNeedsOptions[option] ? styles.checkboxIcon : styles.uncheckedIcon}
                          />
                          <Text style={styles.checkboxLabel}>{getSpecialNeedLabel(option)}</Text>
                        </TouchableOpacity>
                    ))}
                  </View>
              )}
            </View>
          </View>
        </ScrollView>

        <View style={styles.continueContainer}>
          {isFormComplete ? (
              <TouchableOpacity
                  style={[styles.button, styles.buttonActive]}
                  onPress={handleSubmit}
              >
                <Text style={styles.buttonTextActive}>Continue</Text>
                <View style={styles.dragHandle}>
                  <Text style={styles.arrow}>&rarr;</Text>
                </View>
              </TouchableOpacity>
          ) : (
              <View style={[styles.button, styles.buttonDisabled]}>
                <Text style={styles.buttonTextDisabled}>Fill to continue</Text>
                <View style={styles.dragHandleDisabled}>
                  <Text style={styles.arrowDisabled}>&rarr;</Text>
                </View>
              </View>
          )}
        </View>
      </View>
  );
};

const getSpecialNeedLabel = (option) => {
  const labels = {
    welshExaminer: 'You require a Welsh speaking examiner',
    alternateName: 'You\'d like your examiner to call you by a different name',
    pregnant: 'You are heavily pregnant',
    movementRestriction: 'A condition which restricts or limits movement in your arms, legs or body',
    dyslexia: 'Dyslexia',
    epilepsy: 'Epilepsy',
    missingLimbs: 'Missing limbs',
    paraplegia: 'Paraplegia',
    specialLearning: 'Special learning or educational needs',
    nonRestriction: 'A condition which doesn’t restrict or limit movement in your arms, legs or body',
    hardOfHearing: 'Hard of hearing',
    deaf: 'Profoundly deaf - you can arrange to bring a British Sign Language (BSL) interpreter with you',
  };
  return labels[option] || '';
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f7',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.main3,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: colors.gray,
    marginBottom: 40,
  },
  formGroup: {
    marginBottom: 30,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.main3,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.main3,
    marginTop: 20,
    marginBottom: 10,
  },
  radioGroup: {
    flexDirection: 'column',
    marginTop: 8,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginBottom: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 2,
  },
  radioText: {
    fontSize: 16,
    color: colors.main3,
    marginLeft: 10,
  },
  selectedOption: {
    borderColor: colors.main,
    borderWidth: 1,
  },
  selectedIcon: {
    color: colors.main,
    fontSize: 20,
  },
  unselectedIcon: {
    color: '#ccc',
    fontSize: 20,
  },
  specialNeedsContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 2,
  },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  checkboxLabel: {
    fontSize: 16,
    color: colors.main3,
    marginLeft: 10,
  },
  checkboxIcon: {
    fontSize: 20,
    color: colors.main,
  },
  uncheckedIcon: {
    fontSize: 20,
    color: '#ccc',
  },
  continueContainer: {
    alignItems: 'center',
    paddingBottom: 50,
    width: '100%',
    position: 'absolute',
    bottom: 0,
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

export default LicenseDetails;
