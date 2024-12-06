import React, {useState, useEffect, useRef} from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Image,
    StyleSheet,
    Alert,
    Platform, ActivityIndicator,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {colors, fonts} from '../styles/variables';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Progress from 'react-native-progress'; // Importuj progress bar


const LoginComponent = () => {
    const [licenseNumber, setLicenseNumber] = useState('');
    const [applicationRef, setApplicationRef] = useState('');
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [statusMessage, setStatusMessage] = useState('');
    const navigation = useNavigation();
    const pollingInterval = useRef(null);
    const loadingTimeout = useRef(null);
    const [licenseInput, setLicenseInput] = useState('');

    const messages = [
        'Preparing to validate data...',
        'Checking driving license details...',
        'Connecting to secure servers...',
        'Validating your application...',
        'Fetching available tests...',
        'Communicating with DVSA servers...',
        'Synchronizing with the database...',
        'Processing your request, please wait...',
        'Ensuring data integrity...',
        'Loading your application details...',
        'Validating test center availability...',
        'Retrieving your booking details...',
        'Cross-checking information...',
        'Establishing secure connection...',
        'Finalizing the process...',
        'Almost there, hang tight...',
        'Calculating test availability...',
        'Verifying submitted data...',
        'Connecting to remote systems...',
        'Final validation in progress...',
        'Optimizing test center match...',
        'Loading test schedules...',
        'Updating your application status...',
        'Request successfully submitted...',
    ];


    // Walidacja numeru prawa jazdy
    const validateLicenseNumber = (number) => {
        if (number.length !== 16) {
            return 'Driving license number must be 16 characters long.';
        }

        const surnamePart = number.slice(0, 5).replace(/9/g, '');
        const isMacSurname = surnamePart.startsWith('MAC');
        const formattedSurnamePart = isMacSurname ? 'MC' + surnamePart.slice(3) : surnamePart;

        if (!/^[A-Z9]+$/.test(formattedSurnamePart)) {
            return 'First five characters must contain valid surname initials or be padded with 9s.';
        }

        return '';
    };
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setLicenseNumber(licenseInput.toUpperCase());
        }, 300); // Opóźnienie 300 ms

        return () => clearTimeout(timeoutId); // Czyszczenie poprzedniego timeouta
    }, [licenseInput]);

    const validateApplicationRef = (ref) => {
        const regex = /^\d{8}$/;
        return regex.test(ref);
    };
    const handleFindTest = async () => {
        // Walidacja danych wejściowych
        const validationErrors = {};
        if (!licenseNumber || validateLicenseNumber(licenseNumber)) {
            validationErrors.licenseNumber = validateLicenseNumber(licenseNumber);
        }
        if (!applicationRef || !validateApplicationRef(applicationRef)) {
            validationErrors.applicationRef = 'Application ref. must be 8 digits.';
        }
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setLoading(true);
        setStatusMessage(messages[0]);
        simulateLoading();
        console.log(AsyncStorage);
        const serverUrl = 'https://drive-test-3bee5c1b0f36.herokuapp.com';
        try {
            const userData = await AsyncStorage.getItem('userData');
            console.log('Odczytano userData:', userData);

            // Sprawdź, czy dane istnieją i sparsuj je do obiektu
            let parsedUserData = {};
            if (userData) {
                try {
                    parsedUserData = JSON.parse(userData);
                } catch (error) {
                    console.warn('Błąd parsowania userData, reset do pustego obiektu:', error);
                    parsedUserData = {}; // Resetujemy do pustego obiektu w przypadku błędu parsowania
                }
            }

            // Zaktualizuj dane użytkownika
            parsedUserData.licenseNumber = licenseNumber;
            parsedUserData.applicationRef = applicationRef;

            // Zapisz zaktualizowane dane z powrotem do AsyncStorage
            await AsyncStorage.setItem('userData', JSON.stringify(parsedUserData));
            console.log('Zaktualizowano userData:', parsedUserData);

            // Wyślij dane do serwera
            const response = await fetch(`${serverUrl}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(parsedUserData),
            });

            if (!response.ok) {
                Alert.alert('Error', 'Server is currently unavailable. Please try again later.');
                setLoading(false);
                return;
            }

            const responseData = await response.json();
            const { success, taskId } = responseData;

            if (success) {
                monitorTaskStatus(taskId, parsedUserData);
            } else {
                Alert.alert('Error', 'Failed to process your request. Try again.');
                setLoading(false);
            }
        } catch (error) {
            console.error('Error during login:', error);
            Alert.alert('Error', 'Unexpected error occurred. Please try again.');
            setLoading(false);
        }
    };

    const simulateLoading = () => {
        let stageIndex = 0;
        setProgress(0);

        const updateLoading = () => {
            setProgress((prev) => Math.min(prev + 0.25, 1)); // Zwiększ postęp o 25%
            setStatusMessage(messages[stageIndex]); // Wyświetlaj odpowiedni komunikat statusu
            stageIndex = (stageIndex + 1) % messages.length;

            if (stageIndex < messages.length && progress < 1) {
                loadingTimeout.current = setTimeout(updateLoading, 15000); // Odświeżanie co 15 sekundy
            } else {
                clearTimeout(loadingTimeout.current);
            }
        };

        updateLoading();
    };


    const monitorTaskStatus = async (taskId, parsedUserData) => {
        let attempts = 0;
        const maxAttempts = 48; // Maksymalnie 48 prób (co 5 sekund daje około 4 minuty)
        const serverUrl = 'https://drive-test-3bee5c1b0f36.herokuapp.com';

        const checkStatus = async () => {
            attempts += 1;

            try {
                const statusResponse = await fetch(`${serverUrl}/task-status/${taskId}`);
                const { status, error } = await statusResponse.json();

                if (status === 'completed') {
                    console.log('Task completed. Fetching user data from the server...');

                    // Pobierz dane użytkownika
                    const userResponse = await fetch(`${serverUrl}/api/getUser`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ licenseNumber: parsedUserData.licenseNumber }),
                    });

                    if (userResponse.status === 404) {
                        console.log('User not found. Creating user...');
                        await sendUserDataToServer(parsedUserData);
                    } else if (!userResponse.ok) {
                        Alert.alert('Error', 'Failed to fetch user data.');
                        setLoading(false);
                        return;
                    }

                    const userData = await userResponse.json();

                    // Nawiguj w zależności od statusu użytkownika
                    if (userData.isPremium) {
                        console.log('User is premium. Navigating to Home...');
                        navigation.navigate('Home');
                    } else {
                        console.log('User is not premium. Navigating to OfferSelection...');
                        navigation.navigate('OfferSelection');
                    }

                    setLoading(false);
                } else if (status === 'failed') {
                    Alert.alert('Error', error || 'Login failed. Please try again.');
                    setLoading(false);
                } else if (attempts >= maxAttempts) {
                    Alert.alert('Error', 'Request timed out. Please try again later.');
                    setLoading(false);
                } else {
                    setTimeout(checkStatus, 5000); // Sprawdź ponownie za 5 sekund
                }
            } catch (error) {
                console.error('Error during task status check:', error);
                Alert.alert('Error', 'Unexpected error occurred while checking task status. Please try again.');
                setLoading(false);
            }
        };

        checkStatus();
    };



    const sendUserDataToServer = async (userData) => {
        try {
            const serverUrl = 'https://drive-test-3bee5c1b0f36.herokuapp.com';

            const response = await fetch(`${serverUrl}/api/updateUserWithDetails`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(userData),
            });

            if (!response.ok) {
                const responseData = await response.json();
                Alert.alert('Error', responseData.message || 'Failed to update user data on the server.');
            } else {
                console.log('User data successfully updated on the server.');
            }
        } catch (error) {
            console.error('Error during data upload:', error);
            Alert.alert('Error', 'An error occurred while updating user data. Please try again.');
        }
    };


    useEffect(() => {
        return () => {
            clearInterval(pollingInterval.current);
            clearTimeout(loadingTimeout.current);
        };
    }, []);


    return (
        <View style={styles.container}>
            <View style={styles.loginImage}>
                <Image
                    source={require('../assets/driving-rafiki.png')}
                    style={{width: '100%', height: '100%'}}
                    resizeMode="contain"
                />
            </View>
            <View style={styles.loginMain}>
                <Text style={styles.loginLabel}>Driving license number</Text>
                <TextInput
                    style={styles.loginInput}
                    placeholder="Type here..."
                    value={licenseInput}
                    onChangeText={(text) => setLicenseInput(text.replace(/[^A-Za-z0-9]/g, ''))}
                />
                {errors.licenseNumber && (
                    <Text style={styles.errorMessage}>{errors.licenseNumber}</Text>
                )}

                <Text style={styles.loginLabel}>Application ref. / Theory test no.</Text>
                <TextInput
                    style={styles.loginInput}
                    placeholder="Type here..."
                    value={applicationRef}
                    onChangeText={(text) => setApplicationRef(text)}
                />
                {errors.applicationRef && (
                    <Text style={styles.errorMessage}>{errors.applicationRef}</Text>
                )}

                {errors.general && (
                    <Text style={styles.errorMessage}>{errors.general}</Text>
                )}

                {loading && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={colors.main} />
                        <Text style={styles.statusMessage}>{statusMessage}</Text>
                        <Progress.Bar // Dodanie paska postępu
                            progress={progress} // Procent ukończenia
                            width={200} // Szerokość paska
                            color={colors.main} // Kolor paska
                        />
                    </View>
                )}

            </View>
            {!loading && (
                <View style={styles.loginButtonContainer}>
                    <TouchableOpacity style={styles.loginButton} onPress={handleFindTest}>
                        <Text style={styles.buttonText}>Find me a test</Text>
                        <View style={styles.dragHandle}>
                            <Text style={styles.arrow}>&rarr;</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    // ... Twoje style
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        backgroundColor: '#fff',
    },
    loginImage: {
        width: '100%',
        height: 300,
        marginBottom: 30,
    },
    loginMain: {
        width: '100%',
        alignItems: 'center',
        gap: 15,
    },
    loginLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.black,
        alignSelf: 'flex-start',
        textAlign: 'center',
    },
    loginInput: {
        width: '100%',
        maxWidth: 300,
        padding: 12,
        borderColor: colors.black2,
        borderWidth: 1,
        borderRadius: 8,
        marginBottom: 20,
        alignItems: 'center',
        color: 'black',
    },
    loginButtonContainer: {
        width: '100%',
        alignItems: 'center',
        marginTop: 50,
    },
    loginButton: {
        backgroundColor: colors.main,
        width: 280,
        height: 60,
        borderRadius: 30,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
    },
    buttonText: {
        fontWeight: '600',
        color: colors.white,
        flexGrow: 1,
        textAlign: 'left',
        marginLeft: 10,
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
        elevation: 5,
    },
    arrow: {
        fontSize: 24,
        color: colors.main,
        textAlign: 'center',
    },
    errorMessage: {
        color: 'red',
        fontSize: 14,
        marginTop: 5,
        textAlign: 'center',
    },
    loadingContainer: {
        marginTop: 20,
        alignItems: 'center',
    },
    progressBar: {
        width: 200,
        height: 10,
    },
    statusMessage: {
        marginTop: 10,
        fontSize: 16,
        color: colors.main,
        textAlign: 'center',
    },
});

export default LoginComponent;
