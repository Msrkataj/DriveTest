import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { colors } from '../styles/variables';

const InfoScreen = () => {
    const [selectedTestType, setSelectedTestType] = useState(null);
    const [selectedSubTest, setSelectedSubTest] = useState('');
    const [loading, setLoading] = useState(true); // Dodanie stanu ładowania

    const navigation = useNavigation();

    useEffect(() => {
        const fetchTestType = async () => {
            try {
                const userData = await AsyncStorage.getItem('userData');
                if (userData) {
                    const parsedData = JSON.parse(userData);
                    console.log('Data in AsyncStorage:', parsedData); // Logowanie danych dla debugowania
                    setSelectedTestType(parsedData.selectedTestId || null);
                    setSelectedSubTest(parsedData.selectedSubTest || '');
                } else {
                    Alert.alert("Error", "User data not found in storage");
                }
            } catch (error) {
                console.error("Error fetching test type from AsyncStorage:", error);
            } finally {
                setLoading(false); // Wyłącz ładowanie po zakończeniu
            }
        };
        fetchTestType();
    }, []);

    const handleContinue = () => {
        const offRoadValues = ['C1M', 'C1+EM', 'CM', 'C+EM', 'D1M', 'D1+EM', 'DM', 'D+EM'];

        if (selectedTestType === 2 || selectedTestType === 3 || selectedTestType === 4) {
            if (offRoadValues.includes(selectedSubTest)) {
                navigation.navigate('VehicleInformation');
            } else {
                navigation.navigate('LicenseDetails');
            }
        } else {
            navigation.navigate('LicenseDetails');
        }
    };

    const renderInfoText = () => {
        if (loading) {
            return <Text>Loading...</Text>; // Wyświetlanie komunikatu ładowania
        }

        switch (selectedTestType) {
            case 2: // Motorcycles
                return (
                    <>
                        <Text style={styles.title}>Vehicle information - A1 light bike mod 1 test</Text>
                        <View style={styles.infoContainer}>
                            <Text style={styles.infoTitle}>
                                <Icon name="exclamation-circle" size={24} color="#1f73b7" />
                                <Text style={styles.infoTitle}> Additional information for motorcycle tests</Text>
                            </Text>
                            <Text style={styles.infoText}>
                                • You may book both modules at the same time but you must pass your module 1 test before you can take the module 2 test{'\n'}
                                • Both modules must be passed before the theory test expires (except for progressive access tests){'\n'}
                                • You must take your module 1 test certificate to the test centre when you attend your module 2 test{'\n'}
                                {'\n'}
                                Further rules for progressive access tests:{'\n'}
                                • No theory test is required{'\n'}
                                • Module 2 must be passed within 6 months of passing module 1
                            </Text>
                        </View>
                    </>
                );
            case 3: // Lorries
                return (
                    <>
                        <Text style={styles.title}>Vehicle information - Medium and Large Lorry Test</Text>
                        <View style={styles.infoContainer}>
                            <Text style={styles.infoTitle}>
                                <Icon name="exclamation-circle" size={24} color="#1f73b7" />
                                <Text style={styles.infoTitle}> Additional information for lorry tests</Text>
                            </Text>
                            <Text style={styles.infoText}>
                                • Ensure your vehicle meets the required specifications before arriving at the test center{'\n'}
                                • You must have a valid certificate for the lorry's maintenance and safety checks{'\n'}
                                • A fully loaded lorry may be required for the off-road portion of the test{'\n'}
                                {'\n'}
                                Specific guidelines for articulated lorry tests:{'\n'}
                                • Make sure both lorry and trailer are in proper working condition{'\n'}
                                • Ensure the coupling and uncoupling procedures are practiced thoroughly
                            </Text>
                        </View>
                    </>
                );
            case 4: // Buses and coaches
                return (
                    <>
                        <Text style={styles.title}>Vehicle information - Bus and Coach Test</Text>
                        <View style={styles.infoContainer}>
                            <Text style={styles.infoTitle}>
                                <Icon name="exclamation-circle" size={24} color="#1f73b7" />
                                <Text style={styles.infoTitle}>Additional information for bus and coach tests</Text>
                            </Text>
                            <Text style={styles.infoText}>
                                • Buses must have proper signage and seating arrangements as required by law{'\n'}
                                • Emergency exits should be clearly marked and functional{'\n'}
                                • Familiarize yourself with passenger safety protocols, including assisting passengers in wheelchairs{'\n'}
                                {'\n'}
                                Specific requirements for full-size buses:{'\n'}
                                • Ensure the bus has functional stop buttons and door mechanisms{'\n'}
                                • Be prepared for off-road and on-road test portions that simulate real passenger transport scenarios
                            </Text>
                        </View>
                    </>
                );
            default:
                return <Text style={styles.infoText}>No information available for the selected test type.</Text>;
        }
    };

    return (
        <View style={styles.container}>
            {renderInfoText()}
            <TouchableOpacity style={[styles.button, styles.buttonActive]} onPress={handleContinue}>
                <Text style={styles.buttonTextActive}>Continue</Text>
                <View style={styles.dragHandle}>
                    <Text style={styles.arrow}>&rarr;</Text>
                </View>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9f9f9',
        paddingHorizontal: 20,
        paddingTop: 40,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.black,
        marginBottom: 20,
    },
    infoContainer: {
        backgroundColor: '#eef4fb',
        borderRadius: 8,
        padding: 15,
        marginBottom: 40,
    },
    infoTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1f73b7',
        marginBottom: 10,
    },
    infoText: {
        fontSize: 14,
        color: '#333',
        lineHeight: 20,
    },
    continueContainer: {
        marginTop: 'auto',
        alignItems: 'center',
        paddingBottom: 50,
    },
    button: {
        position: 'relative',
        width: 300,
        height: 50,
        backgroundColor: colors.white,
        borderRadius: 30,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
    },
    buttonActive: {
        backgroundColor: colors.main,
    },
    buttonDisabled: {
        backgroundColor: 'rgba(3, 71, 255, 0.1)',
    },
    buttonTextActive: {
        color: colors.white,
        fontWeight: '600',
    },
    buttonTextDisabled: {
        color: 'rgba(3, 71, 255, 0.4)',
        fontWeight: '600',
    },
    dragHandle: {
        position: 'relative',
        zIndex: 2,
        width: 40,
        height: 40,
        backgroundColor: colors.white,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 8,
        elevation: 2,
    },
    dragHandleDisabled: {
        backgroundColor: 'rgba(255,255,255,0.5)',
    },
    arrow: {
        fontSize: 16,
        color: colors.main,
    },
    arrowDisabled: {
        fontSize: 16,
        color: 'rgba(3, 71, 255, 0.4)',
    },
});

export default InfoScreen;
