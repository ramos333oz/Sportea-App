import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Surface, ProgressBar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/theme';

// Achievement definitions
const ACHIEVEMENTS = [
  {
    id: 'first_game',
    title: 'First Game',
    description: 'Join your first game',
    icon: 'trophy',
    requiredCount: 1,
    category: 'participation',
  },
  {
    id: 'game_host',
    title: 'Game Host',
    description: 'Host your first game',
    icon: 'crown',
    requiredCount: 1,
    category: 'hosting',
  },
  {
    id: 'social_butterfly',
    title: 'Social Butterfly',
    description: 'Join 5 different games',
    icon: 'butterfly',
    requiredCount: 5,
    category: 'participation',
  },
  {
    id: 'event_organizer',
    title: 'Event Organizer',
    description: 'Host 3 different games',
    icon: 'calendar-check',
    requiredCount: 3,
    category: 'hosting',
  },
  {
    id: 'sports_explorer',
    title: 'Sports Explorer',
    description: 'Play 3 different sports',
    icon: 'compass',
    requiredCount: 3,
    category: 'diversity',
  },
  {
    id: 'sports_master',
    title: 'Sports Master',
    description: 'Play 5 different sports',
    icon: 'medal',
    requiredCount: 5,
    category: 'diversity',
  },
  {
    id: 'regular_player',
    title: 'Regular Player',
    description: 'Join 10 games total',
    icon: 'calendar-clock',
    requiredCount: 10,
    category: 'participation',
  },
  {
    id: 'community_leader',
    title: 'Community Leader',
    description: 'Host 5 games total',
    icon: 'account-group',
    requiredCount: 5,
    category: 'hosting',
  },
];

const Achievements = ({ stats }) => {
  // Calculate achievements based on stats
  const calculateAchievements = () => {
    if (!stats) return ACHIEVEMENTS.map(achievement => ({
      ...achievement,
      currentCount: 0,
      unlocked: false,
      progress: 0,
    }));

    return ACHIEVEMENTS.map(achievement => {
      let currentCount = 0;
      let unlocked = false;

      switch (achievement.category) {
        case 'participation':
          currentCount = stats.gamesPlayed || 0;
          break;
        case 'hosting':
          currentCount = stats.gamesHosted || 0;
          break;
        case 'diversity':
          currentCount = stats.sportsPlayed?.length || 0;
          break;
        default:
          currentCount = 0;
      }

      unlocked = currentCount >= achievement.requiredCount;
      const progress = Math.min(currentCount / achievement.requiredCount, 1);

      return {
        ...achievement,
        currentCount,
        unlocked,
        progress,
      };
    });
  };

  const achievements = calculateAchievements();
  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return (
    <Surface style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Achievements</Text>
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeText}>{unlockedCount}/{achievements.length}</Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollView}>
        {achievements.map(achievement => (
          <View
            key={achievement.id}
            style={[
              styles.achievementCard,
              achievement.unlocked ? styles.unlockedCard : styles.lockedCard,
            ]}
          >
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons
                name={achievement.icon}
                size={32}
                color={achievement.unlocked ? COLORS.primary : COLORS.disabled}
              />
            </View>
            <Text style={[
              styles.achievementTitle,
              achievement.unlocked ? styles.unlockedTitle : styles.lockedTitle,
            ]}>
              {achievement.title}
            </Text>
            <Text style={styles.achievementDescription}>{achievement.description}</Text>
            <View style={styles.progressContainer}>
              <ProgressBar
                progress={achievement.progress}
                color={achievement.unlocked ? COLORS.primary : COLORS.disabled}
                style={styles.progressBar}
              />
              <Text style={styles.progressText}>
                {achievement.currentCount}/{achievement.requiredCount}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: SPACING.md,
    marginVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    elevation: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  header: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  badgeContainer: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
  },
  badgeText: {
    color: COLORS.background,
    fontSize: FONT_SIZES.sm,
    fontWeight: 'bold',
  },
  scrollView: {
    flexDirection: 'row',
  },
  achievementCard: {
    width: 150,
    padding: SPACING.sm,
    marginRight: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  unlockedCard: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  lockedCard: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    opacity: 0.7,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  achievementTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  unlockedTitle: {
    color: COLORS.primary,
  },
  lockedTitle: {
    color: COLORS.text,
  },
  achievementDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.disabled,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  progressContainer: {
    width: '100%',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    marginBottom: SPACING.xs,
  },
  progressText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.disabled,
    textAlign: 'right',
  },
});

export default Achievements;
