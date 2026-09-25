import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Switch,
  ScrollView,
  Alert,
  Image,
  TextInput,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME, BRAND_COLORS } from '../constants/theme';
import { ThemeMode } from '../types/profile';

export interface SettingsModalProps {
  visible: boolean;
  themeMode: ThemeMode;
  userAvatarUrl?: string;
  onUploadAvatar?: () => void;
  onToggleTheme: () => void;
  onEditProfile: () => void;
  onEditCover: () => void;
  onLogout?: () => void;
  onDeleteAccount?: () => void;
  onClose: () => void;
  restrictedUsers?: string[];
  onAddRestricted?: (handle: string) => void;
  onRemoveRestricted?: (handle: string) => void;
  blockedUsers?: string[];
  onAddBlocked?: (handle: string) => void;
  onRemoveBlocked?: (handle: string) => void;
}

type SubScreen =
  | 'main'
  | 'hubbs'
  | 'faq'
  | 'about'
  | 'privacy'
  | 'terms'
  | 'notifications'
  | 'accessibility'
  | 'blocked'
  | 'restricted';

export const SettingsModal = ({
  visible,
  themeMode,
  userAvatarUrl,
  onUploadAvatar,
  onToggleTheme,
  onEditProfile,
  onLogout,
  onDeleteAccount,
  onClose,
  restrictedUsers: restrictedUsersProp,
  onAddRestricted,
  onRemoveRestricted,
  blockedUsers: blockedUsersProp,
  onAddBlocked,
  onRemoveBlocked,
}: SettingsModalProps) => {
  const colors = THEME[themeMode as 'light' | 'dark'];
  const [activeSubScreen, setActiveSubScreen] = useState<SubScreen>('main');

  // Hubbs Settings state
  const [privateHubs, setPrivateHubs] = useState(false);
  const [hdUploads, setHdUploads] = useState(true);
  const [allowRemixes, setAllowRemixes] = useState(true);
  const [autoSaveGallery, setAutoSaveGallery] = useState(false);

  // Notifications state
  const [pushEnabled, setPushEnabled] = useState(true);
  const [likesAlerts, setLikesAlerts] = useState(true);
  const [newFollowers, setNewFollowers] = useState(true);
  const [clipUpdates, setClipUpdates] = useState(false);
  const [messageNotifications, setMessageNotifications] = useState(true);

  // Accessibility state
  const [highContrast, setHighContrast] = useState(false);
  const [largerText, setLargerText] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [screenReaderOpt, setScreenReaderOpt] = useState(false);

  // Blocked and Restricted state (supports both props and fallback local state)
  const [internalBlockedUsers, setInternalBlockedUsers] = useState<string[]>([
    '@spambot_galaxy',
    '@troll_orbit',
  ]);
  const blockedUsers = blockedUsersProp || internalBlockedUsers;
  const [newBlockInput, setNewBlockInput] = useState('');

  const [internalRestrictedUsers, setInternalRestrictedUsers] = useState<string[]>([
    '@shadow_watcher',
  ]);
  const restrictedUsers = restrictedUsersProp || internalRestrictedUsers;
  const [newRestrictInput, setNewRestrictInput] = useState('');

  // Reset to main screen when modal opens
  React.useEffect(() => {
    if (visible) {
      setActiveSubScreen('main');
    }
  }, [visible]);

  const handleClose = () => {
    setActiveSubScreen('main');
    onClose();
  };

  // Sub-view: Hubbs Settings
  const renderHubbsSettings = () => (
    <View style={styles.subContent}>
      <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
        <View style={styles.settingTextCol}>
          <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Private Hubs</Text>
          <Text style={[styles.settingDesc, { color: colors.textMuted }]}>
            Only approved Hubbers can view your posts
          </Text>
        </View>
        <Switch
          value={privateHubs}
          onValueChange={setPrivateHubs}
          trackColor={{ false: '#D1D5DB', true: BRAND_COLORS.purplePrimary }}
          thumbColor="#FFFFFF"
        />
      </View>

      <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
        <View style={styles.settingTextCol}>
          <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>High-Quality Uploads</Text>
          <Text style={[styles.settingDesc, { color: colors.textMuted }]}>
            Upload photos and Hubclips in full resolution
          </Text>
        </View>
        <Switch
          value={hdUploads}
          onValueChange={setHdUploads}
          trackColor={{ false: '#D1D5DB', true: BRAND_COLORS.purplePrimary }}
          thumbColor="#FFFFFF"
        />
      </View>

      <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
        <View style={styles.settingTextCol}>
          <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Allow Hubclip Remixes</Text>
          <Text style={[styles.settingDesc, { color: colors.textMuted }]}>
            Let other hubbers create duets with your clips
          </Text>
        </View>
        <Switch
          value={allowRemixes}
          onValueChange={setAllowRemixes}
          trackColor={{ false: '#D1D5DB', true: BRAND_COLORS.purplePrimary }}
          thumbColor="#FFFFFF"
        />
      </View>

      <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
        <View style={styles.settingTextCol}>
          <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Auto-save to Gallery</Text>
          <Text style={[styles.settingDesc, { color: colors.textMuted }]}>
            Save new hubs to your device automatically
          </Text>
        </View>
        <Switch
          value={autoSaveGallery}
          onValueChange={setAutoSaveGallery}
          trackColor={{ false: '#D1D5DB', true: BRAND_COLORS.purplePrimary }}
          thumbColor="#FFFFFF"
        />
      </View>
    </View>
  );

  // Sub-view: FAQ
  const renderFAQ = () => (
    <ScrollView style={styles.subContent} showsVerticalScrollIndicator={false}>
      {[
        {
          q: 'How do I edit my cover or profile image?',
          a: 'Tap the small mask icon attached to your cover banner or profile avatar. You can upload any photo directly from your device gallery.',
        },
        {
          q: 'What is the difference between Hubbers & Hubbies?',
          a: 'Hubbers are the followers who follow your cosmic profile. Hubbies are the friends and creators you follow across Hi-Hubble.',
        },
        {
          q: 'What are Hubs and Hubclips?',
          a: 'Hubs are photo and status updates you share with your community. Hubclips are short, engaging full-screen video moments.',
        },
        {
          q: 'How do I switch between Light and Dark mode?',
          a: 'Use the sun/moon icon on the top navigation bar or the Dark Mode switch at the top of Settings.',
        },
      ].map((item, idx) => (
        <View
          key={idx}
          style={[
            styles.faqCard,
            { backgroundColor: colors.statCardBg, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.faqQuestion, { color: BRAND_COLORS.purplePrimary }]}>
            Q: {item.q}
          </Text>
          <Text style={[styles.faqAnswer, { color: colors.textSecondary }]}>{item.a}</Text>
        </View>
      ))}
    </ScrollView>
  );

  // Sub-view: About
  const renderAbout = () => (
    <View style={[styles.subContent, { alignItems: 'center', paddingVertical: 14 }]}>
      <View
        style={[
          styles.aboutLogoBadge,
          {
            backgroundColor: themeMode === 'light' ? '#F6EEFF' : '#27194D',
            borderColor: BRAND_COLORS.purpleLight,
          },
        ]}
      >
        <Ionicons name="planet" size={36} color={BRAND_COLORS.purplePrimary} />
      </View>
      <Text style={[styles.aboutTitle, { color: colors.textPrimary }]}>Hi-Hubble</Text>
      <Text style={[styles.aboutVersion, { color: colors.textMuted }]}>
        Version 1.0.0 (Expo SDK 57)
      </Text>
      <Text style={[styles.aboutDescription, { color: colors.textSecondary }]}>
        Hi-Hubble connects creators and friends across an infinite universe of shared moments,
        vibrant hubs, and creative hubclips.
      </Text>
      <View style={[styles.aboutFooterBadge, { backgroundColor: colors.statCardBg }]}>
        <Text style={[styles.aboutFooterText, { color: colors.textMuted }]}>
          Crafted for the Cosmic Social Universe
        </Text>
      </View>
    </View>
  );

  // Sub-view: Privacy Policy
  const renderPrivacyPolicy = () => (
    <ScrollView style={styles.subContent} showsVerticalScrollIndicator={false}>
      <Text style={[styles.legalText, { color: colors.textSecondary }]}>
        At Hi-Hubble, we respect and safeguard your privacy. We are committed to transparency
        about how we handle your data:
        {'\n\n'}
        <Text style={{ fontWeight: '700', color: colors.textPrimary }}>1. Data You Provide:</Text>
        {'\n'}We store your profile details (name, handle, bio, avatar, and cover image) solely to
        render your account across the Hi-Hubble network.
        {'\n\n'}
        <Text style={{ fontWeight: '700', color: colors.textPrimary }}>2. Media Privacy:</Text>
        {'\n'}Your uploaded photos and videos remain under your control. You can update or delete
        your content at any time.
        {'\n\n'}
        <Text style={{ fontWeight: '700', color: colors.textPrimary }}>3. Security:</Text>
        {'\n'}We implement industry-standard encryption and security measures to protect your
        account information from unauthorized access.
        {'\n\n'}
        <Text style={{ fontWeight: '700', color: colors.textPrimary }}>4. No Third-Party Sales:</Text>
        {'\n'}We never sell your personal information or media to third parties.
      </Text>
    </ScrollView>
  );

  // Sub-view: Terms & Policy
  const renderTermsPolicy = () => (
    <ScrollView style={styles.subContent} showsVerticalScrollIndicator={false}>
      <Text style={[styles.legalText, { color: colors.textSecondary }]}>
        Welcome to Hi-Hubble! By using our platform, you agree to the following terms:
        {'\n\n'}
        <Text style={{ fontWeight: '700', color: colors.textPrimary }}>1. Community Standards:</Text>
        {'\n'}Treat all hubbers with kindness and respect. Harassment, hate speech, or harmful
        behavior will result in immediate suspension.
        {'\n\n'}
        <Text style={{ fontWeight: '700', color: colors.textPrimary }}>2. Content Ownership:</Text>
        {'\n'}You retain ownership of the photos, hubclips, and thoughts you post on Hi-Hubble.
        {'\n\n'}
        <Text style={{ fontWeight: '700', color: colors.textPrimary }}>3. Acceptable Use:</Text>
        {'\n'}Do not post illegal content, spam, or copyrighted material without appropriate
        authorization.
        {'\n\n'}
        <Text style={{ fontWeight: '700', color: colors.textPrimary }}>4. Account Responsibility:</Text>
        {'\n'}You are responsible for all activities that take place under your account credentials.
      </Text>
    </ScrollView>
  );

  // Sub-view: Notifications Section
  const renderNotifications = () => (
    <View style={styles.subContent}>
      <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
        <View style={styles.settingTextCol}>
          <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Push Notifications</Text>
          <Text style={[styles.settingDesc, { color: colors.textMuted }]}>
            Receive alert updates on your device
          </Text>
        </View>
        <Switch
          value={pushEnabled}
          onValueChange={setPushEnabled}
          trackColor={{ false: '#D1D5DB', true: BRAND_COLORS.purplePrimary }}
          thumbColor="#FFFFFF"
        />
      </View>

      <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
        <View style={styles.settingTextCol}>
          <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Hub Likes & Comments</Text>
          <Text style={[styles.settingDesc, { color: colors.textMuted }]}>
            Notify when someone interacts with your posts
          </Text>
        </View>
        <Switch
          value={likesAlerts}
          onValueChange={setLikesAlerts}
          trackColor={{ false: '#D1D5DB', true: BRAND_COLORS.purplePrimary }}
          thumbColor="#FFFFFF"
        />
      </View>

      <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
        <View style={styles.settingTextCol}>
          <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>New Hubbers Alerts</Text>
          <Text style={[styles.settingDesc, { color: colors.textMuted }]}>
            Notify when new followers join your cosmic hub
          </Text>
        </View>
        <Switch
          value={newFollowers}
          onValueChange={setNewFollowers}
          trackColor={{ false: '#D1D5DB', true: BRAND_COLORS.purplePrimary }}
          thumbColor="#FFFFFF"
        />
      </View>

      <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
        <View style={styles.settingTextCol}>
          <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Hubbie Stories & Clips</Text>
          <Text style={[styles.settingDesc, { color: colors.textMuted }]}>
            Get notified when friends you follow post new clips
          </Text>
        </View>
        <Switch
          value={clipUpdates}
          onValueChange={setClipUpdates}
          trackColor={{ false: '#D1D5DB', true: BRAND_COLORS.purplePrimary }}
          thumbColor="#FFFFFF"
        />
      </View>

      <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
        <View style={styles.settingTextCol}>
          <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Direct Messages</Text>
          <Text style={[styles.settingDesc, { color: colors.textMuted }]}>
            Notify on new cosmic chats and replies
          </Text>
        </View>
        <Switch
          value={messageNotifications}
          onValueChange={setMessageNotifications}
          trackColor={{ false: '#D1D5DB', true: BRAND_COLORS.purplePrimary }}
          thumbColor="#FFFFFF"
        />
      </View>
    </View>
  );

  // Sub-view: Accessibility Section
  const renderAccessibility = () => (
    <ScrollView style={styles.subContent}>
      <Text style={[styles.subSectionIntro, { color: colors.textSecondary }]}>
        Customize your experience with visual, text, and motion accessibility preferences.
      </Text>

      <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
        <View style={styles.settingTextCol}>
          <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>High Contrast</Text>
          <Text style={[styles.settingDesc, { color: colors.textMuted }]}>
            Increase contrast between text and background elements
          </Text>
        </View>
        <Switch
          value={highContrast}
          onValueChange={setHighContrast}
          trackColor={{ false: '#D1D5DB', true: BRAND_COLORS.purplePrimary }}
          thumbColor="#FFFFFF"
        />
      </View>

      <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
        <View style={styles.settingTextCol}>
          <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Larger Text</Text>
          <Text style={[styles.settingDesc, { color: colors.textMuted }]}>
            Scale up font sizes throughout hubs and clips for readability
          </Text>
        </View>
        <Switch
          value={largerText}
          onValueChange={setLargerText}
          trackColor={{ false: '#D1D5DB', true: BRAND_COLORS.purplePrimary }}
          thumbColor="#FFFFFF"
        />
      </View>

      <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
        <View style={styles.settingTextCol}>
          <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Reduce Motion</Text>
          <Text style={[styles.settingDesc, { color: colors.textMuted }]}>
            Minimize animations, transitions, and banner sparkle effects
          </Text>
        </View>
        <Switch
          value={reduceMotion}
          onValueChange={setReduceMotion}
          trackColor={{ false: '#D1D5DB', true: BRAND_COLORS.purplePrimary }}
          thumbColor="#FFFFFF"
        />
      </View>

      <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
        <View style={styles.settingTextCol}>
          <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Screen Reader Optimization</Text>
          <Text style={[styles.settingDesc, { color: colors.textMuted }]}>
            Enhanced aria labels and descriptions for assistive tech
          </Text>
        </View>
        <Switch
          value={screenReaderOpt}
          onValueChange={setScreenReaderOpt}
          trackColor={{ false: '#D1D5DB', true: BRAND_COLORS.purplePrimary }}
          thumbColor="#FFFFFF"
        />
      </View>
    </ScrollView>
  );

  // Sub-view: Blocked Accounts Section
  const renderBlockedAccounts = () => {
    const handleBlockUser = () => {
      const trimmed = newBlockInput.trim();
      if (!trimmed) {
        Alert.alert('Handle Required', 'Please enter a username or handle to block.');
        return;
      }
      const formatted = trimmed.startsWith('@') ? trimmed : `@${trimmed}`;
      if (blockedUsers.includes(formatted)) {
        Alert.alert('Already Blocked', `${formatted} is already in your blocked list.`);
        return;
      }
      if (onAddBlocked) {
        onAddBlocked(formatted);
      }
      setInternalBlockedUsers((prev) => (prev.includes(formatted) ? prev : [formatted, ...prev]));
      setNewBlockInput('');
      Alert.alert('User Blocked', `${formatted} has been blocked.`);
    };

    const handleUnblock = (handle: string) => {
      Alert.alert('Unblock User', `Are you sure you want to unblock ${handle}?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unblock',
          style: 'destructive',
          onPress: () => {
            if (onRemoveBlocked) {
              onRemoveBlocked(handle);
            }
            setInternalBlockedUsers((prev) => prev.filter((u) => u !== handle));
            Alert.alert('Unblocked', `${handle} has been unblocked.`);
          },
        },
      ]);
    };

    return (
      <ScrollView
        style={styles.subContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.subSectionIntro, { color: colors.textSecondary }]}>
          Blocked accounts cannot see your profile, view your hubs and clips, or message you on Hi-Hubble.
        </Text>

        {/* Add User to Block */}
        <View style={[styles.blockInputRow, { borderColor: colors.border, backgroundColor: colors.statCardBg }]}>
          <TextInput
            style={[styles.blockInput, { color: colors.textPrimary }]}
            placeholder="Enter handle to block (e.g. @spammer)..."
            placeholderTextColor={colors.textMuted}
            value={newBlockInput}
            onChangeText={setNewBlockInput}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={handleBlockUser}
          />
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleBlockUser}
            disabled={!newBlockInput.trim()}
            style={[
              styles.blockAddBtn,
              { backgroundColor: '#EF4444' },
              !newBlockInput.trim() && { opacity: 0.5 },
            ]}
          >
            <Text style={styles.blockAddBtnText}>Block</Text>
          </TouchableOpacity>
        </View>

        {/* Blocked Accounts List */}
        <Text style={[styles.subListHeader, { color: colors.textPrimary }]}>
          Blocked People ({blockedUsers.length})
        </Text>

        {blockedUsers.map((handle) => (
          <View
            key={handle}
            style={[styles.blockedUserRow, { borderColor: colors.border, backgroundColor: colors.statCardBg }]}
          >
            <View style={styles.blockedUserInfo}>
              <View style={[styles.blockedAvatarCircle, { backgroundColor: '#FEE2E2' }]}>
                <Feather name="user-x" size={14} color="#EF4444" />
              </View>
              <Text style={[styles.blockedUserHandle, { color: colors.textPrimary }]}>{handle}</Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handleUnblock(handle)}
              style={[styles.unblockBtn, { borderColor: colors.border }]}
            >
              <Text style={[styles.unblockBtnText, { color: BRAND_COLORS.purplePrimary }]}>Unblock</Text>
            </TouchableOpacity>
          </View>
        ))}

        {blockedUsers.length === 0 && (
          <Text style={[styles.emptyBlockedText, { color: colors.textMuted }]}>
            You have not blocked any accounts yet.
          </Text>
        )}
      </ScrollView>
    );
  };

  // Sub-view: Restricted Accounts Section
  const renderRestrictedAccounts = () => {
    const handleRestrictUser = () => {
      const trimmed = newRestrictInput.trim();
      if (!trimmed) {
        Alert.alert('Handle Required', 'Please enter a username or handle to restrict.');
        return;
      }
      const formatted = trimmed.startsWith('@') ? trimmed : `@${trimmed}`;
      if (restrictedUsers.includes(formatted)) {
        Alert.alert('Already Restricted', `${formatted} is already in your restricted list.`);
        return;
      }
      if (onAddRestricted) {
        onAddRestricted(formatted);
      }
      setInternalRestrictedUsers((prev) => (prev.includes(formatted) ? prev : [formatted, ...prev]));
      setNewRestrictInput('');
      Alert.alert('User Restricted', `${formatted} has been added to restricted accounts.`);
    };

    const handleUnrestrict = (handle: string) => {
      Alert.alert('Unrestrict User', `Are you sure you want to remove restrictions for ${handle}?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unrestrict',
          onPress: () => {
            if (onRemoveRestricted) {
              onRemoveRestricted(handle);
            }
            setInternalRestrictedUsers((prev) => prev.filter((u) => u !== handle));
            Alert.alert('Unrestricted', `${handle} is no longer restricted.`);
          },
        },
      ]);
    };

    return (
      <ScrollView
        style={styles.subContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.subSectionIntro, { color: colors.textSecondary }]}>
          Restricting limits someone's interactions with your content without letting them know. Their comments on your hubs will only be visible to them unless you approve them, and they won't see your online status.
        </Text>

        {/* Add User to Restrict */}
        <View style={[styles.blockInputRow, { borderColor: colors.border, backgroundColor: colors.statCardBg }]}>
          <TextInput
            style={[styles.blockInput, { color: colors.textPrimary }]}
            placeholder="Enter handle to restrict..."
            placeholderTextColor={colors.textMuted}
            value={newRestrictInput}
            onChangeText={setNewRestrictInput}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={handleRestrictUser}
          />
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleRestrictUser}
            disabled={!newRestrictInput.trim()}
            style={[
              styles.blockAddBtn,
              { backgroundColor: '#F59E0B' },
              !newRestrictInput.trim() && { opacity: 0.5 },
            ]}
          >
            <Text style={styles.blockAddBtnText}>Restrict</Text>
          </TouchableOpacity>
        </View>

        {/* Restricted Accounts List */}
        <Text style={[styles.subListHeader, { color: colors.textPrimary }]}>
          Restricted People ({restrictedUsers.length})
        </Text>

        {restrictedUsers.map((handle) => (
          <View
            key={handle}
            style={[styles.blockedUserRow, { borderColor: colors.border, backgroundColor: colors.statCardBg }]}
          >
            <View style={styles.blockedUserInfo}>
              <View style={[styles.blockedAvatarCircle, { backgroundColor: '#FEF3C7' }]}>
                <Feather name="lock" size={14} color="#D97706" />
              </View>
              <Text style={[styles.blockedUserHandle, { color: colors.textPrimary }]}>{handle}</Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handleUnrestrict(handle)}
              style={[styles.unblockBtn, { borderColor: colors.border }]}
            >
              <Text style={[styles.unblockBtnText, { color: colors.textPrimary }]}>Unrestrict</Text>
            </TouchableOpacity>
          </View>
        ))}

        {restrictedUsers.length === 0 && (
          <Text style={[styles.emptyBlockedText, { color: colors.textMuted }]}>
            You have no restricted accounts.
          </Text>
        )}
      </ScrollView>
    );
  };

  // Screen titles
  const screenTitles: Record<SubScreen, string> = {
    main: 'Settings',
    hubbs: 'Hubbs Settings',
    notifications: 'Notifications',
    accessibility: 'Accessibility',
    blocked: 'Blocked Accounts',
    restricted: 'Restricted Accounts',
    faq: 'FAQ & Help',
    about: 'About Hi-Hubble',
    privacy: 'Privacy Policy',
    terms: 'Terms & Policy',
  };

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out of your Hi-Hubble account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: () => {
            handleClose();
            onLogout?.();
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to permanently delete your account? All your hubs, clips, and profile data will be permanently removed. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Forever',
          style: 'destructive',
          onPress: () => {
            handleClose();
            onDeleteAccount?.();
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay} data-modal-overlay="true">
        <View
          style={[styles.modalCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
          data-modal-card="true"
        >
          {/* Popup Drag Handle */}
          <View style={styles.dragHandleContainer}>
            <View style={[styles.dragHandle, { backgroundColor: colors.border }]} />
          </View>

          {/* Header */}
          <View style={[styles.headerRow, { borderBottomColor: colors.border }]}>
            <View style={styles.titleGroup}>
              {activeSubScreen !== 'main' ? (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setActiveSubScreen('main')}
                  style={styles.backBtn}
                >
                  <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
                </TouchableOpacity>
              ) : (
                <Ionicons name="settings-outline" size={20} color={BRAND_COLORS.purplePrimary} />
              )}
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                {screenTitles[activeSubScreen]}
              </Text>
            </View>
            <TouchableOpacity activeOpacity={0.7} onPress={handleClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Subscreen or Main Menu */}
          {activeSubScreen === 'hubbs' && renderHubbsSettings()}
          {activeSubScreen === 'notifications' && renderNotifications()}
          {activeSubScreen === 'accessibility' && renderAccessibility()}
          {activeSubScreen === 'blocked' && renderBlockedAccounts()}
          {activeSubScreen === 'restricted' && renderRestrictedAccounts()}
          {activeSubScreen === 'faq' && renderFAQ()}
          {activeSubScreen === 'about' && renderAbout()}
          {activeSubScreen === 'privacy' && renderPrivacyPolicy()}
          {activeSubScreen === 'terms' && renderTermsPolicy()}

          {activeSubScreen === 'main' && (
            <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
              {/* Avatar Upload Option directly from Settings */}
              <View style={[styles.avatarUploadCard, { backgroundColor: colors.statCardBg, borderColor: colors.border }]}>
                <View style={styles.avatarPreviewGroup}>
                  <View style={styles.settingsAvatarCircle}>
                    <Image
                      source={{ uri: userAvatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop' }}
                      style={styles.settingsAvatarImg}
                      resizeMode="cover"
                    />
                  </View>
                  <View style={styles.avatarUploadTextCol}>
                    <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Avatar</Text>
                    <Text style={[styles.settingDesc, { color: colors.textMuted }]}>
                      Upload or change your public avatar
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => onUploadAvatar?.()}
                  style={styles.uploadAvatarBtn}
                >
                  <LinearGradient
                    colors={['#8B5CF6', '#7C3AED']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.uploadAvatarBtnGradient}
                  >
                    <Feather name="camera" size={13} color="#FFFFFF" />
                    <Text style={styles.uploadAvatarBtnText}>Change Avatar</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {/* Dark Mode Toggle Switch */}
              <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
                <View style={styles.settingLabelGroup}>
                  <Ionicons
                    name={themeMode === 'light' ? 'sunny-outline' : 'moon-outline'}
                    size={19}
                    color={BRAND_COLORS.purplePrimary}
                  />
                  <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Dark Mode</Text>
                </View>
                <Switch
                  value={themeMode === 'dark'}
                  onValueChange={onToggleTheme}
                  trackColor={{ false: '#D1D5DB', true: BRAND_COLORS.purplePrimary }}
                  thumbColor="#FFFFFF"
                />
              </View>

              {/* 1. Edit Profile */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  onClose();
                  onEditProfile();
                }}
                style={[styles.menuItem, { borderBottomColor: colors.border }]}
              >
                <View style={styles.menuLeft}>
                  <View style={[styles.menuIconCircle, { backgroundColor: colors.statCardBg }]}>
                    <Feather name="user" size={17} color={BRAND_COLORS.purplePrimary} />
                  </View>
                  <View>
                    <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>Edit Profile</Text>
                    <Text style={[styles.menuSubtext, { color: colors.textMuted }]}>
                      Update name, handle, bio, phone & OTP
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </TouchableOpacity>

              {/* 2. Hubbs Settings */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setActiveSubScreen('hubbs')}
                style={[styles.menuItem, { borderBottomColor: colors.border }]}
              >
                <View style={styles.menuLeft}>
                  <View style={[styles.menuIconCircle, { backgroundColor: colors.statCardBg }]}>
                    <Ionicons name="grid-outline" size={17} color={BRAND_COLORS.purplePrimary} />
                  </View>
                  <View>
                    <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>Hubbs Settings</Text>
                    <Text style={[styles.menuSubtext, { color: colors.textMuted }]}>
                      Privacy, remixes & upload quality
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </TouchableOpacity>

              {/* 3. Notifications Section */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setActiveSubScreen('notifications')}
                style={[styles.menuItem, { borderBottomColor: colors.border }]}
              >
                <View style={styles.menuLeft}>
                  <View style={[styles.menuIconCircle, { backgroundColor: colors.statCardBg }]}>
                    <Ionicons name="notifications-outline" size={18} color={BRAND_COLORS.purplePrimary} />
                  </View>
                  <View>
                    <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>Notifications</Text>
                    <Text style={[styles.menuSubtext, { color: colors.textMuted }]}>
                      Push alerts, likes, comments & new hubbers
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </TouchableOpacity>

              {/* Accessibility */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setActiveSubScreen('accessibility')}
                style={[styles.menuItem, { borderBottomColor: colors.border }]}
              >
                <View style={styles.menuLeft}>
                  <View style={[styles.menuIconCircle, { backgroundColor: colors.statCardBg }]}>
                    <Ionicons name="accessibility-outline" size={18} color={BRAND_COLORS.purplePrimary} />
                  </View>
                  <View>
                    <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>Accessibility</Text>
                    <Text style={[styles.menuSubtext, { color: colors.textMuted }]}>
                      Contrast, larger text, and reduced motion
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </TouchableOpacity>

              {/* Blocked Accounts */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setActiveSubScreen('blocked')}
                style={[styles.menuItem, { borderBottomColor: colors.border }]}
              >
                <View style={styles.menuLeft}>
                  <View style={[styles.menuIconCircle, { backgroundColor: '#FEE2E2' }]}>
                    <Feather name="user-x" size={16} color="#EF4444" />
                  </View>
                  <View>
                    <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>Blocked Accounts</Text>
                    <Text style={[styles.menuSubtext, { color: colors.textMuted }]}>
                      Block and manage blocked people ({blockedUsers.length})
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </TouchableOpacity>

              {/* Restricted Accounts */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setActiveSubScreen('restricted')}
                style={[styles.menuItem, { borderBottomColor: colors.border }]}
              >
                <View style={styles.menuLeft}>
                  <View style={[styles.menuIconCircle, { backgroundColor: '#FEF3C7' }]}>
                    <Feather name="lock" size={16} color="#D97706" />
                  </View>
                  <View>
                    <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>Restricted Accounts</Text>
                    <Text style={[styles.menuSubtext, { color: colors.textMuted }]}>
                      Restrict interactions and comments ({restrictedUsers.length})
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </TouchableOpacity>

              {/* 4. FAQ */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setActiveSubScreen('faq')}
                style={[styles.menuItem, { borderBottomColor: colors.border }]}
              >
                <View style={styles.menuLeft}>
                  <View style={[styles.menuIconCircle, { backgroundColor: colors.statCardBg }]}>
                    <Ionicons name="help-circle-outline" size={18} color={BRAND_COLORS.purplePrimary} />
                  </View>
                  <View>
                    <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>FAQ</Text>
                    <Text style={[styles.menuSubtext, { color: colors.textMuted }]}>
                      Frequently asked questions & guides
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </TouchableOpacity>

              {/* 5. About */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setActiveSubScreen('about')}
                style={[styles.menuItem, { borderBottomColor: colors.border }]}
              >
                <View style={styles.menuLeft}>
                  <View style={[styles.menuIconCircle, { backgroundColor: colors.statCardBg }]}>
                    <Ionicons name="information-circle-outline" size={18} color={BRAND_COLORS.purplePrimary} />
                  </View>
                  <View>
                    <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>About</Text>
                    <Text style={[styles.menuSubtext, { color: colors.textMuted }]}>
                      App info, mission & version
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </TouchableOpacity>

              {/* 6. Privacy Policy */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setActiveSubScreen('privacy')}
                style={[styles.menuItem, { borderBottomColor: colors.border }]}
              >
                <View style={styles.menuLeft}>
                  <View style={[styles.menuIconCircle, { backgroundColor: colors.statCardBg }]}>
                    <Ionicons name="shield-checkmark-outline" size={17} color={BRAND_COLORS.purplePrimary} />
                  </View>
                  <View>
                    <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>Privacy Policy</Text>
                    <Text style={[styles.menuSubtext, { color: colors.textMuted }]}>
                      How your data & privacy are protected
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </TouchableOpacity>

              {/* 7. Terms & Policy */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setActiveSubScreen('terms')}
                style={[styles.menuItem, { borderBottomColor: colors.border }]}
              >
                <View style={styles.menuLeft}>
                  <View style={[styles.menuIconCircle, { backgroundColor: colors.statCardBg }]}>
                    <Ionicons name="document-text-outline" size={17} color={BRAND_COLORS.purplePrimary} />
                  </View>
                  <View>
                    <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>Terms & Policy</Text>
                    <Text style={[styles.menuSubtext, { color: colors.textMuted }]}>
                      Community standards & usage terms
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </TouchableOpacity>

              {/* 8. Logout Option */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleLogout}
                style={[styles.menuItem, { borderBottomColor: colors.border, marginTop: 8 }]}
              >
                <View style={styles.menuLeft}>
                  <View style={[styles.menuIconCircle, { backgroundColor: '#FEE2E2' }]}>
                    <Feather name="log-out" size={17} color="#EF4444" />
                  </View>
                  <View>
                    <Text style={[styles.menuLabel, { color: '#EF4444', fontWeight: '700' }]}>Logout</Text>
                    <Text style={[styles.menuSubtext, { color: colors.textMuted }]}>
                      Sign out of your Hi-Hubble account
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#EF4444" />
              </TouchableOpacity>

              {/* 9. Delete Account Option */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleDeleteAccount}
                style={[styles.menuItem, { borderBottomWidth: 0, marginTop: 4 }]}
              >
                <View style={styles.menuLeft}>
                  <View style={[styles.menuIconCircle, { backgroundColor: '#FEF2F2' }]}>
                    <Feather name="trash-2" size={17} color="#DC2626" />
                  </View>
                  <View>
                    <Text style={[styles.menuLabel, { color: '#DC2626', fontWeight: '700' }]}>Delete Account</Text>
                    <Text style={[styles.menuSubtext, { color: colors.textMuted }]}>
                      Permanently remove your account and all data
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#DC2626" />
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 520,
    borderRadius: 26,
    borderWidth: 1,
    paddingBottom: 24,
    maxHeight: '90%',
    overflow: 'hidden',
    shadowColor: BRAND_COLORS.purplePrimary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.28,
    shadowRadius: 24,
    elevation: 12,
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  dragHandle: {
    width: 44,
    height: 4.5,
    borderRadius: 3,
    opacity: 0.8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    padding: 2,
    marginRight: 2,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 6,
  },
  subContent: {
    paddingHorizontal: 20,
    paddingTop: 14,
    maxHeight: 420,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 0.8,
  },
  settingLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingTextCol: {
    flex: 1,
    paddingRight: 16,
  },
  settingLabel: {
    fontSize: 14.5,
    fontWeight: '600',
  },
  settingDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    borderBottomWidth: 0.8,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  menuIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    fontSize: 14.5,
    fontWeight: '700',
  },
  menuSubtext: {
    fontSize: 11.5,
    marginTop: 2,
  },
  faqCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  faqQuestion: {
    fontSize: 13.5,
    fontWeight: '700',
    marginBottom: 6,
  },
  faqAnswer: {
    fontSize: 12.5,
    lineHeight: 18,
  },
  aboutLogoBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  aboutTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 2,
  },
  aboutVersion: {
    fontSize: 12.5,
    fontWeight: '600',
    marginBottom: 12,
  },
  aboutDescription: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    paddingHorizontal: 16,
    marginBottom: 18,
  },
  aboutFooterBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  aboutFooterText: {
    fontSize: 12,
    fontWeight: '600',
  },
  legalText: {
    fontSize: 13,
    lineHeight: 20,
    paddingBottom: 20,
  },
  avatarUploadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 8,
    marginBottom: 8,
  },
  avatarPreviewGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingsAvatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: BRAND_COLORS.purplePrimary,
    overflow: 'hidden',
    backgroundColor: '#E2E8F0',
  },
  settingsAvatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarUploadTextCol: {
    flex: 1,
  },
  uploadAvatarBtn: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  uploadAvatarBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    gap: 5,
  },
  uploadAvatarBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  subSectionIntro: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 16,
    paddingHorizontal: 2,
  },
  blockInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 16,
    gap: 8,
  },
  blockInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 8,
  },
  blockAddBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
  },
  blockAddBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  subListHeader: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 10,
  },
  blockedUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  blockedUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  blockedAvatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blockedUserHandle: {
    fontSize: 13,
    fontWeight: '600',
  },
  unblockBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  unblockBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyBlockedText: {
    fontSize: 12.5,
    textAlign: 'center',
    paddingVertical: 20,
    fontStyle: 'italic',
  },
});

export default SettingsModal;
