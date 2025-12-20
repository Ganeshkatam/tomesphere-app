import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text as RNText } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Palette } from '@/constants/Colors';
import Animated, { FadeInRight } from 'react-native-reanimated';

export function DailyQuote() {
    return (
        <Animated.View entering={FadeInRight.delay(200)} style={styles.quoteContainer}>
            <LinearGradient
                colors={[Palette.surface1, 'rgba(30, 41, 59, 0.6)']}
                style={styles.quoteGradient}
            >
                <Ionicons name="sparkles" size={20} color={Palette.orange} style={{ marginBottom: 8 }} />
                <RNText style={styles.quoteText}>"A reader lives a thousand lives before he dies."</RNText>
                <RNText style={styles.quoteAuthor}>— George R.R. Martin</RNText>
            </LinearGradient>
        </Animated.View>
    );
}

export function StreakCard({ days = 12 }: { days?: number }) {
    return (
        <Animated.View entering={FadeInRight.delay(300)} style={styles.streakContainer}>
            <LinearGradient
                colors={[Palette.primary, '#4f46e5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.streakGradient}
            >
                <View style={styles.streakContent}>
                    <View>
                        <RNText style={styles.streakLabel}>Daily Streak</RNText>
                        <RNText style={styles.streakValue}>{days} Days</RNText>
                    </View>
                    <View style={styles.fireContainer}>
                        <Ionicons name="flame" size={28} color="#fff" />
                    </View>
                </View>
            </LinearGradient>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    quoteContainer: {
        marginBottom: 20,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: Palette.surface2,
    },
    quoteGradient: {
        padding: 20,
    },
    quoteText: {
        color: Palette.textHigh,
        fontSize: 16,
        fontStyle: 'italic',
        lineHeight: 24,
        marginBottom: 8,
    },
    quoteAuthor: {
        color: Palette.textMed,
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'right',
    },
    streakContainer: {
        height: 100,
        borderRadius: 20,
        marginBottom: 20,
        overflow: 'hidden',
        elevation: 5,
        shadowColor: Palette.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    streakGradient: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    streakContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    streakLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    streakValue: {
        color: '#fff',
        fontSize: 28,
        fontWeight: '900',
    },
    fireContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    }
});
