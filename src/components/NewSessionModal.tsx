import React, { useState, useRef, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
  Animated,
  Alert,
} from "react-native";
import { WorkSession, RepeatOption } from "../models/WorkSession";
import { SafeAreaView } from "react-native-safe-area-context";
import SegmentedControl from "@react-native-segmented-control/segmented-control";
import { FontAwesome, Ionicons, Feather, Entypo } from "@expo/vector-icons";
import { useShiftStore } from "../store/shiftStore";
import Dropdown from "./Dropdown";
import { dayNames, repeatOptions } from "../utils/repeatOptions";
import TimePicker from "./TimePicker";
import DatePicker from "./DatePicker";
import SlideInView from "./SlideInView";
import { formatNumberWithComma } from "../utils/formatNumbs";
import { useTheme } from "../hooks/useTheme";

interface NewSessionModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (session: WorkSession) => void;
  // 업데이트를 위한 기존 세션 데이터
  existingSession?: WorkSession;
  // 모달 모드 (새로 생성 또는 업데이트)
  mode?: "create" | "update";
}

export const NewSessionModal = ({
  visible,
  onClose,
  onSave,
  existingSession,
  mode = "create",
}: NewSessionModalProps) => {
  const { colors, scheme } = useTheme();

  const {
    jobName,
    setJobName,
    wage,
    setWage,
    startDate,
    endDate,
    startTime,
    endTime,
    setStartTime,
    setEndTime,
    setStartDate,
    setEndDate,
    selectedWeekDays,
    setSelectedWeekDays,
    repeatOption,
    setRepeatOption,
    reset,
  } = useShiftStore();
  const [isCurrentlyWorking, setIsCurrentlyWorking] = useState(true);
  const [description, setDescription] = useState("");
  const [wageType, setWageType] = useState<"hourly" | "daily" | "monthly">(
    "hourly"
  );
  const [wageValue, setWageValue] = useState<string>("");

  const scrollViewRef = useRef<ScrollView>(null);
  const anim = useRef(new Animated.Value(0)).current;

  // 기존 세션 데이터가 있으면 초기값 설정
  useEffect(() => {
    if (existingSession && mode === "update") {
      setJobName(existingSession.jobName || "");
      setWage(existingSession.wage || 0);
      setWageType(existingSession.wageType || "hourly");
      setWageValue(formatNumberWithComma(String(existingSession.wage || "")));
      setIsCurrentlyWorking(existingSession.isCurrentlyWorking ?? true);
      setDescription(existingSession.description || "");
      setStartTime(existingSession.startTime || new Date());
      setEndTime(existingSession.endTime || new Date());
      setStartDate(existingSession.startDate || new Date());
      setEndDate(existingSession.endDate || new Date());
      setRepeatOption(existingSession.repeatOption || "none");
      setSelectedWeekDays(existingSession.selectedWeekDays || new Set());
    } else if (mode === "create") {
      // 새로 생성할 때는 초기화
      reset();
      setWageValue("");
      setIsCurrentlyWorking(true);
      setDescription("");
      setRepeatOption("none");
    }
  }, [existingSession, mode]);

  // 숫자에 콤마 추가하는 함수

  // 시급/일급 입력 처리
  const handleWageChange = (value: string) => {
    const formattedValue = formatNumberWithComma(value);
    setWageValue(formattedValue);
    setWage(Number(formattedValue.replace(/,/g, "")));
  };

  // selectedWeekDays가 undefined일 때를 대비한 안전한 처리
  const safeSelectedWeekDays =
    selectedWeekDays instanceof Set ? selectedWeekDays : new Set<number>();

  const toggleWeekDay = (index: number) => {
    const newSet = new Set(safeSelectedWeekDays);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    setSelectedWeekDays(newSet);
  };

  // 반복 주기 변경 시 selectedWeekDays 초기화
  const handleRepeatOptionChange = (item: { value: string; label: string }) => {
    const newRepeatOption = item.value as RepeatOption;
    setRepeatOption(newRepeatOption);

    // daily나 monthly로 변경 시 selectedWeekDays 초기화
    if (newRepeatOption === "daily" || newRepeatOption === "monthly") {
      setSelectedWeekDays(new Set());
    }

    Animated.timing(anim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleSave = () => {
    if (!startDate || !endDate) return;

    // 입력값 검증
    const trimmedJobName = jobName.trim();
    if (!trimmedJobName) {
      Alert.alert('입력 오류', '근무지명을 입력해주세요.');
      return;
    }
    if (wage <= 0) {
      Alert.alert('입력 오류', '급여를 입력해주세요.');
      return;
    }
    if (wage > 100_000_000) {
      Alert.alert('입력 오류', '급여가 너무 큽니다. 다시 확인해주세요.');
      return;
    }

    const endDateValue = isCurrentlyWorking ? null : endDate;

    const newSession = {
      id: existingSession?.id,
      jobName: trimmedJobName,
      wage,
      wageType,
      startTime,
      endTime,
      startDate,
      endDate: endDateValue,
      repeatOption,
      selectedWeekDays,
      isCurrentlyWorking,
      description,
    };
    onSave(newSession as WorkSession);
    setWageValue("");
    setIsCurrentlyWorking(true);
    setDescription("");
    reset();
    onClose();
  };

  const getHeaderTitle = () => {
    return mode === "update" ? "근무 일정 수정" : "근무 일정 추가";
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={[styles.areaContainer, { backgroundColor: colors.background }]}>
        <View
          style={[
            styles.headerContainer,
            { borderColor: colors.border },
          ]}
        >
          {/* 닫기 */}
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: colors.surfaceElevated }]}
            onPress={onClose}
          >
            <Text style={[styles.closeButtonText, { color: colors.textPrimary }]}>
              <Feather name="x" size={20} color={colors.textPrimary} />
            </Text>
          </TouchableOpacity>
          <Text style={[styles.header, { color: colors.textPrimary }]}>{getHeaderTitle()}</Text>
          {/* 저장 버튼 */}
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={[styles.saveButtonText, { color: colors.accent }]}>저장</Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.container}
        >
          {/* 근무지 */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
              <Ionicons name="location-outline" size={24} color={colors.textPrimary} />
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                },
              ]}
              placeholder="근무지명을 입력하세요"
              placeholderTextColor={colors.textMuted}
              value={jobName}
              onChangeText={setJobName}
            />
          </View>
          <View style={{ borderBottomWidth: 1, borderColor: colors.border }} />
          {/* 시급 */}
          <View style={{ gap: 12 }}>
            <SegmentedControl
              appearance={scheme}
              tintColor={colors.surfaceElevated}
              backgroundColor={colors.divider}
              fontStyle={{ color: colors.textPrimary }}
              activeFontStyle={{ color: colors.textPrimary }}
              values={["시급", "일급", "월급"]}
              selectedIndex={
                wageType === "hourly" ? 0 : wageType === "daily" ? 1 : 2
              }
              onChange={(event) => {
                setWageType(
                  event.nativeEvent.selectedSegmentIndex === 0
                    ? "hourly"
                    : event.nativeEvent.selectedSegmentIndex === 1
                    ? "daily"
                    : "monthly"
                );
              }}
            />
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
                <Ionicons name="cash-outline" size={24} color={colors.textPrimary} />
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  flex: 1,
                  gap: 10,
                }}
              >
                <FontAwesome name="won" size={16} color={colors.textPrimary} />
                <TextInput
                  style={[
                    styles.input,
                    {
                      borderColor: colors.border,
                      backgroundColor: colors.surface,
                    },
                  ]}
                  placeholder={
                    wageType === "hourly"
                      ? "시급"
                      : wageType === "daily"
                      ? "일급"
                      : "월급"
                  }
                  placeholderTextColor={colors.textMuted}
                  value={wageValue}
                  keyboardType="number-pad"
                  onChangeText={(value) => {
                    handleWageChange(value);
                  }}
                />
              </View>
            </View>
          </View>
          <View style={{ borderBottomWidth: 1, borderColor: colors.border }} />
          {/* 시간 */}
          <View style={{ minHeight: 48, flexDirection: "row" }}>
            <Text style={[styles.inputLabel, { alignSelf: "flex-start", color: colors.textPrimary }]}>
              <Ionicons name="time-outline" size={24} color={colors.textPrimary} />
            </Text>
            <View style={{ flex: 1 }}>
              <TimePicker />
            </View>
          </View>
          <View style={{ borderBottomWidth: 1, borderColor: colors.border }} />
          {/* 날짜 */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { alignSelf: "flex-start", color: colors.textPrimary }]}>
              <Ionicons name="calendar-outline" size={24} color={colors.textPrimary} />
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
                <Text style={{ fontSize: 16, marginLeft: 10, color: colors.textPrimary }}>
                  종료일 없음
                </Text>
                <Switch
                  value={isCurrentlyWorking}
                  onValueChange={setIsCurrentlyWorking}
                  trackColor={{
                    true: colors.accent,
                    false: colors.border,
                  }}
                  thumbColor={colors.surfaceElevated}
                />
              </View>
            </View>
          </View>
          <View style={{ borderBottomWidth: 1, borderColor: colors.border }} />
          {/* 반복 주기 */}
          <View style={[styles.inputGroup, { marginBottom: -18 }]}>
            <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
              <Ionicons name="repeat-outline" size={24} color={colors.textPrimary} />
            </Text>
            <View style={{ flex: 1 }}>
              <Dropdown
                data={repeatOptions}
                onChange={handleRepeatOptionChange}
                placeholder={
                  repeatOptions.find((option) => option.value === repeatOption)
                    ?.label ?? "반복 없음"
                }
              />
            </View>
          </View>
          {/* 요일 선택 */}
          <SlideInView
            visible={repeatOption === "weekly" || repeatOption === "biweekly"}
            direction="down"
          >
            <View
              style={
                repeatOption === "weekly" || repeatOption === "biweekly"
                  ? {
                      height: 50,
                      paddingTop: 12,
                    }
                  : { height: 0 }
              }
            >
              <View style={styles.rowWrap}>
                {dayNames.map((day) => (
                  <TouchableOpacity
                    key={day.value}
                    style={[
                      styles.optionButton,
                      { borderColor: colors.border },
                      safeSelectedWeekDays.has(day.value) && [
                        styles.optionButtonSelected,
                        {
                          backgroundColor: colors.accent,
                          borderColor: colors.accent,
                        },
                      ],
                    ]}
                    onPress={() => toggleWeekDay(day.value)}
                  >
                    <Text
                      style={[
                        styles.optionButtonText,
                        { color: colors.textPrimary },
                        safeSelectedWeekDays.has(day.value) && [
                          styles.optionButtonTextSelected,
                          { color: colors.accentText },
                        ],
                      ]}
                    >
                      {day.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </SlideInView>
          <View style={{ borderBottomWidth: 1, borderColor: colors.border }} />
          {/* 메모 */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { alignSelf: "flex-start", color: colors.textPrimary }]}>
              <Entypo name="text" size={24} color={colors.textPrimary} />
            </Text>
            <TextInput
              style={[styles.input, { height: "100%", padding: 13, borderColor: colors.border, backgroundColor: colors.surface }]}
              placeholder="설명 추가"
              placeholderTextColor={colors.textMuted}
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
  headerContainer: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
    paddingBottom: 16,
  },
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
    width: 50,
    height: 48,
    textAlignVertical: "top",
    lineHeight: 48,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
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
    borderRadius: 20,
    marginRight: 6,
    marginBottom: 6,
  },
  optionButtonSelected: {},
  optionButtonTextSelected: {},
  optionButtonText: {},
  timeButton: {
    padding: 10,
    borderWidth: 1,
    borderRadius: 8,
    flex: 1,
    alignItems: "center",
  },

  saveButton: {
    alignItems: "center",
    borderRadius: 8,
  },
  saveButtonText: { fontWeight: "bold" },
  closeButton: {},
  closeButtonText: {},
});
