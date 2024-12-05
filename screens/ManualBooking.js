import React, {useContext, useEffect, useRef, useState} from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
    FlatList,
    Alert,
    Modal,
} from 'react-native';
import {DateAvailabilityContext} from './DateAvailabilityContext';
import {useFocusEffect} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useNavigation} from '@react-navigation/native'; // Import nawigacji
import {ScrollView} from 'react-native';
import Icon from "react-native-vector-icons/FontAwesome";

const ManualBooking = () => {
    const {
        dateStatuses,
        fetchDateAvailability,
        canFetchDateAvailability,
    } = useContext(DateAvailabilityContext);
    const [modalVisible, setModalVisible] = useState(false);
    const [userData, setUserData] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedDates, setSelectedDates] = useState([]);
    const [selectedCentres, setSelectedCentres] = useState([]);
    const [availabilityNotifications, setAvailabilityNotifications] = useState([]);
    const navigation = useNavigation();
    const serverUrl = 'https://drive-test-3bee5c1b0f36.herokuapp.com';


    useEffect(() => {
        const updateNotifications = async () => {
            if (userData && selectedCentres.length > 0) {
                console.log('Updating notifications...');
                await fetchNotifications();
            }
        };
        updateNotifications();
    }, [selectedDates, selectedCentres]);
    const formatDateString = (dateString) => {
        if (!dateString || typeof dateString !== 'string') return 'Invalid date';
        const [day, month, year] = dateString.split('/');
        const date = new Date(`20${year}-${month}-${day}`);
        const options = {weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'};
        return date.toLocaleDateString('en-GB', options); // Format: Friday 21 March 2025
    };

    // Funkcja do normalizacji formatu daty do `dd/mm/rr`
    const normalizeDateFormat = (date) => {
        // Sprawdź, czy `date` jest poprawnym ciągiem znaków
        if (!date || typeof date !== 'string') {
            console.error('Invalid date input:', date);
            return null; // Zwróć `null` dla niepoprawnych danych
        }

        const [day, month, year] = date.split('/');

        // Sprawdź, czy wszystkie części daty istnieją
        if (!day || !month || !year) {
            console.error('Invalid date structure:', date);
            return null; // Zwróć `null` dla niekompletnych dat
        }

        return `${day}/${month}/${year.length === 2 ? year : year.slice(-2)}`;
    };

    const notificationIntervalRef = useRef(null);

    useFocusEffect(
        React.useCallback(() => {
            const fetchData = async () => {
                try {
                    if (!userData) {
                        await fetchUserData(); // Pobierz dane użytkownika tylko raz
                    }

                    if (userData && selectedCentres.length > 0) {
                        console.log('Fetching notifications...');
                        await fetchNotifications(); // Pobierz powiadomienia
                    }
                } catch (error) {
                    console.error('Error during data fetch:', error);
                }
            };

            fetchData();
        }, [userData, selectedCentres])
    );


    const hasFetchedUserData = useRef(false);


    const fetchUserData = async () => {
        if (hasFetchedUserData.current) return; // Jeśli już pobrano dane, zakończ
        hasFetchedUserData.current = true;
        try {
            const storedData = await AsyncStorage.getItem('userData');
            if (!storedData) throw new Error('UserData is not available in local storage');

            const {licenseNumber} = JSON.parse(storedData);
            const response = await fetch(`${serverUrl}/api/getUser`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({licenseNumber}),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch user data.');
            }

            const user = await response.json();
            setUserData(user);

            if (user.selectedCentres && user.availability) {
                setSelectedCentres(user.selectedCentres);
                setSelectedDates(
                    Object.keys(user.availability).map((date) => ({
                        date,
                        timeSlots: user.availability[date],
                    }))
                );
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
            Alert.alert('Error', error.message || 'Failed to fetch user data.');
        }
    };


    const handleRefresh = async () => {
        console.log('handleRefresh called');
        try {
            console.log('Calling fetchDateAvailability with forceExecute...');
            Alert.alert(
                'Dates Updated',
                'Dates are updated, results may appear in a few minutes.',
                [{ text: 'OK' }]
            );
            await fetchDateAvailability(true); // Wymuś wykonanie zapytania
            await fetchNotifications(); // Aktualizuj powiadomienia po odświeżeniu dostępności
        } catch (error) {
            console.error('Error during refresh:', error);
            Alert.alert('Error', 'Failed to refresh availability data.');
        }
    };


    const fetchNotifications = async () => {
        try {
            if (!userData || !userData._id || selectedCentres.length === 0) {
                console.warn('Notifications skipped: Missing userData or selectedCentres');
                return;
            }

            const userId = userData._id;

            // Pobierz powiadomienia z serwera
            const response = await fetch(`${serverUrl}/api/notifications/${userId}`);
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Server error: ${response.status} ${response.statusText} - ${errorText}`);
            }

            const notifications = await response.json();
            if (!Array.isArray(notifications)) {
                throw new Error('Notifications is not an array');
            }

            const notificationMap = {};

            // Mapowanie powiadomień i grupowanie według centrum
            notifications.forEach((notification) => {
                const centerName = notification.selectedCentre?.name;
                const normalizedDate = normalizeToShortDate(notification.selectedDate);

                if (!normalizedDate || !centerName) return;

                const key = `${centerName}`;
                if (notification.text.startsWith("No available dates in the center")) {
                    notificationMap[key] = notification.text; // Przypisz powiadomienie do centrum
                } else if (!notificationMap[`${normalizedDate}-${centerName}`]) {
                    notificationMap[`${normalizedDate}-${centerName}`] = notification.text;
                }
            });

            const matchedNotifications = selectedDates.map((dateObj) => {
                const normalizedDate = normalizeDateFormat(dateObj.date);
                const centerName = selectedCentres.find((centre) => {
                    const key = `${centre.name}`;
                    return notificationMap[key];
                });

                if (centerName) {
                    return {
                        date: normalizedDate,
                        text: notificationMap[centerName.name],
                    };
                }

                return {
                    date: normalizedDate,
                    text: notificationMap[`${normalizedDate}-${centerName?.name}`] || "No notifications",
                };
            });

            setAvailabilityNotifications(matchedNotifications);

            console.log('Updated notifications:', matchedNotifications);
        } catch (error) {
            console.error('Error fetching notifications:', error);
            Alert.alert('Error', error.message || 'Failed to fetch notifications.');
        }
    };

    const normalizeToShortDate = (readableDate) => {
        if (!readableDate || typeof readableDate !== 'string') {
            console.error('Invalid readableDate:', readableDate);
            return null;
        }
        const [weekday, day, month, year] = readableDate.split(' ');
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December',
        ];
        const monthIndex = monthNames.indexOf(month) + 1; // Znajdź indeks miesiąca
        if (!monthIndex) {
            console.error('Invalid dmonth in readableDate:', readableDate);
            return null;
        }
        const formattedDay = day.padStart(2, '0');
        const formattedMonth = monthIndex.toString().padStart(2, '0');
        const shortYear = year.slice(-2);
        return `${formattedDay}/${formattedMonth}/${shortYear}`;
    };


    const renderDateItem = ({item}) => {
        const notification = availabilityNotifications.find(
            (notif) => notif && notif.date === item.date
        );

        const isLoading =
            !notification && (!dateStatuses[item.date] || dateStatuses[item.date]?.status === 'loading');
        const timeSlots = notification ? [notification.text] : item.timeSlots || [];

        return (
            <View style={styles.card}>
                <Text style={styles.centreName}>
                    {selectedCentres.length > 0
                        ? selectedCentres[0]?.name || 'Test Centre'
                        : 'Test Centre'}
                </Text>
                <Text style={styles.NameMini}>Test Centre</Text>

                <Text style={styles.date}>{formatDateString(item.date)}</Text>
                {/*<Text style={styles.NameMini}>Date</Text>*/}

                <Text style={styles.dateFound}>
                    {isLoading ? (
                        <ActivityIndicator size="small" color="#007bff"/>
                    ) : notification ? (
                        notification.text
                    ) : (
                        'Date found: just now'
                    )}
                </Text>

                {dateStatuses[item.date]?.status === 'available' && (
                    <TouchableOpacity
                        style={styles.bookButton}
                        onPress={() => {
                            setSelectedDate(item.date);
                            setModalVisible(true);
                        }}
                    >
                        <Text style={styles.bookButtonText}>Book now</Text>
                    </TouchableOpacity>
                )}
                {dateStatuses[item.date]?.status === 'unavailable' && (
                    <Text style={styles.unavailableText}>No available slots at this centre.</Text>
                )}
                {dateStatuses[item.date]?.status === 'error' && (
                    <Text style={styles.errorText}>
                        Temporary service issue. Availability will be checked in 15 minutes.
                    </Text>
                )}
                    {userData?.isPremium ? ( // Sprawdź, czy użytkownik ma premium
                        <TouchableOpacity
                            style={styles.bookButtonContainer}
                            onPress={() => {
                                setSelectedDate(item.date); // Set the selected date for confirmation
                                setModalVisible(true); // Open the modal
                            }}
                        >
                            <View style={styles.bookButton}>
                                <Text style={styles.bookButtonText}>Book when available</Text>
                            </View>
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.premiumNoticeContainer}>
                            <Text style={styles.premiumNoticeText}>
                                Only premium users can book dates. Upgrade to premium to proceed.
                            </Text>
                        </View>
                    )}
            </View>
        );
    };


    useFocusEffect(
        React.useCallback(() => {
            const fetchData = async () => {
                try {
                    if (!userData) {
                        await fetchUserData(); // Pobierz dane użytkownika tylko raz
                    }

                    // Wywołaj fetchNotifications tylko jeśli dane użytkownika są dostępne
                    if (userData && selectedCentres.length > 0) {
                        await fetchNotifications();
                    }

                    // Nie wywołuj fetchDateAvailability automatycznie
                    console.log('Focus effect completed');
                } catch (error) {
                    console.error('Error during data fetch:', error);
                }
            };

            fetchData();
        }, [userData, selectedCentres])
    );


    return (
        <FlatList
            data={selectedDates}
            keyExtractor={(item, index) => `${item.date}-${index}`}
            renderItem={renderDateItem}
            contentContainerStyle={styles.listContainer}
            ListHeaderComponent={() => (
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.navigate('HomeModule')} style={styles.headerButton}>
                        <Icon name="chevron-left" size={24} color="#0347FF"/>
                    </TouchableOpacity>
                    <View style={styles.headerTitles}>
                        <Text style={styles.headerTitle}>Manual booking</Text>
                        <Text style={styles.headerSubtitle}>Dates for you</Text>
                    </View>
                </View>
            )}
            ListFooterComponent={() => (
                <>
                    <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
                        <Text style={styles.refreshButtonText}>Refresh</Text>
                    </TouchableOpacity>
                    <Modal
                        visible={modalVisible}
                        animationType="slide"
                        transparent={true}
                        onRequestClose={() => setModalVisible(false)}
                    >
                        <View style={styles.modalContainer}>
                            <View style={styles.modalContent}>
                                <Text style={styles.modalText}>
                                    Confirm booking for {formatDateString(selectedDate)}?
                                </Text>
                                <View style={styles.modalButtons}>
                                    <TouchableOpacity onPress={() => setModalVisible(false)}>
                                        <Text style={styles.cancelButton}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => {
                                            setModalVisible(false);
                                            Alert.alert(
                                                'Scheduled booking',
                                                `You you planned: ${formatDateString(selectedDate)} You will be notified when your reservation is successful`,
                                        );
                                        }}
                                    >
                                        <Text style={styles.confirmButton}>Confirm</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </Modal>
                </>
            )}
            ListEmptyComponent={() => (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No available dates to display.</Text>
                </View>
            )}
        />
    );
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9f9f9',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingTop: 40,
        paddingRight: 10,
        paddingBottom: 30,
        paddingLeft: 0,
    },
    headerButton: {
        marginLeft: 10,
    },
    headerTitles: {
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 20,
    },
    headerTitle: {
        fontSize: 16,
        color: '#999',
        marginBottom: 4,
        textAlign: 'center',
    },
    headerSubtitle: {
        fontSize: 16,
        color: '#000',
        textAlign: 'center',
        fontWeight: '600',
    },
    listContainer: {
        paddingBottom: 20,
    },
    backButton: {
        position: 'absolute', // Ustaw strzałkę w stałej pozycji
        left: 16,
    },
    NameMini: {
        color: 'grey',
    },
    headerDrown: {
        flexDirection: 'column',
    },
    headerUnderTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: 'black',
        textAlign: 'center',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        width: 300,
        padding: 16,
        backgroundColor: '#fff',
        borderRadius: 8,
        alignItems: 'center',
    },
    modalText: {
        fontSize: 16,
        marginBottom: 16,
        textAlign: 'center',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    cancelButton: {
        color: '#ff4d4d',
        fontSize: 16,
        fontWeight: 'bold',
        padding: 8,
    },
    confirmButton: {
        color: '#0347ff',
        fontSize: 16,
        fontWeight: 'bold',
        padding: 8,
    },
    premiumNoticeContainer: {
        marginTop: 16,
        padding: 12,
        backgroundColor: '#FFFAE5',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#FFD700',
        alignItems: 'center',
        justifyContent: 'center',
    },
    premiumNoticeText: {
        fontSize: 14,
        color: '#333',
        textAlign: 'center',
    },
    card: {
        backgroundColor: '#ffffff',
        padding: 16,
        marginVertical: 8,
        marginHorizontal: 8,
        marginBottom: 30,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: {width: 0, height: 2},
        shadowRadius: 4,
        elevation: 3,
        overflow: 'visible', // Allows the button to extend outside the card
    },
    bookButtonContainer: {
        position: 'absolute',
        bottom: -20, // Positions the button slightly outside the card
        alignSelf: 'center', // Centers the button horizontally relative to the card
    },
    centreName: {
        fontSize: 18,
        fontWeight: '500',
        color: '#333',
        marginBottom: 4,
    },
    date: {
        fontSize: 17,
        fontWeight: '500',
        color: '#0347ff',
        marginTop: 8,
    },
    dateFound: {
        fontSize: 14,
        color: '#777',
        marginTop: 4,
        marginBottom: 20,
        fontStyle: 'italic',
    },
    timeSlot: {
        fontSize: 14,
        color: '#555',
        marginTop: 4,
    },
    bookButton: {
        backgroundColor: '#0347ff',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5, // Adds elevation for a floating effect
    },
    bookButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    unavailableText: {
        marginTop: 12,
        color: '#ff4d4d',
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
    },
    errorText: {
        marginTop: 12,
        color: '#ff4d4d',
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
    },
    refreshButton: {
        marginTop: 16,
        backgroundColor: '#0347ff',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 16,
    },
    refreshButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: 'bold',
    },

});

export default ManualBooking;
