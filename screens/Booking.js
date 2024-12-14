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
import {useNavigation} from '@react-navigation/native';
import Icon from "react-native-vector-icons/FontAwesome";

const Booking = () => {
    const {
        dateStatuses,
        fetchDateAvailability,
    } = useContext(DateAvailabilityContext);
    const [modalVisible, setModalVisible] = useState(false);
    const [userData, setUserData] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedDates, setSelectedDates] = useState([]);
    const [selectedCentres, setSelectedCentres] = useState([]);
    const navigation = useNavigation();
    const serverUrl = 'https://drive-test-3bee5c1b0f36.herokuapp.com';
    const [loadingAvailability, setLoadingAvailability] = useState(false);
    const [lastRefreshTime, setLastRefreshTime] = useState(null);
    const [expandedState, setExpandedState] = useState({});
    const [testCentresData, setTestCentresData] = useState([]);
    const [confirmedBooking, setConfirmedBooking] = useState(null); // Aktywne potwierdzenie
    const [selectedCentre, setSelectedCentre] = useState(null); // Tymczasowe wybrane centrum
    const hasFetchedUserData = useRef(false);

    useFocusEffect(
        React.useCallback(() => {
            const fetchData = async () => {
                console.log('useFocusEffect triggered');

                if (!userData) {
                    console.log('fetchUserData will be called...');
                    await fetchUserData();
                    console.log('fetchUserData completed.');
                } else {
                    // Jeśli userData już jest, sprawdź czy mamy wybrane daty
                    // console.log('userData is available:', userData);
                    // console.log('selectedCentres:', selectedCentres);
                }
            };

            fetchData();
        }, [userData, selectedCentres])
    );

    // Gdy zmieni się selectedDates i mamy już userData oraz selectedCentres,
    // a selectedDates nie jest puste, wywołaj fetchAvailabilityData.
    useEffect(() => {
        if (userData && selectedCentres.length > 0 && selectedDates.length > 0) {
            fetchAvailabilityData();
        }
    }, [selectedDates, selectedCentres, userData]);

    useEffect(() => {
        const intervalId = setInterval(() => {
            const now = Date.now();
            if (userData && selectedCentres.length > 0 && !loadingAvailability && selectedDates.length > 0) {
                if (!lastRefreshTime || now - lastRefreshTime >= 30000) {
                    setLastRefreshTime(now);
                    fetchAvailabilityData();
                }
            }
        }, 10000); // Skrócone do 1 sekundy dla precyzyjnej kontroli czasu
        return () => clearInterval(intervalId);
    }, [userData, selectedCentres, loadingAvailability, selectedDates]);


    const fetchUserData = async () => {
        if (hasFetchedUserData.current) return;
        hasFetchedUserData.current = true;

        try {
            const storedData = await AsyncStorage.getItem('userData');
            if (!storedData) throw new Error('UserData is not available in local storage');

            const { licenseNumber } = JSON.parse(storedData);
            console.log('License number:', licenseNumber);

            const response = await fetch(`${serverUrl}/api/getUser`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ licenseNumber }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch user data.');
            }

            const user = await response.json();
            console.log('User data fetched:', user);

            setUserData(user);

            if (user.selectedCentres && user.availability) {
                const newSelectedDates = Object.keys(user.availability).map((date) => ({
                    date,
                    timeSlots: user.availability[date],
                }));
                console.log('Setting selectedDates:', newSelectedDates);

                setSelectedDates(newSelectedDates);
                setSelectedCentres(user.selectedCentres); // Ustawiamy selectedCentres
            } else {
                console.warn('User availability or selectedCentres is missing.');
            }

            await fetchTestCentres();
        } catch (error) {
            console.error('Error fetching user data:', error);
            Alert.alert('Error', error.message || 'Failed to fetch user data.');
        }
    };

    const fetchTestCentres = async () => {
        console.log('fetchTestCentres called.');
        try {
            const response = await fetch(`${serverUrl}/api/testCentres`);
            if (!response.ok) {
                throw new Error('Failed to fetch test centres');
            }
            const testCentres = await response.json();
            setTestCentresData(testCentres);
        } catch (error) {
            console.error('Error fetching test centres:', error);
            Alert.alert('Error', 'Failed to fetch test centres data.');
        }
    };

    const fetchAvailabilityData = async () => {
        try {
            console.log('fetchAvailabilityData: started');
            setLoadingAvailability(true);

            if (selectedDates.length === 0) {
                console.warn('fetchAvailabilityData: No selectedDates available to process.');
                return;
            }

            const sortedSelectedDates = [...selectedDates].sort((a, b) => {
                const [dayA, monthA, yearA] = a.date.split('/');
                const [dayB, monthB, yearB] = b.date.split('/');
                const dateA = new Date(`20${yearA}-${monthA}-${dayA}`);
                const dateB = new Date(`20${yearB}-${monthB}-${dayB}`);
                return dateA - dateB;
            });

            if (JSON.stringify(sortedSelectedDates) !== JSON.stringify(selectedDates)) {
                setSelectedDates(sortedSelectedDates);
            }

            console.log('fetchAvailabilityData: finished');
        } catch (error) {
            console.error('Error fetching availability data:', error);
        } finally {
            setLoadingAvailability(false);
        }
    };


    const handleRefresh = async () => {
        const now = Date.now();
        const fiveMinutes = 5 * 60 * 1000;

        if (lastRefreshTime && now - lastRefreshTime < fiveMinutes) {
            const remainingTime = Math.ceil((fiveMinutes - (now - lastRefreshTime)) / 1000);
            Alert.alert(
                'Too Soon!',
                `You can refresh again in ${Math.ceil(remainingTime / 60)} minute(s).`
            );
            return;
        }

        setLastRefreshTime(now);

        console.log('handleRefresh called');
        try {
            console.log('Calling fetchDateAvailability with forceExecute...');
            Alert.alert(
                'Dates Updated',
                'Dates are updated, results may appear in a few minutes.',
                [{text: 'OK'}]
            );
            await fetchDateAvailability(true);
            await fetchAvailabilityData();
        } catch (error) {
            console.error('Error during refresh:', error);
            Alert.alert('Error', 'Failed to refresh availability data.');
        }
    };

    const formatDateString = (dateString) => {
        if (!dateString || typeof dateString !== 'string') return 'Invalid date';
        const [day, month, year] = dateString.split('/');
        const date = new Date(`20${year}-${month}-${day}`);
        const options = {weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'};
        return date.toLocaleDateString('en-GB', options);
    };
    const handleOpenModal = (date, centre) => {
        if (confirmedBooking) {
            Alert.alert(
                'Active Confirmation',
                'You already have an active confirmation. Cancel it first to create a new one.',
            );
            return;
        }
        setSelectedDate(date);
        setSelectedCentre(centre);
        setModalVisible(true);
    };
    const handleConfirm = () => {
        if (!selectedDate || !selectedCentre) {
            Alert.alert('Error', 'Selected date or centre is missing.');
            return;
        }
        setConfirmedBooking({ date: selectedDate, centre: selectedCentre });
        setModalVisible(false);
    };
    const handleCancelConfirmation = () => {
        setConfirmedBooking(null);
    };

    const renderDateItem = ({item}) => {
        if (!testCentresData || testCentresData.length === 0) {
            // console.log('No testCentresData available');
        }

        return selectedCentres.map((centre, index) => {

            // Znajdź odpowiadający TestCentre w testCentresData
            const testCentre = testCentresData.find(
                (tc) =>
                    tc.postalCode.trim().toLowerCase() === centre.postalCode.trim().toLowerCase() &&
                    tc.name.trim().toLowerCase() === centre.name.trim().toLowerCase()
            );
            // console.log('testCentre:', testCentre);

            const formattedSelectedDate = formatDateString(item.date);
            // console.log('Available Dates:', testCentre?.availableDates);
            // console.log('Formatted Selected Date:', formattedSelectedDate);

            let isDateAvailable = false;
            let datesToShow = [];
            const isConfirmed =
                confirmedBooking &&
                confirmedBooking.date === item.date &&
                confirmedBooking.centre?.name === centre.name;

            if (testCentre && testCentre.availableDates?.length > 0) {
                datesToShow = testCentre.availableDates.filter(ad => {
                    const availableDate = new Date(ad.date).toDateString();
                    const selectedDate = new Date(formattedSelectedDate).toDateString();
                    // console.log('Comparing dates:', { availableDate, selectedDate });
                    return availableDate === selectedDate;
                });

                isDateAvailable = datesToShow.length > 0;
                if (isDateAvailable) {
                    console.log(`Found available dates for ${testCentre.name}:`, datesToShow);
                }
            } else {
                console.log(`No available dates for testCentre: ${testCentre?.name}`);
            }
            const testDateFormatted = testCentre?.testDate
                ? new Date(testCentre.testDate).toLocaleDateString('en-GB', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                })
                : 'No recent update';
            console.log('testDateFormatted:', testDateFormatted);

            const notificationText = isDateAvailable
                ? `Available dates for ${formattedSelectedDate}:`
                : `No available dates for ${formattedSelectedDate}.`;
            console.log('notificationText:', notificationText);

            const expandedKey = `${item.date}-${centre.name}`;
            const isExpanded = expandedState[expandedKey] || false;
            const limitedDates = isDateAvailable
                ? (isExpanded ? datesToShow : datesToShow.slice(0, 3))
                : [];
            const shouldShowExpandButton = isDateAvailable && datesToShow.length > 3;

            return (
                <View style={styles.card} key={`${item.date}-${index}`}>
                    <Text style={styles.centreName}>
                        {centre.name || 'Test Centre'}
                    </Text>
                    <Text style={styles.NameMini}>Test Centre</Text>

                    <Text style={styles.date}>{formattedSelectedDate}</Text>
                    {isConfirmed && (
                        <View style={styles.confirmedContainer}>
                            <Icon name="spinner" size={20} color="#007bff" />
                            <Text style={styles.tooltip}>Processing... We’ll notify you when available.</Text>
                        </View>
                    )}
                    <View style={styles.notificationContainer}>
                        <Text style={styles.notificationText}>{notificationText}</Text>

                        {isDateAvailable && limitedDates.map((dateObj, idx) => (
                            <Text key={idx} style={styles.dateItem}>
                                {`${dateObj.date}, ${dateObj.time}`}
                            </Text>
                        ))}

                        {shouldShowExpandButton && (
                            <TouchableOpacity
                                onPress={() =>
                                    setExpandedState(prevState => ({
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
                        <Text style={styles.notificationText}>
                            Last updated on: {testDateFormatted}
                        </Text>
                    </View>

                    {isDateAvailable && (
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
                        <Text style={[styles.notificationText, {marginBottom: 8}]}>
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
                            onPress={() =>
                                isConfirmed
                                    ? handleCancelConfirmation()
                                    : handleOpenModal(item.date, centre)
                            }
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
            initialNumToRender={selectedDates.length}
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
                                                `You have planned: ${formatDateString(selectedDate)}. You will be notified when your reservation is successful.`,
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
    confirmedContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    tooltip: {
        marginLeft: 8,
        fontSize: 14,
        color: '#007bff',
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

export default Booking;
