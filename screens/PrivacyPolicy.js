import React from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

const PrivacyPolicy = () => {
    const navigation = useNavigation();

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
            >
                <Text style={styles.backButtonText}>&larr; Back</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Terms of Use</Text>
            <View style={styles.content}>
                <View style={styles.section}>
                    <Text style={styles.heading}>1. Definitions:</Text>
                    <Text style={styles.text}>
                        <Text style={styles.bold}>Service Provider</Text> – dane firmy.
                    </Text>
                    <Text style={styles.text}>
                        <Text style={styles.bold}>User</Text> – any person using the Mobile Application.
                    </Text>
                    <Text style={styles.text}>
                        <Text style={styles.bold}>Mobile Application</Text> – the mobile application called "Driving Test Dates".
                    </Text>
                    <Text style={styles.text}>
                        <Text style={styles.bold}>Services</Text> – services available to the User in the Mobile Application.
                    </Text>
                    <Text style={styles.text}>
                        <Text style={styles.bold}>Terms of Use</Text> – these Terms of Use of the mobile application called "Driving Test Dates".
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.heading}>2. General provisions:</Text>
                    <Text style={styles.text}>
                        The Terms of Use specify the rights, obligations and restrictions regarding the use of the Mobile
                        Application. By accessing the Mobile App and/or using all or some of the Services, you agree to
                        these Terms of Use and that you agree to be bound by them.
                    </Text>
                    <Text style={styles.text}>
                        The mobile application is intended for personal, non-commercial use, for informational purposes
                        only. The User may not use the Mobile Application or any of other intellectual property for
                        commercial or business purposes, including marketing, advertising, offers to sell or promote products or services.
                    </Text>
                    <Text style={styles.text}>
                        The Service Provider may change the Terms of Use at any time by posting changes online. It is the
                        User's responsibility to review the information published online regularly to become aware of such
                        changes in a timely manner. If the User continues to use the Mobile Application after changes are
                        posted online, it means that the User accepts the Terms of Use as amended.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.heading}>3. Access to the Mobile Application:</Text>
                    <Text style={styles.text}>
                        The Mobile Application can be accessed free of charge by any User from anywhere with Internet
                        access. Any costs incurred by the User to access the service (telephone, software, Internet connection, etc.) are the responsibility of the User.
                    </Text>
                    <Text style={styles.text}>
                        In order to access the Mobile Application, the User must have a mobile device with Internet access
                        equipped with the iOS system in the minimum version ... or Android in the minimum version ....
                    </Text>
                    <Text style={styles.text}>
                        If the User accesses the Mobile Application via a mobile network, their operator or roaming service provider determines the rates and fees for messages, data transfer, and other services.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.heading}>4. User Obligations:</Text>
                    <Text style={styles.text}>
                        When using the Mobile Application, each User undertakes not to disturb public order and to comply with
                        applicable laws, respect the rights of third parties and the provisions of these Terms of Use.
                    </Text>
                    <Text style={styles.text}>
                        Each User is obliged to:
                        {'\n'}- use the Mobile Application in accordance with its intended purpose,
                        {'\n'}- not change the purpose of the Mobile Application towards committing crimes, offences or
                        offences punishable under criminal or other law,
                        {'\n'}- not seek to weaken the automated data processing systems implemented in the Mobile
                        Application.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.heading}>5. Limitation of responsibility:</Text>
                    <Text style={styles.text}>
                        The Service Provider makes every effort to ensure that the Mobile Application is available 24/7, regardless
                        of the maintenance work carried out on it. In this respect, the Service Provider has the right to suspend
                        access to all or part of the Mobile Application to carry out maintenance work and/or make improvements.
                    </Text>
                    <Text style={styles.text}>
                        The Mobile Application and all services are provided on an "AS IS" and "AS AVAILABLE" basis without
                        any representations or warranties.
                    </Text>
                </View>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: '#f9f9f9',
    },
    backButton: {
        marginBottom: 20,
    },
    backButtonText: {
        fontSize: 16,
        color: '#0347FF',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#0347FF',
        textAlign: 'center',
        marginBottom: 20,
    },
    content: {
        marginTop: 10,
    },
    section: {
        marginBottom: 20,
    },
    heading: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0347FF',
        marginBottom: 10,
    },
    text: {
        fontSize: 14,
        color: '#333',
        lineHeight: 20,
        marginBottom: 10,
    },
    bold: {
        fontWeight: 'bold',
    },
});

export default PrivacyPolicy;
