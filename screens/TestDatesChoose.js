import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/FontAwesome';
import { Calendar } from 'react-native-calendars';

const availableTimes = ['7:00-9:00 (AM)', '9:00-12:00 (AM)', '12:00-4:30 (PM)', '4:30 and above (PM)'];

const TestDates = () => {
    const [selectedDays, setSelectedDays] = useState({});
    const [currentDay, setCurrentDay] = useState(null); // Obecnie wybrany dzień
    const navigation = useNavigation();
    const today = new Date().toISOString().split('T')[0];

    const formatDate = (dateString) => {
        if (!dateString) return ''; // Jeśli brak daty, zwracamy pusty string
        const date = new Date(dateString);
        if (isNaN(date)) return ''; // Jeśli data jest niepoprawna, zwracamy pusty string
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = String(date.getFullYear()).slice(-2);
        return `${day}/${month}/${year}`;
    };


    useEffect(() => {
        const fetchAvailability = async () => {
            try {
                const userData = await AsyncStorage.getItem('userData');
                if (!userData) {
                    Alert.alert('Error', 'User data not found in storage');
                    return;
                }

                const { licenseNumber } = JSON.parse(userData);

                const response = await fetch('https://drive-test-3bee5c1b0f36.herokuapp.com/api/getUser', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ licenseNumber }),
                });

                if (response.ok) {
                    const user = await response.json();
                    const userAvailability = user.availability || {};

                    // Konwersja dat na format ISO dla kalendarza
                    const formattedAvailability = Object.entries(userAvailability).reduce((acc, [date, times]) => {
                        const isoDate = convertToISO(date); // Konwersja daty na format ISO
                        acc[isoDate] = times;
                        return acc;
                    }, {});

                    console.log('User availability fetched:', formattedAvailability);
                    setSelectedDays(formattedAvailability);
                } else {
                    console.error('Failed to fetch user availability');
                }
            } catch (error) {
                console.error('Error fetching user availability:', error);
                Alert.alert('Error', 'Failed to fetch availability');
            }
        };

        fetchAvailability();
    }, []);


    const toggleDaySelection = (day) => {
        if (!day?.dateString) return; // Upewniamy się, że `day.dateString` jest dostępny
        const selectedDate = day.dateString; // Zachowujemy format ISO dla kalendarza

        setSelectedDays((prev) => {
            // Jeśli dzień już istnieje, usuwamy go
            if (prev[selectedDate]) {
                const updatedDays = { ...prev };
                delete updatedDays[selectedDate];
                return updatedDays;
            }

            return {
                ...prev,
                [selectedDate]: [], // Inicjalizujemy pustą tablicę dla godzin
            };
        });

        setCurrentDay(selectedDate); // Ustawienie bieżącego dnia
    };

    const handleTimeSelect = (time) => {
        if (!currentDay) return;
        setSelectedDays((prev) => ({
            ...prev,
            [currentDay]: prev[currentDay] && prev[currentDay].includes(time)
                ? prev[currentDay].filter(selectedTime => selectedTime !== time)
                : [...(prev[currentDay] || []), time],
        }));
    };
    const convertToISO = (dateString) => {
        const [day, month, year] = dateString.split('/');
        return `20${year}-${month}-${day}`; // Przyjmujemy, że `rr` oznacza lata w XXI wieku
    };


    const handleSaveAvailability = async () => {
        try {
            const userData = await AsyncStorage.getItem('userData');
            if (!userData) {
                Alert.alert('Error', 'User data not found in storage');
                return;
            }

            const { licenseNumber } = JSON.parse(userData);

            // Filtruj tylko te dni, które mają wybrane godziny
            const filteredDays = Object.entries(selectedDays).reduce((acc, [date, times]) => {
                if (times.length > 0) { // Ignoruj dni bez wybranych godzin
                    const formattedDate = formatDate(date);
                    acc[formattedDate] = times;
                }
                return acc;
            }, {});

            const response = await fetch('https://drive-test-3bee5c1b0f36.herokuapp.com/api/updateUserAvailability', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ licenseNumber, availability: filteredDays }),
            });

            if (response.ok) {
                console.log('Availability saved successfully');
                navigation.navigate('HomeModule');
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

    const getMarkedDates = () => {
        const markedDates = {};

        // Zaznacz dni z wybranymi godzinami
        Object.keys(selectedDays).forEach((day) => {
            if (selectedDays[day].length > 0) {
                markedDates[day] = { selected: true, marked: true, selectedColor: '#0347FF' }; // Mocny niebieski
            }
        });

        // Zaznacz bieżący dzień
        if (currentDay) {
            markedDates[currentDay] = {
                ...markedDates[currentDay], // Zachowaj istniejące style
                selected: true,
                selectedColor: '#ADD8E6', // Jasny niebieski
            };
        }

        return markedDates;
    };



    return (
        <View style={styles.container}>
            <Text style={styles.title}>Select Dates and Times</Text>
            <Calendar
                minDate={today}
                onDayPress={toggleDaySelection}
                markedDates={getMarkedDates()} // Aktualizacja oznaczeń dni
            />

            {currentDay && (
                <ScrollView style={styles.datesList}>
                    <Text style={styles.dayText}>
                        {currentDay ? formatDate(currentDay) : 'Select a date'} {/* Wyświetlamy wybrany dzień lub domyślny tekst */}
                    </Text>
                    <View style={styles.timesList}>
                        {availableTimes.map((time, idx) => (
                            <TouchableOpacity
                                key={idx}
                                style={[
                                    styles.timeItem,
                                    selectedDays[currentDay]?.includes(time) && styles.selectedTimeItem,
                                ]}
                                onPress={() => handleTimeSelect(time)}
                            >
                                <View style={styles.checkboxContainer}>
                                    {renderCheckbox(selectedDays[currentDay]?.includes(time))}
                                    <Text style={styles.timeText}>{time}</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>
            )}

            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.continueButton}
                    onPress={handleSaveAvailability}
                >
                    <Text style={styles.buttonText}>Save Availability</Text>
                </TouchableOpacity>
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
        color: '#000',
        textAlign: 'center',
        marginBottom: 20,
    },
    datesList: {
        flex: 1,
    },
    dayText: {
        fontSize: 18,
        fontWeight: '600',
        color: 'black',
        marginVertical: 10,
    },
    timesList: {
        paddingLeft: 20,
    },
    timeItem: {
        paddingVertical: 10,
    },
    selectedTimeItem: {
        backgroundColor: 'rgba(3, 71, 255, 0.2)',
    },
    timeText: {
        fontSize: 14,
        color: '#7d7d7d',
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    footer: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    continueButton: {
        backgroundColor: '#0347FF',
        borderRadius: 25,
        paddingVertical: 10,
        paddingHorizontal: 40,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default TestDates;
