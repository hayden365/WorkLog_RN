import React, { useRef } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { WorkSession } from "../models/WorkSession";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FontAwesome, Ionicons, Feather, Entypo } from "@expo/vector-icons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useScheduleManager } from "../hooks/useScheduleManager";

interface ScheduleModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (session: WorkSession) => void;
  sessionId?: string;
}

const ScheduleModal = ({
  visible,
  onClose,
  onSave,
  sessionId,
}: ScheduleModalProps) => {
  const { getScheduleById } = useScheduleManager();
  const session = sessionId ? getScheduleById(sessionId) : undefined;

  const scrollViewRef = useRef<ScrollView>(null);

  const insets = useSafeAreaInsets();

  if (!session) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
    >
      <View
        style={[
          styles.areaContainer,
          { paddingTop: insets.top, paddingBottom: insets.bottom },
        ]}
      >
        <View style={[styles.headerContainer]}>
          <TouchableOpacity onPress={onClose}>
            <Feather name="x" size={22} color="black" />
          </TouchableOpacity>

          <View style={{ flexDirection: "row", gap: 22 }}>
            <TouchableOpacity style={styles.saveButton}>
              <MaterialCommunityIcons name="pencil" size={22} color="black" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton}>
              <Ionicons name="trash-outline" size={22} color="black" />
            </TouchableOpacity>
          </View>
        </View>
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.container}
        >
          {/* 근무지 */}
          <View style={{ gap: 12 }}>
            <View style={styles.inputGroup}>
              <View
                style={[
                  styles.inputLabel,
                  {
                    width: 24,
                    height: 24,
                    backgroundColor: session.color,
                    borderRadius: 10,
                  },
                ]}
              />
              <Text style={styles.readOnlyText}>{session.jobName}</Text>
            </View>
          </View>
          <View style={{ borderBottomWidth: 1, borderColor: "#ddd" }} />
          {/* 시급 */}
          <View style={{ gap: 12 }}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                <Ionicons name="cash-outline" size={24} color="black" />
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  flex: 1,
                  gap: 10,
                }}
              >
                <FontAwesome name="won" size={16} color="black" />
                <Text style={styles.readOnlyText}>{session.wage} (시급)</Text>
              </View>
            </View>
          </View>
          <View style={{ borderBottomWidth: 1, borderColor: "#ddd" }} />

          {/* 시간 */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              <Ionicons name="time-outline" size={24} color="black" />
            </Text>
            <View style={{ flex: 1 }}>
              <View style={styles.timeContainer}>
                <Text style={styles.readOnlyText}>
                  {`${new Date(session.startTime).toLocaleTimeString("ko-KR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })} - ${new Date(session.endTime).toLocaleTimeString(
                    "ko-KR",
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )}`}
                </Text>
              </View>
            </View>
          </View>
          <View style={{ borderBottomWidth: 1, borderColor: "#ddd" }} />

          {/* 날짜 */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              <Ionicons name="calendar-outline" size={24} color="black" />
            </Text>
            <View style={{ flex: 1, gap: 8 }}>
              <Text style={styles.readOnlyText}>
                {`${new Date(session.startDate).toLocaleDateString(
                  "ko-KR"
                )} - ${
                  session.endDate
                    ? new Date(session.endDate).toLocaleDateString("ko-KR")
                    : ""
                }`}
                {session.isCurrentlyWorking && " (종료일 없음)"}
              </Text>
            </View>
          </View>
          <View style={{ borderBottomWidth: 1, borderColor: "#ddd" }} />

          {/* 반복 주기 */}
          <View style={[styles.inputGroup]}>
            <Text style={styles.inputLabel}>
              <Ionicons name="repeat-outline" size={24} color="black" />
            </Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.readOnlyText}>
                {session.repeatOption === "none"
                  ? "반복 없음"
                  : session.repeatOption === "daily"
                  ? "매일"
                  : session.repeatOption === "weekly"
                  ? "매주"
                  : session.repeatOption === "biweekly"
                  ? "격주"
                  : "매월"}
              </Text>
            </View>
          </View>
          {/* 요일 선택 */}
          <View style={{ borderBottomWidth: 1, borderColor: "#ddd" }} />

          {/* 메모 */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              <Entypo name="text" size={24} color="black" />
            </Text>

            <Text style={styles.readOnlyText}>
              {session.description || "설명 없음"}
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

export default ScheduleModal;

const styles = StyleSheet.create({
  areaContainer: { flex: 1 },
  headerContainer: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  container: {
    paddingHorizontal: 16,
    paddingBottom: 60,
    gap: 16,
  },
  header: {
    fontSize: 16,
    textAlign: "center",
  },
  inputGroup: {
    flexDirection: "row",
    minHeight: 48,
    alignItems: "center",
    gap: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    textAlignVertical: "center",
    lineHeight: 48,
    alignSelf: "center",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
    height: 48,
  },
  readOnlyText: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    paddingVertical: 12,
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  timeButton: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
  },
  timeButtonText: {
    fontSize: 16,
    color: "#333",
  },
  timeSeparator: {
    fontSize: 16,
    color: "#666",
  },
  dateContainer: {
    flexDirection: "row",
    gap: 10,
  },
  dateButton: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
  },
  dateButtonDisabled: {
    opacity: 0.5,
  },
  dateButtonText: {
    fontSize: 16,
    color: "#333",
  },
  dateButtonTextDisabled: {
    color: "#999",
  },
  rowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: -10,
    marginBottom: 12,
    width: "100%",
    flex: 1,
    justifyContent: "space-around",
  },
  optionButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 20,
    marginRight: 6,
    marginBottom: 6,
  },
  optionButtonSelected: {
    backgroundColor: "#007aff",
    borderColor: "#007aff",
    color: "#fff",
  },
  optionButtonDisabled: {
    opacity: 0.6,
  },
  optionButtonText: {
    color: "#333",
  },
  optionButtonTextSelected: {
    color: "#fff",
  },
  optionButtonTextDisabled: {
    color: "#999",
  },
  saveButton: {
    alignItems: "center",
    borderRadius: 8,
  },
  saveButtonText: {
    color: "#007aff",
    fontWeight: "bold",
  },
});
