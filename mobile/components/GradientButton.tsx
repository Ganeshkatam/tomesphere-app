import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Palette } from '@/constants/Colors';

interface GradientButtonProps {
    title: string;
    onPress: () => void;
    icon?: React.ReactNode;
    style?: ViewStyle;
}

export function GradientButton({ title, onPress, icon, style }: GradientButtonProps) {
    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={style}>
            <LinearGradient
                colors={Palette.gradients.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradient}
            >
                {icon}
                <Text style={[styles.text, icon ? { marginLeft: 8 } : null]}>{title}</Text>
            </LinearGradient>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    gradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 16,
    },
    text: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
