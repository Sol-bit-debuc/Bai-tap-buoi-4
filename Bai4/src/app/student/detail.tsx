import { Image } from 'expo-image';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { t } from '@/lib/i18n';
import { deleteStudentById, findStudentById } from '@/lib/student-storage';
import { Student } from '@/types/student';

export const options = {
  title: t.studentDetail,
};

export default function StudentDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const studentId = typeof params.id === 'string' ? params.id : '';
  const [student, setStudent] = useState<Student | null>(null);

  const loadStudent = useCallback(async () => {
    if (!studentId) {
      setStudent(null);
      return;
    }

    const foundStudent = await findStudentById(studentId);
    setStudent(foundStudent ?? null);
  }, [studentId]);

  useFocusEffect(
    useCallback(() => {
      void loadStudent();
    }, [loadStudent]),
  );

  const handleDelete = () => {
    if (!studentId || !student) {
      return;
    }

    Alert.alert(t.confirmDelete, '', [
      { text: t.no, style: 'cancel' },
      {
        text: t.yes,
        style: 'destructive',
        onPress: async () => {
          await deleteStudentById(studentId);
          Alert.alert(t.deleteSuccess);
          router.replace('/');
        },
      },
    ]);
  };

  const handleEdit = () => {
    if (!studentId) {
      return;
    }

    router.push({ pathname: '/student/form', params: { id: studentId, mode: 'edit' } });
  };

  if (!student) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>{t.studentDetail}</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Image
          source={{ uri: student.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(student.fullName) }}
          style={styles.avatar}
          contentFit="cover"
        />

        <Text style={styles.name}>{student.fullName}</Text>
        <Text style={styles.meta}>{t.id}: {student.studentCode}</Text>
        <Text style={styles.meta}>{t.emailLabel}: {student.email}</Text>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.sectionTitle}>{t.studentInfo}</Text>
        <Text style={styles.rowLabel}>{t.id}: <Text style={styles.rowValue}>{student.studentCode}</Text></Text>
        <Text style={styles.rowLabel}>{t.email}: <Text style={styles.rowValue}>{student.email}</Text></Text>
        <Text style={styles.rowLabel}>{t.createdAt}: <Text style={styles.rowValue}>{new Date(student.createdAt).toLocaleString()}</Text></Text>
        <Text style={styles.rowLabel}>{t.updatedAt}: <Text style={styles.rowValue}>{new Date(student.updatedAt).toLocaleString()}</Text></Text>
      </View>

      <View style={styles.actionRow}>
        <Pressable style={[styles.button, styles.editButton]} onPress={handleEdit}>
          <Text style={styles.buttonText}>{t.edit}</Text>
        </Pressable>
        <Pressable style={[styles.button, styles.deleteButton]} onPress={handleDelete}>
          <Text style={styles.buttonText}>{t.delete}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: '#f8fafc',
    gap: 16,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  emptyText: {
    fontSize: 18,
    color: '#334155',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 14,
    backgroundColor: '#dbeafe',
  },
  name: {
    fontSize: 26,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  meta: {
    fontSize: 15,
    color: '#475569',
    marginTop: 2,
  },
  infoBox: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 6,
  },
  rowLabel: {
    color: '#334155',
    fontSize: 15,
    fontWeight: '600',
  },
  rowValue: {
    color: '#0f172a',
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#2563eb',
  },
  deleteButton: {
    backgroundColor: '#dc2626',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
  },
});
