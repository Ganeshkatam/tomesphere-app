import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Palette } from '@/constants/Colors';
import * as Updates from 'expo-updates';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    private handleRestart = async () => {
        try {
            await Updates.reloadAsync();
        } catch (e) {
            // Fallback if expo-updates isn't available (dev mode)
            this.setState({ hasError: false, error: null });
        }
    };

    public render() {
        if (this.state.hasError) {
            return (
                <SafeAreaView style={styles.container}>
                    <View style={styles.content}>
                        <Ionicons name="alert-circle" size={64} color={Palette.coral} />
                        <Text style={styles.title}>Oops, something went wrong.</Text>
                        <Text style={styles.subtitle}>
                            {this.state.error?.message || 'An unexpected error occurred.'}
                        </Text>
                        <TouchableOpacity style={styles.button} onPress={this.handleRestart}>
                            <Text style={styles.buttonText}>Restart App</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            );
        }

        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Palette.bgCanvas,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        padding: 24,
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Palette.textHigh,
        marginTop: 16,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: Palette.textMed,
        marginTop: 8,
        textAlign: 'center',
        marginBottom: 32,
    },
    button: {
        backgroundColor: Palette.primary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
