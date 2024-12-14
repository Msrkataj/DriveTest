import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Image,
    Alert,
    ScrollView,
    Platform, ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as RNIap from 'react-native-iap';

const itemSkus = Platform.select({
    ios: ['com.drivetestuk.premium'], // Dodaj swój identyfikator dla iOS
    android: ['premium_upgrade'], // Identyfikator dla Androida
});

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

const DebugLog = ({ logs }) => (
    <ScrollView style={{ height: 1500, backgroundColor: '#f8f8f8', padding: 10, marginTop: 10 }}>
        {logs.map((log, index) => (
            <Text key={index} style={{ fontSize: 12, color: '#333' }}>
                {log}
            </Text>
        ))}
    </ScrollView>
);

const OfferSelection = () => {
    const [selectedOffer, setSelectedOffer] = useState(null);
    const [logs, setLogs] = useState([]);
    const navigation = useNavigation();
    const [isLoading, setIsLoading] = useState(false);

    const addLog = (message) => {
        setLogs((prevLogs) => [...prevLogs, message]);
        console.log(message);
    };

    const handleSelect = (id) => {
        setSelectedOffer(id);
        addLog(`Offer selected: ${id}`);
    };

    useEffect(() => {
        const refreshUserData = async () => {
            try {
                const userData = await AsyncStorage.getItem('userData');
                if (!userData) return;

                const { licenseNumber } = JSON.parse(userData);

                const response = await fetch('https://drive-test-3bee5c1b0f36.herokuapp.com/api/getUser', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ licenseNumber }),
                });

                if (response.ok) {
                    const updatedUser = await response.json();
                    await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
                    return updatedUser;
                } else {
                    addLog('Failed to refresh user data from server.');
                    return JSON.parse(userData); // Powrót do danych z AsyncStorage
                }
            } catch (error) {
                addLog(`Error refreshing user data: ${error.message}`);
                return null;
            }
        };

// W initializeApp
        const initializeApp = async () => {
            try {
                addLog('Initializing application...');

                // Sprawdzenie zaległych zakupów
                const isOwned = await handleAvailablePurchases();
                if (isOwned) {
                    addLog('Restored owned purchase. Redirecting to HomeModule.');
                    navigation.navigate('HomeModule');
                    return;
                }

                let user = await refreshUserData();

                if (!user) {
                    addLog('No user data found. Redirecting to OfferSelection.');
                    navigation.navigate('OfferSelection');
                    return;
                }

                addLog(`User data: ${JSON.stringify(user)}`);

                if (!user.isPremium) {
                    addLog('User is not premium. Redirecting to OfferSelection.');
                    navigation.navigate('OfferSelection');
                } else if (!user.selectedCentres || user.selectedCentres.length === 0) {
                    addLog('User has no selected test centres. Redirecting to TestCentres.');
                    navigation.navigate('TestCentres');
                } else if (!user.availability || Object.keys(user.availability).length === 0) {
                    addLog('User has no availability. Redirecting to TestDates.');
                    navigation.navigate('TestDates');
                } else {
                    addLog('User is premium and has all necessary data. Redirecting to HomeModule.');
                    navigation.navigate('HomeModule');
                }
            } catch (error) {
                addLog(`Error initializing application: ${error.message || JSON.stringify(error)}`);
                Alert.alert('Error', 'An error occurred while initializing the application.');
            }
        };


        initializeApp();
    }, []);



    const handlePurchase = async (purchase) => {
        addLog(`rozpoczescie handlePurchase`);
        try {
            if (!purchase || (!purchase.purchaseToken && !purchase.transactionReceipt)) {
                addLog(`Error: Invalid purchase data. Purchase: ${JSON.stringify(purchase)}`);
                Alert.alert('Error', 'Purchase data is invalid or token/receipt is missing.');
                return;
            }

            const { purchaseToken, transactionReceipt, productId } = purchase;
            addLog(`Full purchase object: ${JSON.stringify(purchase, null, 2)}`);
            addLog(`Processing purchase: ${JSON.stringify(purchase)}`);

            // Weryfikacja płatności na backendzie
            const tokenOrReceipt = Platform.OS === 'ios' ? transactionReceipt : purchaseToken;
            const isVerified = await verifyPaymentWithServer(tokenOrReceipt);
            if (!isVerified) {
                addLog('Payment verification failed on the server.');
                Alert.alert('Error', 'Payment verification failed. Please try again later.');
                return;
            }

            // Android: Potwierdzenie zakupu
            if (Platform.OS === 'android') {
                if (!purchase.isAcknowledgedAndroid && purchase.purchaseStateAndroid === 0) {
                    addLog('Acknowledging purchase on Android...');
                    await RNIap.acknowledgePurchaseAndroid(purchaseToken);
                    addLog('Purchase acknowledged successfully.');
                } else {
                    addLog('Purchase already acknowledged or not eligible for acknowledgment.');
                }
            }

            // Zakończenie transakcji na iOS i Androidzie
            addLog('Finishing transaction...');
            try {
                await RNIap.finishTransaction(purchase, true); // Wymuszenie zakończenia transakcji
                addLog('Transaction finished successfully.');
            } catch (finishError) {
                addLog(`Error finishing transaction: ${finishError.message || JSON.stringify(finishError)}`);
            }

            // Aktualizacja statusu premium użytkownika
            addLog('Updating premium status on the server...');
            await updateUserPremiumStatus(true, purchaseToken, transactionReceipt);

            Alert.alert('Success', 'Purchase completed successfully.');
            navigation.navigate('HomeModule');
        } catch (error) {
            addLog(`Error handling purchase: ${error.message || JSON.stringify(error)}`);
            Alert.alert('Error', `Failed to complete purchase: ${error.message || JSON.stringify(error)}`);
        }
    };


    const verifyPaymentWithServer = async (receiptOrToken) => {
        try {
            addLog(`Verifying payment on the server with receipt/token: ${receiptOrToken}`);

            const response = await fetch('https://drive-test-3bee5c1b0f36.herokuapp.com/api/verifyPayment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    receipt: receiptOrToken,
                    platform: Platform.OS, // Wysyła platformę iOS lub Android
                }),
            });

            if (response.ok) {
                const data = await response.json();
                addLog(`Server verification response: ${JSON.stringify(data)}`);
                return data.isValid; // Backend powinien zwracać `isValid: true`, jeśli zakup jest poprawny
            } else {
                addLog(`Server verification failed with status: ${response.status}`);
                return false;
            }
        } catch (error) {
            addLog(`Error verifying payment on server: ${error.message}`);
            return false;
        }
    };


    const sendPurchaseToServer = async (isPremium) => {
        try {
            const userData = await AsyncStorage.getItem('userData');
            if (!userData) {
                addLog('Error: User data not found in storage');
                Alert.alert('Error', 'User data not found in storage');
                return;
            }

            const { licenseNumber } = JSON.parse(userData);
            addLog(`License number: ${licenseNumber}`);

            const payload = {
                licenseNumber,
                isPremium,
            };

            addLog(`Sending payload to server: ${JSON.stringify(payload)}`);

            const response = await fetch('https://drive-test-3bee5c1b0f36.herokuapp.com/api/updateUserPremiumStatus', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                const data = await response.json();
                addLog(`Server response: ${JSON.stringify(data)}`);

                if (data.user && data.user.isPremium) {
                    addLog('User premium status updated successfully on the server.');

                    // Aktualizacja danych w AsyncStorage
                    await AsyncStorage.setItem('userData', JSON.stringify(data.user));
                    addLog('AsyncStorage updated with new user data.');
                } else {
                    addLog('Failed to update premium status on the server.');
                    Alert.alert('Error', 'Failed to update premium status.');
                }
            } else {
                const errorData = await response.json();
                addLog(`Server error: ${JSON.stringify(errorData)}`);
                Alert.alert('Error', 'Failed to update premium status.');
            }
        } catch (error) {
            addLog(`Error sending premium status to server: ${error.message || JSON.stringify(error)}`);
            Alert.alert('Error', 'An error occurred while updating your premium status.');
        }
    };


    const handleContinue = async () => {
        const selectedOfferData = offers.find((offer) => offer.id === selectedOffer);
        if (!selectedOfferData) {
            Alert.alert('Error', 'No offer selected');
            addLog('Error: No offer selected');
            return;
        }

        const isPremium = selectedOfferData.isPremium;

        if (isPremium) {
            try {
                addLog('Fetching product data for purchase...');
                const products = await RNIap.getProducts({ skus: itemSkus });
                addLog(`Products fetched for purchase: ${JSON.stringify(products)}`);

                const product = products.find((p) => p.productId === 'premium_upgrade');
                if (!product) {
                    addLog('Error: Product not found.');
                    Alert.alert('Error', 'Product not found.');
                    return;
                }

                addLog(`Requesting purchase for productId: ${product.productId}`);
                const purchase = Platform.OS === 'android'
                    ? await RNIap.requestPurchase({ skus: [product.productId] })
                    : await RNIap.requestPurchase(product.productId);

                addLog(`Purchase result: ${JSON.stringify(purchase)}`);

                if (Array.isArray(purchase)) {
                    if (purchase.length > 0 && purchase[0].purchaseToken) {
                        addLog(`Processing first item in purchase array.`);
                        await handlePurchase(purchase[0]); // Obsługujemy pierwszy obiekt z tablicy
                    } else {
                        addLog('Purchase failed or no valid purchaseToken in array.');
                    }
                } else if (purchase && purchase.purchaseToken) {
                    addLog(`Processing single purchase object.`);
                    await handlePurchase(purchase);
                } else {
                    addLog('Purchase failed or no purchaseToken returned.');
                }


            } catch (error) {
                addLog(`Error fetching product data: ${error.message || JSON.stringify(error)}`);
                Alert.alert('Error', `Failed to fetch product data: ${error.message}`);
            }
        } else {
            addLog('Free offer selected, no purchase required.');
            await updateUserPremiumStatus(isPremium);
        }
    };


    const handleAvailablePurchases = async () => {
        try {
            addLog('Fetching available purchases...');
            const purchases = await RNIap.getAvailablePurchases();
            addLog(`Available purchases: ${JSON.stringify(purchases)}`);

            const ownedProduct = purchases.find((p) => p.productId === 'premium_upgrade' || p.productId === 'com.drivetestuk.premium');
            if (ownedProduct) {
                addLog(`Product already owned: ${ownedProduct.productId}`);

                const { purchaseToken, transactionReceipt, isAcknowledgedAndroid } = ownedProduct;
                const tokenOrReceipt = Platform.OS === 'ios' ? transactionReceipt : purchaseToken;

                if (!tokenOrReceipt) {
                    addLog('Error: Missing token or receipt for owned product.');
                    Alert.alert('Error', 'Cannot process owned purchase.');
                    return false;
                }

                if (Platform.OS === 'android' && !isAcknowledgedAndroid) {
                    addLog(`Acknowledging purchase with token: ${purchaseToken}`);
                    await RNIap.acknowledgePurchaseAndroid(purchaseToken);
                    addLog('Owned purchase acknowledged successfully.');
                }

                addLog('Finishing owned transaction...');
                await RNIap.finishTransaction(ownedProduct);
                addLog('Owned transaction finished successfully.');

                addLog('Sending owned product data to server...');
                await sendPurchaseToServer(true);

                Alert.alert('Info', 'Purchase restored successfully.');
                navigation.navigate('HomeModule');
                return true;
            } else {
                addLog('No owned products found.');
                return false;
            }
        } catch (error) {
            addLog(`Error restoring purchases: ${error.message || JSON.stringify(error)}`);
            Alert.alert('Error', 'An error occurred while restoring purchases.');
            return false;
        }
    };


    const updateUserPremiumStatus = async (isPremium, purchaseToken = null, transactionReceipt = null) => {
        try {
            const userData = await AsyncStorage.getItem('userData');
            if (!userData) {
                Alert.alert('Error', 'User data not found in storage');
                addLog('Error: User data not found in storage');
                return;
            }

            const { licenseNumber } = JSON.parse(userData);
            const payload = {
                licenseNumber,
                isPremium,
                purchaseToken,
                transactionReceipt,
            };

            addLog(`Sending payload to server: ${JSON.stringify(payload)}`);

            const response = await fetch('https://drive-test-3bee5c1b0f36.herokuapp.com/api/updateUserPremiumStatus', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                const data = await response.json();
                addLog(`Server response: ${JSON.stringify(data)}`);

                if (data.user && data.user.isPremium) {
                    addLog('User premium status updated successfully.');

                    await AsyncStorage.setItem('userData', JSON.stringify(data.user));
                    addLog('AsyncStorage updated with new user data.');
                } else {
                    addLog('Failed to update premium status on the server.');
                    Alert.alert('Error', 'Failed to update premium status.');
                }
            } else {
                const errorData = await response.json();
                addLog(`Server error: ${JSON.stringify(errorData)}`);
                Alert.alert('Error', 'Failed to update premium status.');
            }
        } catch (error) {
            addLog(`Error updating user premium status: ${error.message || JSON.stringify(error)}`);
            Alert.alert('Error', 'An error occurred while updating your premium status.');
        }
    };




    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <View style={styles.offerSelectionImage}>
                    <Image
                        source={require('../assets/driver-rafiki-2.png')}
                        style={{ width: '100%', height: 150 }}
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
                                        style={{ width: 20, height: 20 }}
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
                {isLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#0000ff" />
                        <Text>Processing your payment. Please wait...</Text>
                    </View>
                ) : (
                    <View>
                        <Text>Select your plan and proceed to payment.</Text>
                        {/* Przycisk do aktywacji płatności */}
                    </View>
                )}
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
                {/*<DebugLog logs={logs} />*/}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 30,
        alignItems: 'center',
                color: 'black',

    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        padding: 20,
        borderRadius: 10,
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
