import { Alert, Platform, ToastAndroid } from 'react-native';

export class AppAlert {
    static error(message: string, title: string = 'Error') {
        if (Platform.OS === 'android') {
            ToastAndroid.show(`${title}: ${message}`, ToastAndroid.LONG);
        } else {
            Alert.alert(title, message);
        }
        console.error(`[AppAlert] ${title}:`, message);
    }

    static success(message: string) {
        if (Platform.OS === 'android') {
            ToastAndroid.show(message, ToastAndroid.SHORT);
        } else {
            // iOS doesn't have native toasts, silent or custom UI would be better, 
            // but for now we avoid interrupting flow unless necessary.
            // Alert.alert('Success', message); 
            console.log(`[AppAlert] Success:`, message);
        }
    }

    static confirm(title: string, message: string, onConfirm: () => void) {
        Alert.alert(
            title,
            message,
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Confirm', style: 'destructive', onPress: onConfirm },
            ]
        );
    }
}
