import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    Button,
    StyleSheet,
    Alert,
    Image,
    ScrollView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { Platform } from 'react-native';

const Contact = () => {
    const [email, setEmail] = useState('');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const navigation = useNavigation();

    const handleSubmit = async () => {
        const notificationData = {
            text: `Support message from ${email}`,
            imageUrl: "https://example.com/assets/customer-service.png",
            date: new Date().toLocaleString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: 'numeric',
                minute: 'numeric',
                hour12: true,
            }),
            read: false,
        };

        const serverUrl = 'https://drive-test-3bee5c1b0f36.herokuapp.com';

        try {
            const response = await fetch(`${serverUrl}/api/saveNotification`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(notificationData),
            });

            if (response.ok) {
                Alert.alert('Message sent', 'Your support message has been sent successfully.');
                navigation.navigate('Home');
            } else {
                Alert.alert('Error', 'Failed to send the message. Please try again.');
            }
        } catch (error) {
            console.error('Error sending support message:', error);
            Alert.alert('Error', 'An error occurred. Please try again.');
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
                    <Icon name="chevron-left" size={24} color="#0347FF" />
                </TouchableOpacity>
                <View style={styles.headerTitles}>
                    <Image source={require('../assets/customer-service.png')} style={styles.headerImage} />
                    <Text style={styles.headerTitle}>Contact Support</Text>
                </View>
            </View>

            <View style={styles.form}>
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Email Address</Text>
                    <TextInput
                        style={styles.input}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={email}
                        onChangeText={setEmail}
                        placeholder="Enter your email"
                        required
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Subject</Text>
                    <TextInput
                        style={styles.input}
                        value={subject}
                        onChangeText={setSubject}
                        placeholder="Enter the subject"
                        required
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Message</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={message}
                        onChangeText={setMessage}
                        placeholder="Enter your message"
                        multiline
                        numberOfLines={4}
                        required
                    />
                </View>

                <Text style={styles.info}>
                    Please ensure your details are correct. By submitting this form, you agree to our terms and that your data will be used to help resolve your query.
                </Text>

                <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                    <Text style={styles.submitButtonText}>Send Message</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

export default Contact;

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: '#f9f9f9',
        paddingVertical: 20,
        paddingHorizontal: 15,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
        paddingVertical: 20,
        paddingHorizontal: 15,
    },
    headerButton: {
        marginRight: 10,
    },
    headerTitles: {
        flex: 1,
        alignItems: 'center',
    },
    headerImage: {
        width: 50,
        height: 50,
    },
    headerTitle: {
        fontSize: 20,
        color: '#0347FF',
        fontWeight: 'bold',
        marginTop: 10,
    },
    form: {
        flex: 1,
        marginTop: 20,
    },
    formGroup: {
        marginBottom: 15,
    },
    label: {
        fontSize: 16,
        color: '#333',
        marginBottom: 5,
    },
    input: {
        padding: 12,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        fontSize: 16,
    },
    textArea: {
        height: 100,
    },
    info: {
        fontSize: 14,
        color: '#666',
        marginBottom: 20,
        textAlign: 'center',
    },
    submitButton: {
        backgroundColor: '#0347FF',
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
