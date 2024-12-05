import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient'; // Importuj gradient
import { colors, fonts } from '../styles/variables';  // Import zmiennych

const OnboardingComponent = ({ navigation }) => {
  return (
    <View style={styles.onboarding}>
      <Image
        source={require('../assets/woman-male-driving.png')}
        style={styles.onboardingImage}
        resizeMode="cover"
      />
      <LinearGradient
        colors={['transparent', colors.main]} // Gradient od przezroczystego do niebieskiego
        start={{ x: 0, y: 0 }}  // Zaczyna się u góry
        end={{ x: 0, y: 1 }}    // Kończy się na dole
        style={styles.onboardingMain}
      >
        <View style={styles.onboardingBottom}>
          <View style={styles.onboardingText}>
            <Text style={[styles.title, { fontFamily: fonts.bold }]}>DRIVING TEST DATES</Text>
            <Text style={[styles.description, { color: colors.white }]}>
              Find canceled dates at exam centers and get your license faster than ever.
              Save time, avoid long waits and move boldly toward your goal!
            </Text>
          </View>
         <View style={styles.onboardingMainButton}>
    <TouchableOpacity
      style={styles.onboardingButton}
      onPress={() => navigation.navigate('WelcomeScreen')}  // Przejście na stronę logowania
    >
      <Text style={[styles.buttonText, { color: colors.main }]}>Book your date</Text>
      <View style={styles.dragHandle}>
        <Text style={styles.arrow}>&rarr;</Text>
      </View>
    </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  onboarding: {
    flex: 1,
    position: 'relative',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  onboardingImage: {
    width: '100%',
    height: '100%',
  },
  onboardingMain: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    height: '50%', // Dodaj pełną wysokość
    padding: 0, // Usuń padding, aby gradient sięgał rogów
    justifyContent: 'flex-end'
  },
  onboardingBottom: {
    color: '#fff',
    textAlign: 'center',
  },
  onboardingText: {
    marginTop: 10,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: fonts.bold,
    color: '#fff',
    alignItems: 'center',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: '#fff',
    marginTop: 10,
    alignItems: 'center',
    textAlign: 'center',
  },
  onboardingMainButton: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,

  },
  onboardingButton: {
    backgroundColor: '#fff',
    width: 300,
    height: 50,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  buttonText: {
  fontSize: 16,
    fontWeight: '600',
  },
  dragHandle: {
    width: 50, // Zwiększony rozmiar okręgu
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 25, // Okrągły kształt
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  arrow: {
    fontSize: 22, // Zwiększony rozmiar strzałki
    fontWeight: 'bold',
    color: '#007BFF',
    marginBottom: 2, // Lekko obniżona pozycja strzałki
    justifyContent: 'center',
        alignItems: 'center',
  },
});

export default OnboardingComponent;
