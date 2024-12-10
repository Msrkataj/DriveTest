import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome';

const Terms = () => {
  const navigation = useNavigation();

  return (
      <ScrollView style={styles.container}>
        <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.navigate('Settings')}
        >
          <Icon name="chevron-left" size={20} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>PRIVACY POLICY</Text>
        <View style={styles.content}>
          <Section title="1. General information.">
            <Text style={styles.paragraph}>
              The Privacy Policy covers the services offered on the Mobile Application called “Driving Test Dates”. The
              Privacy Policy does not cover the services offered on the Mobile Application that are provided by third
              parties. These companies have their own privacy and cookie policies, so please remember that the
              information you provide to them will be subject to their policies, not ours.
            </Text>
          </Section>
          <Section title="2. What types of personal data do we collect in the Mobile Application?">
            <Text style={styles.paragraph}>
              We may ask you to provide your name, contact details, date of birth or other details, depending on the
              services you use.
            </Text>
            <Text style={styles.paragraph}>
              We automatically collect certain technical information from the devices you use. This information may
              include IP (Internet Protocol) address, device identifier, application identifier.
            </Text>
            <Text style={styles.paragraph}>
              We collect information about your location when you use our services. This helps us determine if you are in
              a location where the services are available and helps us offer additional features when you use our
              services. The type of location data (for example, country, region or city) collected depends on the service
              you use, the device you use (for example, Apple or Android), and your device settings (whether permissions
              are turned on or off). You can change which permissions you have turned on or off at any time in your device
              settings.
            </Text>
          </Section>
          <Section title="3. How do we use the information collected?">
            <Text style={styles.paragraph}>
              We will only use your personal data when the law allows us to do so. Most commonly, we will use your
              personal data in the following circumstances:
            </Text>
            <Text style={styles.paragraph}>
              - to perform our contract with you;
              {"\n"}- to process your enquiries and respond to your requests;
              {"\n"}- to provide you with offers related to the Services and additional marketing materials where you
              have consented to receive marketing from us;
              {"\n"}- where we need to comply with a legal obligation;
              {"\n"}- where it is necessary for our legitimate interests (or those of a third party);
              {"\n"}- where we need to protect your interests (or the interests of someone else);
              {"\n"}- where it is needed in the public interest or for official purposes.
            </Text>
          </Section>
          <Section title="4. How long do we store personal data?">
            <Text style={styles.paragraph}>
              We will only retain your personal information for as long as necessary to fulfill the purposes for which we
              collected it. Most often, we will delete your information when you stop using our services, e.g., uninstall
              the mobile application and delete your account.
            </Text>
            <Text style={styles.paragraph}>
              In some circumstances, we may anonymize your personal information so that it can no longer be associated
              with you, in which case we may use such information without further notice to you.
            </Text>
          </Section>
          <Section title="5. Where do we store personal data?">
            <Text style={styles.paragraph}>
              We may store your personal data on our own servers as well as those operated by third party data hosting
              providers.
            </Text>
          </Section>
          <Section title="6. Who do we share your personal data with?">
            <Text style={styles.paragraph}>
              Automated decision-making or profiling occurs when an electronic system uses personal data to decide
              without human intervention. We may use automated decision-making in the following circumstances:
            </Text>
            <Text style={styles.paragraph}>
              - Where it is necessary to perform a contract with you and appropriate measures are in place to protect
              your rights.
              {"\n"}- In limited circumstances, with your express written consent and where appropriate, measures are in
              place to protect your rights.
            </Text>
          </Section>
          <Section title="What are your rights?">
            <Text style={styles.paragraph}>
              You have the right to:
              {"\n"}- receive a copy of the information we have collected about you,
              {"\n"}- block automated important decisions about you,
              {"\n"}- ask us to correct inaccurate information, delete it or ask us to only use it for specific purposes,
              {"\n"}- change your mind and ask us to stop using your information.
            </Text>
          </Section>
          <Section title="How will I find out about changes to the Privacy Policy?">
            <Text style={styles.paragraph}>
              We occasionally update this policy. If we make important changes, such as how we use your personal
              information, we will notify you.
            </Text>
          </Section>
          <Section title="How can you contact us?">
            <Text style={styles.paragraph}>
              For any other questions or comments about this policy, please email us at ... .
            </Text>
          </Section>
        </View>
      </ScrollView>
  );
};

const Section = ({ title, children }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    padding: 20,
  },
  backButton: {
    marginBottom: 20,
    padding: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  content: {
    paddingBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f73b7',
    marginBottom: 10,
  },
  paragraph: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
});

export default Terms;
