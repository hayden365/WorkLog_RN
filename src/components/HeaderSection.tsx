// src/components/HeaderSection.tsx

import React from "react";
import { View, Text, StyleSheet } from "react-native";

export const HeaderSection = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>6월 수익</Text>
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
