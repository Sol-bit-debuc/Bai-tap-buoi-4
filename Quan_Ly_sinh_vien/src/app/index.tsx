
import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";

import {
  initDatabase,
  getStudents,
} from "../lib/database";

import type { Student } from "../types/student";

export default function HomeScreen() {
  const router = useRouter();

  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Tải dữ liệu khi màn hình được mở
  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadStudents() {
        try {
          setLoading(true);
          setError("");

          await initDatabase();
          const data = await getStudents();

          if (active) {
            setStudents(data);
          }
        } catch (err) {
          console.error(err);

          if (active) {
            setError("Không thể tải danh sách sinh viên.");
          }
        } finally {
          if (active) {
            setLoading(false);
          }
        }
      }

      loadStudents();

      return () => {
        active = false;
      };
    }, [])
  );

  // Tìm kiếm theo họ tên hoặc mã sinh viên
  const filteredStudents = students.filter((student) => {
    const keyword = search.toLowerCase().trim();

    return (
      student.fullName.toLowerCase().includes(keyword) ||
      student.studentCode.toLowerCase().includes(keyword)
    );
  });

  // Hiển thị từng sinh viên
  const renderStudent = ({ item }: { item: Student }) => (
    <TouchableOpacity
      style={styles.studentCard}
      onPress={() =>
        router.push({
          pathname: "/student/[id]",
          params: { id: String(item.id) },
        })
      }
    >
      {item.avatar ? (
        <Image
          source={{ uri: item.avatar }}
          style={styles.avatar}
        />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>
            {item.fullName.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}

      <View style={styles.studentInfo}>
        <Text style={styles.studentName}>
          {item.fullName}
        </Text>

        <Text style={styles.studentCode}>
          MSSV: {item.studentCode}
        </Text>

        <Text style={styles.studentMajor}>
          {item.major}
        </Text>
      </View>

      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          Quản lý sinh viên
        </Text>

        <Text style={styles.subtitle}>
          MSSV: BIT240205
        </Text>
      </View>

      <TextInput
        style={styles.searchInput}
        placeholder="Tìm kiếm sinh viên..."
        placeholderTextColor="#999"
        value={search}
        onChangeText={setSearch}
      />

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#2563eb"
          style={styles.loading}
        />
      ) : error ? (
        <Text style={styles.emptyText}>{error}</Text>
      ) : (
        <FlatList
          data={filteredStudents}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderStudent}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {search
                ? "Không tìm thấy sinh viên."
                : "Chưa có sinh viên nào.\nHãy thêm sinh viên mới!"}
            </Text>
          }
        />
      )}

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => router.push("/student/form")}
      >
        <Text style={styles.addButtonText}>＋</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f6fb",
  },

  header: {
    backgroundColor: "#2563eb",
    paddingTop: 60,
    paddingBottom: 25,
    paddingHorizontal: 20,
  },

  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#ffffff",
  },

  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: "#dbeafe",
  },

  searchInput: {
    backgroundColor: "#ffffff",
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
    flexGrow: 1,
  },

  studentCard: {
    backgroundColor: "#ffffff",
    padding: 15,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    elevation: 2,
  },

  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },

  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#bfdbfe",
    alignItems: "center",
    justifyContent: "center",
  },

  avatarText: {
    fontSize: 25,
    fontWeight: "bold",
    color: "#1d4ed8",
  },

  studentInfo: {
    flex: 1,
    marginLeft: 15,
  },

  studentName: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#111827",
  },

  studentCode: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
  },

  studentMajor: {
    fontSize: 13,
    color: "#2563eb",
    marginTop: 4,
  },

  arrow: {
    fontSize: 30,
    color: "#9ca3af",
  },

  emptyText: {
    textAlign: "center",
    marginTop: 70,
    fontSize: 16,
    color: "#6b7280",
    lineHeight: 26,
  },

  loading: {
    marginTop: 70,
  },

  addButton: {
    position: "absolute",
    bottom: 30,
    right: 25,
    backgroundColor: "#2563eb",
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
  },

  addButtonText: {
    fontSize: 32,
    color: "#ffffff",
    fontWeight: "bold",
  },
});
