import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Vibration, Modal, Dimensions } from 'react-native';
import * as Speech from 'expo-speech';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeOut, ZoomIn } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

// NOTE: "Touchless" Wake Word requires a Custom Development Build (EAS Build).
// In Expo Go, we must use a Trigger Button to avoid crashes.
// This UI mimics a high-end AI Agent.

export default function MobileVoiceListener() {
    const router = useRouter();
    const [isActive, setIsActive] = useState(false);
    const [simulatedInput, setSimulatedInput] = useState('');
    const [showInput, setShowInput] = useState(false);
    const [botResponse, setBotResponse] = useState('');

    const toggleAssistant = () => {
        Vibration.vibrate(50);
        setIsActive(!isActive);
        setShowInput(!isActive);
        setSimulatedInput('');
        setBotResponse('');
        if (!isActive) {
            speak("Gaka is listening.");
        }
    };

    const handleCommandSubmit = () => {
        if (!simulatedInput.trim()) return;
        handleMobileIntent(simulatedInput);
    };

    const handleMobileIntent = async (text: string) => {
        const cleanText = text.toLowerCase().replace("hey gaka", "").replace("gaka", "").trim();
        setBotResponse(`Processing: "${text}"...`);

        // Artificial delay for "Thinking" effect
        setTimeout(() => {
            // --- NAVIGATION COMMANDS ---
            if (cleanText.includes("go to") || cleanText.includes("open") || cleanText.includes("navigate")) {
                if (cleanText.includes("home") || cleanText.includes("dashboard")) {
                    executeCommand("Taking you Home", '/(tabs)');
                }
                else if (cleanText.includes("library") || cleanText.includes("my books")) {
                    executeCommand("Opening Library", '/(tabs)/library');
                }
                else if (cleanText.includes("explore") || cleanText.includes("search")) {
                    executeCommand("Opening Explore", '/(tabs)/explore');
                }
                else if (cleanText.includes("academics") || cleanText.includes("school")) {
                    executeCommand("Opening Academics", '/(tabs)/academics');
                }
                else if (cleanText.includes("profile")) {
                    executeCommand("Opening Profile", '/(tabs)/profile');
                }
                else {
                    setBotResponse("Destination unclear. Try 'Open Library'.");
                    speak("I didn't catch that destination.");
                }
            }
            else if (cleanText.includes("hello") || cleanText.includes("hi")) {
                setBotResponse("Hello, Traveler. Ready to read?");
                speak("Hello Traveler.");
            }
            else {
                setBotResponse("Command not recognized.");
                speak("I can't do that yet.");
            }
        }, 1200);
    };

    const executeCommand = (speech: string, route: string) => {
        setBotResponse("Executing...");
        speak(speech);
        setTimeout(() => {
            setIsActive(false); // Close overlay
            router.push(route as any);
        }, 1000);
    };

    const speak = (thingToSay: string) => {
        Speech.speak(thingToSay, { language: 'en', rate: 1.0 });
    };

    return (
        <>
            {/* Floating Trigger Button (Always Visible) */}
            {!isActive && (
                <Animated.View entering={ZoomIn} exiting={FadeOut} style={styles.triggerContainer}>
                    <TouchableOpacity
                        style={styles.triggerButton}
                        onPress={toggleAssistant}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={['#6366f1', '#a855f7']}
                            style={styles.gradientOrb}
                        >
                            <Ionicons name="mic" size={24} color="#fff" />
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>
            )}

            {/* Full Screen Holographic Overlay */}
            <Modal visible={isActive} transparent animationType="fade">
                <View style={styles.overlay}>
                    {/* Darkened Background */}
                    <TouchableOpacity style={styles.backdrop} onPress={toggleAssistant} />

                    <Animated.View entering={FadeIn.springify()} style={styles.hudContainer}>

                        {/* The "Brain" Orb */}
                        <View style={styles.orbContainer}>
                            <View style={[styles.orbGlow, { backgroundColor: '#6366f1' }]} />
                            <View style={[styles.orbCore, { backgroundColor: '#fff' }]} />
                        </View>

                        <Text style={styles.hudTitle}>GAKA AI</Text>
                        <Text style={styles.hudStatus}>
                            {botResponse || "Listening..."}
                        </Text>

                        {/* Text Input pretending to be Voice Stream */}
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.ghostInput}
                                placeholder="Type a command..."
                                placeholderTextColor="rgba(255,255,255,0.5)"
                                value={simulatedInput}
                                onChangeText={setSimulatedInput}
                                onSubmitEditing={handleCommandSubmit}
                                autoFocus
                                returnKeyType="go"
                            />
                            <TouchableOpacity onPress={handleCommandSubmit} style={styles.sendIcon}>
                                <Ionicons name="arrow-up-circle" size={32} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.hintText}>
                            Try "Open Library", "Go to Academics", or "Open Explore"
                        </Text>

                        <TouchableOpacity style={styles.closeButton} onPress={toggleAssistant}>
                            <Text style={styles.closeText}>Close</Text>
                        </TouchableOpacity>

                    </Animated.View>
                </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    triggerContainer: {
        position: 'absolute',
        bottom: 30,
        right: 20,
        zIndex: 999,
    },
    triggerButton: {
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 16,
        elevation: 10,
    },
    gradientOrb: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(2, 6, 23, 0.95)', // Deep Backdrop
    },
    hudContainer: {
        width: width,
        height: height * 0.6,
        backgroundColor: '#0f172a',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        alignItems: 'center',
        padding: 32,
        borderTopWidth: 1,
        borderTopColor: 'rgba(99, 102, 241, 0.3)',
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
    },
    orbContainer: {
        width: 100,
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    orbGlow: {
        position: 'absolute',
        width: 100,
        height: 100,
        borderRadius: 50,
        opacity: 0.5,
    },
    orbCore: {
        width: 20,
        height: 20,
        borderRadius: 10,
        shadowColor: '#fff',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 20,
    },
    hudTitle: {
        color: '#fff',
        fontSize: 24,
        fontWeight: '900',
        letterSpacing: 2,
        marginBottom: 8,
    },
    hudStatus: {
        color: '#a5b4fc',
        fontSize: 16,
        marginBottom: 32,
        textAlign: 'center',
    },
    inputWrapper: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    ghostInput: {
        flex: 1,
        color: '#fff',
        fontSize: 18,
    },
    sendIcon: {
        marginLeft: 12,
    },
    hintText: {
        color: '#64748b',
        fontSize: 12,
        marginBottom: 32,
    },
    closeButton: {
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    closeText: {
        color: '#94a3b8',
        fontWeight: '600',
    },
});
