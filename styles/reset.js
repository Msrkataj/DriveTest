import { StyleSheet } from 'react-native';

export const resetStyles = StyleSheet.create({
  base: {
    margin: 0,
    padding: 0,
    borderWidth: 0,
    fontSize: 16,
    fontWeight: 'normal',
    verticalAlign: 'baseline',
    boxSizing: 'border-box',
  },
  container: {
    flex: 1,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  list: {
    listStyleType: 'none',
  },
  table: {
    borderWidth: 0,
    borderCollapse: 'collapse',
  },
});
}