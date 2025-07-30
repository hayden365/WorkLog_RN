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

const DatePicker = ({
  isCurrentlyWorking,
}: {
  isCurrentlyWorking: boolean;
}) => {
  const { startDate, setStartDate, endDate, setEndDate } = useShiftStore();
  const [openPicker, setOpenPicker] = useState<null | {
    index: number;
    type: "date";
  }>(null);
  const anim = useRef(new Animated.Value(0)).current;

  const handleToggle = (index: number, type: "date") => {
    // 레이아웃 애니메이션 설정
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    if (openPicker?.index === index && openPicker?.type === type) {
      // 같은 picker를 다시 클릭하면 닫기
      Animated.timing(anim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setOpenPicker(null);
      });
    } else if (openPicker?.index !== index) {
      // 다른 index - 애니메이션으로 전환
      setOpenPicker({ index, type });
      Animated.timing(anim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
      Animated.timing(anim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else if (openPicker == null) {
      // 새로운 picker 열기
      setOpenPicker({ index, type });
      Animated.timing(anim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  };

  return (
    <View style={styles.container}>
      {/* 날짜 섹션 */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            handleToggle(0, "date");
          }}
          style={styles.button}
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
            handleToggle(1, "date");
          }}
          style={styles.button}
          disabled={isCurrentlyWorking}
        >
          <Text
            style={[
              styles.value,
              isCurrentlyWorking && styles.disabled,
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
      </View>

      {/* DateTimePicker */}
      {openPicker?.type === "date" && (
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
            value={openPicker.index === 1 ? endDate : startDate}
            style={{ width: "100%", left: -30 }}
            textColor="black"
            mode={openPicker.type}
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(event, selectedDate) => {
              if (selectedDate) {
                if (openPicker.index === 1) {
                  setEndDate(selectedDate);
                } else {
                  setStartDate(selectedDate);
                }
              }
            }}
            locale="ko-KR"
          />
        </Animated.View>
      )}
    </View>
  );
};

export default DatePicker;

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    gap: 16,
  },
  value: {
    fontSize: 16,
    color: "#000",
  },
  activeValue: {
    color: "#007AFF", // 활성화된 상태의 색상
  },
  disabled: {
    color: "#ddd",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 40,
  },
  button: {
    maxWidth: 145,
    backgroundColor: "#f5f5f5",
    flex: 1,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },
});
