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
    const [loadingNotifications, setLoadingNotifications] = useState(false); // Nowa flaga
    const [lastRefreshTime, setLastRefreshTime] = useState(null); // Przechowuje czas ostatniego odświeżenia
    const [expandedState, setExpandedState] = useState({});


    useEffect(() => {
        const intervalId = setInterval(() => {
            if (userData && selectedCentres.length > 0 && !loadingNotifications) {
                console.log('Auto-refreshing notifications...');
                fetchNotifications();
            }
        }, 30000); // 30 sekund

        return () => clearInterval(intervalId); // Czyszczenie interwału przy odmontowaniu
    }, [userData, selectedCentres, loadingNotifications]);



    const formatDateString = (dateString) => {
        if (!dateString || typeof dateString !== 'string') return 'Invalid date';
        const [day, month, year] = dateString.split('/');
        const date = new Date(`20${year}-${month}-${day}`);
        const options = {weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'};
        return date.toLocaleDateString('en-GB', options); // Format: Friday 21 March 2025
    };

    // Funkcja do normalizacji formatu daty do `dd/mm/rr`
    const normalizeDateFormat = (date) => {
        if (!date) return null;
        const [day, month, year] = date.split('/');
        return `${day}/${month}/${year.slice(-2)}`;
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
                        console.log('Fetchisng notifications...');
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
        const now = Date.now();
        const fiveMinutes = 5 * 60 * 1000; // 5 minut w milisekundach

        if (lastRefreshTime && now - lastRefreshTime < fiveMinutes) {
            const remainingTime = Math.ceil((fiveMinutes - (now - lastRefreshTime)) / 1000);
            Alert.alert(
                'Too Soon!',
                `You can refresh again in ${Math.ceil(remainingTime / 60)} minute(s).`
            );
            return;
        }

        setLastRefreshTime(now); // Ustaw czas ostatniego odświeżenia

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

    // const handleRefresh = async () => {
    //     console.log('handleRefresh called');
    //     try {
    //         console.log('Calling fetchDateAvailability with forceExecute...');
    //         Alert.alert(
    //             'Dates Updated',
    //             'Dates are updated, results may appear in a few minutes.',
    //             [{ text: 'OK' }]
    //         );
    //         await fetchDateAvailability(true); // Wymuś wykonanie zapytania
    //         await fetchNotifications(); // Aktualizuj powiadomienia po odświeżeniu dostępności
    //     } catch (error) {
    //         console.error('Error during refresh:', error);
    //         Alert.alert('Error', 'Failed to refresh availability data.');
    //     }
    // };


    const fetchNotifications = async () => {
        try {
            setLoadingNotifications(true);

            if (!userData || !userData._id || selectedCentres.length === 0) {
                console.warn('Notifications skipped: Missing userData or selectedCentres');
                setLoadingNotifications(false);
                return;
            }

            const userId = userData._id;

            // Pobierz powiadomienia z bazy danych
            const response = await fetch(`${serverUrl}/api/notifications/${userId}`);
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Server error: ${response.status} ${response.statusText} - ${errorText}`);
            }

            const notifications = await response.json();
            if (!Array.isArray(notifications)) {
                throw new Error('Notifications is not an array');
            }

            // Sortuj powiadomienia po dacie w kolejności malejącej
            const sortedNotifications = notifications.sort(
                (a, b) => new Date(b.date) - new Date(a.date)
            );

            // console.log('Pobrane i posortowane powiadomienia:', sortedNotifications);

            // Budowanie mapy powiadomień
            const notificationMap = {};
            sortedNotifications.forEach((notification) => {
                const centerName = notification.selectedCentre?.name?.trim().toLowerCase();
                if (!centerName || !notification.selectedDate) return;

                notification.selectedDate.forEach((readableDate) => {
                    const normalizedDate = normalizeToShortDate(readableDate); // Normalizujemy daty w bazie
                    if (normalizedDate) {
                        const key = `${normalizedDate}-${centerName}`;
                        // console.log('Generated key for notificationMap:', key); // Log dla generowanego klucza
                        if (!notificationMap[key]) {
                            notificationMap[key] = {
                                text: notification.text,
                                availableDates: Array.isArray(notification.availableDates)
                                    ? notification.availableDates.filter(
                                        (d) => d.date && d.time // Sprawdź, czy każdy obiekt ma `date` i `time`
                                    )
                                    : [],
                            };
                        }
                    }
                });
            });

            // console.log('Final notificationMap keys:', Object.keys(notificationMap)); // Loguj wszystkie klucze w mapie

            // Dopasowanie powiadomień do każdej daty w `selectedDates`
            const matchedNotifications = [];

            selectedDates.forEach((dateObj) => {
                const normalizedDate = normalizeDateFormat(dateObj.date);

                selectedCentres.forEach((centre) => {
                    const centerKey = `${normalizedDate}-${centre.name.trim().toLowerCase()}`;
                    const notificationData = notificationMap[centerKey];
                    console.log('notificationData:', notificationData);
                    console.log('centerKey:', centerKey);
                    console.log('normalizedDate:', normalizedDate);

                    matchedNotifications.push({
                        date: normalizedDate,
                        text: notificationData ? notificationData.text : 'No notifications',
                        availableDates: notificationData ? notificationData.availableDates : [],
                        testCentreName: centre.name
                    });
                });
            });

            setAvailabilityNotifications(matchedNotifications);



            setAvailabilityNotifications(matchedNotifications);

            // console.log('Dopasowane powiadomienia:', matchedNotifications);
        } catch (error) {
            console.error('Błąd podczas pobierania powiadomień:', error);
            Alert.alert('Błąd', error.message || 'Nie udało się pobrać powiadomień.');
        } finally {
            setLoadingNotifications(false);
        }
    };


    useFocusEffect(
        React.useCallback(() => {
            if (userData && selectedCentres.length > 0) {
                fetchNotifications();
            }
        }, [userData, selectedCentres])
    );



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
            console.error('Invalid month in readableDate:', readableDate);
            return null;
        }
        const formattedDay = day.padStart(2, '0');
        const formattedMonth = monthIndex.toString().padStart(2, '0');
        const shortYear = year.slice(-2);
        return `${formattedDay}/${formattedMonth}/${shortYear}`;
    };



    useEffect(() => {
        // console.log('Current selectedDates:', selectedDates);
        // console.log('Current selectedCentres:', selectedCentres);
    }, [selectedDates, selectedCentres]);



    const renderDateItem = ({ item }) => {
        return selectedCentres.map((centre, index) => {
            // Dopasowanie powiadomienia dla danego centrum testowego i daty
            const notification = availabilityNotifications.find(
                (notif) =>
                    notif &&
                    notif.date === item.date &&
                    notif.testCentreName?.toLowerCase() === centre.name.toLowerCase()
            );

            const isLoading =
                !notification &&
                (!dateStatuses[item.date] || dateStatuses[item.date]?.status === 'loading');
            const expandedKey = `${item.date}-${centre.name}`;

            const isExpanded = expandedState[`${item.date}-${centre.name}`] || false;

            return (
                <View style={styles.card} key={`${item.date}-${index}`}>
                    <Text style={styles.centreName}>
                        {centre.name || 'Test Centre'}
                    </Text>
                    <Text style={styles.NameMini}>Test Centre</Text>

                    <Text style={styles.date}>{formatDateString(item.date)}</Text>

                    <View style={styles.notificationContainer}>
                        {isLoading ? (
                            <ActivityIndicator size="small" color="#007bff" />
                        ) : notification ? (
                            <>
                                {/* Tekst powiadomienia na osobnej linii */}
                                <Text style={styles.notificationText}>{notification.text}</Text>

                                {/* Lista dostępnych terminów */}
                                {notification.availableDates?.length > 0 && (
                                    <View>
                                        {(isExpanded
                                                ? notification.availableDates
                                                : notification.availableDates.slice(0, 3)
                                        ).map((dateObj, index) => (
                                            <Text key={index} style={styles.dateItem}>
                                                {`${dateObj.date}, ${dateObj.time}`}
                                            </Text>
                                        ))}

                                        {notification.availableDates.length > 3 && (
                                            <TouchableOpacity
                                                onPress={() =>
                                                    setExpandedState((prevState) => ({
                                                        ...prevState,
                                                        [expandedKey]: !isExpanded,
                                                    }))
                                                }
                                                style={styles.expandButton}
                                            >
                                                <Text style={styles.expandButtonText}>
                                                    {isExpanded ? 'Hide' : 'Show more'}
                                                </Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                )}
                            </>
                        ) : (
                            <Text style={styles.noNotificationText}>No notifications</Text>
                        )}
                    </View>

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
                        <Text style={[styles.notificationText, { marginBottom: 8 }]}>
                            No date found for this date
                        </Text>
                    )}
                    {dateStatuses[item.date]?.status === 'error' && (
                        <Text style={styles.errorText}>
                            Temporary service issue. Availability will be checked in 15 minutes.
                        </Text>
                    )}
                    {userData?.isPremium ? (
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
        });
    };



    return (
        <FlatList
            data={selectedDates}
            keyExtractor={(item, index) => `${item.date}-${index}`}
            renderItem={renderDateItem}
            contentContainerStyle={styles.listContainer}
            nitialNumToRender={selectedDates.length} // Renderuj wszystkie daty na raz
            maxToRenderPerBatch={selectedDates.length}
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
    notificationContainer: {
        marginTop: 10,
    },
    notificationText: {
        fontSize: 14,
        color: '#555',
        marginBottom: 8, // Dodano odstęp między tekstem a datami
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
    expandButton: {
        marginTop: 5,
        paddingVertical: 5,
    },
    expandButtonText: {
        color: '#007bff',
        textAlign: 'center',
        fontSize: 14,
        fontWeight: '600',
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
    dateItem: {
        fontSize: 13,
        color: '#333',
        marginBottom: 2, // Odstęp między datami
    },

    noNotificationText: {
        fontSize: 14,
        color: '#999', // Kolor tekstu, gdy brak powiadomień
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
        color: 'rgba(20, 20, 20, 1)',
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
        padding: 12,
        paddingBottom: 40,
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
