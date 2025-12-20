import { View, Text, FlatList, TouchableOpacity, StyleSheet, StatusBar, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp, Layout } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const MOCK_BOOKS = [
    { id: '1', title: 'Calculus', price: '$45', originalPrice: '$120', condition: 'Good', role: 'Buy' },
    { id: '2', title: 'Psychology', price: '$30', originalPrice: '$85', condition: 'Like New', role: 'Sell' },
    { id: '3', title: 'Organic Chem', price: '$55', originalPrice: '$150', condition: 'Fair', role: 'Buy' },
    { id: '4', title: 'Macro Econ', price: '$40', originalPrice: '$95', condition: 'Good', role: 'Buy' },
    { id: '5', title: 'History 101', price: '$20', originalPrice: '$60', condition: 'Poor', role: 'Buy' },
    { id: '6', title: 'Physics II', price: '$70', originalPrice: '$140', condition: 'New', role: 'Buy' },
];

export default function TextbookExchangeScreen() {
    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            <View style={styles.tabHeader}>
                <TouchableOpacity style={styles.tabActive}>
                    <LinearGradient colors={['#3b82f6', '#2563eb']} style={styles.tabGradient}>
                        <Text style={styles.tabTextActive}>MARKETPLACE</Text>
                    </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity style={styles.tabInactive}>
                    <Text style={styles.tabTextInactive}>MY LISTINGS</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={MOCK_BOOKS}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.gridContent}
                numColumns={2}
                columnWrapperStyle={styles.gridRow}
                renderItem={({ item, index }) => (
                    <Animated.View
                        entering={FadeInUp.delay(index * 100).springify()}
                        style={styles.gridItem}
                        layout={Layout.springify()}
                    >
                        <TouchableOpacity
                            style={styles.bookCard}
                            activeOpacity={0.9}
                            onPress={() => Haptics.selectionAsync()}
                        >
                            {/* Card Image Area */}
                            <View style={styles.cardImageArea}>
                                <Ionicons name="book" size={48} color="#475569" />
                                <View style={styles.priceTag}>
                                    <Text style={styles.priceText}>{item.price}</Text>
                                </View>
                            </View>

                            <View style={styles.cardInfo}>
                                <Text style={styles.bookTitle} numberOfLines={1}>{item.title}</Text>
                                <View style={styles.conditionRow}>
                                    <View style={[styles.statusDot, { backgroundColor: item.condition === 'New' ? '#10b981' : '#f59e0b' }]} />
                                    <Text style={styles.conditionText}>{item.condition}</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    </Animated.View>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
    },
    tabHeader: {
        flexDirection: 'row',
        padding: 16,
        gap: 12,
    },
    tabActive: {
        flex: 1,
        borderRadius: 16,
        overflow: 'hidden',
    },
    tabGradient: {
        paddingVertical: 12,
        alignItems: 'center',
    },
    tabInactive: {
        flex: 1,
        borderRadius: 16,
        backgroundColor: '#1e293b',
        borderWidth: 1,
        borderColor: '#334155',
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabTextActive: {
        color: '#fff',
        fontWeight: '800',
        fontSize: 12,
        letterSpacing: 1,
    },
    tabTextInactive: {
        color: '#64748b',
        fontWeight: '700',
        fontSize: 12,
        letterSpacing: 1,
    },
    gridContent: {
        paddingHorizontal: 16,
        paddingBottom: 40,
    },
    gridRow: {
        justifyContent: 'space-between',
    },
    gridItem: {
        width: '48%',
        marginBottom: 16,
    },
    bookCard: {
        backgroundColor: '#1e293b',
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#334155',
    },
    cardImageArea: {
        height: 140,
        backgroundColor: '#020617',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    priceTag: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(255,255,255,0.9)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    priceText: {
        color: '#0f172a',
        fontWeight: '800',
        fontSize: 12,
    },
    cardInfo: {
        padding: 12,
    },
    bookTitle: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
        marginBottom: 6,
    },
    conditionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    conditionText: {
        color: '#94a3b8',
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'uppercase',
    }
});
