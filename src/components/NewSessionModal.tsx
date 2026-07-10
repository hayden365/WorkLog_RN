import React, { useState, useRef, useEffect } from "react";
import {
  Modal,
  View,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
  Animated,
  Alert,
} from "react-native";
import { AppText as Text, AppTextInput as TextInput } from './AppText';
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
import { spacing, radius, fontSize, fontWeight } from "../theme/tokens";

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
      <SafeAreaView style={[styles.areaContainer, { backgroundColor: colors.surface }]}>
        <View style={styles.headerContainer}>
          {/* 닫기 */}
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: colors.surfaceElevated }]}
            onPress={onClose}
          >
            <Feather name="x" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.header, { color: colors.textPrimary }]}>{getHeaderTitle()}</Text>
          {/* 저장 버튼 */}
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: colors.brand }]}
            onPress={handleSave}
          >
            <Text style={[styles.saveButtonText, { color: colors.accentText }]}>저장</Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          {/* 근무지 */}
          <View style={[styles.card, { backgroundColor: colors.surfaceElevated }]}>
            <View style={styles.inputGroup}>
              <View style={styles.iconWrap}>
                <Ionicons name="location-outline" size={22} color={colors.brand} />
              </View>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.surface, color: colors.textPrimary },
                ]}
                placeholder="근무지명을 입력하세요"
                placeholderTextColor={colors.textMuted}
                value={jobName}
                onChangeText={setJobName}
              />
            </View>
          </View>

          {/* 급여 */}
          <View style={[styles.card, { backgroundColor: colors.surfaceElevated }]}>
            <SegmentedControl
              appearance={scheme}
              tintColor={colors.surface}
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
              <View style={styles.iconWrap}>
                <Ionicons name="cash-outline" size={22} color={colors.brand} />
              </View>
              <View style={styles.wageInputRow}>
                <FontAwesome name="won" size={16} color={colors.textSecondary} />
                <TextInput
                  style={[
                    styles.input,
                    { flex: 1, backgroundColor: colors.surface, color: colors.textPrimary },
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

          {/* 시간 */}
          <View style={[styles.card, { backgroundColor: colors.surfaceElevated }]}>
            <View style={styles.rowTop}>
              <View style={styles.iconWrap}>
                <Ionicons name="time-outline" size={22} color={colors.brand} />
              </View>
              <View style={{ flex: 1 }}>
                <TimePicker />
              </View>
            </View>
          </View>

          {/* 날짜 */}
          <View style={[styles.card, { backgroundColor: colors.surfaceElevated }]}>
            <View style={styles.rowTop}>
              <View style={styles.iconWrap}>
                <Ionicons name="calendar-outline" size={22} color={colors.brand} />
              </View>
              <View style={{ flex: 1, gap: spacing.sm }}>
                <DatePicker isCurrentlyWorking={isCurrentlyWorking} />
                <View style={styles.switchRow}>
                  <Text style={{ fontSize: fontSize.base, color: colors.textPrimary }}>
                    종료일 없음
                  </Text>
                  <Switch
                    value={isCurrentlyWorking}
                    onValueChange={setIsCurrentlyWorking}
                    trackColor={{
                      true: colors.brand,
                      false: colors.border,
                    }}
                    thumbColor={colors.surfaceElevated}
                  />
                </View>
              </View>
            </View>
          </View>

          {/* 반복 주기 */}
          <View style={[styles.card, { backgroundColor: colors.surfaceElevated }]}>
            <View style={styles.inputGroup}>
              <View style={styles.iconWrap}>
                <Ionicons name="repeat-outline" size={22} color={colors.brand} />
              </View>
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
                    ? { paddingTop: spacing.md }
                    : { height: 0 }
                }
              >
                <View style={styles.rowWrap}>
                  {dayNames.map((day) => {
                    const selected = safeSelectedWeekDays.has(day.value);
                    return (
                      <TouchableOpacity
                        key={day.value}
                        style={[
                          styles.optionButton,
                          { borderColor: colors.border },
                          selected && {
                            backgroundColor: colors.brand,
                            borderColor: colors.brand,
                          },
                        ]}
                        onPress={() => toggleWeekDay(day.value)}
                      >
                        <Text
                          style={{
                            fontSize: fontSize.md,
                            fontWeight: fontWeight.medium,
                            color: selected ? colors.accentText : colors.textPrimary,
                          }}
                        >
                          {day.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </SlideInView>
          </View>

          {/* 메모 */}
          <View style={[styles.card, { backgroundColor: colors.surfaceElevated }]}>
            <View style={styles.rowTop}>
              <View style={styles.iconWrap}>
                <Entypo name="text" size={22} color={colors.brand} />
              </View>
              <TextInput
                style={[
                  styles.input,
                  styles.memoInput,
                  { backgroundColor: colors.surface, color: colors.textPrimary },
                ]}
                placeholder="설명 추가"
                placeholderTextColor={colors.textMuted}
                value={description}
                multiline
                onChangeText={setDescription}
              />
            </View>
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  header: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    textAlign: "center",
  },
  container: {
    padding: spacing.lg,
    paddingBottom: 60,
    gap: spacing.md,
  },
  card: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  inputGroup: {
    flexDirection: "row",
    minHeight: 48,
    alignItems: "center",
    gap: spacing.md,
  },
  rowTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  iconWrap: {
    width: 28,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.base,
    height: 48,
  },
  memoInput: {
    minHeight: 88,
    height: undefined,
    paddingVertical: spacing.md,
    textAlignVertical: "top",
  },
  wageInputRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: spacing.sm,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 48,
    paddingHorizontal: spacing.xs,
  },
  rowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: "100%",
    justifyContent: "space-around",
  },
  optionButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: radius.full,
  },
  saveButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
});
