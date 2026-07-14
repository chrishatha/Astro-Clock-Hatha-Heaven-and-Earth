import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import {
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface Props {
  previewDate: Date | null;
  onSet: (d: Date | null) => void;
}

const MIN_DATE = new Date('1526-01-01');
const MAX_DATE = new Date('2526-12-31');

function formatPreview(d: Date): string {
  return d.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ─── Web version ──────────────────────────────────────────────────────────────
function WebPicker({ previewDate, onSet }: Props) {
  function toInputValue(d: Date): string {
    const y = d.getFullYear().toString().padStart(4, '0');
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dy = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dy}`;
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.value) return;
    const [y, m, dy] = e.target.value.split('-').map(Number);
    const d = new Date(previewDate ?? new Date());
    d.setFullYear(y, m - 1, dy);
    onSet(d);
  }

  const inputValue = previewDate ? toInputValue(previewDate) : '';

  return (
    <View style={styles.row}>
      {/* @ts-ignore — web-only input element */}
      <input
        type="date"
        min="1526-01-01"
        max="2526-12-31"
        value={inputValue}
        onChange={handleChange}
        style={{
          background: 'transparent',
          border: 'none',
          color: previewDate ? '#c9a227' : '#4a5a6a',
          fontSize: 12,
          fontFamily: 'inherit',
          cursor: 'pointer',
          outline: 'none',
          padding: 0,
          width: previewDate ? 'auto' : 110,
        }}
        placeholder="set preview date"
      />
      {previewDate && (
        <>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>preview</Text>
          </View>
          <TouchableOpacity onPress={() => onSet(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.clearBtn}>✕</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

// ─── Native version ────────────────────────────────────────────────────────────
function NativePicker({ previewDate, onSet }: Props) {
  const [showPicker, setShowPicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(previewDate ?? new Date());

  function open() {
    setTempDate(previewDate ?? new Date());
    setShowPicker(true);
  }

  function handleChange(_: unknown, selected?: Date) {
    if (Platform.OS === 'android') {
      setShowPicker(false);
      if (selected) onSet(selected);
    } else {
      if (selected) setTempDate(selected);
    }
  }

  function confirm() {
    setShowPicker(false);
    onSet(tempDate);
  }

  function cancel() {
    setShowPicker(false);
  }

  return (
    <View style={styles.row}>
      <TouchableOpacity onPress={open} style={styles.selectBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Text style={[styles.selectText, previewDate ? styles.selectTextActive : null]}>
          {previewDate ? formatPreview(previewDate) : 'set preview date'}
        </Text>
      </TouchableOpacity>

      {previewDate && (
        <>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>preview</Text>
          </View>
          <TouchableOpacity onPress={() => onSet(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.clearBtn}>✕</Text>
          </TouchableOpacity>
        </>
      )}

      {/* iOS uses a modal so the user can confirm/cancel */}
      {showPicker && Platform.OS === 'ios' && (
        <Modal transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <DateTimePicker
                value={tempDate}
                mode="date"
                display="spinner"
                minimumDate={MIN_DATE}
                maximumDate={MAX_DATE}
                onChange={handleChange}
                themeVariant="dark"
                textColor="#e8d5a3"
              />
              <View style={styles.modalBtns}>
                <TouchableOpacity onPress={cancel} style={styles.modalBtn}>
                  <Text style={styles.modalBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={confirm} style={[styles.modalBtn, styles.modalBtnConfirm]}>
                  <Text style={[styles.modalBtnText, styles.modalBtnTextConfirm]}>Set date</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Android picker is inline */}
      {showPicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={tempDate}
          mode="date"
          display="default"
          minimumDate={MIN_DATE}
          maximumDate={MAX_DATE}
          onChange={handleChange}
        />
      )}
    </View>
  );
}

// ─── Export ────────────────────────────────────────────────────────────────────
export default function PreviewDatePicker(props: Props) {
  if (Platform.OS === 'web') return <WebPicker {...props} />;
  return <NativePicker {...props} />;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  selectBtn: {
    paddingVertical: 1,
  },
  selectText: {
    fontSize: 12,
    color: '#4a5a6a',
    fontFamily: 'Inter_400Regular',
    letterSpacing: 0.3,
  },
  selectTextActive: {
    color: '#c9a227',
  },
  badge: {
    backgroundColor: '#1a1400',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: '#c9a227',
  },
  badgeText: {
    fontSize: 9,
    color: '#c9a227',
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  clearBtn: {
    fontSize: 13,
    color: '#c9a227',
    fontFamily: 'Inter_600SemiBold',
    lineHeight: 16,
  },
  // Modal (iOS)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCard: {
    backgroundColor: '#0a1220',
    borderRadius: 16,
    paddingBottom: 12,
    borderWidth: 1,
    borderColor: '#1e2d42',
    width: 320,
    overflow: 'hidden',
  },
  modalBtns: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#0f1a28',
    borderWidth: 1,
    borderColor: '#1e2d42',
    alignItems: 'center',
  },
  modalBtnConfirm: {
    backgroundColor: '#1a1400',
    borderColor: '#c9a227',
  },
  modalBtnText: {
    fontSize: 14,
    color: '#7a8a9a',
    fontFamily: 'Inter_600SemiBold',
  },
  modalBtnTextConfirm: {
    color: '#c9a227',
  },
});
