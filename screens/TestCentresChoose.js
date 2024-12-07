import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TestCentres = () => {
    const [testCentres, setTestCentres] = useState([]);
    const [filteredCentres, setFilteredCentres] = useState([]);
    const [selectedCentres, setSelectedCentres] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showDetails, setShowDetails] = useState({});
    const navigation = useNavigation();

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

    const fetchSavedCentres = async () => {
        try {
            const userData = await AsyncStorage.getItem('userData');
            if (userData) {
                const parsedUserData = JSON.parse(userData);
                console.log('Loaded user data:', parsedUserData);
                if (parsedUserData.selectedCentres) {
                    setSelectedCentres(parsedUserData.selectedCentres);
                }
            }
        } catch (error) {
            console.error('Error fetching saved centres:', error);
        }
    };

    useFocusEffect(
        useCallback(() => {
            // Pobieranie danych, gdy ekran jest aktywny
            fetchTestCentres();
            fetchSavedCentres();
        }, [])
    );

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
                navigation.navigate('HomeModule');
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
                <Icon
                    name="location-arrow"
                    size={20}
                    color="#0347FF"
                    onPress={() => toggleDetails(index)}
                />
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
                <Icon name="search" size={20} color="#000" style={styles.searchIcon} />
            </View>

            {/* Wyświetlanie wybranych centrów */}
            {selectedCentres.length > 0 && (
                <View style={styles.selectedCentresContainer}>
                    <Text style={styles.selectedTitle}>Selected Centres:</Text>
                    {selectedCentres.map((centre, index) => (
                        <View key={index} style={styles.selectedItem}>
                            <Text style={styles.selectedText}>
                                {centre.name} ({centre.postalCode})
                            </Text>
                            <TouchableOpacity onPress={() => handleSelect(centre)}>
                                <Icon name="times-circle" size={20} color="red" />
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>
            )}
            <FlatList
                data={filteredCentres}
                keyExtractor={(item, index) => index.toString()}
                renderItem={renderItem}
                style={styles.centresList}
            />
            {selectedCentres.length > 0 && (
                <View style={styles.saveButtonContainer}>
                    <TouchableOpacity style={styles.saveButton} onPress={handleContinue}>
                        <Text style={styles.buttonText}>Save</Text>
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
        paddingLeft: 40,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        fontSize: 14,
        color: '#000',
    },
    searchIcon: {
        position: 'absolute',
        left: 10,
        top: 12,
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
        fontWeight: '600',
                color: 'black',

    },
    selectedText: {
        color: '#0347FF', // Jasnoniebieski kolor
        fontWeight: 'bold',
    },

    centreDetails: {
        marginTop: 10,
        paddingLeft: 10,
                color: 'black',

    },
       text: {
                    color: 'black',
        },
    saveButtonContainer: {
        alignItems: 'center',
        marginVertical: 20,
    },
    saveButton: {
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
