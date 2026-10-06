import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { t } from '@/lib/i18n';
import { findStudentById, getStudents, upsertStudent } from '@/lib/student-storage';
import { Student } from '@/types/student';

type StudentFormState = {
  fullName: string;
  studentCode: string;
  email: string;
  avatar: string;
};

export const options = {
  title: t.addStudent,
};

const defaultForm = {
  fullName: '',
  studentCode: '',
  email: '',
  avatar: '',
};

export default function StudentFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; mode?: string }>();
  const studentId = typeof params.id === 'string' ? params.id : '';
  const isEditMode = params.mode === 'edit' && !!studentId;

  const [form, setForm] = useState<StudentFormState>(defaultForm);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadStudent = async () => {
      if (!isEditMode || !studentId) {
        setForm(defaultForm);
        return;
      }

      const student = await findStudentById(studentId);
      if (student) {
        setForm({
          fullName: student.fullName,
          studentCode: student.studentCode,
          email: student.email,
          avatar: student.avatar,
        });
      }
    };

    void loadStudent();
  }, [isEditMode, studentId]);

  const pageTitle = useMemo(() => (isEditMode ? t.editStudent : t.addStudent), [isEditMode]);

  const handleFieldChange = (field: keyof StudentFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSelectImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t.permissionDenied);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.length) {
      handleFieldChange('avatar', result.assets[0].uri);
    }
  };

  const validateForm = async (): Promise<boolean> => {
    const name = form.fullName.trim();
    const code = form.studentCode.trim();
    const email = form.email.trim();

    if (!name || !code || !email) {
      Alert.alert(t.fieldsRequired);
      return false;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      Alert.alert(t.invalidEmail);
      return false;
    }

    const students = await getStudents();
    const duplicate = students.some((student) => {
      const sameCode = student.studentCode.toLowerCase() === code.toLowerCase();
      return sameCode && student.id !== studentId;
    });

    if (duplicate) {
      Alert.alert(t.duplicateCode);
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    const canSave = await validateForm();
    if (!canSave) {
      return;
    }

    const confirmMessage = isEditMode ? t.confirmEdit : t.confirmSave;

    Alert.alert(confirmMessage, '', [
      { text: t.no, style: 'cancel' },
      {
        text: t.yes,
        onPress: async () => {
          setIsLoading(true);

          try {
            const now = new Date().toISOString();
            const existingStudent = studentId ? await findStudentById(studentId) : undefined;
            const nextStudent: Student = {
              id: existingStudent?.id ?? `${Date.now()}`,
              fullName: form.fullName.trim(),
              studentCode: form.studentCode.trim(),
              email: form.email.trim(),
              avatar: form.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(form.fullName.trim() || 'Student'),
              createdAt: existingStudent?.createdAt ?? now,
              updatedAt: now,
            };

            await upsertStudent(nextStudent);
            Alert.alert(isEditMode ? t.updateSuccess : t.addSuccess);
            router.replace('/');
          } finally {
            setIsLoading(false);
          }
        },
      },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.contentContainer} keyboardShouldPersistTaps="handled">
        <Text style={styles.pageTitle}>{pageTitle}</Text>

        <View style={styles.avatarBox}>
          <Image
            source={{ uri: form.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(form.fullName || 'Student') }}
            style={styles.avatar}
            contentFit="cover"
          />
          <Pressable style={styles.uploadButton} onPress={handleSelectImage}>
            <Text style={styles.uploadButtonText}>{t.chooseImage}</Text>
          </Pressable>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>{t.fullName}</Text>
          <TextInput
            style={styles.input}
            value={form.fullName}
            onChangeText={(value) => handleFieldChange('fullName', value)}
            placeholder={t.fullName}
            placeholderTextColor="#94a3b8"
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>{t.studentCode}</Text>
          <TextInput
            style={styles.input}
            value={form.studentCode}
            onChangeText={(value) => handleFieldChange('studentCode', value)}
            placeholder={t.studentCode}
            placeholderTextColor="#94a3b8"
            autoCapitalize="characters"
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>{t.email}</Text>
          <TextInput
            style={styles.input}
            value={form.email}
            onChangeText={(value) => handleFieldChange('email', value)}
            placeholder={t.email}
            placeholderTextColor="#94a3b8"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>{t.avatarUrl}</Text>
          <TextInput
            style={styles.input}
            value={form.avatar}
            onChangeText={(value) => handleFieldChange('avatar', value)}
            placeholder="https://example.com/avatar.jpg"
            placeholderTextColor="#94a3b8"
            autoCapitalize="none"
          />
        </View>

        <Pressable style={[styles.saveButton, isLoading && styles.saveButtonDisabled]} onPress={handleSubmit} disabled={isLoading}>
          <Text style={styles.saveButtonText}>{isLoading ? '...' : t.saveStudent}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  contentContainer: {
    padding: 16,
    gap: 16,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#0f172a',
  },
  avatarBox: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#dbeafe',
  },
  uploadButton: {
    backgroundColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  uploadButtonText: {
    color: '#0f172a',
    fontWeight: '600',
  },
  fieldGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: '#0f172a',
    fontSize: 16,
  },
  saveButton: {
    marginTop: 8,
    backgroundColor: '#16a34a',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
