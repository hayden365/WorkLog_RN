import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useDateStore } from "../store/dateStore";

export const HeaderSection = () => {
  const { month } = useDateStore();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{month}월 수익</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
  },
});
