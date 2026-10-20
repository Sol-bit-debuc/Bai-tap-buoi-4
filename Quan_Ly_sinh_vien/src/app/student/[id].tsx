
import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  ActivityIndicator,
} from "react-native";
import {
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from "expo-router";

import {
  getStudentById,
  deleteStudent,
  initDatabase,
} from "../../lib/database";

import type { Student } from "../../types/student";

export default function StudentDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadStudent() {
        try {
          setLoading(true);
          setError("");

          const studentId = Number(id);

          if (!Number.isInteger(studentId) || studentId <= 0) {
            throw new Error("ID không hợp lệ");
          }

          await initDatabase();
          const data = await getStudentById(studentId);

          if (active) {
            setStudent(data);
          }
        } catch (err) {
          console.error(err);
          if (active) {
            setError("Không thể tải thông tin sinh viên.");
          }
        } finally {
          if (active) setLoading(false);
        }
      }

      loadStudent();

      return () => {
        active = false;
      };
    }, [id])
  );

  const handleEdit = () => {
    router.push({
      pathname: "/student/form",
      params: { id: String(id) },
    });
  };

  const confirmDelete = () => {
    if (deleting) return;

    const performDelete = async () => {
      try {
        setDeleting(true);
        await deleteStudent(Number(id));
        router.replace("/");
      } catch (err) {
        console.error(err);
        setError("Không thể xóa sinh viên.");
        setDeleting(false);
      }
    };

    if (Platform.OS === "web") {
      // Xác nhận trên trình duyệt
      if (globalThis.confirm("Bạn có chắc muốn xóa sinh viên này?")) {
        void performDelete();
      }
    } else {
      Alert.alert(
        "Xác nhận xóa",
        "Bạn có chắc muốn xóa sinh viên này?",
        [
          { text: "Hủy", style: "cancel" },
          {
            text: "Xóa",
            style: "destructive",
            onPress: () => void performDelete(),
          },
        ]
      );
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!student) {
    return (
      <View style={styles.center}>
        <Text>{error || "Không tìm thấy sinh viên."}</Text>
        <TouchableOpacity onPress={() => router.replace("/")}>
          <Text style={styles.backLink}>Quay về danh sách</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.title}>Chi tiết sinh viên</Text>

      <View style={styles.card}>
        {student.avatar ? (
          <Image
            source={{ uri: student.avatar }}
            style={styles.avatar}
          />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarLetter}>
              {student.fullName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}

        <Text style={styles.name}>{student.fullName}</Text>
        <Text style={styles.code}>{student.studentCode}</Text>

        <View style={styles.divider} />

        <InfoRow label="Mã sinh viên" value={student.studentCode} />
        <InfoRow label="Họ và tên" value={student.fullName} />
        <InfoRow label="Email" value={student.email} />
        <InfoRow label="Số điện thoại" value={student.phone} />
        <InfoRow label="Ngành học" value={student.major} />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity
        style={styles.editButton}
        onPress={handleEdit}
      >
        <Text style={styles.buttonText}>✏️ Sửa thông tin</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.deleteButton, deleting && { opacity: 0.5 }]}
        onPress={confirmDelete}
        disabled={deleting}
      >
        <Text style={styles.buttonText}>
          {deleting ? "Đang xóa..." : "🗑️ Xóa sinh viên"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.replace("/")}
      >
        <Text style={styles.backText}>Quay lại danh sách</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value?: string;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || "Chưa cập nhật"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f6fb",
  },
  content: {
    padding: 20,
    paddingBottom: 50,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#fff",
    padding: 22,
    borderRadius: 16,
    alignItems: "center",
    elevation: 2,
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
  },
  avatarPlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#dbeafe",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarLetter: {
    fontSize: 42,
    fontWeight: "bold",
    color: "#2563eb",
  },
  name: {
    fontSize: 23,
    fontWeight: "bold",
    marginTop: 15,
    color: "#111827",
  },
  code: {
    fontSize: 15,
    color: "#6b7280",
    marginTop: 5,
  },
  divider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    width: "100%",
    marginVertical: 20,
  },
  infoRow: {
    width: "100%",
    marginBottom: 15,
  },
  infoLabel: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "500",
    color: "#111827",
  },
  editButton: {
    backgroundColor: "#2563eb",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 22,
  },
  deleteButton: {
    backgroundColor: "#dc2626",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
  backButton: {
    alignItems: "center",
    padding: 16,
    marginTop: 10,
  },
  backText: {
    color: "#6b7280",
    fontSize: 15,
  },
  backLink: {
    color: "#2563eb",
    marginTop: 15,
  },
  error: {
    color: "#dc2626",
    textAlign: "center",
    marginTop: 15,
  },
});
