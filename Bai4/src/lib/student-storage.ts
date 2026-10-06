import AsyncStorage from '@react-native-async-storage/async-storage';

import { Student } from '@/types/student';

const STORAGE_KEY = 'student-manager-students';

export async function getStudents(): Promise<Student[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Failed to load students:', error);
    return [];
  }
}

export async function saveStudents(students: Student[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(students));
}

export async function upsertStudent(student: Student): Promise<void> {
  const students = await getStudents();
  const index = students.findIndex((item) => item.id === student.id);

  if (index >= 0) {
    students[index] = student;
  } else {
    students.unshift(student);
  }

  await saveStudents(students);
}

export async function deleteStudentById(id: string): Promise<void> {
  const students = await getStudents();
  const next = students.filter((student) => student.id !== id);
  await saveStudents(next);
}

export async function findStudentById(id: string): Promise<Student | undefined> {
  const students = await getStudents();
  return students.find((student) => student.id === id);
}
