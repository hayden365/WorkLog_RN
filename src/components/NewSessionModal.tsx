import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
} from "react-native";
import dayjs from "dayjs";
import {
  WorkSession,
  RepeatOption,
  MonthlyRepeatOption,
} from "../models/WorkSession";
import { SafeAreaView } from "react-native-safe-area-context";
import SegmentedControl from "@react-native-segmented-control/segmented-control";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { useShiftStore } from "../store/shiftStore";
import Dropdown from "./Dropdown";
import { repeatOptions } from "../utils/repeatOptions";
import TimePicker from "./TimePicker";
import DatePicker from "./DatePicker";

interface NewSessionModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (session: WorkSession) => void;
}

export const NewSessionModal = ({
  visible,
  onClose,
  onSave,
}: NewSessionModalProps) => {
  const { startDate, endDate } = useShiftStore();
  const [jobName, setJobName] = useState("");
  const [wage, setWage] = useState("");
  const [repeatOption, setRepeatOption] = useState<RepeatOption>("none");
  const [selectedWeekDays, setSelectedWeekDays] = useState<Set<number>>(
    new Set()
  );
  const [monthlyRepeatOption, setMonthlyRepeatOption] =
    useState<MonthlyRepeatOption>("byDayOfMonth");
  const [isCurrentlyWorking, setIsCurrentlyWorking] = useState(true);
  const [note, setNote] = useState("");
  const [wageType, setWageType] = useState<"hourly" | "daily">("hourly");

  // 숫자에 콤마 추가하는 함수
  const formatNumberWithComma = (value: string) => {
    // 숫자가 아닌 문자 제거
    const numericValue = value.replace(/[^0-9]/g, "");
    // 세자리마다 콤마 추가
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // 시급/일급 입력 처리
  const handleWageChange = (value: string) => {
    const formattedValue = formatNumberWithComma(value);
    setWage(formattedValue);
  };

  const toggleWeekDay = (index: number) => {
    const newSet = new Set(selectedWeekDays);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    setSelectedWeekDays(newSet);
  };

  const handleSave = () => {
    if (!startDate || !endDate) return;

    // 콤마 제거 후 숫자로 변환
    const numericWage = parseInt(wage.replace(/,/g, "")) || 0;

    const newSession: WorkSession = {
      jobName,
      wage: numericWage,
      startTime: {
        hour: startDate.getHours(),
        minute: startDate.getMinutes(),
      },
      endTime: {
        hour: endDate.getHours(),
        minute: endDate.getMinutes(),
      },
      repeatOption,
      selectedWeekDays,
      monthlyRepeatOption,
      startDate: dayjs(startDate).format("YYYY-MM-DD"),
      endDate: isCurrentlyWorking ? null : dayjs(endDate).format("YYYY-MM-DD"),
      isCurrentlyWorking,
      note,
    };
    onSave(newSession);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide">
      <SafeAreaView style={styles.areaContainer}>
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.header}>근무 일정 추가</Text>

          {/* 근무지 */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              <Ionicons name="location-outline" size={24} color="black" />
            </Text>
            <TextInput
              style={styles.input}
              placeholder="근무지명을 입력하세요"
              value={jobName}
              onChangeText={setJobName}
            />
          </View>
          <View style={{ borderBottomWidth: 1, borderColor: "#ddd" }} />
          {/* 시급 */}
          <View style={{ gap: 12 }}>
            <SegmentedControl
              tintColor="#fff"
              values={["시급", "일급"]}
              selectedIndex={wageType === "hourly" ? 0 : 1}
              onChange={(event) => {
                setWageType(
                  event.nativeEvent.selectedSegmentIndex === 0
                    ? "hourly"
                    : "daily"
                );
              }}
            />
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
                <TextInput
                  style={styles.input}
                  placeholder={wageType === "hourly" ? "시급" : "일급"}
                  value={wage}
                  keyboardType="number-pad"
                  onChangeText={handleWageChange}
                />
              </View>
            </View>
          </View>
          <View style={{ borderBottomWidth: 1, borderColor: "#ddd" }} />

          {/* 시간 */}
          <View style={{ minHeight: 48, flexDirection: "row" }}>
            <Text style={[styles.inputLabel, { alignSelf: "flex-start" }]}>
              <Ionicons name="time-outline" size={24} color="black" />
            </Text>
            <View style={{ flex: 1 }}>
              <TimePicker />
            </View>
          </View>
          <View style={{ borderBottomWidth: 1, borderColor: "#ddd" }} />

          {/* 날짜 */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { alignSelf: "flex-start" }]}>
              <Ionicons name="calendar-outline" size={24} color="black" />
            </Text>
            <View style={{ flex: 1 }}>
              <DatePicker isCurrentlyWorking={isCurrentlyWorking} />
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  height: 48,
                }}
              >
                <Text style={{ fontSize: 16, marginLeft: 10 }}>
                  종료일 없음
                </Text>
                <Switch
                  value={isCurrentlyWorking}
                  onValueChange={setIsCurrentlyWorking}
                  trackColor={{
                    true: "#007aff",
                    false: "#ddd",
                  }}
                  thumbColor="#fff"
                />
              </View>
            </View>
          </View>
          <View style={{ borderBottomWidth: 1, borderColor: "#ddd" }} />

          {/* 반복 주기 */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              <Ionicons name="repeat-outline" size={24} color="black" />
            </Text>
            <View style={{ flex: 1 }}>
              <Dropdown
                data={repeatOptions}
                onChange={(item) => setRepeatOption(item.value as RepeatOption)}
                placeholder="반복 주기 선택"
              />
            </View>
          </View>

          {/* 요일 선택 */}
          {repeatOption !== "none" && (
            <>
              <Text style={styles.label}>근무 요일</Text>
              <View style={styles.rowWrap}>
                {["월", "화", "수", "목", "금", "토", "일"].map(
                  (day, index) => (
                    <TouchableOpacity
                      key={day}
                      style={[
                        styles.optionButton,
                        selectedWeekDays.has(index) &&
                          styles.optionButtonSelected,
                      ]}
                      onPress={() => toggleWeekDay(index)}
                    >
                      <Text>{day}</Text>
                    </TouchableOpacity>
                  )
                )}
              </View>
            </>
          )}

          {/* 월별 반복 옵션 */}
          {repeatOption === "monthly" && (
            <>
              <Text style={styles.label}>반복 방식</Text>
              <View style={styles.rowWrap}>
                {(["byDayOfMonth", "byDayOfWeek"] as MonthlyRepeatOption[]).map(
                  (opt) => (
                    <TouchableOpacity
                      key={opt}
                      style={[
                        styles.optionButton,
                        monthlyRepeatOption === opt &&
                          styles.optionButtonSelected,
                      ]}
                      onPress={() => setMonthlyRepeatOption(opt)}
                    >
                      <Text>{opt}</Text>
                    </TouchableOpacity>
                  )
                )}
              </View>
            </>
          )}
          {/* 메모 */}
          <TextInput
            style={[styles.input, { height: 80 }]}
            placeholder="메모"
            value={note}
            multiline
            onChangeText={setNote}
          />

          <View style={styles.buttonContainer}>
            {/* 저장 버튼 */}
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>저장</Text>
            </TouchableOpacity>

            {/* 닫기 */}
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  areaContainer: { flex: 1 },
  container: {
    padding: 16,
    paddingBottom: 40,
    position: "relative",
    flex: 1,
    gap: 24,
  },
  header: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  inputGroup: {
    flexDirection: "row",
    minHeight: 48,
    alignItems: "center",
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    width: 50,
    height: 48,
    textAlignVertical: "top",
    lineHeight: 48,
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
  label: { fontSize: 14, fontWeight: "bold", marginTop: 12, marginBottom: 6 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    justifyContent: "space-between",
  },
  rowWrap: { flexDirection: "row", flexWrap: "wrap", marginBottom: 12 },
  optionButton: {
    padding: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginRight: 6,
    marginBottom: 6,
  },
  optionButtonSelected: { backgroundColor: "#007aff", borderColor: "#007aff" },
  timeButton: {
    padding: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    flex: 1,
    alignItems: "center",
  },
  buttonContainer: {
    position: "absolute",
    width: "100%",
    bottom: 24,
    marginHorizontal: 16,
    justifyContent: "center",
    alignItems: "center",
    display: "flex",
    flexDirection: "row",
    gap: 16,
  },
  saveButton: {
    backgroundColor: "#007aff",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    width: "100%",
    marginTop: 16,
  },
  saveButtonText: { color: "#fff", fontWeight: "bold" },
  closeButton: {
    marginTop: 16,
    alignItems: "center",
    backgroundColor: "white",
    padding: 14,
    borderRadius: 8,
    borderColor: "#007aff",
    width: "100%",
    borderWidth: 1,
  },
  closeButtonText: { color: "#007aff" },
});
