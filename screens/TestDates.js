import React, {useEffect, useState} from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert, BackHandler,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/FontAwesome';
import { Calendar } from 'react-native-calendars';

const testTimes = ['7:00-9:00 (AM)', '9:00-12:00 (AM)', '12:00-4:30 (PM)', '4:30 and above (PM)'];

const TestDates = () => {
    const [selectedTimes, setSelectedTimes] = useState({});
    const [selectedDay, setSelectedDay] = useState(null);
    const navigation = useNavigation();

    // Ustaw dzisiejszą datę jako minimalną do wyboru
    const today = new Date().toISOString().split('T')[0];

    const handleDaySelect = (day) => {
        setSelectedDay(day.dateString);
    };
    useEffect(() => {
        const onBackPress = () => {
            navigation.replace('TestCentres'); // Zawsze przekierowuj do ekranu docelowego
            return true; // Zatrzymuje domyślne działanie przycisku "wstecz"
        };

        BackHandler.addEventListener('hardwareBackPress', onBackPress);

        // Sprzątanie: usuń listener przy odmontowaniu komponentu
        return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [navigation]);
    const handleTimeSelect = (time) => {
        setSelectedTimes((prev) => ({
            ...prev,
            [selectedDay]: prev[selectedDay] && prev[selectedDay].includes(time)
                ? prev[selectedDay].filter((selectedTime) => selectedTime !== time)
                : [...(prev[selectedDay] || []), time],
        }));
    };

    const handleSaveAvailability = async () => {
        const serverUrl = 'https://drive-test-3bee5c1b0f36.herokuapp.com';

        try {
            const userData = await AsyncStorage.getItem('userData');

            if (!userData) {
                Alert.alert('Error', 'User data not found in storage');
                return;
            }

            const parsedUserData = JSON.parse(userData);
            const { licenseNumber } = parsedUserData;

            // Przekształcenie formatu dat
            const transformedAvailability = Object.entries(selectedTimes).reduce((acc, [date, times]) => {
                // Konwersja formatu YYYY-MM-DD na DD/MM/YY
                const [year, month, day] = date.split('-');
                const formattedDate = `${day}/${month}/${year.slice(-2)}`; // DD/MM/YY
                acc[formattedDate] = times;
                return acc;
            }, {});

            // Przesłanie dostępności do serwera
            const response = await fetch(`${serverUrl}/api/updateAvailability`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ licenseNumber, availability: transformedAvailability }),
            });

            if (response.ok) {
                console.log('Availability saved successfully');
                navigation.navigate('EmailNotification');
            } else {
                console.error('Failed to save availability');
                Alert.alert('Error', 'Failed to save availability');
            }
        } catch (error) {
            console.error('Error:', error);
            Alert.alert('Error', 'An error occurred. Please try again.');
        }
    };


    const renderCheckbox = (isSelected) => (
        <View style={styles.checkbox}>
            {isSelected ? (
                <Icon name="check-circle" size={24} color="#0347FF" />
            ) : (
                <Icon name="circle-thin" size={24} color="#bbb" />
            )}
        </View>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Select a Test Date</Text>
            <Calendar
                minDate={today} // Blokuje wybór przeszłych dni
                onDayPress={handleDaySelect}
                markedDates={{
                    [selectedDay]: { selected: true, marked: true, selectedColor: '#0347FF' },
                    ...Object.keys(selectedTimes).reduce((acc, date) => {
                        acc[date] = { selected: true, marked: true, selectedColor: '#0347FF' };
                        return acc;
                    }, {}),
                }}
                theme={{
                    selectedDayBackgroundColor: '#0347FF',
                    todayTextColor: '#0347FF',
                }}
            />
            {selectedDay && (
                <>
                    <Text style={styles.subtitle}>Select Available Times for {selectedDay}</Text>
                    <ScrollView style={styles.timesList}>
                        {testTimes.map((time, idx) => (
                            <TouchableOpacity
                                key={idx}
                                style={[
                                    styles.timeItem,
                                    selectedTimes[selectedDay] && selectedTimes[selectedDay].includes(time) && styles.selectedTimeItem,
                                ]}
                                onPress={() => handleTimeSelect(time)}
                            >
                                <View style={styles.checkboxContainer}>
                                    {renderCheckbox(selectedTimes[selectedDay] && selectedTimes[selectedDay].includes(time))}
                                    <Text style={styles.timeText}>{time}</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </>
            )}
            <View style={styles.footer}>
                <View style={styles.continueButtonContainer}>
                    <TouchableOpacity
                        style={styles.continueButton}
                        onPress={handleSaveAvailability}
                        disabled={Object.keys(selectedTimes).length === 0}
                    >
                        <Text style={styles.buttonText}>Save Availability</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#000',
    },
    subtitle: {
        fontSize: 16,
        color: '#7d7d7d',
        marginVertical: 20,
    },
    timesList: {
        flex: 1,
    },
    timeItem: {
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    selectedTimeItem: {
        backgroundColor: 'rgba(3, 71, 255, 0.2)',
    },
    timeText: {
        fontSize: 16,
        color: '#7d7d7d',
    },
    checkbox: {
        marginRight: 10,
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    footer: {
        paddingVertical: 20,
        alignItems: 'center',
    },
    continueButtonContainer: {
        alignItems: 'center',
    },
    continueButton: {
        alignItems: 'center',
        width: '100%',
        backgroundColor: '#0347FF',
        borderRadius: 30,
        padding: 15,
        opacity: 1,
    },
    buttonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },
});

export default TestDates;
