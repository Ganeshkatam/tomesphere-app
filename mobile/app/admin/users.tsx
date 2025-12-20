import { useState, useEffect } from 'react';
import {
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  StatusBar
} from 'react-native';
import { Text, View } from '@/components/Themed';
import { supabase, Profile } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

export default function AdminUsers() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<Profile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchTerm, users]);

  async function fetchUsers() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      Alert.alert('Error', 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }

  function filterUsers() {
    if (!searchTerm) {
      setFilteredUsers(users);
      return;
    }
    const term = searchTerm.toLowerCase();
    const result = users.filter(
      u =>
        u.name?.toLowerCase().includes(term) ||
        u.role?.toLowerCase().includes(term)
    );
    setFilteredUsers(result);
  }

  const renderItem = ({ item, index }: { item: Profile; index: number }) => (
    <Animated.View entering={FadeInUp.delay(50 * index)} style={styles.card}>
      <Image
        source={{ uri: item.avatar_url || 'https://via.placeholder.com/100' }}
        style={styles.avatar}
      />
      <View style={styles.info}>
        <View style={styles.header}>
          <Text style={styles.name}>{item.name || 'Unknown User'}</Text>
          {item.role === 'admin' ? (
            <LinearGradient colors={['#6366f1', '#4f46e5']} style={styles.adminBadge}>
              <Ionicons name="shield-checkmark" size={10} color="#fff" />
              <Text style={styles.adminText}>ADMIN</Text>
            </LinearGradient>
          ) : (
            <View style={styles.userBadge}>
              <Text style={styles.userBadgeText}>USER</Text>
            </View>
          )}
        </View>
        <Text style={styles.email} numberOfLines={1}>{item.id ? `ID: ${item.id.slice(0, 8)}...` : 'No ID'}</Text>
        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={12} color="#64748b" />
          <Text style={styles.date}>Joined {new Date(item.created_at).toLocaleDateString()}</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.moreBtn} onPress={() => Haptics.selectionAsync()}>
        <Ionicons name="ellipsis-vertical" size={20} color="#64748b" />
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.headerContainer}>
        <Text style={styles.pageTitle}>User Database</Text>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users by name..."
            placeholderTextColor="#64748b"
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#6366f1" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filteredUsers}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color="#334155" />
              <Text style={styles.emptyText}>No users found</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  headerContainer: {
    padding: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderRadius: 16,
    height: 56,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#1e293b',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    color: '#fff',
    fontSize: 16,
  },
  list: {
    padding: 16,
    paddingTop: 0,
    paddingBottom: 100,
  },
  card: {
    flexDirection: 'row',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#1e293b',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 18,
    marginRight: 16,
    backgroundColor: '#334155',
  },
  info: {
    flex: 1,
    gap: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  email: {
    color: '#64748b',
    fontSize: 11,
    fontFamily: 'monospace',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  date: {
    color: '#94a3b8',
    fontSize: 12,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  adminText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  userBadge: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  userBadgeText: {
    color: '#94a3b8',
    fontSize: 9,
    fontWeight: '700',
  },
  moreBtn: {
    padding: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    color: '#64748b',
    textAlign: 'center',
    marginTop: 16,
    fontSize: 14,
    fontWeight: '600',
  },
});
