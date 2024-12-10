import messaging from '@react-native-firebase/messaging';
import {AppRegistry} from 'react-native';
import App from './App'; // upewnij się, że ścieżka jest poprawna
import {name as appName} from './app.json'; // Importuj nazwę aplikacji jako `appName`

// Obsługa wiadomości w tle
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    console.log('Message handled in the background:', remoteMessage);
});

console.log("App Name:", appName); // Logowanie nazwy aplikacji dla diagnostyki

// Rejestracja głównego komponentu aplikacji
AppRegistry.registerComponent(appName, () => App);
