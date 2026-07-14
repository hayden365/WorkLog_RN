import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from "react-native";
import Modal from "react-native-modal";
import { AppText as Text, AppTextInput as TextInput } from "./AppText";
import SegmentedControl from "@react-native-segmented-control/segmented-control";
import Feather from "@expo/vector-icons/Feather";
import uuid from "react-native-uuid";
import { useWorkplaceStore } from "../store/workplaceStore";
import { Workplace, WageType } from "../models/Workplace";
import { SESSION_COLORS } from "../utils/colorManager";
import { formatNumberWithComma } from "../utils/formatNumbs";
import { useTheme } from "../hooks/useTheme";
import { spacing, radius, fontSize, fontWeight } from "../theme/tokens";

interface WorkplaceManagerModalProps {
  visible: boolean;
  onClose: () => void;
}

const WAGE_TYPE_LABELS: Record<WageType, string> = {
  hourly: "시급",
  daily: "일급",
  monthly: "월급",
};

// 급여유형 + 급여 + 휴게시간을 한 줄 요약으로 표시
const summarizeWorkplace = (w: Workplace) => {
  const wageLabel = `${WAGE_TYPE_LABELS[w.wageType]} ${formatNumberWithComma(
    String(w.wage)
  )}원`;
  return `${wageLabel} · 휴게 ${w.defaultBreakMinutes}분`;
};

export const WorkplaceManagerModal = ({
  visible,
  onClose,
}: WorkplaceManagerModalProps) => {
  const { colors, scheme } = useTheme();
  const workplaces = useWorkplaceStore((s) => s.getAllWorkplaces());
  const addWorkplace = useWorkplaceStore((s) => s.addWorkplace);
  const updateWorkplace = useWorkplaceStore((s) => s.updateWorkplace);
  const archiveWorkplace = useWorkplaceStore((s) => s.archiveWorkplace);

  // 편집 폼 표시 여부 및 대상 (null이면 신규 생성)
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState<string>(SESSION_COLORS[0]);
  const [wageType, setWageType] = useState<WageType>("hourly");
  const [wageValue, setWageValue] = useState("");
  const [breakValue, setBreakValue] = useState("");

  const activeWorkplaces = workplaces.filter((w) => !w.archived);
  const archivedWorkplaces = workplaces.filter((w) => w.archived);

  const resetForm = () => {
    setIsEditing(false);
    setEditingId(null);
    setName("");
    setColor(SESSION_COLORS[0]);
    setWageType("hourly");
    setWageValue("");
    setBreakValue("");
  };

  const openCreateForm = () => {
    resetForm();
    setIsEditing(true);
  };

  const openEditForm = (workplace: Workplace) => {
    setIsEditing(true);
    setEditingId(workplace.id);
    setName(workplace.name);
    setColor(workplace.color);
    setWageType(workplace.wageType);
    setWageValue(formatNumberWithComma(String(workplace.wage)));
    setBreakValue(String(workplace.defaultBreakMinutes));
  };

  const handleWageChange = (value: string) => {
    setWageValue(formatNumberWithComma(value));
  };

  const handleSaveWorkplace = () => {
    const trimmedName = name.trim();
    const wage = Number(wageValue.replace(/,/g, "")) || 0;
    const defaultBreakMinutes = Number(breakValue.replace(/[^0-9]/g, "")) || 0;

    if (!trimmedName) {
      Alert.alert("입력 오류", "근무지명을 입력해주세요.");
      return;
    }
    if (wage <= 0 && wageType !== "monthly") {
      Alert.alert("입력 오류", "기본 급여를 입력해주세요.");
      return;
    }

    if (editingId) {
      updateWorkplace(editingId, {
        name: trimmedName,
        color,
        wageType,
        wage,
        defaultBreakMinutes,
      });
    } else {
      addWorkplace({
        id: uuid.v4() as string,
        name: trimmedName,
        color,
        wageType,
        wage,
        defaultBreakMinutes,
        archived: false,
      });
    }
    resetForm();
  };

  const handleArchive = (workplace: Workplace) => {
    Alert.alert(
      "근무지 보관",
      `'${workplace.name}'을(를) 보관하시겠습니까? 보관된 근무지는 새 근무 일정 선택 목록에 나타나지 않습니다.`,
      [
        { text: "취소", style: "cancel" },
        {
          text: "보관",
          style: "destructive",
          onPress: () => archiveWorkplace(workplace.id),
        },
      ]
    );
  };

  const handleModalClose = () => {
    resetForm();
    onClose();
  };

  const renderWorkplaceRow = (workplace: Workplace) => (
    <View
      key={workplace.id}
      style={[styles.row, { backgroundColor: colors.surface }]}
    >
      <View
        style={[styles.colorDot, { backgroundColor: workplace.color }]}
      />
      <View style={styles.rowInfo}>
        <Text
          style={[
            styles.rowName,
            { color: colors.textPrimary },
            workplace.archived && { color: colors.textMuted },
          ]}
        >
          {workplace.name}
        </Text>
        <Text style={[styles.rowSummary, { color: colors.textSecondary }]}>
          {summarizeWorkplace(workplace)}
        </Text>
      </View>
      <View style={styles.rowActions}>
        <TouchableOpacity
          style={styles.rowActionButton}
          onPress={() => openEditForm(workplace)}
          hitSlop={8}
        >
          <Feather name="edit-2" size={18} color={colors.brand} />
        </TouchableOpacity>
        {!workplace.archived && (
          <TouchableOpacity
            style={styles.rowActionButton}
            onPress={() => handleArchive(workplace)}
            hitSlop={8}
          >
            <Feather name="archive" size={18} color={colors.danger} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={handleModalClose}
      onSwipeComplete={handleModalClose}
      swipeDirection="down"
      style={styles.modal}
      avoidKeyboard
    >
      <View
        style={[styles.container, { backgroundColor: colors.surfaceElevated }]}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            근무지 관리
          </Text>
          <TouchableOpacity onPress={handleModalClose} hitSlop={12}>
            <Feather name="x" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {isEditing ? (
            <View
              style={[styles.card, { backgroundColor: colors.surface }]}
            >
              <Text style={[styles.formLabel, { color: colors.textSecondary }]}>
                근무지명
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.surfaceElevated, color: colors.textPrimary },
                ]}
                placeholder="예: 강남 카페"
                placeholderTextColor={colors.textMuted}
                value={name}
                onChangeText={setName}
              />

              <Text style={[styles.formLabel, { color: colors.textSecondary }]}>
                색상
              </Text>
              <View style={styles.colorRow}>
                {SESSION_COLORS.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[
                      styles.colorSwatch,
                      { backgroundColor: c },
                      color === c && [
                        styles.colorSwatchSelected,
                        { borderColor: colors.textPrimary },
                      ],
                    ]}
                    onPress={() => setColor(c)}
                  />
                ))}
              </View>

              <Text style={[styles.formLabel, { color: colors.textSecondary }]}>
                급여 유형
              </Text>
              <SegmentedControl
                appearance={scheme}
                tintColor={colors.surfaceElevated}
                backgroundColor={colors.divider}
                fontStyle={{ color: colors.textPrimary }}
                activeFontStyle={{ color: colors.textPrimary }}
                values={["시급", "일급", "월급"]}
                selectedIndex={
                  wageType === "hourly" ? 0 : wageType === "daily" ? 1 : 2
                }
                onChange={(event) => {
                  const idx = event.nativeEvent.selectedSegmentIndex;
                  setWageType(idx === 0 ? "hourly" : idx === 1 ? "daily" : "monthly");
                }}
              />

              <Text style={[styles.formLabel, { color: colors.textSecondary }]}>
                기본 {WAGE_TYPE_LABELS[wageType]}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.surfaceElevated, color: colors.textPrimary },
                ]}
                placeholder={`기본 ${WAGE_TYPE_LABELS[wageType]}`}
                placeholderTextColor={colors.textMuted}
                value={wageValue}
                keyboardType="number-pad"
                onChangeText={handleWageChange}
              />

              <Text style={[styles.formLabel, { color: colors.textSecondary }]}>
                기본 휴게시간(분)
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.surfaceElevated, color: colors.textPrimary },
                ]}
                placeholder="예: 60"
                placeholderTextColor={colors.textMuted}
                value={breakValue}
                keyboardType="number-pad"
                onChangeText={(v) => setBreakValue(v.replace(/[^0-9]/g, ""))}
              />

              <View style={styles.formButtonRow}>
                <TouchableOpacity
                  style={[styles.formButton, { backgroundColor: colors.divider }]}
                  onPress={resetForm}
                >
                  <Text style={{ color: colors.textPrimary, fontWeight: fontWeight.medium }}>
                    취소
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.formButton, { backgroundColor: colors.brand }]}
                  onPress={handleSaveWorkplace}
                >
                  <Text style={{ color: colors.accentText, fontWeight: fontWeight.bold }}>
                    저장
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.addButton, { borderColor: colors.brand }]}
              onPress={openCreateForm}
            >
              <Feather name="plus" size={18} color={colors.brand} />
              <Text style={[styles.addButtonText, { color: colors.brand }]}>
                새 근무지
              </Text>
            </TouchableOpacity>
          )}

          <View style={styles.listSection}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
              사용 중인 근무지
            </Text>
            {activeWorkplaces.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                등록된 근무지가 없습니다.
              </Text>
            ) : (
              activeWorkplaces.map(renderWorkplaceRow)
            )}
          </View>

          {archivedWorkplaces.length > 0 && (
            <View style={styles.listSection}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                보관된 근무지
              </Text>
              {archivedWorkplaces.map(renderWorkplaceRow)}
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: {
    justifyContent: "flex-end",
    margin: 0,
  },
  container: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: 36,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    maxHeight: "85%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  scroll: {
    flexGrow: 0,
  },
  sectionLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    marginBottom: spacing.sm,
  },
  listSection: {
    marginTop: spacing.lg,
  },
  emptyText: {
    fontSize: fontSize.md,
    paddingVertical: spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: radius.full,
  },
  rowInfo: {
    flex: 1,
    gap: spacing.xxs,
  },
  rowName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },
  rowSummary: {
    fontSize: fontSize.sm,
  },
  rowActions: {
    flexDirection: "row",
    gap: spacing.md,
  },
  rowActionButton: {
    padding: spacing.xs,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
  },
  addButtonText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },
  card: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  formLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    marginTop: spacing.sm,
  },
  input: {
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.base,
    height: 48,
  },
  colorRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  colorSwatch: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
  },
  colorSwatchSelected: {
    borderWidth: 3,
  },
  formButtonRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  formButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    paddingVertical: spacing.md,
  },
});
