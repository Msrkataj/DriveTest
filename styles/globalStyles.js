import { StyleSheet } from 'react-native';
import { colors, fonts } from './variables';  // Zmienne globalne

export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  text: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.black,
  },
  title: {
    fontSize: 24,
    fontFamily: fonts.bold,
    color: colors.black,
  },
  button: {
    backgroundColor: colors.main,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.white,
  },
});
