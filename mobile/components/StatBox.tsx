import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Palette } from '@/constants/Colors';

interface StatBoxProps {
    label: string;
    value: string | number;
    icon?: React.ReactNode;
}

export function StatBox({ label, value, icon }: StatBoxProps) {
    return (
        <View style={styles.container}>
            <Text style={styles.value}>{value}</Text>
            <Text style={styles.label}>{label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: Palette.surface1,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Palette.surface2,
        minWidth: 100,
    },
    value: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Palette.textHigh,
        marginBottom: 4,
    },
    label: {
        fontSize: 12,
        color: Palette.textMed,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
});
