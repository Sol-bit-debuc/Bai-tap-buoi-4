
import * as SQLite from "expo-sqlite";
import type { Student } from "../types/student";

// Mở cơ sở dữ liệu SQLite
const dbPromise = SQLite.openDatabaseAsync("students.db");

// Khởi tạo bảng sinh viên
export async function initDatabase() {
  const db = await dbPromise;

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      studentCode TEXT NOT NULL UNIQUE,
      fullName TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      avatar TEXT,
      major TEXT
    );
  `);
}

// Lấy danh sách sinh viên
export async function getStudents(): Promise<Student[]> {
  const db = await dbPromise;

  return await db.getAllAsync<Student>(
    "SELECT * FROM students ORDER BY id DESC"
  );
}

// Lấy sinh viên theo ID
export async function getStudentById(
  id: number
): Promise<Student | null> {
  const db = await dbPromise;

  return await db.getFirstAsync<Student>(
    "SELECT * FROM students WHERE id = ?",
    [id]
  );
}

// Thêm sinh viên
export async function addStudent(
  student: Omit<Student, "id">
) {
  const db = await dbPromise;

  return await db.runAsync(
    `INSERT INTO students
    (studentCode, fullName, email, phone, avatar, major)
    VALUES (?, ?, ?, ?, ?, ?)`,
    [
      student.studentCode,
      student.fullName,
      student.email,
      student.phone,
      student.avatar,
      student.major,
    ]
  );
}

// Cập nhật sinh viên
export async function updateStudent(
  id: number,
  student: Omit<Student, "id">
) {
  const db = await dbPromise;

  return await db.runAsync(
    `UPDATE students
     SET studentCode = ?,
         fullName = ?,
         email = ?,
         phone = ?,
         avatar = ?,
         major = ?
     WHERE id = ?`,
    [
      student.studentCode,
      student.fullName,
      student.email,
      student.phone,
      student.avatar,
      student.major,
      id,
    ]
  );
}

// Xóa sinh viên
export async function deleteStudent(id: number) {
  const db = await dbPromise;

  return await db.runAsync(
    "DELETE FROM students WHERE id = ?",
    [id]
  );
}
