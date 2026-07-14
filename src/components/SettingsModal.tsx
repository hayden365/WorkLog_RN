import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import { AppText as Text } from './AppText';
import Modal from 'react-native-modal';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import Feather from '@expo/vector-icons/Feather';
import { useTheme } from '../hooks/useTheme';
import { useThemeStore, ThemeMode } from '../store/themeStore';
import { useSettingsStore, WorkTimeDisplayMode } from '../store/settingsStore';
import { WorkplaceManagerModal } from './WorkplaceManagerModal';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

const ORDER: ThemeMode[] = ['light', 'dark', 'system'];
const LABELS = ['라이트', '다크', '시스템'];

const DISPLAY_MODE_ORDER: WorkTimeDisplayMode[] = ['actual', 'total'];
const DISPLAY_MODE_LABELS = ['실근무', '총근무'];

export const SettingsModal = ({ visible, onClose }: SettingsModalProps) => {
  const { colors } = useTheme();
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);
  const workTimeDisplayMode = useSettingsStore((s) => s.workTimeDisplayMode);
  const setWorkTimeDisplayMode = useSettingsStore(
    (s) => s.setWorkTimeDisplayMode,
  );
  const systemScheme = useColorScheme();
  const [workplaceManagerVisible, setWorkplaceManagerVisible] = useState(false);

  const selectedIndex = ORDER.indexOf(mode);
  const systemLabel = systemScheme === 'dark' ? '다크' : '라이트';
  const displayModeIndex = DISPLAY_MODE_ORDER.indexOf(workTimeDisplayMode);

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onClose}
      onSwipeComplete={onClose}
      swipeDirection='down'
      style={styles.modal}
    >
      <View
        style={[styles.container, { backgroundColor: colors.surfaceElevated }]}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>설정</Text>
          <TouchableOpacity onPress={onClose} hitSlop={12}>
            <Feather name='x' size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            테마
          </Text>
          <SegmentedControl
            values={LABELS}
            selectedIndex={selectedIndex >= 0 ? selectedIndex : 2}
            onChange={(event) => {
              const idx = event.nativeEvent.selectedSegmentIndex;
              setMode(ORDER[idx]);
            }}
          />
          {mode === 'system' && (
            <Text style={[styles.systemHint, { color: colors.textMuted }]}>
              현재 시스템: {systemLabel}
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            근무시간 표시
          </Text>
          <SegmentedControl
            values={DISPLAY_MODE_LABELS}
            selectedIndex={displayModeIndex >= 0 ? displayModeIndex : 0}
            onChange={(event) => {
              const idx = event.nativeEvent.selectedSegmentIndex;
              setWorkTimeDisplayMode(DISPLAY_MODE_ORDER[idx]);
            }}
          />
          <Text style={[styles.systemHint, { color: colors.textMuted }]}>
            {workTimeDisplayMode === 'total'
              ? '휴게시간을 포함한 총 근무시간을 표시합니다'
              : '휴게시간을 제외한 실근무 시간을 표시합니다 (급여는 항상 실근무 기준)'}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            근무지
          </Text>
          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => setWorkplaceManagerVisible(true)}
          >
            <Text style={[styles.linkRowText, { color: colors.textPrimary }]}>
              근무지 관리
            </Text>
            <Feather name="chevron-right" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      <WorkplaceManagerModal
        visible={workplaceManagerVisible}
        onClose={() => setWorkplaceManagerVisible(false)}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 36,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  section: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  systemHint: {
    fontSize: 12,
    marginTop: 8,
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  linkRowText: {
    fontSize: 16,
  },
});
