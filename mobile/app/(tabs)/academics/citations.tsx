import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, StatusBar } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

export default function CitationsScreen() {
    const [style, setStyle] = useState('APA');
    const [query, setQuery] = useState('');

    const stylesList = ['APA', 'MLA', 'Chicago', 'Harvard'];
    const mockHistory = [
        { id: 1, title: 'The Great Gatsby', style: 'APA 7', date: '2 mins ago' },
        { id: 2, title: 'Dune: Messiah', style: 'MLA 9', date: '1 hour ago' },
    ];

    return (
        <View style={appStyles.container}>
            <StatusBar barStyle="light-content" />
            <Stack.Screen options={{
                title: 'Citation Machine',
                headerShown: true,
                headerStyle: { backgroundColor: '#0f172a' },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: '800' }
            }} />

            <ScrollView contentContainerStyle={appStyles.content}>

                {/* Style Selector */}
                <View style={appStyles.selectorRow}>
                    {stylesList.map((s) => (
                        <TouchableOpacity
                            key={s}
                            onPress={() => {
                                Haptics.selectionAsync();
                                setStyle(s);
                            }}
                            style={[appStyles.pill, style === s && appStyles.pillActive]}
                        >
                            <Text style={[appStyles.pillText, style === s && appStyles.pillTextActive]}>{s}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Input Area */}
                <Animated.View entering={FadeInDown.delay(100)} style={appStyles.inputCard}>
                    <Text style={appStyles.label}>ENTER URL OR ISBN</Text>
                    <View style={appStyles.inputRow}>
                        <Ionicons name="link" size={20} color="#94a3b8" />
                        <TextInput
                            style={appStyles.input}
                            placeholder="paste link here..."
                            placeholderTextColor="#64748b"
                            value={query}
                            onChangeText={setQuery}
                        />
                    </View>
                    <TouchableOpacity
                        style={appStyles.generateBtn}
                        onPress={() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)}
                    >
                        <LinearGradient
                            colors={['#f97316', '#fb923c']}
                            style={appStyles.btnGradient}
                        >
                            <Text style={appStyles.btnText}>GENERATE CITATION</Text>
                            <Ionicons name="sparkles" size={18} color="white" />
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>

                {/* History */}
                <Text style={appStyles.sectionTitle}>RECENT HISTORY</Text>
                {mockHistory.map((item, i) => (
                    <Animated.View key={item.id} entering={FadeInDown.delay(200 + i * 100)}>
                        <TouchableOpacity style={appStyles.historyCard}>
                            <View style={appStyles.iconBox}>
                                <Text style={appStyles.iconText}>{item.style.charAt(0)}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={appStyles.historyTitle}>{item.title}</Text>
                                <Text style={appStyles.historyMeta}>{item.style} • {item.date}</Text>
                            </View>
                            <Ionicons name="copy-outline" size={20} color="#64748b" />
                        </TouchableOpacity>
                    </Animated.View>
                ))}

            </ScrollView>
        </View>
    );
}

const appStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
    },
    content: {
        padding: 24,
    },
    selectorRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 32,
    },
    pill: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: '#1e293b',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    pillActive: {
        backgroundColor: '#334155',
        borderColor: '#f97316',
    },
    pillText: {
        color: '#94a3b8',
        fontWeight: '600',
    },
    pillTextActive: {
        color: '#fff',
        fontWeight: '800',
    },
    inputCard: {
        backgroundColor: '#1e293b',
        borderRadius: 24,
        padding: 24,
        marginBottom: 40,
        borderWidth: 1,
        borderColor: '#334155',
    },
    label: {
        color: '#94a3b8',
        fontSize: 10,
        fontWeight: '800',
        marginBottom: 12,
        letterSpacing: 1,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0f172a',
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 56,
        marginBottom: 24,
    },
    input: {
        flex: 1,
        marginLeft: 12,
        color: '#fff',
        fontSize: 16,
    },
    generateBtn: {
        height: 56,
        borderRadius: 16,
        overflow: 'hidden',
    },
    btnGradient: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    btnText: {
        color: '#fff',
        fontWeight: '800',
        fontSize: 14,
        letterSpacing: 1,
    },
    sectionTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 16,
    },
    historyCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1e293b',
        padding: 16,
        borderRadius: 20,
        marginBottom: 12,
        gap: 16,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#334155',
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconText: {
        color: '#f97316',
        fontWeight: '900',
        fontSize: 16,
    },
    historyTitle: {
        color: '#fff',
        fontWeight: '700',
        marginBottom: 4,
    },
    historyMeta: {
        color: '#64748b',
        fontSize: 12,
    }
});
