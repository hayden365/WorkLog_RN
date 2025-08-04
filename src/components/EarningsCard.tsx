import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useDateStore } from "../store/dateStore";
import Feather from "@expo/vector-icons/Feather";
interface EarningsCardProps {
  totalEarnings: number;
}

export const EarningsCard = ({ totalEarnings }: EarningsCardProps) => {
  const { month } = useDateStore();
  const [isVisible, setIsVisible] = useState(false);

  const formatNumberWithComma = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, "");
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  return (
    <View style={styles.card}>
      <View style={styles.column}>
        <View style={styles.row}>
          <Text style={styles.label}>{month + 1}월 예상 급여</Text>
          {isVisible ? (
            <TouchableOpacity onPress={() => setIsVisible(false)}>
              <Feather name="eye-off" size={24} color="black" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => setIsVisible(true)}>
              <Feather name="eye" size={24} color="black" />
            </TouchableOpacity>
          )}
        </View>
        {isVisible ? (
          <Text style={styles.amount}>
            ₩ {formatNumberWithComma(totalEarnings.toString())}
          </Text>
        ) : (
          <View style={styles.hiddenAmount}>
            <Text style={styles.hiddenAmountText}>금액숨김</Text>
            {/* <Feather name="chevron-right" size={24} color="#8e8e93" /> */}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: "100%",
    height: 110,
    padding: 20,
    backgroundColor: "#f8f8f8",
    borderRadius: 12,
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
    alignItems: "center",
  },
  column: {
    flexDirection: "column",
    gap: 16,
    alignItems: "flex-start",
  },
  label: {
    fontSize: 15,
    color: "#1c1c1e", // CupertinoColors.label 대체
    fontWeight: "500",
  },
  amount: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1c1c1e",
  },
  hiddenAmount: {
    color: "#8e8e93",
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 4,
  },
  hiddenAmountText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#8e8e93",
  },
});
