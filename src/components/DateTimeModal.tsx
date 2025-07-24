import {
  LayoutAnimation,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
  Animated,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useEffect, useRef, useState } from "react";
import { useShiftStore } from "../store/shiftStore";

// Android에서 LayoutAnimation 활성화
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const DateTimeModal = () => {
  const { startDate, setStartDate, endDate, setEndDate } = useShiftStore();
  const [openPicker, setOpenPicker] = useState<null | {
    index: number;
    type: "date" | "time";
  }>(null);
  const anim = useRef(new Animated.Value(0)).current;

  const handleToggle = (index: number, type: "date" | "time") => {
    // 레이아웃 애니메이션 설정
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    if (openPicker?.index === index && openPicker?.type === type) {
      // 같은 picker를 다시 클릭하면 닫기 __ ok
      Animated.timing(anim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        setOpenPicker(null);
      });
    } else if (openPicker?.index === index && openPicker?.type !== type) {
      // 같은 index, 다른 type - 애니메이션으로 전환 __ ok
      Animated.timing(anim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }).start(() => {
        setOpenPicker({ index, type });
        Animated.timing(anim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }).start();
      });
    } else if (openPicker?.index !== index) {
      // 다른 index - 애니메이션으로 전환
      setOpenPicker({ index, type });
      Animated.timing(anim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
      Animated.timing(anim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    } else if (openPicker == null) {
      // 새로운 picker 열기
      setOpenPicker({ index, type });
      Animated.timing(anim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  };

  // // openPicker가 변경될 때 애니메이션 실행
  // useEffect(() => {
  //   if (openPicker) {
  //     Animated.timing(anim, {
  //       toValue: 1,
  //       duration: 300,
  //       useNativeDriver: true,
  //     }).start();
  //   } else {
  //     Animated.timing(anim, {
  //       toValue: 0,
  //       duration: 300,
  //       useNativeDriver: true,
  //     }).start();
  //   }
  // }, [openPicker]);

  return (
    <View style={styles.container}>
      {/* 시작 날짜/시간 섹션 */}
      <View style={styles.row}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            handleToggle(0, "date");
          }}
        >
          <Text
            style={[
              styles.value,
              openPicker?.index === 0 &&
                openPicker?.type === "date" &&
                styles.activeValue,
            ]}
          >
            {startDate.toLocaleDateString("ko-KR", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            handleToggle(0, "time");
          }}
        >
          <Text
            style={[
              styles.value,
              openPicker?.index === 0 &&
                openPicker?.type === "time" &&
                styles.activeValue,
            ]}
          >
            {startDate.toLocaleTimeString("ko-KR", {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            })}
          </Text>
        </TouchableOpacity>
      </View>
      {/* DateTimePicker */}
      {openPicker?.index === 0 && (
        <Animated.View
          style={{
            width: "100%",
            justifyContent: "center",
            alignItems: "center",
            opacity: anim,
            transform: [
              {
                translateY: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-20, 0],
                }),
              },
            ],
          }}
        >
          <DateTimePicker
            value={startDate}
            style={{ width: "100%", left: -30 }}
            textColor="black"
            mode={openPicker.type}
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(event, selectedDate) => {
              if (selectedDate) {
                setStartDate(selectedDate);
              }
            }}
          />
        </Animated.View>
      )}
      {/* 종료 날짜/시간 섹션 */}
      <View style={styles.row}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            handleToggle(1, "date");
          }}
        >
          <Text
            style={[
              styles.value,
              openPicker?.index === 1 &&
                openPicker?.type === "date" &&
                styles.activeValue,
            ]}
          >
            {endDate.toLocaleDateString("ko-KR", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            handleToggle(1, "time");
          }}
        >
          <Text
            style={[
              styles.value,
              openPicker?.index === 1 &&
                openPicker?.type === "time" &&
                styles.activeValue,
            ]}
          >
            {endDate.toLocaleTimeString("ko-KR", {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            })}
          </Text>
        </TouchableOpacity>
      </View>

      {/* DateTimePicker */}
      {openPicker?.index === 1 && (
        <Animated.View
          style={{
            width: "100%",
            justifyContent: "center",
            alignItems: "center",
            opacity: anim,
            transform: [
              {
                translateY: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-20, 0],
                }),
              },
            ],
          }}
        >
          <DateTimePicker
            value={endDate}
            style={{ width: "100%", left: -30 }}
            textColor="black"
            mode={openPicker.type}
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(event, selectedDate) => {
              if (selectedDate) {
                setEndDate(selectedDate);
              }
            }}
          />
        </Animated.View>
      )}
    </View>
  );
};

export default DateTimeModal;

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 40,
  },
  label: {
    fontSize: 16,
    color: "#444",
  },
  value: {
    fontSize: 16,
    color: "#000",
  },
  activeValue: {
    color: "#007AFF", // 활성화된 상태의 색상
    fontWeight: "600",
  },
});
