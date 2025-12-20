import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Linking } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
// import { PorcupineManager } from '@picovoice/porcupine-react-native'; 

// Replace with actual Backend URL (LAN IP for real device, localhost for emulator)
const BACKEND_URL = 'http://10.0.2.2:8080/api/v1/gaka/intent';

export const GakaVoiceListener = () => {
    const [active, setActive] = useState(false);
    const [status, setStatus] = useState('Idle');

    const triggerListening = () => {
        setActive(true);
        setStatus('Listening...');

        // Simulating Voice Input processing
        setTimeout(() => {
            setStatus('Thinking...');
            processIntent("Open my profile settings");
        }, 1500);
    };

    const processIntent = async (text: string) => {
        try {
            const response = await fetch(BACKEND_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: text })
            });

            if (!response.ok) throw new Error('Network response was not ok');

            const data = await response.json();

            setStatus(data.tts_text || 'Done');

            if (data.nav_url) {
                setTimeout(() => {
                    setActive(false);
                    // Simple navigation mapping or use router
                    // Linking.openURL(data.nav_url); 
                    Alert.alert("Navigating", `To: ${data.nav_url}`);
                }, 1000);
            }

        } catch (error) {
            console.error(error);
            setStatus('Error connecting to Brain');
            setTimeout(() => setActive(false), 2000);
        }
    };

    if (!active) {
        // Hidden trigger area or small mic icon
        return (
            <TouchableOpacity style={styles.trigger} onPress={triggerListening}>
                <View style={styles.dot} />
            </TouchableOpacity>
        );
    }

    return (
        <View style={styles.overlay}>
            <View style={styles.card}>
                <ActivityIndicator size="large" color="#6366f1" />
                <Text style={styles.status}>{status}</Text>
                <TouchableOpacity style={styles.closeBtn} onPress={() => setActive(false)}>
                    <FontAwesome name="close" size={24} color="#666" />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    trigger: {
        position: 'absolute',
        top: 50,
        right: 20,
        padding: 10,
        zIndex: 9999,
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: 'rgba(255, 0, 0, 0.5)',
    },
    overlay: {
        padding: 24,
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 10000,
    },
    card: {
        width: '80%',
        padding: 30,
        backgroundColor: 'white',
        borderRadius: 20,
        alignItems: 'center',
        elevation: 10,
        gap: 16
    },
    status: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1e293b',
        marginTop: 10
    },
    closeBtn: {
        position: 'absolute',
        top: 10,
        right: 10,
        padding: 5
    }
});
