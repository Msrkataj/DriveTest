import { StyleSheet } from 'react-native';
import { colors } from './variables';  // Import zmiennych kolorów

export const styles = StyleSheet.create({
  loginImage: {
    width: '100%',
    height: 300,
    marginBottom: 30,
  },
  loginMain: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 15,
  },
  loginLabel: {
    fontSize: 14,
    fontWeight: '600',
    alignSelf: 'flex-start',
  },
  loginInput: {
    width: '100%',
    maxWidth: 300,
    padding: 12,
    borderColor: colors.black2,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorMessage: {
    color: 'red',
    fontSize: 12,
  },
  loginButtonContainer: {
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    marginTop: 100,
  },
  loginButton: {
    backgroundColor: colors.main,
    width: 280,
    height: 60,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  buttonText: {
    fontWeight: '600',
    color: colors.white,
  },
  dragHandle: {
    position: 'absolute',
    right: -15,
    width: 60,
    height: 60,
    backgroundColor: colors.white,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
  },
  arrow: {
    fontSize: 16,
    color: colors.main,
  },
});
