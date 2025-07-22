import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface EarningsCardProps {
  totalEarnings: number;
}

export const EarningsCard = ({ totalEarnings }: EarningsCardProps) => {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.label}>이번 달 예상 급여</Text>
        <Text style={styles.amount}>₩ {totalEarnings}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: "100%",
    padding: 30,
    backgroundColor: "#f2f2f7", // Cupertino systemGrey6 대체
    borderRadius: 12,
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  label: {
    fontSize: 15,
    color: "#1c1c1e", // CupertinoColors.label 대체
  },
  amount: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1c1c1e",
  },
});
