import React, { useState, useRef } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
  LayoutRectangle,
  Dimensions,
  Animated,
} from "react-native";
import { WorkSession, RepeatOption } from "../models/WorkSession";
import { SafeAreaView } from "react-native-safe-area-context";
import SegmentedControl from "@react-native-segmented-control/segmented-control";
import { FontAwesome, Ionicons, Feather, Entypo } from "@expo/vector-icons";
import { useShiftStore } from "../store/shiftStore";
import Dropdown from "./Dropdown";
import { repeatOptions } from "../utils/repeatOptions";
import TimePicker from "./TimePicker";
import DatePicker from "./DatePicker";
import SlideInView from "./SlideInView";

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
  const { startDate, endDate, startTime, endTime } = useShiftStore();
  const [jobName, setJobName] = useState("");
  const [wage, setWage] = useState("");
  const [repeatOption, setRepeatOption] = useState<RepeatOption>("none");

  const [selectedWeekDays, setSelectedWeekDays] = useState<Set<number>>(
    new Set()
  );
  const [isCurrentlyWorking, setIsCurrentlyWorking] = useState(true);
  const [description, setDescription] = useState("");
  const [wageType, setWageType] = useState<"hourly" | "daily">("hourly");

  const scrollViewRef = useRef<ScrollView>(null);
  const anim = useRef(new Animated.Value(0)).current;
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
    const endDateValue = isCurrentlyWorking ? null : endDate;
    // 콤마 제거 후 숫자로 변환
    const numericWage = parseInt(wage.replace(/,/g, "")) || 0;

    const newSession: WorkSession = {
      jobName,
      wage: numericWage,
      startTime,
      endTime,
      startDate,
      endDate: endDateValue,
      repeatOption,
      selectedWeekDays,
      isCurrentlyWorking,
      description,
    };
    onSave(newSession);
    console.log("newSession", newSession);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.areaContainer}>
        <View style={styles.headerContainer}>
          {/* 닫기 */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>
              <Feather name="x" size={20} color="black" />
            </Text>
          </TouchableOpacity>
          <Text style={styles.header}>근무 일정 추가</Text>
          {/* 저장 버튼 */}
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>저장</Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.container}
        >
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
            <View style={{ flex: 1, gap: 8 }}>
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
          <View style={[styles.inputGroup, { marginBottom: -18 }]}>
            <Text style={styles.inputLabel}>
              <Ionicons name="repeat-outline" size={24} color="black" />
            </Text>
            <View style={{ flex: 1 }}>
              <Dropdown
                data={repeatOptions}
                onChange={(item) => {
                  setRepeatOption(item.value as RepeatOption);
                  Animated.timing(anim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                  }).start();
                }}
                placeholder="반복 주기 선택"
              />
            </View>
          </View>
          {/* 요일 선택 */}
          <SlideInView
            visible={
              repeatOption === "weekly" ||
              repeatOption === "biweekly" ||
              repeatOption === "triweekly"
            }
            direction="down"
          >
            <View
              style={
                repeatOption === "weekly" ||
                repeatOption === "biweekly" ||
                repeatOption === "triweekly"
                  ? {
                      height: 50,
                      paddingTop: 12,
                    }
                  : { height: 0 }
              }
            >
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
                      <Text
                        style={
                          selectedWeekDays.has(index) &&
                          styles.optionButtonTextSelected
                        }
                      >
                        {day}
                      </Text>
                    </TouchableOpacity>
                  )
                )}
              </View>
            </View>
          </SlideInView>
          <View style={{ borderBottomWidth: 1, borderColor: "#ddd" }} />
          {/* 메모 */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { alignSelf: "flex-start" }]}>
              <Entypo name="text" size={24} color="black" />
            </Text>
            <TextInput
              style={[styles.input, { height: "100%", padding: 13 }]}
              placeholder="설명 추가"
              value={description}
              multiline
              onChangeText={setDescription}
            />
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
    paddingBottom: 60,
    gap: 24,
  },
  header: {
    fontSize: 16,
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
  optionButtonTextSelected: { color: "#fff" },
  timeButton: {
    padding: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    flex: 1,
    alignItems: "center",
  },
  headerContainer: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderColor: "#ddd",
    paddingBottom: 16,
  },
  saveButton: {
    alignItems: "center",
    borderRadius: 8,
  },
  saveButtonText: { color: "#007aff", fontWeight: "bold" },
  closeButton: {
    backgroundColor: "white",
  },
  closeButtonText: { color: "#333" },
});
