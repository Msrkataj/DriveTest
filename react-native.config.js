module.exports = {
  assets: ['./assets/fonts'],
   dependencies: {
      'react-native-iap': {
        platforms: {
          android: {
            sourceDir: './node_modules/react-native-iap/android/play',
          },
        },
      },
    },
};
