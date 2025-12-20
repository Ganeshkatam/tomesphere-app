import { Stack } from 'expo-router';

export default function AcademicsLayout() {
    return (
        <Stack screenOptions={{
            headerStyle: {
                backgroundColor: '#0f172a',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
                fontWeight: 'bold',
            },
        }}>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="study-groups" options={{ title: 'Study Groups' }} />
            <Stack.Screen name="textbooks" options={{ title: 'Textbook Exchange' }} />
            <Stack.Screen name="citations" options={{ title: 'Citations' }} />
            <Stack.Screen name="exam-prep" options={{ title: 'Exam Prep' }} />
        </Stack>
    );
}
