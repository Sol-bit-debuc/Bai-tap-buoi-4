import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { t } from '@/lib/i18n';
import { getStudents } from '@/lib/student-storage';
import { Student } from '@/types/student';

export const options = {
  title: t.appName,
};

export default function StudentListScreen() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);

  const loadStudents = useCallback(async () => {
    const data = await getStudents();
    setStudents(data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadStudents();
    }, [loadStudents]),
  );

  const openDetail = (studentId: string) => {
    router.push({ pathname: '/student/detail', params: { id: studentId } });
  };

  const renderItem = ({ item }: { item: Student }) => (
    <Pressable style={styles.card} onPress={() => openDetail(item.id)}>
      <Image
        source={{ uri: item.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(item.fullName) }}
        style={styles.avatar}
        contentFit="cover"
      />
      <View style={styles.infoWrap}>
        <Text style={styles.name}>{item.fullName}</Text>
        <Text style={styles.meta}>({item.studentCode})</Text>
        <Text style={styles.meta}>{item.email}</Text>
      </View>
      <Text style={styles.actionText}>{t.viewDetails}</Text>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{t.studentList}</Text>
        <Pressable style={styles.primaryButton} onPress={() => router.push('/student/form')}>
          <Text style={styles.primaryButtonText}>{t.addStudent}</Text>
        </Pressable>
      </View>

      {students.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>{t.noStudents}</Text>
        </View>
      ) : (
        <FlatList
          data={students}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
  },
  primaryButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: 20,
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#dbeafe',
  },
  infoWrap: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  name: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '700',
  },
  meta: {
    marginTop: 4,
    color: '#475569',
    fontSize: 13,
  },
  actionText: {
    color: '#2563eb',
    fontWeight: '600',
    marginLeft: 8,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#475569',
    fontSize: 16,
    textAlign: 'center',
  },
});
