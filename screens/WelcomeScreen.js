import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../styles/variables';

const WelcomeScreen = () => {
    const navigation = useNavigation();

    const handleLogin = () => {
        navigation.navigate('LoginPanel'); // Przekierowanie do komponentu logowania
    };

    const handleCreateAccount = () => {
        navigation.navigate('Login'); // Przekierowanie do komponentu tworzenia konta
    };

    return (
        <View style={styles.container}>

            <Text style={styles.title}>Welcome to Drive Test</Text>
            <Text style={styles.subtitle}>Book your driving test with ease!</Text>

            <View style={styles.buttonContainer}>
                <TouchableOpacity style={[styles.button, styles.buttonLogin]} onPress={handleLogin}>
                    <Text style={styles.buttonTextLogin}>Already have an account</Text>
                    <View style={styles.dragHandle}>
                        <Text style={styles.arrow}>&rarr;</Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.button, styles.buttonCreate]} onPress={handleCreateAccount}>
                    <Text style={styles.buttonTextCreate}>Create new account</Text>
                    <View style={styles.dragHandle}>
                        <Text style={styles.arrow}>&rarr;</Text>
                    </View>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default WelcomeScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9f9f9',
        paddingHorizontal: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logo: {
        width: 150,
        height: 150,
        resizeMode: 'contain',
    },
    title: {
        fontSize: 28,
        color: 'black',
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#7d7d7d',
        marginBottom: 40,
        textAlign: 'center',
    },
    buttonContainer: {
        width: '100%',
        maxWidth: 400,
        paddingHorizontal: 20,
    },
    button: {
        position: 'relative',
        width: '100%',
        height: 50,
        borderRadius: 30,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    buttonLogin: {
        backgroundColor: colors.main,
    },
    buttonCreate: {
        backgroundColor: 'rgba(3, 71, 255, 0.1)',
    },
    buttonTextLogin: {
        color: colors.white,
        fontWeight: '600',
        fontSize: 16,
    },
    buttonTextCreate: {
        color: colors.main,
        fontWeight: '600',
        fontSize: 16,
    },
    dragHandle: {
        position: 'relative',
        zIndex: 2,
        width: 40,
        height: 40,
        backgroundColor: colors.white,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 8,
        elevation: 2,
    },
    arrow: {
        fontSize: 16,
        color: colors.main,
    },
});
