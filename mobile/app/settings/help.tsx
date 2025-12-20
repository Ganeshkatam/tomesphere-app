import { View, Text } from '@/components/Themed';
import { StyleSheet, TouchableOpacity, Linking, ScrollView, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

export default function HelpScreen() {
    const FAQs = [
        { icon: 'download', color: '#60a5fa', q: 'How do I download books?', a: 'Go to any book details page and click the Download button. The book will be available offline.' },
        { icon: 'flag', color: '#2dd4bf', q: 'Can I change my reading goal?', a: 'Yes, go to Profile > Reading Goals to update your annual target.' },
        { icon: 'mail', color: '#f472b6', q: 'How do I contact support?', a: 'Email us at support@tomesphere.com for assistance.' },
    ];

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <Text style={styles.title}>Help Center</Text>

                <Text style={styles.sectionTitle}>FREQUENTLY ASKED QUESTIONS</Text>
                {FAQs.map((faq, i) => (
                    <Animated.View key={i} entering={FadeInUp.delay(100 + i * 100)} style={styles.faqCard}>
                        <View style={[styles.iconBox, { backgroundColor: `${faq.color}20` }]}>
                            <Ionicons name={faq.icon as any} size={20} color={faq.color} />
                        </View>
                        <Text style={styles.question}>{faq.q}</Text>
                        <Text style={styles.answer}>{faq.a}</Text>
                    </Animated.View>
                ))}

                <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.contactBtn}
                    onPress={() => {
                        Haptics.selectionAsync();
                        Linking.openURL('mailto:support@tomesphere.com');
                    }}
                >
                    <LinearGradient
                        colors={['#6366f1', '#4f46e5']}
                        style={styles.contactGradient}
                    >
                        <Ionicons name="mail" size={20} color="#fff" />
                        <Text style={styles.contactText}>Contact Support</Text>
                    </LinearGradient>
                </TouchableOpacity>
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
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 10,
        fontWeight: '800',
        color: '#94a3b8',
        letterSpacing: 1,
        marginBottom: 16,
    },
    faqCard: {
        backgroundColor: '#1e293b',
        padding: 20,
        borderRadius: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#334155',
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    question: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 8,
    },
    answer: {
        fontSize: 14,
        color: '#94a3b8',
        lineHeight: 22,
    },
    contactBtn: {
        height: 56,
        borderRadius: 18,
        overflow: 'hidden',
        marginTop: 16,
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
    },
    contactGradient: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    contactText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '800',
    },
});
