import React, {useState} from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Image,
    Alert,
    ScrollView,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const offers = [
    {
        id: 1,
        name: 'Premium',
        price: '14.99 GBP',
        features: [
            'Automatic test date booking',
            'Push notification and email information about the new dates',
            'Choose the perfect date that suits you',
        ],
        isPremium: true,
    },
    {
        id: 2,
        name: 'Free',
        price: '0 GBP',
        features: [
            'Manual bookings only',
            'No notification of new dates',
            'Slower refresh of appointment dates',
            'No guarantee of booking an appointment',
        ],
        isPremium: false,
    },
];

const OfferSelection = () => {
    const [selectedOffer, setSelectedOffer] = useState(null);
    const navigation = useNavigation();

    const handleSelect = (id) => {
        setSelectedOffer(id);
    };

    const handleContinue = async () => {
        const selectedOfferData = offers.find((offer) => offer.id === selectedOffer);
        const isPremium = selectedOfferData.isPremium;

        try {
            // Pobierz dane użytkownika z AsyncStorage
            const userData = await AsyncStorage.getItem('userData');

            if (!userData) {
                Alert.alert('Error', 'User data not found in storage');
                return;
            }

            const parsedUserData = JSON.parse(userData);
            const { licenseNumber } = parsedUserData;

            // Aktualizuj dane użytkownika
            const updatedUserData = {
                ...parsedUserData,
                isPremium,
            };

            // Zapisz zaktualizowane dane użytkownika w AsyncStorage
            await AsyncStorage.setItem('userData', JSON.stringify(updatedUserData));

            // Wyślij zaktualizowane dane użytkownika do serwera
            const response = await fetch('https://drive-test-3bee5c1b0f36.herokuapp.com/api/updateUserPremiumStatus', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ licenseNumber, isPremium }),
            });

            if (response.ok) {
                console.log('User premium status updated successfully');
                // Przekierowanie w zależności od wybranej oferty
                if (isPremium) {
                    navigation.navigate('PremiumSuccess');
                } else {
                    navigation.navigate('TestCentres');
                }
            } else {
                console.error('Failed to update user premium status');
                Alert.alert('Error', 'Failed to update user premium status');
            }
        } catch (error) {
            console.error('Error:', error);
            Alert.alert('Error', 'An error occurred. Please try again.');
        }
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <View style={styles.offerSelectionImage}>
                    <Image
                        source={require('../assets/driver-rafiki-2.png')}
                        style={{width: '100%', height: 150}}
                        resizeMode="contain"
                    />
                </View>
                <Text style={styles.subtitle}>Increase your chances</Text>
                <Text style={styles.title}>Choose offer</Text>
                <View style={styles.options}>
                    {offers.map((offer) => (
                        <TouchableOpacity
                            key={offer.id}
                            style={[
                                styles.option,
                                offer.isPremium ? styles.premium : styles.free,
                                selectedOffer === offer.id && styles.selectedOption,
                            ]}
                            onPress={() => handleSelect(offer.id)}
                        >
                            <View style={styles.offerHeader}>
                                <View style={styles.offerIcon}>
                                    <Image
                                        source={require('../assets/hexagon.png')}
                                        style={{width: 20, height: 20}}
                                    />
                                </View>
                                <Text style={styles.offerName}>{offer.name}</Text>
                                <Text style={styles.offerPrice}>{offer.price}</Text>
                            </View>
                            <View style={styles.offerFeatures}>
                                {offer.features.map((feature, index) => (
                                    <Text key={index} style={styles.featureItem}>
                                        * {feature}
                                    </Text>
                                ))}
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
                <View style={styles.offerSelectionBottom}>
                    <Text style={styles.oneTimeCharge}>This is a one-time charge.</Text>
                    <View style={styles.offerSelectionContinue}>
                        {selectedOffer ? (
                            <TouchableOpacity
                                style={[styles.button, styles.buttonActive]}
                                onPress={handleContinue}
                            >
                                <Text style={styles.buttonTextActive}>Pay and continue</Text>
                                <View style={styles.dragHandle}>
                                    <Text style={styles.arrow}>&rarr;</Text>
                                </View>
                            </TouchableOpacity>
                        ) : (
                            <View style={[styles.button, styles.buttonDisabled]}>
                                <Text style={styles.buttonTextDisabled}>Pay and continue</Text>
                                <View style={styles.dragHandleDisabled}>
                                    <Text style={styles.arrowDisabled}>&rarr;</Text>
                                </View>
                            </View>
                        )}
                    </View>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 30,
        alignItems: 'center',
    },
    offerSelectionImage: {
        width: '100%',
        maxWidth: 600,
        marginBottom: 20,
    },
    scrollContainer: {
        alignItems: 'center',
    },
    subtitle: {
        color: '#0347FF',
        marginBottom: 10,
        fontSize: 20,
        textAlign: 'center',
    },
    title: {
        fontSize: 40,
        fontWeight: 'bold',
        marginBottom: 30,
        textAlign: 'center',
        color: '#0347FF',
    },
    options: {
        width: '100%',
        flexDirection: 'column',
        gap: 20,
        lineHeight: 30,
    },
    option: {
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#ddd',
        marginBottom: 20,
        lineHeight: 200,
        height: 220,
    },
    premium: {
        backgroundColor: 'rgba(3, 71, 255, 0.1)',
    },
    free: {
        backgroundColor: 'rgba(3, 71, 255, 0.1)',
    },
    selectedOption: {
        backgroundColor: '#0347FF',
    },
    offerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    offerIcon: {
        marginRight: 10,
    },
    offerName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    offerPrice: {
        fontSize: 18,
        color: '#fff',
    },
    offerFeatures: {
        marginTop: 10,
        width: '100%',
        flex: 1, // Zapewni, że elementy będą miały dostęp do pełnej wysokości rodzica
        justifyContent: 'space-between', // Rozłoży tekst równomiernie w pionie
    },
    featureItem: {
        fontSize: 14,
        color: '#fff',
        marginBottom: 5,
        fontWeight: '200',
        lineHeight: 30, // Zwiększ wartość lineHeight, aby tekst był bardziej rozciągnięty w pionie
    },
    offerSelectionBottom: {
        width: '100%',
        textAlign: 'center',
        marginTop: 10,
        paddingBottom: 80,
    },
    oneTimeCharge: {
        fontSize: 16,
        color: '#7d7d7d',
        marginBottom: 20,
        textAlign: 'center',
    },
    offerSelectionContinue: {
        alignItems: 'center',
        marginTop: 20,
    },
    button: {
        position: 'relative',
        width: 300,
        height: 50,
        borderRadius: 30,
        paddingHorizontal: 20,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
    },
    buttonActive: {
        backgroundColor: '#0347FF',
    },
    buttonDisabled: {
        backgroundColor: 'rgba(3, 71, 255, 0.2)',
    },
    buttonTextActive: {
        color: '#fff',
        fontSize: 16,
        textAlign: 'center',
        flex: 1,
    },
    buttonTextDisabled: {
        color: '#999',
        fontSize: 16,
    },
    dragHandle: {
        position: 'absolute',
        right: -15,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dragHandleDisabled: {
        position: 'absolute',
        right: -15,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#999',
        justifyContent: 'center',
        alignItems: 'center',
    },
    arrow: {
        fontSize: 16,
        color: '#0347FF',
    },
    arrowDisabled: {
        fontSize: 16,
        color: '#fff',
    },
});

export default OfferSelection;
