import { View, Text, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';

export default function PlaceholderScreen() {
    return (
        <View style={styles.container}>
            <Stack.Screen options={{ title: 'Coming Soon', headerBackTitle: 'Back' }} />
            <Text style={styles.text}>Feature Coming Soon</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0f172a',
    },
    text: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
});
