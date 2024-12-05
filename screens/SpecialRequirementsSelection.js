import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../styles/variables';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SpecialRequirementsDetails = () => {
    const navigation = useNavigation();
    const [selectedOptions, setSelectedOptions] = useState([]);
    const [detailedInfo, setDetailedInfo] = useState('');

    useEffect(() => {
        const fetchSelectedOptions = async () => {
            try {
                const userData = await AsyncStorage.getItem('userData');
                if (userData) {
                    const parsedUserData = JSON.parse(userData);
                    const { specialNeedsOptions } = parsedUserData;

                    // Filtruj wybrane opcje, które mają wartość true
                    const selected = Object.keys(specialNeedsOptions).filter((key) => specialNeedsOptions[key]);
                    setSelectedOptions(selected);
                }
            } catch (error) {
                Alert.alert('Error', 'Failed to load your selections.');
            }
        };

        fetchSelectedOptions();
    }, []);

    const handleSubmit = async () => {
        try {
            const userData = await AsyncStorage.getItem('userData');
            if (!userData) {
                Alert.alert('Error', 'User data not found in storage');
                return;
            }

            const parsedUserData = JSON.parse(userData);

            const updatedUserData = {
                ...parsedUserData,
                detailedSpecialNeedsInfo: detailedInfo,
            };

            await AsyncStorage.setItem('userData', JSON.stringify(updatedUserData));

            navigation.navigate('Login'); // Przekierowanie do kolejnej strony po zapisaniu informacji
        } catch (error) {
            Alert.alert('Error', 'Failed to save your information. Please try again.');
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
            <Text style={styles.title}>Further information about your special requirements:</Text>
            <Text style={styles.subtitle}>We need to know a little more about some of the special requirements that you have.</Text>

            {selectedOptions.length > 0 ? (
                <View>
                    <Text style={styles.sectionTitle}>Special Requirements Selected:</Text>
                    <View style={styles.selectedOptionsContainer}>
                        {selectedOptions.map((option, index) => (
                            <Text key={index} style={styles.selectedOptionText}>
                                • {getSpecialNeedLabel(option)}
                            </Text>
                        ))}
                    </View>

                    <Text style={styles.label}>Please provide more information about the special requirements above (max 300 characters, including spaces):</Text>
                    <TextInput
                        style={styles.textArea}
                        multiline={true}
                        numberOfLines={5}
                        maxLength={300}
                        value={detailedInfo}
                        onChangeText={setDetailedInfo}
                    />

                    <TouchableOpacity style={styles.button} onPress={handleSubmit}>
                        <Text style={styles.buttonText}>Submit</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <Text style={styles.noSelectionText}>No special requirements selected.</Text>
            )}
        </ScrollView>
    );
};

const getSpecialNeedLabel = (option) => {
    const labels = {
        welshExaminer: 'Welsh Speaking Examiner',
        alternateName: 'Different Name Preference',
        pregnant: 'Heavily Pregnant',
        movementRestriction: 'Movement Restriction',
        dyslexia: 'Dyslexia',
        epilepsy: 'Epilepsy',
        missingLimbs: 'Missing Limbs',
        paraplegia: 'Paraplegia',
        specialLearning: 'Special Learning Needs',
        nonRestriction: 'No Movement Restriction',
        hardOfHearing: 'Hard of Hearing',
        deaf: 'Profoundly Deaf',
    };
    return labels[option] || '';
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f7f7f7',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 40,
        paddingBottom: 60,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.main3,
        marginBottom: 16,
    },
    subtitle: {
        fontSize: 16,
        color: colors.gray,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.main3,
        marginBottom: 10,
    },
    selectedOptionsContainer: {
        marginBottom: 20,
    },
    selectedOptionText: {
        fontSize: 16,
        color: colors.main3,
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.main3,
        marginBottom: 10,
    },
    textArea: {
        height: 100,
        borderColor: '#ddd',
        borderWidth: 1,
        borderRadius: 8,
        padding: 10,
        fontSize: 16,
        marginBottom: 20,
        backgroundColor: '#fff',
    },
    button: {
        backgroundColor: colors.main,
        borderRadius: 8,
        paddingVertical: 15,
        alignItems: 'center',
        marginTop: 20,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    noSelectionText: {
        fontSize: 16,
        color: colors.gray,
        textAlign: 'center',
    },
});

export default SpecialRequirementsDetails;
