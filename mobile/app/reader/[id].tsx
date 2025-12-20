import { useState, useEffect } from 'react';
import { StyleSheet, Dimensions, TouchableOpacity, ActivityIndicator, Alert, StatusBar, Platform } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import * as ExpoFileSystem from 'expo-file-system';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Sharing from 'expo-sharing';
import { supabase } from '@/lib/supabase'; // IMPORT ADDED

const FileSystem = ExpoFileSystem as any;

export default function ReaderScreen() {
    const { id, title, pdfUrl } = useLocalSearchParams<{ id: string; title: string; pdfUrl: string }>();
    const [loading, setLoading] = useState(true);
    const [showControls, setShowControls] = useState(true);
    const [downloading, setDownloading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [isDownloaded, setIsDownloaded] = useState(false);
    const [localPdfPath, setLocalPdfPath] = useState<string | null>(null);

    useEffect(() => {
        checkIfDownloaded();
        startReadingSession(); // Start session on open
        const timer = setTimeout(() => setShowControls(false), 3000);
        return () => clearTimeout(timer);
    }, []);

    async function startReadingSession() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Move to "currently_reading" if not already
            await supabase.from('reading_lists').upsert({
                user_id: user.id,
                book_id: id,
                status: 'currently_reading',
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id, book_id' }); // Ignore if exists, just update status

        } catch (e) {
            console.log('Failed to start session', e);
        }
    }

    async function finishBook() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            Alert.alert('Finish Book?', 'Mark this book as finished and earn XP?', [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Finish!', onPress: async () => {
                        // 1. Update status
                        const { error } = await supabase.from('reading_lists').upsert({
                            user_id: user.id,
                            book_id: id,
                            status: 'finished',
                            updated_at: new Date().toISOString()
                        }, { onConflict: 'user_id, book_id' });

                        if (!error) {
                            Alert.alert('Congratualtions! 🎉', 'You finished the book!');
                            router.back();
                        } else {
                            Alert.alert('Error', 'Could not update status');
                        }
                    }
                }
            ]);
        } catch (e) {
            console.log('Finish error', e);
        }
    }

    async function checkIfDownloaded() {
        try {
            const localPath = `${FileSystem.documentDirectory}books/${id}.pdf`;
            const fileInfo = await FileSystem.getInfoAsync(localPath);
            if (fileInfo.exists) {
                setIsDownloaded(true);
                setLocalPdfPath(localPath);
            }
        } catch (error) {
            console.log('Check download error', error);
        }
    }

    async function openOnAndroid() {
        try {
            if (localPdfPath) {
                const cUri = await FileSystem.getContentUriAsync(localPdfPath);
                await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
                    data: cUri,
                    flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
                    type: 'application/pdf',
                });
            } else if (pdfUrl) {
                await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
                    data: pdfUrl,
                    type: 'application/pdf',
                });
            }
        } catch (e) {
            console.log('Android Open Error:', e);
            Alert.alert('Error', 'Could not open PDF viewer. Please ensure you have a PDF reader installed.');
        }
    }

    async function downloadBook() {
        if (!pdfUrl) {
            Alert.alert('Error', 'No PDF available for this book');
            return;
        }

        setDownloading(true);
        setDownloadProgress(0);

        try {
            const safePdfUrl = encodeURI(pdfUrl);

            const booksDir = `${FileSystem.documentDirectory}books/`;
            const dirInfo = await FileSystem.getInfoAsync(booksDir);
            if (!dirInfo.exists) {
                await FileSystem.makeDirectoryAsync(booksDir, { intermediates: true });
            }

            const localPath = `${booksDir}${id}.pdf`;

            const fileInfo = await FileSystem.getInfoAsync(localPath);
            if (fileInfo.exists) {
                await FileSystem.deleteAsync(localPath, { idempotent: true });
            }

            const downloadResumable = FileSystem.createDownloadResumable(
                safePdfUrl,
                localPath,
                {},
                (downloadProgress: any) => {
                    const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
                    setDownloadProgress(Math.round(progress * 100));
                }
            );

            const result = await downloadResumable.downloadAsync();

            if (result?.uri) {
                const newFileInfo = await FileSystem.getInfoAsync(result.uri);
                if (newFileInfo.exists && newFileInfo.size > 0) {
                    setLocalPdfPath(result.uri);
                    setIsDownloaded(true);
                    Alert.alert('Success', 'Book downloaded! You can now read it offline.');
                } else {
                    throw new Error('Downloaded file is empty or missing.');
                }
            } else {
                throw new Error('Download failed to complete.');
            }
        } catch (error) {
            console.error('Download error:', error);
            Alert.alert('Download Error', 'Failed to download book. Please check your internet connection.');
        } finally {
            setDownloading(false);
        }
    }

    async function deleteDownload() {
        const localPath = `${FileSystem.documentDirectory}books/${id}.pdf`;
        try {
            await FileSystem.deleteAsync(localPath);
            setIsDownloaded(false);
            setLocalPdfPath(null);
            Alert.alert('Deleted', 'Book removed from downloads');
        } catch (error) {
            console.error('Delete error:', error);
        }
    }

    const toggleControls = () => setShowControls(!showControls);

    // Use Google Docs Viewer for Android if not local, otherwise native WebView handles PDF
    const getSource = () => {
        if (localPdfPath) {
            return { uri: localPdfPath };
        }
        if (Platform.OS === 'android') {
            return { uri: `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(pdfUrl || '')}` };
        }
        return { uri: pdfUrl || '' };
    };

    if (!pdfUrl && !localPdfPath) {
        return (
            <View style={styles.errorContainer}>
                <Ionicons name="book-outline" size={64} color="#64748b" />
                <Text style={styles.errorText}>No PDF available for this book</Text>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Text style={styles.backBtnText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (Platform.OS === 'android') {
        return (
            <View style={styles.container}>
                <View style={styles.androidContainer}>
                    <Ionicons name="document-text-outline" size={80} color="#6366f1" />
                    <Text style={styles.androidTitle}>{title}</Text>
                    <Text style={styles.androidSubtext}>
                        For the best experience on Android, we use your device's native PDF reader.
                    </Text>

                    <TouchableOpacity style={styles.primaryButton} onPress={openOnAndroid}>
                        <Ionicons name="open-outline" size={24} color="#fff" />
                        <Text style={styles.primaryButtonText}>Open Native Reader</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.secondaryButton, isDownloaded && styles.downloadedButton]}
                        onPress={isDownloaded ? () => { } : downloadBook}
                        disabled={downloading || isDownloaded}
                    >
                        {downloading ? (
                            <Text style={styles.secondaryButtonText}>Downloading {downloadProgress}%...</Text>
                        ) : (
                            <>
                                <Ionicons name={isDownloaded ? "checkmark-circle" : "download-outline"} size={20} color="#fff" />
                                <Text style={styles.secondaryButtonText}>
                                    {isDownloaded ? 'Downloaded to Device' : 'Download for Offline'}
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.secondaryButton} onPress={finishBook}>
                        <Ionicons name="checkmark-done" size={20} color="#fff" />
                        <Text style={styles.secondaryButtonText}>Mark as Finished</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <Text style={styles.backButtonText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar hidden={!showControls} />

            <View style={styles.webViewContainer}>
                <WebView
                    source={getSource()}
                    style={styles.webView}
                    originWhitelist={['*']}
                    onLoadStart={() => setLoading(true)}
                    onLoadEnd={() => setLoading(false)}
                    onError={(syntheticEvent) => {
                        const { nativeEvent } = syntheticEvent;
                        console.warn('WebView error: ', nativeEvent);
                    }}
                    scalesPageToFit={true}
                />
                <TouchableOpacity
                    style={StyleSheet.absoluteFill}
                    onPress={toggleControls}
                    activeOpacity={1}
                    pointerEvents="box-none"
                />
            </View>

            {loading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#6366f1" />
                    <Text style={styles.loadingText}>Loading book...</Text>
                </View>
            )}

            {/* Top Controls */}
            {showControls && (
                <View style={styles.topControls}>
                    <TouchableOpacity style={styles.controlButton} onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>

                    <View style={styles.titleContainer}>
                        <Text style={styles.bookTitle} numberOfLines={1}>{title || 'Reading'}</Text>
                    </View>

                    <TouchableOpacity style={[styles.controlButton, { marginRight: 8 }]} onPress={finishBook}>
                        <Ionicons name="checkmark-circle-outline" size={24} color="#22c55e" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.controlButton}
                        onPress={isDownloaded ? deleteDownload : downloadBook}
                        disabled={downloading}
                    >
                        {downloading ? (
                            <View style={styles.downloadProgress}>
                                <Text style={styles.progressText}>{Math.round(downloadProgress)}%</Text>
                            </View>
                        ) : (
                            <Ionicons
                                name={isDownloaded ? "cloud-done" : "download-outline"}
                                size={24}
                                color={isDownloaded ? "#22c55e" : "#fff"}
                            />
                        )}
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    webViewContainer: {
        flex: 1,
        position: 'relative',
    },
    webView: {
        flex: 1,
        backgroundColor: '#000',
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#fff',
        marginTop: 16,
    },
    topControls: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 50,
        paddingHorizontal: 16,
        paddingBottom: 16,
        backgroundColor: 'rgba(0,0,0,0.7)',
    },
    controlButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    titleContainer: {
        flex: 1,
        marginHorizontal: 12,
        backgroundColor: 'transparent',
    },
    bookTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    downloadProgress: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressText: {
        color: '#6366f1',
        fontSize: 10,
        fontWeight: 'bold',
    },
    bottomControls: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 16,
        paddingBottom: 40,
        paddingTop: 16,
        backgroundColor: 'rgba(0,0,0,0.7)',
    },
    pageInfo: {
        alignItems: 'center',
        marginBottom: 12,
        backgroundColor: 'transparent',
    },
    pageText: {
        color: '#fff',
        fontSize: 14,
    },
    progressBar: {
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 2,
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#6366f1',
        borderRadius: 2,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0f172a',
        padding: 24,
    },
    errorText: {
        color: '#64748b',
        marginTop: 16,
        textAlign: 'center',
    },
    backBtn: {
        marginTop: 24,
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: '#6366f1',
        borderRadius: 12,
    },
    backBtnText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    androidContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    androidTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginVertical: 16,
        textAlign: 'center',
    },
    androidSubtext: {
        color: '#94a3b8',
        textAlign: 'center',
        marginBottom: 32,
        fontSize: 16,
    },
    primaryButton: {
        flexDirection: 'row',
        backgroundColor: '#6366f1',
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
        width: '100%',
        maxWidth: 300,
        justifyContent: 'center',
    },
    primaryButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    secondaryButton: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        gap: 8,
        marginBottom: 24,
        width: '100%',
        maxWidth: 300,
        justifyContent: 'center',
    },
    downloadedButton: {
        backgroundColor: '#22c55e',
    },
    secondaryButtonText: {
        color: '#fff',
        fontSize: 16,
    },
    backButton: {
        padding: 16,
    },
    backButtonText: {
        color: '#94a3b8',
        fontSize: 16,
    },
    closeButton: {
        position: 'absolute',
        top: 50,
        right: 20,
        backgroundColor: '#fff',
        borderRadius: 20,
        zIndex: 10,
    }
});
