import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useScheduleManager } from "../hooks/useScheduleManager";
import { WorkSession } from "../models/WorkSession";

export const StorageTestComponent: React.FC = () => {
  const {
    allSchedulesById,
    addSchedule,
    deleteSchedule,
    clearAllData,
    exportData,
    importData,
    getStorageStatus,
  } = useScheduleManager();

  // 테스트용 스케줄 추가
  const addTestSchedule = () => {
    const testSchedule: Partial<WorkSession> = {
      jobName: `테스트 작업 ${Object.keys(allSchedulesById).length + 1}`,
      wageType: "hourly",
      wage: 10000,
      startTime: new Date(),
      endTime: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8시간 후
      startDate: new Date(),
      endDate: null,
      repeatOption: "daily",
      selectedWeekDays: new Set([1, 2, 3, 4, 5]), // 월~금
      isCurrentlyWorking: false,
      description: "테스트용 스케줄입니다.",
    };

    addSchedule(testSchedule);
    Alert.alert("성공", "테스트 스케줄이 추가되었습니다.");
  };

  // 모든 데이터 삭제
  const handleClearAllData = () => {
    Alert.alert("확인", "모든 스케줄 데이터를 삭제하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: () => {
          clearAllData();
          Alert.alert("완료", "모든 데이터가 삭제되었습니다.");
        },
      },
    ]);
  };

  // 데이터 백업
  const handleExportData = () => {
    const exportedData = exportData();
    console.log("백업된 데이터:", exportedData);
    Alert.alert("백업 완료", "콘솔에서 백업된 데이터를 확인하세요.");
  };

  // 저장 상태 확인
  const handleCheckStorage = () => {
    const status = getStorageStatus();
    console.log("저장 상태:", status);
    Alert.alert("저장 상태", "콘솔에서 저장 상태를 확인하세요.");
  };

  // 첫 번째 스케줄 삭제
  const deleteFirstSchedule = () => {
    const scheduleIds = Object.keys(allSchedulesById);
    if (scheduleIds.length > 0) {
      deleteSchedule(scheduleIds[0]);
      Alert.alert("삭제 완료", "첫 번째 스케줄이 삭제되었습니다.");
    } else {
      Alert.alert("알림", "삭제할 스케줄이 없습니다.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>스케줄 저장 테스트</Text>

      <Text style={styles.status}>
        현재 스케줄 수: {Object.keys(allSchedulesById).length}개
      </Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={addTestSchedule}>
          <Text style={styles.buttonText}>테스트 스케줄 추가</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={deleteFirstSchedule}>
          <Text style={styles.buttonText}>첫 번째 스케줄 삭제</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleCheckStorage}>
          <Text style={styles.buttonText}>저장 상태 확인</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleExportData}>
          <Text style={styles.buttonText}>데이터 백업</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.dangerButton]}
          onPress={handleClearAllData}
        >
          <Text style={styles.buttonText}>모든 데이터 삭제</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  status: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
    color: "#666",
  },
  buttonContainer: {
    gap: 10,
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  dangerButton: {
    backgroundColor: "#FF3B30",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
