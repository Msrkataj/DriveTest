import React, {useState, useEffect} from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Image,
    FlatList,
    Alert,
    Animated,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import BookingIcon from '../assets/booking.svg'; // Użycie SVG jako komponentu
import AsyncStorage from '@react-native-async-storage/async-storage';

const HomeModule = () => {
    const [notifications, setNotifications] = useState([]);
    const [topNotification, setTopNotification] = useState(null);
    const [unreadNotifications, setUnreadNotifications] = useState([]);
    const [bottomNotifications, setBottomNotifications] = useState([]);
    const [showSupportMessage, setShowSupportMessage] = useState(false);
    const navigation = useNavigation();
    const [fadeAnim] = useState(new Animated.Value(0));

    useEffect(() => {
        const fetchNotifications = async () => {
            // Simulating fetching notifications from the database
            const userDataString = await AsyncStorage.getItem('userData');
            if (!userDataString) return;
            const userData = JSON.parse(userDataString);
            const userId = userData._id;

            const response = await fetch(
                `https://drive-test-3bee5c1b0f36.herokuapp.com/api/notifications/${userId}`
            );
            const notifications = await response.json();

            const unread = notifications.filter((n) => !n.read);
            setUnreadNotifications(unread.sort((a, b) => new Date(a.date) - new Date(b.date)));
            setNotifications(notifications);
        };

        fetchNotifications();

        const checkUserData = async () => {
            try {
                // Pobierz dane userData z AsyncStorage
                const userDataString = await AsyncStorage.getItem('userData');

                if (!userDataString) {
                    // Jeśli brak danych w userData, usuń wszystko i przekieruj
                    await AsyncStorage.clear();
                    navigation.navigate('/');
                    return;
                }

                // Parsuj userData jako obiekt
                const userData = JSON.parse(userDataString);

                // Sprawdź, czy klucze `licenseNumber` i `applicationRef` istnieją
                if (!userData.licenseNumber || !userData.applicationRef) {
                    await AsyncStorage.clear();
                    navigation.navigate('/');
                }
            } catch (error) {
                console.error('Error checking user data:', error);
                Alert.alert('Error', 'Failed to verify user data.');
            }
        };

        checkUserData();
    }, [navigation]);

    useEffect(() => {
        if (unreadNotifications.length > 0) {
            const notification = unreadNotifications[0];
            setTopNotification(notification);

            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }).start();

            const timer = setTimeout(async () => {
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 500,
                    useNativeDriver: true,
                }).start(() => {
                    setTopNotification(null);
                    setUnreadNotifications((prev) => prev.slice(1));
                    setNotifications((prev) =>
                        prev.map((n) =>
                            n._id === notification._id ? {...n, read: true} : n
                        )
                    );
                });

                // Update read status in database
                try {
                    await fetch('https://drive-test-3bee5c1b0f36.herokuapp.com/api/notifications/update', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({
                            userId: notification.userId,
                            notificationIds: [notification._id], // Przekazujemy `_id` powiadomienia
                        }),
                    });
                } catch (error) {
                    console.error('Error updating notification read status:', error);
                }
            }, 3000);

            return () => clearTimeout(timer);
        }
    }, [unreadNotifications, fadeAnim]);
    const navigateTo = (screenName) => {
        navigation.navigate(screenName);
    };

    const renderNotification = ({item}) => (
        <View style={styles.notification}>
            <Image
                source={require('../assets/calendar.png')}
                style={styles.notificationIcon}
                resizeMode="contain"
            />
            <View style={styles.notificationText}>
                <Text style={styles.notificationTitle}>{item.text}</Text>
                <Text style={styles.notificationDate}>{new Date(item.date).toLocaleString()}</Text>
            </View>
        </View>
    );


    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Driving Test Dates</Text>
                <TouchableOpacity onPress={() => navigateTo('Settings')}>
                    <Image
                        source={require('../assets/bars-staggered.png')}
                        style={styles.topNotificationMenu}
                        resizeMode="contain"
                    />
                </TouchableOpacity>
            </View>
            {/* Top Notification */}
            {topNotification && (
                <Animated.View
                    style={[
                        styles.topNotificationOverlay,
                        {opacity: fadeAnim},
                    ]}
                >
                    <View style={styles.topNotification}>
                        <Image
                            source={require('../assets/calendar.png')}
                            style={styles.topNotificationIcon}
                            resizeMode="contain"
                        />
                        <View style={styles.topNotificationText}>
                            <Text style={styles.topNotificationTitle}>
                                New notification
                            </Text>
                            <Text style={styles.topNotificationSubtitle}>
                                {topNotification.text}
                            </Text>
                        </View>
                    </View>
                </Animated.View>
            )}
            {/* Options */}
            <View style={styles.options}>
                <TouchableOpacity
                    style={styles.option}
                    onPress={() => navigateTo('Booking')}
                >
                    <View style={styles.optionContent}>
                        <Text style={styles.optionTitle}>Manual booking</Text>
                        <Text style={styles.optionSubtitle}>Check free dates</Text>
                    </View>
                    <BookingIcon width={30} height={30}/>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.option}
                    onPress={() => navigateTo('TestCentresChoose')}
                >
                    <View style={styles.optionContent}>
                        <Text style={styles.optionTitle}>Test centres</Text>
                        <Text style={styles.optionSubtitle}>Your test centres</Text>
                    </View>
                    <Image
                        source={require('../assets/land-layer-location.png')}
                        style={{width: 30, height: 30}}
                        resizeMode="contain"
                    />
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.option}
                    onPress={() => navigateTo('TestDatesChoose')}
                >
                    <View style={styles.optionContent}>
                        <Text style={styles.optionTitle}>Test dates</Text>
                        <Text style={styles.optionSubtitle}>Your availability for autobook</Text>
                    </View>
                    <Image
                        source={require('../assets/calendar-clock.png')}
                        style={{width: 30, height: 30}}
                        resizeMode="contain"
                    />
                </TouchableOpacity>
            </View>


            {/* Notifications */}
            <View style={styles.notifications}>
                <Text style={styles.notificationsTitle}>Notifications</Text>
                <FlatList
                    data={notifications.filter((n) => n.read)}
                    keyExtractor={(item) => item._id}
                    renderItem={renderNotification}
                />
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
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 30,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#0347ff',
    },
    topNotificationOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
    },
    topNotification: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        backgroundColor: '#fffae6',
        borderRadius: 10,
        marginHorizontal: 20,
        marginTop: 10,
        color: 'rgba(20, 20, 20, 1)',

    },
    topNotificationIcon: {
        width: 30,
        height: 30,
        color: 'rgba(20, 20, 20, 1)',

    },
    topNotificationText: {
        marginLeft: 10,
        color: 'rgba(20, 20, 20, 1)',

        flex: 1,
    },
    topNotificationTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'rgba(20, 20, 20, 1)',

    },
    topNotificationSubtitle: {
        fontSize: 14,
        color: '#999',

    },
    notifications: {
        flex: 1,
        padding: 20,
    },
    notificationsTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
        color: 'rgba(20, 20, 20, 1)',
    },
    notification: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        backgroundColor: '#f9f9f9',
        borderRadius: 10,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    notificationIcon: {
        width: 30,
        height: 30,
    },
    notificationText: {
        marginLeft: 10,
        flex: 1,
        color: '#999',
    },
    notificationTitle: {
        fontSize: 14,
        color: 'rgba(20, 20, 20, 1)',
    },
    notificationDate: {
        fontSize: 12,
        color: 'grey',
    },
    options: {
        marginBottom: 20,
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 40,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 15,
        marginBottom: 15,
    },
    optionContent: {
        flexDirection: 'column',
    },
    optionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0347ff',
        marginBottom: 5,
    },
    optionSubtitle: {
        fontSize: 14,
        color: '#0347ff',
    },
});

export default HomeModule;
