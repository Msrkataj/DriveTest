import React, { useState, useEffect } from 'react';
import {View, Text, TextInput, TouchableOpacity, Image, StyleSheet, ActivityIndicator, Alert} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, fonts } from '../styles/variables';
import { globalStyles } from '../styles/globalStyles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const LoginPanel = () => {
    const [licenseNumber, setLicenseNumber] = useState('');
    const [applicationRef, setApplicationRef] = useState('');
    const [errors, setErrors] = useState({});
    const navigation = useNavigation();
    const [loading, setLoading] = useState(false);
    const [licenseInput, setLicenseInput] = useState('');

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

    const validateApplicationRef = (ref) => {
        const regex = /^\d{8}$/;
        return regex.test(ref);
    };
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setLicenseNumber(licenseInput.toUpperCase());
        }, 300); // Opóźnienie 300 ms

        return () => clearTimeout(timeoutId); // Czyszczenie timeouta
    }, [licenseInput]);

    const handleFindTest = async () => {
        const validationErrors = {};

        const licenseValidationError = validateLicenseNumber(licenseNumber);
        if (licenseValidationError) {
            validationErrors.licenseNumber = licenseValidationError;
        }

        if (!applicationRef) {
            validationErrors.applicationRef = 'Application ref. / Theory test no. is required.';
        } else if (!validateApplicationRef(applicationRef)) {
            validationErrors.applicationRef = 'Application ref. / Theory test no. must be 8 digits.';
        }

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setLoading(true);
        const serverUrl = 'https://drive-test-3bee5c1b0f36.herokuapp.com';

        try {
            const response = await fetch(`${serverUrl}/api/getUser`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ licenseNumber, applicationRef }),
            });

            if (!response.ok) {
                console.error(`Server Error: ${response.status}`);
                const errorData = await response.text();
                console.error('Error details:', errorData);

                if (response.status === 404) {
                    Alert.alert('Error', 'Account not found. Please check your details.');
                } else {
                    Alert.alert('Error', 'Unexpected server error occurred.');
                }
                setLoading(false);
                return;
            }

            const data = await response.json();
            console.log('User data received:', data);

            await AsyncStorage.setItem('userData', JSON.stringify(data));

            const user = data;

            if (!user.isPremium) {
                navigation.navigate('OfferSelection');
            } else if (!user.selectedCentres || user.selectedCentres.length === 0) {
                navigation.navigate('TestCentres');
            } else if (!user.availability || Object.keys(user.availability).length === 0) {
                navigation.navigate('TestDates');
            } else {
                navigation.navigate('HomeModule');
            }
        } catch (error) {
            console.error('Network error:', error);
            Alert.alert('Error', 'Failed to fetch data. Please check your connection and try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.loginImage}>
                <Image
                    source={require('../assets/driving-rafiki.png')}
                    style={{ width: '100%', height: '100%' }}
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
                    <ActivityIndicator size="large" color={colors.main} style={styles.loader} />
                )}
            </View>
            <View style={styles.loginButtonContainer}>
                <TouchableOpacity style={styles.loginButton} onPress={handleFindTest}>
                    <Text style={styles.buttonText}>Find me a test</Text>
                    <View style={styles.dragHandle}>
                        <Text style={styles.arrow}>&rarr;</Text>
                    </View>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
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
});

export default LoginPanel;
