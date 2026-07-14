import DateTimePicker from '@react-native-community/datetimepicker';
import { Feather } from '@expo/vector-icons';
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

// ─── Web version ───────────────────────────────────────────────────────────────
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
  const isActive = !!previewDate;

  return (
    <View style={[styles.pill, isActive ? styles.pillActive : styles.pillIdle]}>
      <Feather name="calendar" size={11} color={isActive ? '#c9a227' : '#5a8a9a'} style={{ marginRight: 2 }} />
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
          color: isActive ? '#c9a227' : '#5a8a9a',
          fontSize: 11,
          fontFamily: 'inherit',
          cursor: 'pointer',
          outline: 'none',
          padding: 0,
          letterSpacing: '0.5px',
        }}
      />
      {isActive ? (
        <>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>preview</Text>
          </View>
          <TouchableOpacity
            onPress={() => onSet(null)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.clearBtn}
          >
            <Text style={styles.clearBtnText}>✕</Text>
          </TouchableOpacity>
        </>
      ) : (
        <Text style={styles.idleHint}>set preview date</Text>
      )}
    </View>
  );
}

// ─── Native version ────────────────────────────────────────────────────────────
function NativePicker({ previewDate, onSet }: Props) {
  const [showPicker, setShowPicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(previewDate ?? new Date());

  const isActive = !!previewDate;

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
    <>
      <TouchableOpacity
        onPress={open}
        activeOpacity={0.7}
        style={[styles.pill, isActive ? styles.pillActive : styles.pillIdle]}
      >
        <Feather name="calendar" size={11} color={isActive ? '#c9a227' : '#5a8a9a'} style={{ marginRight: 4 }} />
        {isActive ? (
          <>
            <Text style={styles.activeDate}>{formatPreview(previewDate!)}</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>preview</Text>
            </View>
          </>
        ) : (
          <Text style={styles.idleHint}>set preview date</Text>
        )}
      </TouchableOpacity>

      {isActive && (
        <TouchableOpacity
          onPress={() => onSet(null)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.clearBtn}
        >
          <Text style={styles.clearBtnText}>✕</Text>
        </TouchableOpacity>
      )}

      {/* iOS modal */}
      {showPicker && Platform.OS === 'ios' && (
        <Modal transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Preview Date</Text>
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

      {/* Android system picker */}
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
    </>
  );
}

// ─── Export ────────────────────────────────────────────────────────────────────
export default function PreviewDatePicker(props: Props) {
  return (
    <View style={styles.wrapper}>
      {Platform.OS === 'web' ? <WebPicker {...props} /> : <NativePicker {...props} />}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 5,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  pillIdle: {
    backgroundColor: '#0a1624',
    borderColor: '#2a5a6a',
    borderStyle: 'dashed',
  },
  pillActive: {
    backgroundColor: '#110d00',
    borderColor: '#c9a227',
    borderStyle: 'solid',
  },
  idleHint: {
    fontSize: 11,
    color: '#5a8a9a',
    fontFamily: 'Inter_500Medium',
    letterSpacing: 0.4,
  },
  activeDate: {
    fontSize: 11,
    color: '#c9a227',
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.5,
  },
  badge: {
    backgroundColor: '#1a1400',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: '#c9a227',
    marginLeft: 2,
  },
  badgeText: {
    fontSize: 8,
    color: '#c9a227',
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  clearBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#1a1400',
    borderWidth: 1,
    borderColor: '#c9a227',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtnText: {
    fontSize: 10,
    color: '#c9a227',
    fontFamily: 'Inter_600SemiBold',
    lineHeight: 12,
  },
  // Modal (iOS)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCard: {
    backgroundColor: '#0a1220',
    borderRadius: 16,
    paddingBottom: 16,
    borderWidth: 1,
    borderColor: '#2a5a6a',
    width: 320,
    overflow: 'hidden',
  },
  modalTitle: {
    fontSize: 14,
    color: '#c9a227',
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'center',
    paddingTop: 16,
    paddingBottom: 4,
    letterSpacing: 0.8,
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
