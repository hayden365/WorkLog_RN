// src/components/NewSessionModal.tsx

import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  StyleSheet,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import dayjs from "dayjs";
import {
  WorkSession,
  RepeatOption,
  MonthlyRepeatOption,
  TimeOfDay,
} from "../models/WorkSession";

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
  const [jobName, setJobName] = useState("");
  const [wage, setWage] = useState("");
  const [startTime, setStartTime] = useState<TimeOfDay | null>(null);
  const [endTime, setEndTime] = useState<TimeOfDay | null>(null);
  const [repeatOption, setRepeatOption] = useState<RepeatOption>("none");
  const [selectedWeekDays, setSelectedWeekDays] = useState<Set<number>>(
    new Set()
  );
  const [monthlyRepeatOption, setMonthlyRepeatOption] =
    useState<MonthlyRepeatOption>("byDayOfMonth");
  const [startDate, setStartDate] = useState<string>(
    dayjs().format("YYYY-MM-DD")
  );
  const [endDate, setEndDate] = useState<string | null>(null);
  const [isCurrentlyWorking, setIsCurrentlyWorking] = useState(true);
  const [note, setNote] = useState("");

  const [showDatePicker, setShowDatePicker] = useState<{
    mode: "date" | "time";
    isStart: boolean;
  }>({
    mode: "date",
    isStart: true,
  });
  const [datePickerVisible, setDatePickerVisible] = useState(false);

  const handleTimeChange = (event: any, selectedDate: Date | undefined) => {
    setDatePickerVisible(false);
    if (selectedDate) {
      const newTime = {
        hour: selectedDate.getHours(),
        minute: selectedDate.getMinutes(),
      };
      if (showDatePicker.isStart) {
        setStartTime(newTime);
      } else {
        setEndTime(newTime);
      }
    }
  };

  const handleDateChange = (event: any, selectedDate: Date | undefined) => {
    setDatePickerVisible(false);
    if (selectedDate) {
      const dateStr = dayjs(selectedDate).format("YYYY-MM-DD");
      if (showDatePicker.isStart) {
        setStartDate(dateStr);
      } else {
        setEndDate(dateStr);
      }
    }
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
    if (!startTime || !endTime) return;
    const newSession: WorkSession = {
      jobName,
      wage: parseInt(wage) || 0,
      startTime,
      endTime,
      repeatOption,
      selectedWeekDays,
      monthlyRepeatOption,
      startDate,
      endDate: isCurrentlyWorking ? null : endDate,
      isCurrentlyWorking,
      note,
    };
    onSave(newSession);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide">
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.header}>근무 일정 추가</Text>

        {/* 근무지 */}
        <TextInput
          style={styles.input}
          placeholder="근무지"
          value={jobName}
          onChangeText={setJobName}
        />

        {/* 시급 */}
        <TextInput
          style={styles.input}
          placeholder="시급"
          value={wage}
          keyboardType="numeric"
          onChangeText={setWage}
        />

        {/* 시간 */}
        <Text style={styles.label}>시간</Text>
        <View style={styles.row}>
          <TouchableOpacity
            style={styles.timeButton}
            onPress={() => {
              setShowDatePicker({ mode: "time", isStart: true });
              setDatePickerVisible(true);
            }}
          >
            <Text>
              {startTime
                ? `${startTime.hour}:${startTime.minute}`
                : "시작 시간"}
            </Text>
          </TouchableOpacity>
          <Text> ~ </Text>
          <TouchableOpacity
            style={styles.timeButton}
            onPress={() => {
              setShowDatePicker({ mode: "time", isStart: false });
              setDatePickerVisible(true);
            }}
          >
            <Text>
              {endTime ? `${endTime.hour}:${endTime.minute}` : "종료 시간"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 반복 주기 */}
        <Text style={styles.label}>반복 주기</Text>
        <View style={styles.rowWrap}>
          {(
            [
              "none",
              "weekly",
              "biweekly",
              "triweekly",
              "monthly",
            ] as RepeatOption[]
          ).map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[
                styles.optionButton,
                repeatOption === opt && styles.optionButtonSelected,
              ]}
              onPress={() => setRepeatOption(opt)}
            >
              <Text>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 요일 선택 */}
        {repeatOption === "weekly" && (
          <>
            <Text style={styles.label}>근무 요일</Text>
            <View style={styles.rowWrap}>
              {["월", "화", "수", "목", "금", "토", "일"].map((day, index) => (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.optionButton,
                    selectedWeekDays.has(index) && styles.optionButtonSelected,
                  ]}
                  onPress={() => toggleWeekDay(index)}
                >
                  <Text>{day}</Text>
                </TouchableOpacity>
              ))}
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

        {/* 기간 */}
        <Text style={styles.label}>근무 기간</Text>
        <View style={styles.row}>
          <TouchableOpacity
            style={styles.timeButton}
            onPress={() => {
              setShowDatePicker({ mode: "date", isStart: true });
              setDatePickerVisible(true);
            }}
          >
            <Text>{startDate}</Text>
          </TouchableOpacity>
          <Text> ~ </Text>
          <TouchableOpacity
            style={[
              styles.timeButton,
              isCurrentlyWorking && { backgroundColor: "#ccc" },
            ]}
            onPress={() => {
              if (!isCurrentlyWorking) {
                setShowDatePicker({ mode: "date", isStart: false });
                setDatePickerVisible(true);
              }
            }}
          >
            <Text>{isCurrentlyWorking ? "계속 반복" : endDate ?? "선택"}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.row}>
          <Text>계속 반복하기</Text>
          <Switch
            value={isCurrentlyWorking}
            onValueChange={setIsCurrentlyWorking}
          />
        </View>

        {/* 메모 */}
        <TextInput
          style={[styles.input, { height: 80 }]}
          placeholder="메모"
          value={note}
          multiline
          onChangeText={setNote}
        />

        {/* 저장 버튼 */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>저장</Text>
        </TouchableOpacity>

        {/* 닫기 */}
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>닫기</Text>
        </TouchableOpacity>

        {/* DateTimePicker */}
        {datePickerVisible && (
          <DateTimePicker
            value={new Date()}
            mode={showDatePicker.mode}
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={
              showDatePicker.mode === "time"
                ? handleTimeChange
                : handleDateChange
            }
          />
        )}
      </ScrollView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  header: { fontSize: 20, fontWeight: "bold", marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  label: { fontSize: 14, fontWeight: "bold", marginTop: 12, marginBottom: 6 },
  row: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
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
  saveButton: {
    backgroundColor: "#007aff",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  saveButtonText: { color: "#fff", fontWeight: "bold" },
  closeButton: { marginTop: 12, alignItems: "center" },
  closeButtonText: { color: "#007aff" },
});
