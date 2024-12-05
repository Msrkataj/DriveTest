import React from 'react';
import { View, StatusBar } from 'react-native';
import OnboardingComponent from './OnboardingComponent';  // Twój komponent onboardingowy
import { globalStyles } from '../styles/globalStyles';  // Importowanie globalnych stylów

const Home = () => {
  return (
    <View style={globalStyles.container}>
      <StatusBar barStyle="dark-content" />
      <OnboardingComponent />
    </View>
  );
};

export default Home;
