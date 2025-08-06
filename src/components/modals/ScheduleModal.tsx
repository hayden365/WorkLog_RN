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
  Platform,
} from "react-native";
import { WorkSession, RepeatOption } from "../../models/WorkSession";
import { SafeAreaView } from "react-native-safe-area-context";
import SegmentedControl from "@react-native-segmented-control/segmented-control";
import { FontAwesome, Ionicons, Feather, Entypo } from "@expo/vector-icons";
import { useScheduleManager } from "../../hooks/useScheduleManager";
import Dropdown from "../Dropdown";
import { repeatOptions } from "../../utils/repeatOptions";
import DateTimePicker from "@react-native-community/datetimepicker";
import SlideInView from "../SlideInView";

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
  console.log(session);

  // 자체 상태로 관리
  const [jobName, setJobName] = useState("");
  const [wage, setWage] = useState(0);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [selectedWeekDays, setSelectedWeekDays] = useState<Set<number>>(
    new Set()
  );
  const [repeatOption, setRepeatOption] = useState<RepeatOption>("none");
  const [description, setDescription] = useState("");
  const [isCurrentlyWorking, setIsCurrentlyWorking] = useState(true);
  const [wageType, setWageType] = useState<"hourly" | "daily" | "monthly">(
    "hourly"
  );
  const [wageValue, setWageValue] = useState<string>("");
  const [isEditMode, setIsEditMode] = useState(false);

  // 시간/날짜 picker 상태
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerType, setPickerType] = useState<
    "startTime" | "endTime" | "startDate" | "endDate"
  >("startTime");

  const scrollViewRef = useRef<ScrollView>(null);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (session) {
      setJobName(session.jobName);
      setWage(session.wage);
      setWageType(session.wageType);
      setWageValue(
        session.wage.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
      );
      setIsCurrentlyWorking(session.isCurrentlyWorking);
      setDescription(session.description);
      setRepeatOption(session.repeatOption);
      setSelectedWeekDays(
        session.selectedWeekDays instanceof Set
          ? session.selectedWeekDays
          : new Set()
      );
      setStartTime(
        session.startTime instanceof Date ? session.startTime : new Date()
      );
      setEndTime(
        session.endTime instanceof Date ? session.endTime : new Date()
      );
      setStartDate(
        session.startDate instanceof Date ? session.startDate : new Date()
      );
      setEndDate(
        session.endDate instanceof Date ? session.endDate : new Date()
      );
      setIsEditMode(false);
    } else {
      // session이 없을 때 기본값으로 초기화
      setJobName("");
      setWage(0);
      setWageType("hourly");
      setWageValue("");
      setIsCurrentlyWorking(true);
      setDescription("");
      setRepeatOption("none");
      setSelectedWeekDays(new Set());
      setStartTime(new Date());
      setEndTime(new Date());
      setStartDate(new Date());
      setEndDate(new Date());
      setIsEditMode(false);
    }
  }, [session]);

  // 숫자에 콤마 추가하는 함수
  const formatNumberWithComma = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, "");
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // 시급/일급 입력 처리
  const handleWageChange = (value: string) => {
    const formattedValue = formatNumberWithComma(value);
    setWageValue(formattedValue);
    setWage(Number(formattedValue.replace(/,/g, "")));
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

  const handleEdit = () => {
    setIsEditMode(true);
  };

  const handleSave = () => {
    if (!session || !startDate || !endDate) return;

    const endDateValue = isCurrentlyWorking ? null : endDate;
    const numericWage = Number(wageValue.replace(/,/g, ""));

    const updatedSession: WorkSession = {
      ...session,
      jobName,
      wage: numericWage,
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

    onSave(updatedSession);
    setIsEditMode(false);
    onClose();
  };

  const handleClose = () => {
    setJobName("");
    setWage(0);
    setWageValue("");
    setIsCurrentlyWorking(true);
    setDescription("");
    setRepeatOption("none");
    setSelectedWeekDays(new Set());
    setStartDate(new Date());
    setEndDate(new Date());
    setStartTime(new Date());
    setEndTime(new Date());
    setWageType("hourly");
    setIsEditMode(false);
    onClose();
  };

  const handleTimeChange = (event: any, selectedDate?: Date) => {
    setShowTimePicker(false);
    if (selectedDate) {
      if (pickerType === "startTime") {
        setStartTime(selectedDate);
      } else {
        setEndTime(selectedDate);
      }
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      if (pickerType === "startDate") {
        setStartDate(selectedDate);
      } else {
        setEndDate(selectedDate);
      }
    }
  };

  if (!session) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.areaContainer}>
        <View style={styles.headerContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Text style={styles.closeButtonText}>
              <Feather name="x" size={20} color="black" />
            </Text>
          </TouchableOpacity>
          <Text style={styles.header}>근무 일정</Text>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={isEditMode ? handleSave : handleEdit}
          >
            <Text style={styles.saveButtonText}>
              {isEditMode ? "저장" : "수정"}
            </Text>
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
            {isEditMode ? (
              <TextInput
                style={styles.input}
                placeholder="근무지명을 입력하세요"
                value={jobName}
                onChangeText={setJobName}
              />
            ) : (
              <Text style={styles.readOnlyText}>{jobName}</Text>
            )}
          </View>
          <View style={{ borderBottomWidth: 1, borderColor: "#ddd" }} />

          {/* 시급 */}
          <View style={{ gap: 12 }}>
            {isEditMode && (
              <SegmentedControl
                tintColor="#fff"
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
            )}
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
                {isEditMode ? (
                  <TextInput
                    style={styles.input}
                    placeholder={
                      wageType === "hourly"
                        ? "시급"
                        : wageType === "daily"
                        ? "일급"
                        : "월급"
                    }
                    value={wageValue}
                    keyboardType="number-pad"
                    onChangeText={handleWageChange}
                  />
                ) : (
                  <Text style={styles.readOnlyText}>
                    {wageValue} (
                    {wageType === "hourly"
                      ? "시급"
                      : wageType === "daily"
                      ? "일급"
                      : "월급"}
                    )
                  </Text>
                )}
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
              {isEditMode ? (
                <View style={styles.timeContainer}>
                  <TouchableOpacity
                    style={styles.timeButton}
                    onPress={() => {
                      setPickerType("startTime");
                      setShowTimePicker(true);
                    }}
                  >
                    <Text style={styles.timeButtonText}>
                      {startTime?.toLocaleTimeString("ko-KR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      }) || "00:00"}
                    </Text>
                  </TouchableOpacity>
                  <Text style={styles.timeSeparator}>~</Text>
                  <TouchableOpacity
                    style={styles.timeButton}
                    onPress={() => {
                      setPickerType("endTime");
                      setShowTimePicker(true);
                    }}
                  >
                    <Text style={styles.timeButtonText}>
                      {endTime?.toLocaleTimeString("ko-KR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      }) || "00:00"}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <Text style={styles.readOnlyText}>
                  {(startTime instanceof Date
                    ? startTime
                    : new Date()
                  ).toLocaleTimeString("ko-KR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  }) || "00:00"}{" "}
                  -{" "}
                  {(endTime instanceof Date
                    ? endTime
                    : new Date()
                  ).toLocaleTimeString("ko-KR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  }) || "00:00"}
                </Text>
              )}
            </View>
          </View>
          <View style={{ borderBottomWidth: 1, borderColor: "#ddd" }} />

          {/* 날짜 */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { alignSelf: "flex-start" }]}>
              <Ionicons name="calendar-outline" size={24} color="black" />
            </Text>
            <View style={{ flex: 1, gap: 8 }}>
              {isEditMode ? (
                <>
                  <View style={styles.dateContainer}>
                    <TouchableOpacity
                      style={styles.dateButton}
                      onPress={() => {
                        setPickerType("startDate");
                        setShowDatePicker(true);
                      }}
                    >
                      <Text style={styles.dateButtonText}>
                        {startDate.toLocaleDateString("ko-KR")}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.dateButton,
                        isCurrentlyWorking && styles.dateButtonDisabled,
                      ]}
                      onPress={() => {
                        if (!isCurrentlyWorking) {
                          setPickerType("endDate");
                          setShowDatePicker(true);
                        }
                      }}
                      disabled={isCurrentlyWorking}
                    >
                      <Text
                        style={[
                          styles.dateButtonText,
                          isCurrentlyWorking && styles.dateButtonTextDisabled,
                        ]}
                      >
                        {endDate.toLocaleDateString("ko-KR")}
                      </Text>
                    </TouchableOpacity>
                  </View>
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
                </>
              ) : (
                <Text style={styles.readOnlyText}>
                  {startDate.toLocaleDateString("ko-KR")}{" "}
                  {!isCurrentlyWorking &&
                    endDate &&
                    `- ${endDate.toLocaleDateString("ko-KR")}`}
                  {isCurrentlyWorking && " (종료일 없음)"}
                </Text>
              )}
            </View>
          </View>
          <View style={{ borderBottomWidth: 1, borderColor: "#ddd" }} />

          {/* 반복 주기 */}
          <View style={[styles.inputGroup, { marginBottom: -18 }]}>
            <Text style={styles.inputLabel}>
              <Ionicons name="repeat-outline" size={24} color="black" />
            </Text>
            <View style={{ flex: 1 }}>
              {isEditMode ? (
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
                  placeholder="반복 없음"
                />
              ) : (
                <Text style={styles.readOnlyText}>
                  {repeatOption === "none"
                    ? "반복 없음"
                    : repeatOption === "daily"
                    ? "매일"
                    : repeatOption === "weekly"
                    ? "매주"
                    : repeatOption === "biweekly"
                    ? "격주"
                    : "매월"}
                </Text>
              )}
            </View>
          </View>

          {/* 요일 선택 */}
          {(repeatOption === "weekly" || repeatOption === "biweekly") && (
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
                  {[
                    { label: "월", value: 1 },
                    { label: "화", value: 2 },
                    { label: "수", value: 3 },
                    { label: "목", value: 4 },
                    { label: "금", value: 5 },
                    { label: "토", value: 6 },
                    { label: "일", value: 0 },
                  ].map((day) => (
                    <TouchableOpacity
                      key={day.value}
                      style={[
                        styles.optionButton,
                        selectedWeekDays instanceof Set &&
                          selectedWeekDays.has(day.value) &&
                          styles.optionButtonSelected,
                        !isEditMode && styles.optionButtonDisabled,
                      ]}
                      onPress={() => isEditMode && toggleWeekDay(day.value)}
                      disabled={!isEditMode}
                    >
                      <Text
                        style={[
                          styles.optionButtonText,
                          selectedWeekDays instanceof Set &&
                            selectedWeekDays.has(day.value) &&
                            styles.optionButtonTextSelected,
                          !isEditMode && styles.optionButtonTextDisabled,
                        ]}
                      >
                        {day.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </SlideInView>
          )}
          <View style={{ borderBottomWidth: 1, borderColor: "#ddd" }} />

          {/* 메모 */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { alignSelf: "flex-start" }]}>
              <Entypo name="text" size={24} color="black" />
            </Text>
            {isEditMode ? (
              <TextInput
                style={[styles.input, { height: "100%", padding: 13 }]}
                placeholder="설명 추가"
                value={description}
                multiline
                onChangeText={setDescription}
              />
            ) : (
              <Text style={styles.readOnlyText}>
                {description || "설명 없음"}
              </Text>
            )}
          </View>
        </ScrollView>

        {/* DateTimePicker 모달 */}
        {showTimePicker && (
          <DateTimePicker
            value={pickerType === "startTime" ? startTime : endTime}
            mode="time"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={handleTimeChange}
            locale="ko-KR"
          />
        )}
        {showDatePicker && (
          <DateTimePicker
            value={pickerType === "startDate" ? startDate : endDate}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={handleDateChange}
            locale="ko-KR"
          />
        )}
      </SafeAreaView>
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
    padding: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderColor: "#ddd",
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
  closeButton: {
    backgroundColor: "white",
  },
  closeButtonText: {
    color: "#333",
  },
});
