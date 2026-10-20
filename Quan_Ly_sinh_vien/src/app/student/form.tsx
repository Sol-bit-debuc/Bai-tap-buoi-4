
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";

import {
  initDatabase,
  addStudent,
  updateStudent,
  getStudentById,
} from "../../lib/database";

export default function StudentForm() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const studentId = id ? Number(id) : null;
  const isEditing = studentId !== null;

  const [studentCode, setStudentCode] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [major, setMajor] = useState("");
  const [avatar, setAvatar] = useState("");

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Tải dữ liệu khi chỉnh sửa
  useEffect(() => {
    let active = true;

    async function loadStudent() {
      if (!isEditing) return;

      try {
        await initDatabase();

        if (!Number.isInteger(studentId)) {
          throw new Error("ID không hợp lệ");
        }

        const student = await getStudentById(studentId!);

        if (!student) {
          throw new Error("Không tìm thấy sinh viên");
        }

        if (active) {
          setStudentCode(student.studentCode);
          setFullName(student.fullName);
          setEmail(student.email ?? "");
          setPhone(student.phone ?? "");
          setMajor(student.major ?? "");
          setAvatar(student.avatar ?? "");
        }
      } catch (err) {
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
  }, [id]);

  // Chọn ảnh từ thư viện
  const pickImage = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        setError("Bạn cần cấp quyền truy cập ảnh.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        setAvatar(result.assets[0].uri);
        setError("");
      }
    } catch (err) {
      setError("Không thể chọn ảnh.");
    }
  };

  // Kiểm tra và lưu dữ liệu
  const handleSave = async () => {
    if (!studentCode.trim()) {
      setError("Vui lòng nhập mã sinh viên!");
      return;
    }

    if (!fullName.trim()) {
      setError("Vui lòng nhập họ tên!");
      return;
    }

    if (!major.trim()) {
      setError("Vui lòng nhập ngành học!");
      return;
    }

    if (
      email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ) {
      setError("Email không hợp lệ!");
      return;
    }

    setSaving(true);
    setError("");

    const studentData = {
      studentCode: studentCode.trim(),
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      avatar,
      major: major.trim(),
    };

    try {
      await initDatabase();

      if (isEditing && studentId !== null) {
        await updateStudent(studentId, studentData);
      } else {
        await addStudent(studentData);
      }

      router.replace("/");
    } catch (err) {
      console.error(err);

      const message =
        err instanceof Error ? err.message : String(err);

      if (
        message.includes("UNIQUE constraint failed")
      ) {
        setError("Mã sinh viên này đã tồn tại!");
      } else {
        setError("Không thể lưu sinh viên. Vui lòng thử lại.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>
          {isEditing ? "Sửa sinh viên" : "Thêm sinh viên"}
        </Text>

        <Text style={styles.subtitle}>
          Điền đầy đủ thông tin bên dưới
        </Text>

        <TouchableOpacity
          style={styles.avatarContainer}
          onPress={pickImage}
        >
          {avatar ? (
            <Image
              source={{ uri: avatar }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarIcon}>📷</Text>
              <Text style={styles.avatarHint}>Chọn ảnh</Text>
            </View>
          )}
        </TouchableOpacity>

        <Text style={styles.label}>Mã sinh viên *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ví dụ: BIT240205"
          value={studentCode}
          onChangeText={setStudentCode}
          autoCapitalize="characters"
        />

        <Text style={styles.label}>Họ và tên *</Text>
        <TextInput
          style={styles.input}
          placeholder="Nhập họ và tên"
          value={fullName}
          onChangeText={setFullName}
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="example@gmail.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Số điện thoại</Text>
        <TextInput
          style={styles.input}
          placeholder="Nhập số điện thoại"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>Ngành học *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ví dụ: Công nghệ thông tin"
          value={major}
          onChangeText={setMajor}
        />

        {error ? (
          <Text style={styles.error}>{error}</Text>
        ) : null}

        <TouchableOpacity
          style={[
            styles.saveButton,
            saving && styles.disabledButton,
          ]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.saveButtonText}>
              {isEditing ? "Lưu thay đổi" : "Thêm sinh viên"}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
        >
          <Text style={styles.cancelText}>Hủy bỏ</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f6fb",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    padding: 20,
    paddingBottom: 50,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#111827",
    marginTop: 15,
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 6,
    marginBottom: 24,
  },
  avatarContainer: {
    alignSelf: "center",
    marginBottom: 25,
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
    alignItems: "center",
    justifyContent: "center",
  },
  avatarIcon: {
    fontSize: 32,
  },
  avatarHint: {
    fontSize: 13,
    color: "#2563eb",
    marginTop: 5,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 13,
    fontSize: 16,
    marginBottom: 18,
    color: "#111827",
  },
  error: {
    color: "#dc2626",
    fontSize: 14,
    marginBottom: 16,
    textAlign: "center",
  },
  saveButton: {
    backgroundColor: "#2563eb",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  disabledButton: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "bold",
  },
  cancelButton: {
    padding: 16,
    alignItems: "center",
    marginTop: 10,
  },
  cancelText: {
    color: "#6b7280",
    fontSize: 16,
  },
});
