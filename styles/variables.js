import { Dimensions } from 'react-native';

// Zmienne kolorów
export const colors = {
  main: '#0347FF',
  main2: 'rgba(3, 71, 255, 0.32)',
  main3: 'grey',
  black: '#000000',
  black2: 'rgba(112, 112, 112, 0.2)',
  white: '#FFFFFF',
};

// Zmienne czcionek - Upewnij się, że Montserrat został poprawnie zainstalowany
export const fonts = {
  regular: 'Montserrat-Regular',
  bold: 'Montserrat-Bold',
  italic: 'Montserrat-Italic',
};

// Ustalanie wymiarów ekranu
const { width, height } = Dimensions.get('window');

// Zmienne do tworzenia responsywnych layoutów
export const layout = {
  isTablet: width >= 768,
  isMobile: width < 768,
  screenWidth: width,
  screenHeight: height,
};

// Styl globalny oparty na szerokości ekranu
export const globalStyles = {
  container: {
    paddingHorizontal: width > 1024 ? 50 : 20,
  },
  text: {
    fontSize: width > 768 ? 18 : 14,
    color: colors.black,
  },
};
