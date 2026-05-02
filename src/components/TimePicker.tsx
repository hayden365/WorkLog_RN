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
import React, { useRef, useState } from "react";
import { useShiftStore } from "../store/shiftStore";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "../hooks/useTheme";

// Android에서 LayoutAnimation 활성화
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const TimePicker = () => {
  const { startTime, setStartTime, endTime, setEndTime } = useShiftStore();
  const { colors } = useTheme();

  const [openPicker, setOpenPicker] = useState<null | {
    index: number;
    type: "time";
  }>(null);
  const anim = useRef(new Animated.Value(0)).current;

  const handleToggle = (index: number, type: "time") => {
    // 레이아웃 애니메이션 설정
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    if (openPicker?.index === index && openPicker?.type === type) {
      // 같은 picker를 다시 클릭하면 닫기
      Animated.timing(anim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        setOpenPicker(null);
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

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceElevated }]}>
      {/* 시작 시간/종료 시간 섹션 */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            handleToggle(0, "time");
          }}
          style={[styles.button, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Text
            style={[
              styles.value,
              { color: colors.textPrimary },
              openPicker?.index === 0 &&
                openPicker?.type === "time" &&
                { color: colors.accent },
            ]}
          >
            {startTime
              ? new Date(startTime).toLocaleTimeString("ko-KR", {
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                })
              : "시간 선택"}
          </Text>
        </TouchableOpacity>
        <MaterialCommunityIcons name="tilde" size={16} color={colors.textSecondary} />
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            handleToggle(1, "time");
          }}
          style={[styles.button, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Text
            style={[
              styles.value,
              { color: colors.textPrimary },
              openPicker?.index === 1 &&
                openPicker?.type === "time" &&
                { color: colors.accent },
            ]}
          >
            {new Date(endTime).toLocaleTimeString("ko-KR", {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            })}
          </Text>
        </TouchableOpacity>
      </View>

      {/* DateTimePicker */}
      {openPicker && (
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
            value={openPicker.index === 0 ? startTime : endTime}
            style={{ width: "100%", left: -30 }}
            textColor={colors.textPrimary}
            mode="time"
            is24Hour={false}
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(event, selectedDate) => {
              if (Platform.OS === "android") {
                setOpenPicker(null);
              }
              if (event.type === "set" && selectedDate) {
                if (openPicker.index === 0) {
                  setStartTime(selectedDate);
                } else {
                  setEndTime(selectedDate);
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

export default TimePicker;

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  value: {
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 40,
  },
  button: {
    maxWidth: 145,
    flex: 1,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
  },
});
