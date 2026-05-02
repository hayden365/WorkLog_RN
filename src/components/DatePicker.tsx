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
import { useTheme } from "../hooks/useTheme";

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
  const { colors } = useTheme();

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
    <View style={[styles.container, { backgroundColor: colors.surfaceElevated }]}>
      {/* 날짜 섹션 */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            handleToggle(0, "date");
          }}
          style={[styles.button, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Text
            style={[
              styles.value,
              { color: colors.textPrimary },
              openPicker?.index === 0 &&
                openPicker?.type === "date" &&
                { color: colors.accent },
            ]}
          >
            {new Date(startDate).toLocaleDateString("ko-KR", {
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
          style={[styles.button, { backgroundColor: colors.surface, borderColor: colors.border }]}
          disabled={isCurrentlyWorking}
        >
          <Text
            style={[
              styles.value,
              { color: colors.textPrimary },
              isCurrentlyWorking && { color: colors.textMuted },
              openPicker?.index === 1 &&
                openPicker?.type === "date" &&
                { color: colors.accent },
            ]}
          >
            {endDate
              ? new Date(endDate).toLocaleDateString("ko-KR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              : ""}
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
            value={
              openPicker.index === 1
                ? endDate
                  ? new Date(endDate)
                  : new Date()
                : new Date(startDate)
            }
            style={{ width: "100%", left: -30 }}
            textColor={colors.textPrimary}
            mode={openPicker.type}
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(event, selectedDate) => {
              if (Platform.OS === "android") {
                setOpenPicker(null);
              }
              if (event.type === "set" && selectedDate) {
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
