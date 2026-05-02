import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useDateStore } from "../store/dateStore";
import Feather from "@expo/vector-icons/Feather";
import { useTheme } from '../hooks/useTheme';

export const EarningsCard = ({ totalEarnings }: { totalEarnings: number }) => {
  const { month } = useDateStore();
  const [isVisible, setIsVisible] = useState(false);
  const { colors } = useTheme();

  const formatNumberWithComma = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, "");
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <View style={styles.column}>
        <View style={styles.row}>
          <Text style={[styles.label, { color: colors.textPrimary }]}>
            {month + 1}월 예상 급여
          </Text>
          {isVisible ? (
            <TouchableOpacity onPress={() => setIsVisible(false)}>
              <Feather name='eye-off' size={18} color={colors.textPrimary} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => setIsVisible(true)}>
              <Feather name='eye' size={18} color={colors.textPrimary} />
            </TouchableOpacity>
          )}
        </View>
        {isVisible ? (
          <Text style={[styles.amount, { color: colors.textPrimary }]}>
            ₩ {formatNumberWithComma(totalEarnings.toString())}
          </Text>
        ) : (
          <View style={styles.hiddenAmount}>
            <Text style={[styles.hiddenAmountText, { color: colors.textMuted }]}>
              금액숨김
            </Text>
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
    fontWeight: "500",
  },
  amount: {
    fontSize: 24,
    fontWeight: "bold",
  },
  hiddenAmount: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 4,
  },
  hiddenAmountText: {
    fontSize: 24,
    fontWeight: "bold",
  },
  selectedDateSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e5e5e5",
  },
  selectedDateLabel: {
    fontSize: 13,
    color: "#666",
    marginBottom: 4,
  },
  selectedDateAmount: {
    fontSize: 18,
    fontWeight: "600",
    color: "#007aff",
  },
});
