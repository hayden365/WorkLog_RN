import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Modal,
  TouchableWithoutFeedback,
  Platform,
  LayoutRectangle,
} from "react-native";
import React, { useCallback, useRef, useState } from "react";
import Entypo from "@expo/vector-icons/Entypo";

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

  const [top, setTop] = useState(0);

  const [dropdownLayout, setDropdownLayout] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });

  const toggleExpanded = useCallback(() => {
    if (buttonRef.current) {
      buttonRef.current.measureInWindow((x, y, width, height) => {
        setDropdownLayout({
          x,
          y,
          width,
          height,
        });
      });
    }
    setExpanded(!expanded);
  }, [expanded]);

  const onSelect = useCallback((item: OptionItem) => {
    onChange(item);
    setValue(item.label);
    setExpanded(false);
  }, []);

  return (
    <View
      ref={buttonRef}
      style={{
        position: "relative",
      }}
    >
      <TouchableOpacity
        style={styles.button}
        activeOpacity={0.8}
        onPress={toggleExpanded}
      >
        <Text style={styles.text}>{value || placeholder}</Text>
        <Entypo name={expanded ? "chevron-up" : "chevron-down"} size={20} />
      </TouchableOpacity>
      {expanded ? (
        <Modal visible={expanded} transparent>
          <TouchableWithoutFeedback onPress={() => setExpanded(false)}>
            <View style={styles.backdrop}>
              <View
                style={[
                  styles.options,
                  {
                    position: "absolute",
                    top: dropdownLayout?.y + dropdownLayout?.height + 10,
                    left: dropdownLayout?.x,
                    width: dropdownLayout?.width,
                  },
                ]}
              >
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
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
  },
  optionItem: {
    height: 40,
    justifyContent: "center",
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
