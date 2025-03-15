import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { Text, TextInput, Button, Chip, HelperText, Avatar, Divider, Dialog, Portal } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MainTabParamList } from '../navigation/MainNavigator';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/theme';

type CreateGameScreenNavigationProp = BottomTabNavigationProp<MainTabParamList, 'CreateGame'>;

// Sport options
const sportOptions = [
  { id: 'basketball', name: 'Basketball', icon: 'basketball' },
  { id: 'football', name: 'Football', icon: 'soccer' },
  { id: 'badminton', name: 'Badminton', icon: 'badminton' },
  { id: 'table-tennis', name: 'Table Tennis', icon: 'table-tennis' },
  { id: 'volleyball', name: 'Volleyball', icon: 'volleyball' },
];

// Skill level options
const skillLevelOptions = [
  { id: 'all', name: 'All Levels' },
  { id: 'beginner', name: 'Beginner' },
  { id: 'intermediate', name: 'Intermediate' },
  { id: 'advanced', name: 'Advanced' },
];

// Mock court options
const courtOptions = [
  { id: '1', name: 'Main Basketball Court', sport: 'basketball', capacity: 20 },
  { id: '2', name: 'Indoor Sports Hall (Badminton)', sport: 'badminton', capacity: 16 },
  { id: '3', name: 'University Field', sport: 'football', capacity: 30 },
  { id: '4', name: 'Recreation Center (Table Tennis)', sport: 'table-tennis', capacity: 16 },
  { id: '5', name: 'Beach Volleyball Court', sport: 'volleyball', capacity: 12 },
  { id: '6', name: 'Second Basketball Court', sport: 'basketball', capacity: 16 },
];

const CreateGameScreen = () => {
  const navigation = useNavigation<CreateGameScreenNavigationProp>();
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedSport, setSelectedSport] = useState('');
  const [selectedSkillLevel, setSelectedSkillLevel] = useState('all');
  const [selectedCourt, setSelectedCourt] = useState('');
  const [courtDialogVisible, setCourtDialogVisible] = useState(false);
  const [requiredPlayers, setRequiredPlayers] = useState('');
  
  // Date and time state
  const [date, setDate] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date(Date.now() + 60 * 60 * 1000)); // Default to 1 hour later
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  
  // Form validation state
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [loading, setLoading] = useState(false);
  
  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };
  
  // Format time for display
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };
  
  // Handle date change
  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
      
      // Update start and end times to have the same date
      const newStartTime = new Date(startTime);
      newStartTime.setFullYear(selectedDate.getFullYear());
      newStartTime.setMonth(selectedDate.getMonth());
      newStartTime.setDate(selectedDate.getDate());
      setStartTime(newStartTime);
      
      const newEndTime = new Date(endTime);
      newEndTime.setFullYear(selectedDate.getFullYear());
      newEndTime.setMonth(selectedDate.getMonth());
      newEndTime.setDate(selectedDate.getDate());
      setEndTime(newEndTime);
    }
  };
  
  // Handle start time change
  const onStartTimeChange = (event: any, selectedTime?: Date) => {
    setShowStartTimePicker(false);
    if (selectedTime) {
      setStartTime(selectedTime);
      
      // If end time is before start time, update end time to be 1 hour after start time
      if (selectedTime.getTime() >= endTime.getTime()) {
        const newEndTime = new Date(selectedTime.getTime() + 60 * 60 * 1000);
        setEndTime(newEndTime);
      }
    }
  };
  
  // Handle end time change
  const onEndTimeChange = (event: any, selectedTime?: Date) => {
    setShowEndTimePicker(false);
    if (selectedTime) {
      // Only allow end time to be after start time
      if (selectedTime.getTime() > startTime.getTime()) {
        setEndTime(selectedTime);
      } else {
        // If invalid, set end time to 1 hour after start time
        const newEndTime = new Date(startTime.getTime() + 60 * 60 * 1000);
        setEndTime(newEndTime);
      }
    }
  };
  
  // Validate form
  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!title.trim()) {
      newErrors.title = 'Game title is required';
    }
    
    if (!selectedSport) {
      newErrors.sport = 'Please select a sport';
    }
    
    if (!selectedCourt) {
      newErrors.court = 'Please select a venue';
    }
    
    if (!requiredPlayers || parseInt(requiredPlayers) <= 0) {
      newErrors.requiredPlayers = 'Number of players must be greater than 0';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleCreateGame = () => {
    if (validateForm()) {
      setLoading(true);
      
      // Here you would normally send the data to your backend
      console.log({
        title,
        description,
        sport: selectedSport,
        skillLevel: selectedSkillLevel,
        court: selectedCourt,
        date: date.toISOString(),
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        requiredPlayers: parseInt(requiredPlayers),
      });
      
      // Simulate API call
      setTimeout(() => {
        setLoading(false);
        navigation.navigate('Dashboard');
      }, 1500);
    }
  };
  
  // Get filtered courts based on selected sport
  const getFilteredCourts = () => {
    if (!selectedSport) return [];
    return courtOptions.filter(court => court.sport === selectedSport);
  };
  
  // Get court name by ID
  const getCourtName = (id: string) => {
    const court = courtOptions.find(court => court.id === id);
    return court ? court.name : 'Select a venue';
  };
  
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Host a Game</Text>
          <Text style={styles.headerSubtitle}>Create a new game for players to join</Text>
        </View>
        
        <View style={styles.form}>
          {/* Game Title */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Game Title*</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Basketball 3v3"
              value={title}
              onChangeText={setTitle}
              error={!!errors.title}
            />
            {errors.title && <HelperText type="error">{errors.title}</HelperText>}
          </View>
          
          {/* Description */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Description <Text style={styles.optional}>(Optional)</Text></Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Add details about your game..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
            />
          </View>
          
          {/* Sport Selection */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Sport*</Text>
            <View style={styles.chipsContainer}>
              {sportOptions.map(sport => (
                <Chip
                  key={sport.id}
                  selected={selectedSport === sport.id}
                  onPress={() => {
                    setSelectedSport(sport.id);
                    setSelectedCourt(''); // Reset court when sport changes
                  }}
                  style={[
                    styles.chip,
                    selectedSport === sport.id && styles.selectedChip
                  ]}
                  textStyle={[
                    styles.chipText,
                    selectedSport === sport.id && styles.selectedChipText
                  ]}
                  avatar={<Avatar.Icon size={24} icon={sport.icon} style={styles.chipIcon} />}
                >
                  {sport.name}
                </Chip>
              ))}
            </View>
            {errors.sport && <HelperText type="error">{errors.sport}</HelperText>}
          </View>
          
          {/* Skill Level */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Skill Level</Text>
            <View style={styles.chipsContainer}>
              {skillLevelOptions.map(level => (
                <Chip
                  key={level.id}
                  selected={selectedSkillLevel === level.id}
                  onPress={() => setSelectedSkillLevel(level.id)}
                  style={[
                    styles.chip,
                    selectedSkillLevel === level.id && styles.selectedChip
                  ]}
                  textStyle={[
                    styles.chipText,
                    selectedSkillLevel === level.id && styles.selectedChipText
                  ]}
                >
                  {level.name}
                </Chip>
              ))}
            </View>
          </View>
          
          {/* Date & Time Selection */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Date & Time*</Text>
            <View style={styles.dateTimeContainer}>
              <TouchableOpacity 
                style={styles.dateTimePicker}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateTimeLabel}>Date</Text>
                <Text style={styles.dateTimeValue}>{formatDate(date)}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.dateTimePicker}
                onPress={() => setShowStartTimePicker(true)}
              >
                <Text style={styles.dateTimeLabel}>Start Time</Text>
                <Text style={styles.dateTimeValue}>{formatTime(startTime)}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.dateTimePicker}
                onPress={() => setShowEndTimePicker(true)}
              >
                <Text style={styles.dateTimeLabel}>End Time</Text>
                <Text style={styles.dateTimeValue}>{formatTime(endTime)}</Text>
              </TouchableOpacity>
            </View>
            
            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display="default"
                onChange={onDateChange}
                minimumDate={new Date()}
              />
            )}
            
            {showStartTimePicker && (
              <DateTimePicker
                value={startTime}
                mode="time"
                display="default"
                onChange={onStartTimeChange}
              />
            )}
            
            {showEndTimePicker && (
              <DateTimePicker
                value={endTime}
                mode="time"
                display="default"
                onChange={onEndTimeChange}
              />
            )}
          </View>
          
          {/* Court Selection */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Venue*</Text>
            <TouchableOpacity
              style={[styles.courtSelector, !!errors.court && styles.inputError]}
              onPress={() => {
                if (selectedSport) {
                  setCourtDialogVisible(true);
                } else {
                  setErrors({...errors, sport: 'Please select a sport first'});
                }
              }}
            >
              <Text style={selectedCourt ? styles.courtText : styles.courtPlaceholder}>
                {selectedCourt ? getCourtName(selectedCourt) : 'Select a venue'}
              </Text>
            </TouchableOpacity>
            {errors.court && <HelperText type="error">{errors.court}</HelperText>}
          </View>
          
          {/* Required Players */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Number of Players Needed*</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 10"
              value={requiredPlayers}
              onChangeText={(text) => setRequiredPlayers(text.replace(/[^0-9]/g, ''))}
              keyboardType="numeric"
              error={!!errors.requiredPlayers}
            />
            {errors.requiredPlayers && <HelperText type="error">{errors.requiredPlayers}</HelperText>}
          </View>
          
          {/* Submit Button */}
          <Button
            mode="contained"
            style={styles.submitButton}
            loading={loading}
            disabled={loading}
            onPress={handleCreateGame}
          >
            Create Game
          </Button>
        </View>
      </ScrollView>
      
      {/* Court Selection Dialog */}
      <Portal>
        <Dialog visible={courtDialogVisible} onDismiss={() => setCourtDialogVisible(false)}>
          <Dialog.Title>Select a Venue</Dialog.Title>
          <Dialog.Content>
            <ScrollView style={styles.courtDialogContent}>
              {getFilteredCourts().map(court => (
                <TouchableOpacity
                  key={court.id}
                  style={styles.courtOption}
                  onPress={() => {
                    setSelectedCourt(court.id);
                    setCourtDialogVisible(false);
                  }}
                >
                  <View style={styles.courtOptionContent}>
                    <Text style={styles.courtOptionName}>{court.name}</Text>
                    <Text style={styles.courtOptionCapacity}>Capacity: {court.capacity}</Text>
                  </View>
                  {selectedCourt === court.id && (
                    <Avatar.Icon size={24} icon="check" style={styles.selectedCourtIcon} />
                  )}
                </TouchableOpacity>
              ))}
              {getFilteredCourts().length === 0 && (
                <Text style={styles.noCourtsText}>No venues available for this sport</Text>
              )}
            </ScrollView>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setCourtDialogVisible(false)}>Cancel</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: SPACING.xl,
  },
  header: {
    padding: SPACING.lg,
    backgroundColor: COLORS.primary,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: 'bold',
    color: COLORS.background,
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.background,
    opacity: 0.8,
  },
  form: {
    padding: SPACING.lg,
  },
  inputContainer: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
    color: COLORS.text,
  },
  optional: {
    fontWeight: 'normal',
    color: COLORS.disabled,
    fontSize: FONT_SIZES.sm,
  },
  input: {
    backgroundColor: COLORS.background,
  },
  inputError: {
    borderColor: COLORS.error,
    borderWidth: 1,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    margin: SPACING.xs,
    backgroundColor: COLORS.card,
  },
  selectedChip: {
    backgroundColor: COLORS.primary,
  },
  chipText: {
    color: COLORS.text,
  },
  selectedChipText: {
    color: COLORS.background,
  },
  chipIcon: {
    backgroundColor: 'transparent',
  },
  dateTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateTimePicker: {
    flex: 1,
    padding: SPACING.sm,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.sm,
    marginRight: SPACING.sm,
  },
  dateTimeLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.disabled,
    marginBottom: SPACING.xs,
  },
  dateTimeValue: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    fontWeight: 'bold',
  },
  courtSelector: {
    padding: SPACING.md,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  courtText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  courtPlaceholder: {
    fontSize: FONT_SIZES.md,
    color: COLORS.disabled,
  },
  courtDialogContent: {
    maxHeight: 300,
  },
  courtOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  courtOptionContent: {
    flex: 1,
  },
  courtOptionName: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    fontWeight: 'bold',
  },
  courtOptionCapacity: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.disabled,
  },
  selectedCourtIcon: {
    backgroundColor: COLORS.primary,
  },
  noCourtsText: {
    textAlign: 'center',
    padding: SPACING.md,
    color: COLORS.disabled,
  },
  submitButton: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.primary,
    padding: SPACING.xs,
  },
});

export default CreateGameScreen; 