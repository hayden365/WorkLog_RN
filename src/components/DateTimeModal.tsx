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

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface DateTimeModalProps {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  isOpen: boolean;
  openType: "date" | "time" | null;
  onToggle: (type: "date" | "time") => void;
}

const DateTimeModal = ({
  selectedDate,
  setSelectedDate,
  isOpen,
  openType,
  onToggle,
}: DateTimeModalProps) => {
  const [visible, setVisible] = useState(isOpen);
  const anim = useRef(new Animated.Value(0)).current;

  // isOpen이 바뀔 때 (열릴 때)
  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      Animated.timing(anim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(anim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start(() => setVisible(false));
    }
  }, [isOpen]);

  // openType이 바뀔 때 (이미 열려있는 상태에서 date <-> time 전환)
  useEffect(() => {
    if (isOpen && openType) {
      anim.setValue(0);
      Animated.timing(anim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [openType]);

  return (
    <View style={styles.container}>
      {/* 날짜 줄 */}
      <View style={styles.row}>
        <TouchableOpacity onPress={() => onToggle("date")}>
          <Text style={styles.value}>
            {selectedDate.toLocaleDateString("ko-KR", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </Text>
        </TouchableOpacity>
        {/* 시간 줄 */}
        <TouchableOpacity onPress={() => onToggle("time")}>
          <Text style={styles.value}>
            {selectedDate.toLocaleTimeString("ko-KR", {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            })}
          </Text>
        </TouchableOpacity>
      </View>
      {visible && (
        <Animated.View
          style={{
            width: "100%",
            marginLeft: -80,
            justifyContent: "center",
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
            value={selectedDate}
            textColor="black"
            mode={openType ?? "date"}
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(event, selectedDate) => {
              if (selectedDate) {
                setSelectedDate(selectedDate);
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

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  label: {
    fontSize: 16,
    color: "#444",
  },
  value: {
    fontSize: 16,
    color: "#000",
  },
});
