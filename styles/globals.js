import { StyleSheet } from 'react-native';
import { fonts, colors } from './variables';

export const globalStyles = StyleSheet.create({
  body: {
    fontSize: 14,
    color: colors.black,
    overflowX: 'hidden', // React Native nie ma "overflow-x/y", ale można używać flex i scroll
    overflowY: 'auto',
    fontFamily: fonts.regular,
    fontStyle: 'normal',
  },
  main: {
    minHeight: '65vh', // Użyj flex na elementach nadrzędnych, aby zdefiniować wysokość w React Native
  },
  h1: {
    fontSize: 24,
    fontFamily: fonts.bold,
  },
  link: {
    textDecorationLine: 'none',
    cursor: 'pointer',
  },
  noScroll: {
    overflow: 'hidden',
  },
});
