import { useState, useEffect, useRef } from 'react';
import { StyleSheet, FlatList, TextInput, TouchableOpacity, View, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Text } from '@/components/Themed';
import { supabase } from '@/lib/supabase';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp, Layout } from 'react-native-reanimated';
import { Palette } from '@/constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';

interface Message {
    id: string;
    content: string;
    sender_id: string;
    created_at: string;
}

export default function ChatScreen() {
    const { id } = useLocalSearchParams(); // Recipient ID
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [userId, setUserId] = useState<string | null>(null);
    const [recipient, setRecipient] = useState<any>(null);
    const [sending, setSending] = useState(false);

    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        checkAuth();
    }, []);

    async function checkAuth() {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            setUserId(user.id);
            fetchRecipient(id as string);
            fetchMessages(user.id, id as string);
            subscribeToMessages(user.id);
        }
    }

    async function fetchRecipient(recId: string) {
        const { data } = await supabase.from('profiles').select('*').eq('id', recId).single();
        setRecipient(data);
    }

    async function fetchMessages(uid: string, recId: string) {
        const { data } = await supabase
            .from('direct_messages')
            .select('*')
            .or(`and(sender_id.eq.${uid},receiver_id.eq.${recId}),and(sender_id.eq.${recId},receiver_id.eq.${uid})`)
            .order('created_at', { ascending: true });

        if (data) setMessages(data);
    }

    function subscribeToMessages(uid: string) {
        const sub = supabase
            .channel(`chat:${uid}`)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'direct_messages' },
                (payload) => {
                    const newMsg = payload.new as Message;
                    if (newMsg.sender_id === id || newMsg.sender_id === uid) {
                        setMessages((prev) => [...prev, newMsg]);
                        flatListRef.current?.scrollToEnd({ animated: true });
                    }
                }
            )
            .subscribe();

        return () => supabase.removeChannel(sub);
    }

    async function sendMessage() {
        if (!inputText.trim() || !userId) return;
        setSending(true);

        const { error } = await supabase.from('direct_messages').insert({
            sender_id: userId,
            receiver_id: id,
            content: inputText.trim()
        });

        if (!error) {
            setInputText('');
        } else {
            console.error('Send error:', error);
        }
        setSending(false);
    }

    const renderMessage = ({ item, index }: { item: Message, index: number }) => {
        const isMe = item.sender_id === userId;
        return (
            <Animated.View
                entering={FadeInUp.delay(index * 20)}
                layout={Layout.springify()}
                style={[
                    styles.msgBubble,
                    isMe ? styles.msgMe : styles.msgOther
                ]}
            >
                <Text style={isMe ? styles.textMe : styles.textOther}>{item.content}</Text>
            </Animated.View>
        );
    };

    return (
        <View style={styles.container}>
            <LinearGradient colors={[Palette.bgCanvas, Palette.surface1]} style={StyleSheet.absoluteFill} />

            {/* Custom Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={28} color="white" />
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <Text style={styles.headerName}>{recipient?.name || 'Chat'}</Text>
                    <Text style={styles.headerStatus}>Online</Text>
                </View>
                <TouchableOpacity style={styles.callBtn}>
                    <Ionicons name="call" size={24} color="white" />
                </TouchableOpacity>
            </View>

            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 0}
                style={styles.inputWrapper}
            >
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Type a message..."
                        placeholderTextColor={Palette.textMed}
                        value={inputText}
                        onChangeText={setInputText}
                        multiline
                    />
                    <TouchableOpacity
                        onPress={sendMessage}
                        disabled={sending || !inputText.trim()}
                        style={[styles.sendBtn, (!inputText.trim() || sending) && styles.sendDisabled]}
                    >
                        {sending ? <ActivityIndicator color="white" size="small" /> : <Ionicons name="send" size={20} color="white" />}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Palette.bgCanvas },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 60,
        paddingHorizontal: 16,
        paddingBottom: 16,
        backgroundColor: 'rgba(30, 41, 59, 0.8)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
        zIndex: 10
    },
    backBtn: { padding: 8 },
    headerInfo: { flex: 1, marginLeft: 12 },
    headerName: { color: 'white', fontWeight: 'bold', fontSize: 18 },
    headerStatus: { color: Palette.primary, fontSize: 12, fontWeight: '600' },
    callBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20 },

    listContent: { padding: 16, paddingBottom: 20 },

    msgBubble: {
        maxWidth: '80%',
        padding: 12,
        borderRadius: 20,
        marginBottom: 8,
    },
    msgMe: {
        alignSelf: 'flex-end',
        backgroundColor: Palette.primary,
        borderBottomRightRadius: 4,
    },
    msgOther: {
        alignSelf: 'flex-start',
        backgroundColor: Palette.surface2,
        borderBottomLeftRadius: 4,
    },
    textMe: { color: 'white', fontSize: 16 },
    textOther: { color: 'white', fontSize: 16 },

    inputWrapper: {
        padding: 16,
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Palette.surface1,
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    input: {
        flex: 1,
        color: 'white',
        fontSize: 16,
        maxHeight: 100,
        paddingVertical: 8,
    },
    sendBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Palette.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
    },
    sendDisabled: {
        backgroundColor: Palette.surface2,
        opacity: 0.5,
    }
});
