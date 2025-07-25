import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Modal,
  TouchableWithoutFeedback,
  Dimensions,
} from "react-native";
import React, { useCallback, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";

type OptionItem = {
  value: string;
  label: string;
};

interface DropDownProps {
  data: OptionItem[];
  onChange: (item: OptionItem) => void;
  placeholder: string;
}

export default function Dropdown({
  data,
  onChange,
  placeholder,
}: DropDownProps) {
  const [expanded, setExpanded] = useState(false);
  const buttonRef = useRef<View>(null);
  const [value, setValue] = useState("");
  const [dropdownLayout, setDropdownLayout] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const [showAbove, setShowAbove] = useState(false);

  const screenHeight = Dimensions.get("window").height;
  const screenMiddle = screenHeight / 2;

  const toggleExpanded = useCallback(() => {
    if (buttonRef.current) {
      buttonRef.current.measureInWindow((x, y, width, height) => {
        const layout = { x, y, width, height };
        setDropdownLayout(layout);

        // 버튼의 중앙점이 화면 중간보다 아래에 있으면 위로 펼치기
        const buttonCenter = y + height / 2;
        setShowAbove(buttonCenter > screenMiddle);
      });
    }
    setExpanded(!expanded);
  }, [expanded, screenMiddle]);

  const onSelect = useCallback(
    (item: OptionItem) => {
      onChange(item);
      setValue(item.label);
      setExpanded(false);
    },
    [onChange]
  );

  const getDropdownStyle = () => {
    const baseStyle = {
      position: "absolute" as const,
      left: dropdownLayout?.x,
      width: dropdownLayout?.width,
    };
    if (showAbove) {
      return {
        ...baseStyle,
        bottom: screenHeight - dropdownLayout?.y - 60,
      };
    } else {
      return {
        ...baseStyle,
        top: dropdownLayout?.y + dropdownLayout?.height + 10,
      };
    }
  };

  return (
    <View ref={buttonRef} style={{ position: "relative" }}>
      <TouchableOpacity
        style={styles.button}
        activeOpacity={0.8}
        onPress={toggleExpanded}
      >
        <Text style={styles.text}>{value || placeholder}</Text>
        <Ionicons name="chevron-expand" size={22} color="black" />
      </TouchableOpacity>
      {expanded ? (
        <Modal visible={expanded} animationType="fade" transparent>
          <TouchableWithoutFeedback onPress={() => setExpanded(false)}>
            <View style={styles.backdrop}>
              <View style={[styles.options, getDropdownStyle()]}>
                <FlatList
                  keyExtractor={(item) => item.value}
                  data={data}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      style={styles.optionItem}
                      onPress={() => onSelect(item)}
                    >
                      <Text>{item.label}</Text>
                    </TouchableOpacity>
                  )}
                  ItemSeparatorComponent={() => (
                    <View
                      style={[
                        styles.separator,
                        {
                          borderBottomWidth: 1,
                          borderColor: "rgba(0, 0, 0, 0.1)",
                        },
                      ]}
                    />
                  )}
                  ListFooterComponent={() => <View style={styles.separator} />}
                />
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
  },
  optionItem: {
    height: 40,
    justifyContent: "center",
    paddingHorizontal: 15,
  },
  separator: {
    height: 4,
  },
  options: {
    backgroundColor: "white",
    justifyContent: "center",
    width: "100%",
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
    maxHeight: 250,
    shadowColor: "rgba(0, 0, 0, 0.2)",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  text: {
    fontSize: 15,
    opacity: 0.8,
  },
  button: {
    position: "relative",
    justifyContent: "space-between",
    flexDirection: "row",
    width: "100%",
    alignItems: "center",
    paddingHorizontal: 15,
    borderRadius: 8,
  },
});
