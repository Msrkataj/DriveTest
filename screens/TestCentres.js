import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    Alert,
    Image, BackHandler,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TestCentres = () => {
    const [testCentres, setTestCentres] = useState([]);
    const [filteredCentres, setFilteredCentres] = useState([]);
    const [selectedCentres, setSelectedCentres] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showDetails, setShowDetails] = useState({});
    const navigation = useNavigation();

    useEffect(() => {
        const onBackPress = () => {
            navigation.replace('TestCentres'); // Zawsze przekierowuj do ekranu docelowego
            return true; // Zatrzymuje domyślne działanie przycisku "wstecz"
        };

        BackHandler.addEventListener('hardwareBackPress', onBackPress);

        // Sprzątanie: usuń listener przy odmontowaniu komponentu
        return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [navigation]);

    useEffect(() => {
        const fetchTestCentres = async () => {
            const serverUrl = 'https://drive-test-3bee5c1b0f36.herokuapp.com';

            try {
                const response = await fetch(`${serverUrl}/api/testCentres`);
                const data = await response.json();
                setTestCentres(data);
                setFilteredCentres(data);
            } catch (error) {
                console.error('Error fetching test centres:', error);
                Alert.alert('Error', 'Failed to fetch test centres');
            }
        };

        fetchTestCentres();
    }, []);

    useEffect(() => {
        const filtered = testCentres.filter((centre) => {
            const name = centre.name || '';
            const postalCode = centre.postalCode || '';
            return (
                name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                postalCode.toLowerCase().includes(searchQuery.toLowerCase())
            );
        });
        setFilteredCentres(filtered);
    }, [searchQuery, testCentres]);

    // Zmodyfikowana funkcja obsługi zaznaczania
    const handleSelect = (centre) => {
        setSelectedCentres((prev) => {
            const exists = prev.some((item) => item.name === centre.name);

            if (exists) {
                // Usuń centrum, jeśli już zostało wybrane
                return prev.filter((item) => item.name !== centre.name);
            } else {
                // Sprawdź, czy liczba wybranych centrów jest poniżej limitu
                if (prev.length >= 3) {
                    Alert.alert('Limit Reached', 'You can only select up to 3 test centres.');
                    return prev; // Nie dodawaj kolejnego centrum
                }

                // Dodaj nowe centrum
                return [...prev, { name: centre.name, postalCode: centre.postalCode }];
            }
        });
    };

    const toggleDetails = (index) => {
        setShowDetails((prev) => ({ ...prev, [index]: !prev[index] }));
    };

    const handleContinue = async () => {
        try {
            const userData = await AsyncStorage.getItem('userData');

            if (!userData) {
                Alert.alert('Error', 'User data not found in storage');
                return;
            }

            const parsedUserData = JSON.parse(userData);
            const { licenseNumber } = parsedUserData;

            const updatedUserData = {
                ...parsedUserData,
                selectedCentres,
            };

            await AsyncStorage.setItem('userData', JSON.stringify(updatedUserData));

            const response = await fetch('https://drive-test-3bee5c1b0f36.herokuapp.com/api/updateUserCentres', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ licenseNumber, selectedCentres }),
            });

            if (response.ok) {
                console.log('Selected centres saved successfully');
                navigation.navigate('TestDates');
            } else {
                console.error('Failed to save selected centres');
                Alert.alert('Error', 'Failed to save selected centres');
            }
        } catch (error) {
            console.error('Error:', error);
            Alert.alert('Error', 'An error occurred. Please try again.');
        }
    };

    const renderItem = ({ item, index }) => (
        <View style={styles.centreItem}>
            <TouchableOpacity
                style={styles.centreLabel}
                onPress={() => handleSelect(item)}
            >
                <Text
                    style={[
                        styles.centreName,
                        selectedCentres.some((centre) => centre.name === item.name) && styles.selectedText,
                    ]}
                >
                    {item.name}
                </Text>
                <TouchableOpacity onPress={() => toggleDetails(index)}>
                    <Image
                        source={require('../assets/navigation.png')}
                        style={styles.navigationIcon}
                        resizeMode="contain"
                    />
                </TouchableOpacity>
            </TouchableOpacity>
            {showDetails[index] && (
                <View style={styles.centreDetails}>
                    <Text style={styles.text}>{item.address}</Text>
                    <Text style={styles.text}>{item.postalCode}</Text>
                </View>
            )}
        </View>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Test centres</Text>
            <Text style={styles.subtitle}>Choose your test centres</Text>
            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchBox}
                    placeholder="Search test centres or type post code"
                    value={searchQuery}
                    onChangeText={(text) => setSearchQuery(text)}
                />
                <Image
                    source={require('../assets/search.png')}
                    style={styles.searchIcon}
                    resizeMode="contain"
                />
            </View>
            <FlatList
                data={filteredCentres}
                keyExtractor={(item, index) => index.toString()}
                renderItem={renderItem}
                style={styles.centresList}
            />
            {selectedCentres.length > 0 && (
                <View style={styles.continueButtonContainer}>
                    <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
                        <Text style={styles.buttonText}>Continue</Text>
                        <View style={styles.dragHandle}>
                            <Text style={styles.arrow}>&rarr;</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            )}
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
        fontSize: 32,
        fontWeight: 'bold',
        marginTop: 30,
        marginBottom: 10,
        color: '#000',
    },
    subtitle: {
        fontSize: 16,
        color: '#7d7d7d',
        marginBottom: 20,
    },
    searchContainer: {
        position: 'relative',
        marginBottom: 20,
    },
    searchBox: {
        padding: 10,
        paddingLeft: 10,
        paddingRight: 40, // Zwiększ margines po prawej, aby zrobić miejsce dla ikony
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        fontSize: 14,
    },
    searchIcon: {
        position: 'absolute',
        right: 10, // Ustawienie ikony po prawej stronie
        top: 12,
        width: 20,
        height: 20,
    },
    centresList: {
        flex: 1,
    },
    centreItem: {
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    centreLabel: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    centreName: {
        fontSize: 16,
                color: 'black',

        fontWeight: '600',
    },
    selectedText: {
        color: '#0347FF',
    },
    centreDetails: {
        marginTop: 10,
        paddingLeft: 10,
                color: 'black',

    },
       text: {
                    color: 'black',
        },
    continueButtonContainer: {
        alignItems: 'center',
        marginVertical: 20,
    },
    continueButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: 300,
        height: 50,
        backgroundColor: '#0347FF',
        borderRadius: 30,
        paddingHorizontal: 20,
    },
    buttonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },
    dragHandle: {
        width: 40,
        height: 40,
        backgroundColor: '#fff',
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    arrow: {
        color: '#0347FF',
        fontSize: 16,
    },
});

export default TestCentres;
