import { ScrollView, StyleSheet, StatusBar } from 'react-native';
import { Text, View } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';

const PRIVACY_SECTIONS = [
    { icon: 'shield-checkmark', color: '#60a5fa', title: 'Data Collection', text: 'We collect minimal personal data necessary to provide our services, including name, email, and reading preferences.' },
    { icon: 'analytics', color: '#f472b6', title: 'Usage', text: 'Your data is used solely to personalize your reading experience and maintain your account security.' },
    { icon: 'key', color: '#2dd4bf', title: 'Your Rights', text: 'You have full control over your data. You can request deletion of your account and data at any time via the Help Center.' },
    { icon: 'lock-closed', color: '#fbbf24', title: 'Security', text: 'All data is encrypted in transit and at rest. We use industry-standard security measures to protect your information.' },
];

export default function PrivacyScreen() {
    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <Text style={styles.pageTitle}>Privacy & Security</Text>

                {PRIVACY_SECTIONS.map((section, i) => (
                    <Animated.View key={section.title} entering={FadeInUp.delay(100 + i * 100)} style={styles.sectionCard}>
                        <View style={[styles.iconBox, { backgroundColor: `${section.color}20` }]}>
                            <Ionicons name={section.icon as any} size={24} color={section.color} />
                        </View>
                        <Text style={styles.heading}>{section.title}</Text>
                        <Text style={styles.text}>{section.text}</Text>
                    </Animated.View>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
    },
    content: {
        padding: 24,
        paddingBottom: 100,
    },
    pageTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 24,
    },
    sectionCard: {
        backgroundColor: '#1e293b',
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#334155',
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    heading: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 8,
    },
    text: {
        fontSize: 14,
        color: '#94a3b8',
        lineHeight: 22,
    },
});
