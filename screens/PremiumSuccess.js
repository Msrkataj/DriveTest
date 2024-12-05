// screens/PremiumSuccess.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const PremiumSuccess = () => {
    const navigation = useNavigation();

    const handleContinue = () => {
        navigation.navigate('TestCentres');
    };

    return (
        <View style={styles.container}>
            <View style={styles.iconContainer}>
                <Image
                    source={require('../assets/hexagon.png')}
                    style={{ width: 100, height: 100 }}
                    resizeMode="contain"
                />
            </View>
            <Text style={styles.subtitle}>Congratulations</Text>
            <Text style={styles.title}>You're Premium</Text>
            <Text style={styles.description}>Let's get your license now</Text>
            <TouchableOpacity style={styles.button} onPress={handleContinue}>
                <Text style={styles.buttonText}>Go to booking</Text>
                <View style={styles.dragHandle}>
                    <Text style={styles.arrow}>&rarr;</Text>
                </View>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0347FF',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    iconContainer: {
        marginBottom: 20,
    },
    subtitle: {
        fontSize: 18,
        marginBottom: 8,
        color: 'rgba(255, 255, 255, 0.7)',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#fff',
    },
    description: {
        fontSize: 14,
        marginBottom: 40,
        color: '#fff',
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: 300,
        height: 50,
        borderRadius: 30,
        backgroundColor: '#fff',
        paddingHorizontal: 20,
    },
    buttonText: {
        color: '#0347FF',
        fontWeight: '600',
        fontSize: 16,
    },
    dragHandle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#0347FF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    arrow: {
        color: '#fff',
        fontSize: 16,
    },
});

export default PremiumSuccess;
