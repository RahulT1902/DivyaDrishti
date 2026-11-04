import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Platform,
} from 'react-native';
import { Calendar, Clock, MapPin, ChevronLeft, ChevronRight, Check, X } from 'lucide-react-native';
import { cities as INDIAN_CITIES } from '../constants/cities';

export interface BirthDetailsData {
  date: string; // YYYY-MM-DD
  time: string; // HH:mm (24-hour format)
  city: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

interface BirthDetailsPickerProps {
  value: BirthDetailsData;
  onChange: (details: BirthDetailsData) => void;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS_LIST = Array.from({ length: 100 }, (_, i) => CURRENT_YEAR - i);

interface CityOption {
  city: string;
  lat: number;
  lng: number;
  tz: string;
}

const POPULAR_CITIES: CityOption[] = [
  { city: 'New Delhi, India', lat: 28.6139, lng: 77.2090, tz: 'Asia/Kolkata' },
  { city: 'Mumbai, India', lat: 19.0760, lng: 72.8777, tz: 'Asia/Kolkata' },
  { city: 'Bengaluru, India', lat: 12.9716, lng: 77.5946, tz: 'Asia/Kolkata' },
  { city: 'Kolkata, India', lat: 22.5726, lng: 88.3639, tz: 'Asia/Kolkata' },
  { city: 'Chennai, India', lat: 13.0827, lng: 80.2707, tz: 'Asia/Kolkata' },
  { city: 'Hyderabad, India', lat: 17.3850, lng: 78.4867, tz: 'Asia/Kolkata' },
  { city: 'Ahmedabad, India', lat: 23.0225, lng: 72.5714, tz: 'Asia/Kolkata' },
  { city: 'Pune, India', lat: 18.5204, lng: 73.8567, tz: 'Asia/Kolkata' },
  { city: 'Jaipur, India', lat: 26.9124, lng: 75.7873, tz: 'Asia/Kolkata' },
  { city: 'London, UK', lat: 51.5074, lng: -0.1278, tz: 'Europe/London' },
  { city: 'New York, USA', lat: 40.7128, lng: -74.0060, tz: 'America/New_York' },
  { city: 'Dubai, UAE', lat: 25.2048, lng: 55.2708, tz: 'Asia/Dubai' },
];

// Every selectable city has known coordinates. Typed text only filters this
// list — it is never saved on its own, so a chart can't be cast for a city
// name paired with another city's coordinates.
const ALL_CITIES: CityOption[] = [
  ...POPULAR_CITIES,
  ...INDIAN_CITIES
    .map(c => ({ city: `${c.name}, ${c.state}`, lat: c.lat, lng: c.lng, tz: c.timezone }))
    .filter(c => !POPULAR_CITIES.some(p => p.lat === c.lat && p.lng === c.lng)),
];

const formatCoords = (lat: number, lng: number) =>
  `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lng).toFixed(2)}°${lng >= 0 ? 'E' : 'W'}`;

export default function BirthDetailsPicker({ value, onChange }: BirthDetailsPickerProps) {
  // Calendar Modal State
  const [showCalendar, setShowCalendar] = useState(false);
  
  // Parse initial or current date
  const initialDateObj = value.date ? new Date(value.date) : new Date(1995, 7, 15);
  const [calYear, setCalYear] = useState(initialDateObj.getFullYear());
  const [calMonth, setCalMonth] = useState(initialDateObj.getMonth()); // 0-indexed
  const [selectedDay, setSelectedDay] = useState(initialDateObj.getDate());

  // Time State: 12-hour format with AM / PM
  // Initial parsing of 24-hr time (HH:mm)
  const parse24HrTime = (timeStr: string) => {
    if (!timeStr) return { hour12: '07', minute: '30', ampm: 'AM' };
    const [hStr, mStr] = timeStr.split(':');
    let h = parseInt(hStr || '7', 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    if (h === 0) h = 12;
    return {
      hour12: h.toString().padStart(2, '0'),
      minute: (mStr || '00').padStart(2, '0'),
      ampm,
    };
  };

  const initialTime = parse24HrTime(value.time);
  const [hour12, setHour12] = useState(initialTime.hour12);
  const [minute, setMinute] = useState(initialTime.minute);
  const [ampm, setAmpm] = useState<'AM' | 'PM'>(initialTime.ampm as 'AM' | 'PM');

  // Location State
  const [cityName, setCityName] = useState(value.city || 'New Delhi, India');
  const [cityQuery, setCityQuery] = useState('');
  const [showCityPicker, setShowCityPicker] = useState(false);

  const trimmedQuery = cityQuery.trim().toLowerCase();
  const visibleCities = trimmedQuery
    ? ALL_CITIES.filter(c => c.city.toLowerCase().includes(trimmedQuery)).slice(0, 50)
    : POPULAR_CITIES;

  // ── Date calculation helpers ────────────────────────────────────────────────
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(calYear, calMonth, 1).getDay();

  const handleSelectDay = (dayNum: number) => {
    setSelectedDay(dayNum);
    const mm = (calMonth + 1).toString().padStart(2, '0');
    const dd = dayNum.toString().padStart(2, '0');
    const dateStr = `${calYear}-${mm}-${dd}`;
    onChange({ ...value, date: dateStr });
    setShowCalendar(false);
  };

  const handlePrevMonth = () => {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear(calYear - 1);
    } else {
      setCalMonth(calMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear(calYear + 1);
    } else {
      setCalMonth(calMonth + 1);
    }
  };

  // ── Time calculation helpers (Converts 12-hr AM/PM to 24-hr HH:mm) ─────────
  const updateTime = (h12: string, min: string, ap: 'AM' | 'PM') => {
    setHour12(h12);
    setMinute(min);
    setAmpm(ap);

    let h24 = parseInt(h12, 10);
    if (ap === 'PM' && h24 < 12) h24 += 12;
    if (ap === 'AM' && h24 === 12) h24 = 0;
    
    const time24 = `${h24.toString().padStart(2, '0')}:${min.padStart(2, '0')}`;
    onChange({ ...value, time: time24 });
  };

  const handleSelectCity = (c: CityOption) => {
    setCityName(c.city);
    setCityQuery('');
    onChange({
      ...value,
      city: c.city,
      latitude: c.lat,
      longitude: c.lng,
      timezone: c.tz,
    });
    setShowCityPicker(false);
  };

  // Format date display
  const formatDateDisplay = () => {
    if (!value.date) return 'Select Birth Date';
    const [y, m, d] = value.date.split('-');
    const mName = MONTH_NAMES[parseInt(m, 10) - 1] || '';
    return `${d} ${mName} ${y}`;
  };

  return (
    <View style={styles.container}>
      {/* ── 1. DATE OF BIRTH SECTION WITH CALENDAR OPTION ── */}
      <View style={styles.section}>
        <Text style={styles.label}>
          Date of Birth <Text style={styles.subLabel}>(Calendar Option)</Text>
        </Text>

        <TouchableOpacity
          style={styles.calendarTrigger}
          onPress={() => setShowCalendar(true)}
          activeOpacity={0.8}
        >
          <View style={styles.triggerLeft}>
            <Calendar size={20} color="#D97706" style={{ marginRight: 10 }} />
            <Text style={styles.triggerText}>{formatDateDisplay()}</Text>
          </View>
          <View style={styles.calendarBadge}>
            <Text style={styles.calendarBadgeText}>Open Calendar 📅</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* ── 2. TIME OF BIRTH SECTION WITH AM / PM FORMAT ── */}
      <View style={styles.section}>
        <Text style={styles.label}>
          Time of Birth <Text style={styles.subLabel}>(12-Hour AM / PM Format)</Text>
        </Text>

        <View style={styles.timePickerContainer}>
          <Clock size={20} color="#D97706" style={{ marginRight: 8 }} />

          {/* Hour Dropdown */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.timeScroll}
            contentContainerStyle={styles.timeScrollContent}
          >
            {['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].map(h => (
              <TouchableOpacity
                key={h}
                onPress={() => updateTime(h, minute, ampm)}
                style={[styles.timeChip, hour12 === h && styles.activeChip]}
              >
                <Text style={[styles.timeChipText, hour12 === h && styles.activeChipText]}>
                  {h}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.colonText}>:</Text>

          {/* Minute Selector */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.timeScroll}
            contentContainerStyle={styles.timeScrollContent}
          >
            {['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].map(m => (
              <TouchableOpacity
                key={m}
                onPress={() => updateTime(hour12, m, ampm)}
                style={[styles.timeChip, minute === m && styles.activeChip]}
              >
                <Text style={[styles.timeChipText, minute === m && styles.activeChipText]}>
                  {m}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* AM / PM Toggle Buttons */}
          <View style={styles.ampmToggle}>
            <TouchableOpacity
              onPress={() => updateTime(hour12, minute, 'AM')}
              style={[styles.ampmButton, ampm === 'AM' && styles.activeAmpmButton]}
            >
              <Text style={[styles.ampmText, ampm === 'AM' && styles.activeAmpmText]}>AM</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => updateTime(hour12, minute, 'PM')}
              style={[styles.ampmButton, ampm === 'PM' && styles.activeAmpmButton]}
            >
              <Text style={[styles.ampmText, ampm === 'PM' && styles.activeAmpmText]}>PM</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.timePreview}>
          Selected Time: <Text style={{ fontWeight: '700', color: '#B45309' }}>{hour12}:{minute} {ampm}</Text>
        </Text>
      </View>

      {/* ── 3. CITY / LOCATION OF BIRTH ── */}
      <View style={styles.section}>
        <Text style={styles.label}>Birth Place / City</Text>

        <TouchableOpacity
          style={styles.cityTrigger}
          onPress={() => setShowCityPicker(true)}
          activeOpacity={0.8}
        >
          <MapPin size={20} color="#D97706" style={{ marginRight: 10 }} />
          <Text style={styles.triggerText}>{cityName}</Text>
          <Text style={styles.changeLink}>Change</Text>
        </TouchableOpacity>
      </View>

      {/* ── CALENDAR MODAL ── */}
      <Modal
        visible={showCalendar}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCalendar(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Date of Birth</Text>
              <TouchableOpacity onPress={() => setShowCalendar(false)}>
                <X size={22} color="#78350F" />
              </TouchableOpacity>
            </View>

            {/* Year & Month Navigation */}
            <View style={styles.monthNav}>
              <TouchableOpacity onPress={handlePrevMonth} style={styles.navArrow}>
                <ChevronLeft size={20} color="#78350F" />
              </TouchableOpacity>

              <View style={styles.monthYearTitle}>
                <Text style={styles.monthYearText}>
                  {MONTH_NAMES[calMonth]} {calYear}
                </Text>
              </View>

              <TouchableOpacity onPress={handleNextMonth} style={styles.navArrow}>
                <ChevronRight size={20} color="#78350F" />
              </TouchableOpacity>
            </View>

            {/* Quick Year Selector */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.yearScroll}
              contentContainerStyle={{ paddingHorizontal: 4, gap: 6 }}
            >
              {YEARS_LIST.map(y => (
                <TouchableOpacity
                  key={y}
                  onPress={() => setCalYear(y)}
                  style={[styles.yearChip, calYear === y && styles.activeYearChip]}
                >
                  <Text style={[styles.yearChipText, calYear === y && styles.activeYearChipText]}>
                    {y}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Day of Week Headers */}
            <View style={styles.daysHeaderGrid}>
              {DAYS_OF_WEEK.map(d => (
                <Text key={d} style={styles.dayHeaderCell}>{d}</Text>
              ))}
            </View>

            {/* Calendar Days Matrix */}
            <View style={styles.daysMatrixGrid}>
              {/* Empty cells before 1st day of month */}
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <View key={`empty-${i}`} style={styles.dayCellEmpty} />
              ))}

              {/* Days 1 to N */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const isSelected = selectedDay === dayNum;

                return (
                  <TouchableOpacity
                    key={dayNum}
                    onPress={() => handleSelectDay(dayNum)}
                    style={[styles.dayCell, isSelected && styles.dayCellSelected]}
                  >
                    <Text style={[styles.dayCellText, isSelected && styles.dayCellTextSelected]}>
                      {dayNum}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={styles.confirmButton}
              onPress={() => handleSelectDay(selectedDay)}
            >
              <Check size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.confirmButtonText}>
                Confirm Date ({selectedDay} {MONTH_NAMES[calMonth]} {calYear})
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── CITY PICKER MODAL ── */}
      <Modal
        visible={showCityPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCityPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxHeight: 500 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Birth City</Text>
              <TouchableOpacity onPress={() => setShowCityPicker(false)}>
                <X size={22} color="#78350F" />
              </TouchableOpacity>
            </View>

            <View style={styles.citySearchInputContainer}>
              <MapPin size={18} color="#B45309" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.citySearchInput}
                placeholder="Search your birth city..."
                placeholderTextColor="#C4B5A5"
                value={cityQuery}
                onChangeText={setCityQuery}
                autoCorrect={false}
              />
            </View>

            <Text style={styles.citySectionHeader}>
              {trimmedQuery ? 'Matching Cities — tap to select' : 'Popular Locations'}
            </Text>

            <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
              {visibleCities.map(item => (
                <TouchableOpacity
                  key={item.city}
                  style={styles.cityRow}
                  onPress={() => handleSelectCity(item)}
                >
                  <MapPin size={16} color="#D97706" style={{ marginRight: 10 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cityNameText}>{item.city}</Text>
                    <Text style={styles.cityCoordsText}>{formatCoords(item.lat, item.lng)}</Text>
                  </View>
                  {cityName === item.city && <Check size={18} color="#D97706" />}
                </TouchableOpacity>
              ))}
              {trimmedQuery && visibleCities.length === 0 && (
                <Text style={styles.cityCoordsText}>
                  No match. Pick the nearest listed city — the chart needs exact coordinates.
                </Text>
              )}
            </ScrollView>

            <TouchableOpacity
              style={[styles.confirmButton, { marginTop: 12 }]}
              onPress={() => { setCityQuery(''); setShowCityPicker(false); }}
            >
              <Text style={styles.confirmButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  section: {
    gap: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#78350F',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    opacity: 0.8,
  },
  subLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#D97706',
    textTransform: 'none',
  },
  calendarTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFDF9',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  triggerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  triggerText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#451A03',
  },
  calendarBadge: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  calendarBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
  timePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFDF9',
    borderWidth: 1,
    borderColor: '#EFE8D9',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  timeScroll: {
    maxHeight: 38,
  },
  timeScrollContent: {
    alignItems: 'center',
    gap: 4,
  },
  timeChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F3EFE6',
  },
  activeChip: {
    backgroundColor: '#D97706',
  },
  timeChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#78350F',
  },
  activeChipText: {
    color: '#FFFFFF',
  },
  colonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#78350F',
    marginHorizontal: 4,
  },
  ampmToggle: {
    flexDirection: 'row',
    backgroundColor: '#F3EFE6',
    borderRadius: 10,
    padding: 2,
    marginLeft: 6,
  },
  ampmButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  activeAmpmButton: {
    backgroundColor: '#D97706',
  },
  ampmText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#78350F',
  },
  activeAmpmText: {
    color: '#FFFFFF',
  },
  timePreview: {
    fontSize: 12,
    color: '#78350F',
    opacity: 0.7,
    marginTop: 2,
  },
  cityTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFDF9',
    borderWidth: 1,
    borderColor: '#EFE8D9',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  changeLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D97706',
    marginLeft: 'auto',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#451A03',
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  navArrow: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: '#F3EFE6',
  },
  monthYearTitle: {
    alignItems: 'center',
  },
  monthYearText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#451A03',
  },
  yearScroll: {
    maxHeight: 36,
    marginBottom: 16,
  },
  yearChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#F3EFE6',
  },
  activeYearChip: {
    backgroundColor: '#D97706',
  },
  yearChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#78350F',
  },
  activeYearChipText: {
    color: '#FFFFFF',
  },
  daysHeaderGrid: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayHeaderCell: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: '#78350F',
    opacity: 0.5,
  },
  daysMatrixGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  dayCellEmpty: {
    width: '14.28%',
    height: 38,
  },
  dayCell: {
    width: '14.28%',
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  dayCellSelected: {
    backgroundColor: '#D97706',
  },
  dayCellText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#451A03',
  },
  dayCellTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  confirmButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#D97706',
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  citySearchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3EFE6',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 12,
  },
  citySearchInput: {
    flex: 1,
    fontSize: 14,
    color: '#451A03',
  },
  citySectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#78350F',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    opacity: 0.7,
  },
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3EFE6',
  },
  cityNameText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#451A03',
  },
  cityCoordsText: {
    fontSize: 11,
    color: '#78350F',
    opacity: 0.5,
  },
});
