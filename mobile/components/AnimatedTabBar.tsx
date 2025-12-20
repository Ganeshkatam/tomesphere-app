import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { Palette } from '@/constants/Colors';

const { width } = Dimensions.get('window');
const PADDING = 20;
const TAB_WIDTH = (width - PADDING * 2) / 3;

interface AnimatedTabBarProps {
    tabs: { key: string; label: string }[];
    activeTab: string;
    onTabPress: (key: string) => void;
}

export function AnimatedTabBar({ tabs, activeTab, onTabPress }: AnimatedTabBarProps) {
    const indicatorPosition = useSharedValue(0);

    useEffect(() => {
        const activeIndex = tabs.findIndex(t => t.key === activeTab);
        indicatorPosition.value = withSpring(activeIndex * TAB_WIDTH, {
            damping: 15,
            stiffness: 150,
        });
    }, [activeTab]);

    const indicatorStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateX: indicatorPosition.value }],
        };
    });

    return (
        <View style={styles.container}>
            <View style={styles.tabTrack}>
                <Animated.View style={[styles.indicator, indicatorStyle]} />
                {tabs.map((tab) => {
                    const isActive = tab.key === activeTab;
                    return (
                        <TouchableOpacity
                            key={tab.key}
                            onPress={() => onTabPress(tab.key)}
                            style={styles.tabItem}
                            activeOpacity={0.8}
                        >
                            <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: PADDING,
        marginBottom: 20,
    },
    tabTrack: {
        flexDirection: 'row',
        height: 48,
        backgroundColor: Palette.surface1,
        borderRadius: 24,
        position: 'relative',
        borderWidth: 1,
        borderColor: Palette.surface2,
    },
    indicator: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: TAB_WIDTH,
        backgroundColor: Palette.primary,
        borderRadius: 24,
    },
    tabItem: {
        width: TAB_WIDTH,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
    },
    tabText: {
        color: Palette.textMed,
        fontWeight: '600',
        fontSize: 13,
    },
    tabTextActive: {
        color: 'white',
        fontWeight: '700',
    },
});
