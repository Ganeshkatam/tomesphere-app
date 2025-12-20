import { StyleSheet, Linking, TouchableOpacity, StatusBar, ScrollView } from 'react-native';
import { Text, View } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

export default function AboutScreen() {
    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <Animated.View entering={FadeInUp.delay(100)} style={styles.logoContainer}>
                    <View style={styles.logoCircle}>
                        <Ionicons name="book" size={56} color="#6366f1" />
                    </View>
                    <Text style={styles.appName}>TomeSphere</Text>
                    <Text style={styles.version}>Version 2.5.0 (Neo-Bento)</Text>
                </Animated.View>

                <Animated.View entering={FadeInUp.delay(200)} style={styles.descriptionCard}>
                    <Text style={styles.description}>
                        TomeSphere is your ultimate companion for reading tracking and book discovery.
                        Built with modern web and mobile technologies to provide a seamless experience across all your devices.
                    </Text>
                </Animated.View>

                <View style={styles.footer}>
                    <Text style={styles.copyright}>© 2025 TomeSphere. All rights reserved.</Text>

                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => {
                            Haptics.selectionAsync();
                            Linking.openURL('https://tomesphere.com');
                        }}
                        style={styles.linkBtn}
                    >
                        <LinearGradient colors={['#6366f1', '#4f46e5']} style={styles.linkGradient}>
                            <Ionicons name="globe-outline" size={18} color="white" />
                            <Text style={styles.linkText}>Visit Website</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
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
        alignItems: 'center',
        flexGrow: 1,
    },
    logoContainer: {
        alignItems: 'center',
        marginTop: 32,
        marginBottom: 32,
    },
    logoCircle: {
        width: 110,
        height: 110,
        borderRadius: 35,
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'rgba(99, 102, 241, 0.2)',
        marginBottom: 16,
    },
    appName: {
        fontSize: 32,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: 1,
    },
    version: {
        fontSize: 14,
        color: '#94a3b8',
        marginTop: 8,
        fontWeight: '600',
    },
    descriptionCard: {
        backgroundColor: '#1e293b',
        padding: 24,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#334155',
        width: '100%',
    },
    description: {
        color: '#cbd5e1',
        fontSize: 15,
        lineHeight: 24,
        textAlign: 'center',
    },
    footer: {
        marginTop: 'auto',
        alignItems: 'center',
        gap: 16,
        paddingBottom: 32,
    },
    copyright: {
        color: '#475569',
        fontSize: 12,
        fontWeight: '600',
    },
    linkBtn: {
        height: 48,
        borderRadius: 14,
        overflow: 'hidden',
        paddingHorizontal: 24,
    },
    linkGradient: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingHorizontal: 24,
    },
    linkText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
    },
});
