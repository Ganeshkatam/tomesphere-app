import React from 'react';
import { View, Dimensions, StyleSheet, Image, Pressable, Platform } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedScrollHandler,
    useAnimatedStyle,
    interpolate,
    Extrapolation
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from './Themed';
import { Palette } from '@/constants/Colors';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = width * 0.72;
const ITEM_HEIGHT = ITEM_WIDTH * 1.5;
const SPACING = 12;

interface BookItem {
    id: string;
    title: string;
    author: string;
    cover_url: string;
    progress?: number;
}

interface ParallaxCarouselProps {
    data: BookItem[];
}

export function ParallaxCarousel({ data }: ParallaxCarouselProps) {
    const scrollX = useSharedValue(0);

    const onScroll = useAnimatedScrollHandler((event) => {
        scrollX.value = event.contentOffset.x;
    });

    if (!data.length) return null;

    return (
        <Animated.ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={ITEM_WIDTH + SPACING}
            decelerationRate="fast"
            contentContainerStyle={styles.scrollContent}
            onScroll={onScroll}
            scrollEventThrottle={16}
        >
            {data.map((item, index) => {
                const inputRange = [
                    (index - 1) * (ITEM_WIDTH + SPACING),
                    index * (ITEM_WIDTH + SPACING),
                    (index + 1) * (ITEM_WIDTH + SPACING),
                ];

                const rStyle = useAnimatedStyle(() => {
                    const scale = interpolate(
                        scrollX.value,
                        inputRange,
                        [0.9, 1, 0.9],
                        Extrapolation.CLAMP
                    );

                    const opacity = interpolate(
                        scrollX.value,
                        inputRange,
                        [0.6, 1, 0.6],
                        Extrapolation.CLAMP
                    );

                    return {
                        transform: [{ scale }],
                        opacity,
                    };
                });

                return (
                    <Animated.View key={item.id} style={[styles.itemContainer, rStyle]}>
                        <Pressable
                            onPress={() => router.push(`/book/${item.id}` as any)}
                            style={({ pressed }) => [styles.pressable, { opacity: pressed ? 0.9 : 1 }]}
                        >
                            <Image source={{ uri: item.cover_url }} style={styles.image} />

                            <LinearGradient
                                colors={['transparent', 'rgba(15,23,42,0.95)']}
                                style={styles.gradient}
                            >
                                <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
                                <Text style={styles.author} numberOfLines={1}>{item.author}</Text>

                                {item.progress !== undefined && (
                                    <View style={styles.progressContainer}>
                                        <View style={[styles.progressBar, { width: `${item.progress}%` }]} />
                                    </View>
                                )}
                                {item.progress !== undefined && (
                                    <Text style={styles.progressText}>{Math.round(item.progress)}% Complete</Text>
                                )}
                            </LinearGradient>
                        </Pressable>
                    </Animated.View>
                );
            })}
        </Animated.ScrollView>
    );
}

const styles = StyleSheet.create({
    scrollContent: {
        paddingHorizontal: (width - ITEM_WIDTH) / 2,
        paddingVertical: 20,
    },
    itemContainer: {
        width: ITEM_WIDTH,
        height: ITEM_HEIGHT,
        marginRight: SPACING,
    },
    pressable: {
        flex: 1,
        borderRadius: 24,
        overflow: 'hidden',
        backgroundColor: Palette.surface1,
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.3,
                shadowRadius: 10,
            },
            android: {
                elevation: 10,
            }
        })
    },
    image: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    gradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        paddingTop: 60,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 4,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    author: {
        fontSize: 14,
        color: '#cbd5e1',
        marginBottom: 12,
    },
    progressContainer: {
        height: 6,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: 6,
    },
    progressBar: {
        height: '100%',
        backgroundColor: Palette.primary,
        borderRadius: 3,
    },
    progressText: {
        fontSize: 12,
        color: Palette.primary,
        fontWeight: '700',
    }
});
