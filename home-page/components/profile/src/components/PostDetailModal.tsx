import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  TextInput,
  Alert,
  Share,
  Platform,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { THEME, BRAND_COLORS } from '../constants/theme';
import { HubPost, ThemeMode, UserProfile, CommentItem } from '../types/profile';
import { INSTAGRAM_FILTERS, getFilterById } from '../constants/filters';
import MediaPlayer from './MediaPlayer';

export interface PostDetailModalProps {
  visible: boolean;
  post: HubPost | null;
  user: UserProfile;
  themeMode: ThemeMode;
  onClose: () => void;
  onUpdatePost: (updated: HubPost) => void;
  onDeletePost?: (postId: string) => void;
  onToggleLike: (post: HubPost) => void;
  onToggleSave: (post: HubPost) => void;
  onSharePost?: (post: HubPost) => void;
  onAddPostToStory?: (post: HubPost) => void;
}

const IN_APP_ACCOUNTS = [
  {
    id: 'hihubble_official',
    handle: '@hihubble_official',
    name: 'Hi-Hubble Official',
    role: 'Official Platform',
    avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=200&auto=format&fit=crop',
    isVerified: true,
  },
  {
    id: 'hihubble_creators',
    handle: '@hihubble_creators',
    name: 'Hubble Creators Club',
    role: 'Creator Community',
    avatar: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=200&auto=format&fit=crop',
    isVerified: true,
  },
  {
    id: 'alex_rivers',
    handle: '@alexrivers',
    name: 'Alex Rivers',
    role: 'Cosmic Explorer',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop',
    isVerified: true,
  },
  {
    id: 'jamie_sun',
    handle: '@jamiesun',
    name: 'Jamie Sun',
    role: 'Astrophotographer',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop',
    isVerified: true,
  },
];

export const PostDetailModal = ({
  visible,
  post,
  user,
  themeMode,
  onClose,
  onUpdatePost,
  onDeletePost,
  onToggleLike,
  onToggleSave,
  onSharePost,
  onAddPostToStory,
}: PostDetailModalProps) => {
  const colors = THEME[themeMode as 'light' | 'dark'];

  const [isEditing, setIsEditing] = useState(false);
  const [editedCaption, setEditedCaption] = useState('');
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Filter selector drawer state
  const [showFilterPicker, setShowFilterPicker] = useState(false);
  const [currentFilterId, setCurrentFilterId] = useState('normal');

  // In-app sharing sheet state
  const [isShareSheetVisible, setIsShareSheetVisible] = useState(false);
  const [sentAccounts, setSentAccounts] = useState<Record<string, boolean>>({});
  const commentInputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (post) {
      setEditedCaption(post.caption || '');
      setIsEditing(false);
      setActiveImageIndex(0);
      setCurrentFilterId(post.filter || 'normal');
      setShowFilterPicker(false);

      if (post.commentsList && post.commentsList.length > 0) {
        setComments(post.commentsList);
      } else if (post.comments > 0) {
        setComments([
          {
            id: 'c1',
            user: 'Alex Rivers',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop',
            text: 'Stunning colors and composition!',
            time: '1h ago',
            isPinned: true,
          },
          {
            id: 'c2',
            user: 'Sneha Patel',
            avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop',
            text: 'Love the Instagram filter on this photo!',
            time: '30m ago',
            isPinned: false,
          },
        ]);
      } else {
        setComments([]);
      }
    }
  }, [post?.id, post?.imageUrl, post?.additionalImages?.length, post?.filter]);

  if (!post) return null;

  const isVideo =
    post.mediaType === 'video' ||
    post.tabType === 'hubclips' ||
    post.imageUrl?.includes('.mp4') ||
    post.imageUrl?.includes('.mov') ||
    post.imageUrl?.includes('.webm') ||
    post.imageUrl?.startsWith('blob:');

  const allImages = [post.imageUrl, ...(post.additionalImages || [])];
  const activeFilterObj = getFilterById(currentFilterId);

  // Jump to specific slide in image carousel
  const handleScrollToSlide = (index: number) => {
    if (index >= 0 && index < allImages.length) {
      setActiveImageIndex(index);
    }
  };

  // Add more photos into this Hub post
  const handleAddMorePhotos = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Needed', 'Please allow photo gallery access to add more photos.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.9,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newUris = result.assets.map((a) => a.uri);
        const currentAdd = post.additionalImages || [];
        const combined = [...currentAdd, ...newUris];
        const updated: HubPost = {
          ...post,
          additionalImages: combined,
        };
        onUpdatePost(updated);
        // Switch to the newly added slide
        setActiveImageIndex(allImages.length);
        Alert.alert('Photos Added', `${newUris.length} more photo(s) added to this Hub! Swipe sideways to view them all.`);
      }
    } catch (e) {
      console.log('Error adding more photos:', e);
      Alert.alert('Error', 'Could not access device photos.');
    }
  };

  // Apply new Instagram filter to post
  const handleSelectFilter = (filterId: string) => {
    setCurrentFilterId(filterId);
    const updated: HubPost = {
      ...post,
      filter: filterId !== 'normal' ? filterId : undefined,
    };
    onUpdatePost(updated);
  };

  // Save edited caption
  const handleSaveEdit = () => {
    const updated: HubPost = {
      ...post,
      caption: editedCaption.trim(),
      filter: currentFilterId !== 'normal' ? currentFilterId : undefined,
    };
    onUpdatePost(updated);
    setIsEditing(false);
  };

  // Delete post
  const handleDelete = () => {
    Alert.alert(
      isVideo ? 'Delete HubClip' : 'Delete Post',
      isVideo
        ? 'Are you sure you want to permanently delete this video clip? This action cannot be undone.'
        : 'Are you sure you want to delete this hub post? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            onDeletePost?.(post.id);
            onClose();
          },
        },
      ]
    );
  };

  // Add a new comment
  const handleAddComment = () => {
    const trimmed = commentText.trim();
    if (!trimmed) return;

    const newComment: CommentItem = {
      id: `c_${Date.now()}`,
      user: user?.name || 'Hymasri',
      avatar:
        user?.avatarUrl ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
      text: trimmed,
      time: 'Just now',
      isPinned: false,
    };

    const updatedList = [newComment, ...comments];
    setComments(updatedList);
    setCommentText('');

    onUpdatePost({
      ...post,
      comments: updatedList.length,
      commentsList: updatedList,
    });
  };

  const handleSendToInAppUser = (acc: typeof IN_APP_ACCOUNTS[0]) => {
    setSentAccounts((prev) => ({ ...prev, [acc.id]: true }));
    Alert.alert('Sent to In-App Account', `Post shared directly with ${acc.name} (${acc.handle}).`);
  };

  const handleExternalShare = async () => {
    try {
      const shareContent = [
        `Hi-Hubble Post by ${user.name} (${user.handle})`,
        post.caption ? `"${post.caption}"` : '',
        `Media: ${post.imageUrl}`,
        `Explore on Hi-Hubble: https://hihubble.com/p/${post.id}`,
      ]
        .filter(Boolean)
        .join('\n\n');

      await Share.share({
        title: `${user.name}'s Post on Hi-Hubble`,
        message: shareContent,
      });
    } catch (e) {
      console.log('Error sharing:', e);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay} data-modal-overlay="true">
        <View
          style={[
            styles.modalCard,
            {
              backgroundColor: colors.cardBg,
              borderColor: colors.border,
            },
          ]}
          data-modal-card="true"
        >
          {/* Header Row */}
          <View style={[styles.headerRow, { borderBottomColor: colors.border }]}>
            <View style={styles.authorGroup}>
              <Image source={{ uri: user.avatarUrl }} style={styles.authorAvatar} />
              <View style={styles.authorMeta}>
                <View style={styles.nameBadgeRow}>
                  <Text style={[styles.authorName, { color: colors.textPrimary }]}>{user.name}</Text>
                  {user.isVerified && (
                    <Ionicons name="checkmark-circle" size={14} color={BRAND_COLORS.purplePrimary} />
                  )}
                </View>
                <Text style={[styles.authorHandle, { color: colors.textMuted }]}>
                  {user.handle} • {post.createdAt}
                </Text>
              </View>
            </View>

            <View style={styles.topActionsGroup}>
              {/* Add Photos button for Hubs */}
              {!isVideo && (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleAddMorePhotos}
                  style={[styles.addPhotoTopBtn, { borderColor: BRAND_COLORS.purplePrimary }]}
                >
                  <Feather name="plus-circle" size={13} color={BRAND_COLORS.purplePrimary} />
                  <Text style={styles.addPhotoTopBtnText}>+ Photos</Text>
                </TouchableOpacity>
              )}

              {/* Instagram Filter Picker Button */}
              {!isVideo && (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setShowFilterPicker((prev) => !prev)}
                  style={[
                    styles.filterTopBtn,
                    showFilterPicker && { backgroundColor: BRAND_COLORS.purplePrimary },
                  ]}
                >
                  <Ionicons
                    name="color-filter-outline"
                    size={14}
                    color={showFilterPicker ? '#FFFFFF' : BRAND_COLORS.purplePrimary}
                  />
                  <Text
                    style={[
                      styles.filterTopBtnText,
                      { color: showFilterPicker ? '#FFFFFF' : BRAND_COLORS.purplePrimary },
                    ]}
                  >
                    Filter
                  </Text>
                </TouchableOpacity>
              )}

              {/* Edit Button */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setIsEditing((prev) => !prev)}
                style={[
                  styles.editActionBtn,
                  isEditing
                    ? { backgroundColor: BRAND_COLORS.purplePrimary }
                    : { backgroundColor: colors.statCardBg, borderColor: colors.border, borderWidth: 1 },
                ]}
              >
                <Feather
                  name={isEditing ? 'check' : 'edit-2'}
                  size={13}
                  color={isEditing ? '#FFFFFF' : colors.textPrimary}
                />
              </TouchableOpacity>

              {/* Close Button */}
              <TouchableOpacity activeOpacity={0.7} onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Instagram Filter Picker Sheet (Collapsible) */}
          {showFilterPicker && !isVideo && (
            <View
              style={[
                styles.filterPickerBar,
                { backgroundColor: colors.statCardBg, borderBottomColor: colors.border },
              ]}
            >
              <View style={styles.filterPickerHeader}>
                <Text style={[styles.filterPickerTitle, { color: colors.textPrimary }]}>
                  Instagram Filters ({INSTAGRAM_FILTERS.length})
                </Text>
                <Text style={{ fontSize: 11, color: BRAND_COLORS.purplePrimary, fontWeight: '700' }}>
                  {activeFilterObj.name}
                </Text>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterListScroll}>
                {INSTAGRAM_FILTERS.map((flt) => {
                  const isCurrent = currentFilterId === flt.id;
                  return (
                    <TouchableOpacity
                      key={flt.id}
                      activeOpacity={0.8}
                      onPress={() => handleSelectFilter(flt.id)}
                      style={[
                        styles.filterChipItem,
                        isCurrent && {
                          borderColor: BRAND_COLORS.purplePrimary,
                          backgroundColor: 'rgba(124, 58, 237, 0.12)',
                          borderWidth: 2,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.filterSwatchBox,
                          // @ts-ignore
                          Platform.OS === 'web' && flt.id !== 'normal' && ({ filter: flt.cssFilter } as any),
                        ]}
                      >
                        <Image source={{ uri: post.imageUrl }} style={styles.filterSwatchImg} resizeMode="cover" />
                        {flt.color !== 'transparent' && (
                          <View
                            pointerEvents="none"
                            style={[StyleSheet.absoluteFill, { backgroundColor: flt.color }]}
                          />
                        )}
                      </View>
                      <Text
                        style={[
                          styles.filterChipText,
                          {
                            color: isCurrent ? BRAND_COLORS.purplePrimary : colors.textPrimary,
                            fontWeight: isCurrent ? '800' : '600',
                          },
                        ]}
                      >
                        {flt.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* MEDIA CANVAS */}
            <View style={styles.mediaCanvasWrapper}>
              {isVideo ? (
                /* 1. REAL WORKING MEDIA PLAYER FOR HUBCLIPS */
                <MediaPlayer
                  videoUrl={post.imageUrl}
                  aspectRatio={9 / 16}
                  autoPlay={true}
                  isMuted={false}
                  loop={true}
                  title={post.caption || 'HubClip'}
                />
              ) : (
                /* 2. SWIPEABLE PHOTOS CAROUSEL WITH INSTAGRAM FILTERS */
                <View style={styles.photoCarouselBox}>
                  {/* Photo Display with Active Filter */}
                  <View style={styles.photoDisplayArea}>
                    <Image
                      source={{ uri: allImages[activeImageIndex] || post.imageUrl }}
                      // @ts-ignore
                      style={[
                        styles.mainPhoto,
                        Platform.OS === 'web' &&
                          activeFilterObj.id !== 'normal' &&
                          ({ filter: activeFilterObj.cssFilter } as any),
                      ]}
                      resizeMode="contain"
                    />

                    {/* Filter Color Tint Overlay */}
                    {activeFilterObj.color !== 'transparent' && (
                      <View
                        pointerEvents="none"
                        style={[StyleSheet.absoluteFill, { backgroundColor: activeFilterObj.color }]}
                      />
                    )}

                    {/* Sideways Navigation Arrows */}
                    {allImages.length > 1 && (
                      <>
                        {activeImageIndex > 0 && (
                          <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => handleScrollToSlide(activeImageIndex - 1)}
                            style={[styles.swipeArrowBtn, styles.swipeArrowLeft]}
                          >
                            <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
                          </TouchableOpacity>
                        )}
                        {activeImageIndex < allImages.length - 1 && (
                          <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => handleScrollToSlide(activeImageIndex + 1)}
                            style={[styles.swipeArrowBtn, styles.swipeArrowRight]}
                          >
                            <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
                          </TouchableOpacity>
                        )}
                      </>
                    )}

                    {/* Counter Badge */}
                    {allImages.length > 1 && (
                      <View style={styles.carouselCounterBadge}>
                        <Ionicons name="images-outline" size={12} color="#FFFFFF" />
                        <Text style={styles.carouselCounterText}>
                          {activeImageIndex + 1} / {allImages.length}
                        </Text>
                      </View>
                    )}

                    {/* Active Filter Badge */}
                    {activeFilterObj.id !== 'normal' && (
                      <View style={styles.filterBadgeOverlay}>
                        <Ionicons name="sparkles" size={10} color="#FFFFFF" />
                        <Text style={styles.filterBadgeText}>{activeFilterObj.name}</Text>
                      </View>
                    )}
                  </View>

                  {/* Swipeable Thumbnails Strip */}
                  {allImages.length > 1 && (
                    <View style={styles.thumbnailsStripWrapper}>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbnailsStrip}>
                        {allImages.map((uri, idx) => {
                          const isCurrent = idx === activeImageIndex;
                          return (
                            <TouchableOpacity
                              key={idx}
                              activeOpacity={0.8}
                              onPress={() => handleScrollToSlide(idx)}
                              style={[
                                styles.thumbBtn,
                                isCurrent && {
                                  borderColor: BRAND_COLORS.purplePrimary,
                                  borderWidth: 2.5,
                                  transform: [{ scale: 1.05 }],
                                },
                              ]}
                            >
                              <Image source={{ uri }} style={styles.thumbImg} resizeMode="cover" />
                              <View style={styles.thumbIdxPill}>
                                <Text style={styles.thumbIdxText}>{idx + 1}</Text>
                              </View>
                            </TouchableOpacity>
                          );
                        })}

                        {/* Add More Photos button in strip */}
                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={handleAddMorePhotos}
                          style={[styles.thumbAddBtn, { borderColor: BRAND_COLORS.purplePrimary, backgroundColor: colors.statCardBg }]}
                        >
                          <Feather name="plus" size={16} color={BRAND_COLORS.purplePrimary} />
                          <Text style={styles.thumbAddText}>Add</Text>
                        </TouchableOpacity>
                      </ScrollView>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Actions Bar: Like, Comments, Save, Share */}
            <View style={[styles.actionsBar, { borderBottomColor: colors.border }]}>
              <View style={styles.leftActions}>
                {/* Like Button */}
                <TouchableOpacity activeOpacity={0.7} onPress={() => onToggleLike(post)} style={styles.actionBtn}>
                  <Ionicons
                    name={post.isLiked ? 'heart' : 'heart-outline'}
                    size={24}
                    color={post.isLiked ? '#FF4D6D' : colors.textPrimary}
                  />
                  <Text style={[styles.actionCount, { color: post.isLiked ? '#FF4D6D' : colors.textPrimary }]}>
                    {post.likes}
                  </Text>
                </TouchableOpacity>

                {/* Comment Counter Button */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => commentInputRef.current?.focus()}
                  style={styles.actionBtn}
                >
                  <Ionicons name="chatbubble-outline" size={22} color={colors.textPrimary} />
                  <Text style={[styles.actionCount, { color: colors.textPrimary }]}>{comments.length}</Text>
                </TouchableOpacity>

                {/* Share Button */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    if (onSharePost) {
                      onSharePost(post);
                    } else {
                      setIsShareSheetVisible(true);
                    }
                  }}
                  style={styles.shareActionBtn}
                >
                  <Ionicons name="paper-plane-outline" size={20} color={BRAND_COLORS.purplePrimary} />
                  <Text style={[styles.shareActionText, { color: BRAND_COLORS.purplePrimary }]}>Share</Text>
                </TouchableOpacity>
              </View>

              {/* Bookmark Save */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => onToggleSave(post)}
                style={[
                  styles.savePostBtn,
                  post.isSaved
                    ? { backgroundColor: '#ECFDF5', borderColor: '#10B981' }
                    : { backgroundColor: colors.statCardBg, borderColor: colors.border },
                ]}
              >
                <Ionicons
                  name={post.isSaved ? 'bookmark' : 'bookmark-outline'}
                  size={17}
                  color={post.isSaved ? '#10B981' : colors.textSecondary}
                />
                <Text style={[styles.savePostBtnText, { color: post.isSaved ? '#10B981' : colors.textSecondary }]}>
                  {post.isSaved ? 'Saved' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Caption & Edit Section */}
            <View style={styles.captionSection}>
              {isEditing ? (
                <View style={[styles.editBox, { backgroundColor: colors.statCardBg, borderColor: colors.border }]}>
                  <Text style={[styles.editBoxTitle, { color: colors.textSecondary }]}>Edit Caption</Text>
                  <TextInput
                    style={[
                      styles.editInput,
                      { backgroundColor: colors.cardBg, color: colors.textPrimary, borderColor: colors.border },
                    ]}
                    value={editedCaption}
                    onChangeText={setEditedCaption}
                    multiline
                    numberOfLines={3}
                    placeholder="Enter updated caption..."
                    placeholderTextColor={colors.textMuted}
                  />

                  <View style={styles.editControlsRow}>
                    <TouchableOpacity activeOpacity={0.8} onPress={handleDelete} style={styles.deleteBtn}>
                      <Feather name="trash-2" size={14} color="#EF4444" />
                      <Text style={styles.deleteBtnText}>Delete</Text>
                    </TouchableOpacity>

                    <TouchableOpacity activeOpacity={0.85} onPress={handleSaveEdit} style={styles.saveChangesBtnWrapper}>
                      <LinearGradient colors={['#8B5CF6', '#7C3AED']} style={styles.saveChangesBtn}>
                        <Feather name="check" size={14} color="#FFFFFF" />
                        <Text style={styles.saveChangesBtnText}>Save</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.captionDisplay}>
                  {post.caption ? (
                    <Text style={[styles.captionText, { color: colors.textPrimary }]}>
                      <Text style={[styles.captionAuthor, { color: colors.textPrimary }]}>{user.name} </Text>
                      {post.caption}
                    </Text>
                  ) : null}

                  {/* Hashtags */}
                  {post.hashtags && post.hashtags.length > 0 && (
                    <View style={styles.postHashtagsRow}>
                      {post.hashtags.map((tag, idx) => (
                        <View key={idx} style={styles.postHashtagBadge}>
                          <Text style={styles.postHashtagText}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Comments List Section */}
            <View style={styles.commentsSection}>
              <Text style={[styles.commentsSectionTitle, { color: colors.textSecondary }]}>
                Comments ({comments.length})
              </Text>

              {comments.map((c) => (
                <View key={c.id} style={styles.commentRow}>
                  <Image source={{ uri: c.avatar }} style={styles.commentAvatar} />
                  <View style={[styles.commentBubble, { backgroundColor: colors.statCardBg }]}>
                    <View style={styles.commentHeader}>
                      <Text style={[styles.commentAuthor, { color: colors.textPrimary }]}>{c.user}</Text>
                      <Text style={[styles.commentTime, { color: colors.textMuted }]}>{c.time}</Text>
                    </View>
                    <Text style={[styles.commentBody, { color: colors.textSecondary }]}>{c.text}</Text>
                  </View>
                </View>
              ))}

              {/* Add Comment Input or Disabled Notice */}
              {post.allowComments === false ? (
                <View style={[styles.addCommentRow, { borderColor: colors.border, backgroundColor: colors.statCardBg, justifyContent: 'center', gap: 6 }]}>
                  <Feather name="lock" size={13} color={colors.textMuted} />
                  <Text style={{ fontSize: 12, color: colors.textMuted, fontWeight: '500' }}>
                    Comments are disabled for this post.
                  </Text>
                </View>
              ) : (
                <View style={[styles.addCommentRow, { borderColor: colors.border, backgroundColor: colors.statCardBg }]}>
                  <Image source={{ uri: user.avatarUrl }} style={styles.inputAvatar} />
                  <TextInput
                    ref={commentInputRef}
                    style={[styles.commentInput, { color: colors.textPrimary }]}
                    placeholder="Add a comment... (press enter to post)"
                    placeholderTextColor={colors.textMuted}
                    value={commentText}
                    onChangeText={setCommentText}
                    returnKeyType="send"
                    onSubmitEditing={handleAddComment}
                  />
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={handleAddComment}
                    disabled={!commentText.trim()}
                    style={[styles.postCommentBtn, commentText.trim() ? { opacity: 1 } : { opacity: 0.4 }]}
                  >
                    <Text style={styles.postCommentBtnText}>Post</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </View>

      {/* SHARE SHEET MODAL */}
      <Modal visible={isShareSheetVisible} transparent animationType="fade" onRequestClose={() => setIsShareSheetVisible(false)}>
        <View style={styles.overlay} data-modal-overlay="true">
          <View style={[styles.shareCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]} data-modal-card="true">
            <View style={styles.shareHeader}>
              <Text style={[styles.shareTitle, { color: colors.textPrimary }]}>Share Hub Post</Text>
              <TouchableOpacity activeOpacity={0.7} onPress={() => setIsShareSheetVisible(false)}>
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Post ID & Add to Story Quick Action */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 9, backgroundColor: colors.statCardBg, borderRadius: 12, marginHorizontal: 16, marginBottom: 12 }}>
              <View>
                <Text style={{ fontSize: 10.5, color: colors.textMuted, fontWeight: '600' }}>POST ID</Text>
                <Text style={{ fontSize: 13, fontWeight: '800', color: BRAND_COLORS.purplePrimary }}>#{post.shareId || post.id}</Text>
              </View>
              {onAddPostToStory && (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    onAddPostToStory(post);
                    setIsShareSheetVisible(false);
                  }}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: BRAND_COLORS.purplePrimary, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 9 }}
                >
                  <Ionicons name="sparkles" size={13} color="#FFFFFF" />
                  <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '700' }}>Add to Story</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.inAppList}>
              {IN_APP_ACCOUNTS.map((acc) => {
                const isSent = sentAccounts[acc.id];
                return (
                  <View key={acc.id} style={styles.shareItemRow}>
                    <Image source={{ uri: acc.avatar }} style={styles.shareItemAvatar} />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={[styles.shareItemName, { color: colors.textPrimary }]}>{acc.name}</Text>
                      <Text style={[styles.shareItemHandle, { color: colors.textMuted }]}>{acc.handle}</Text>
                    </View>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => handleSendToInAppUser(acc)}
                      disabled={isSent}
                      style={[
                        styles.sendBtn,
                        isSent
                          ? { backgroundColor: '#10B981' }
                          : { backgroundColor: BRAND_COLORS.purplePrimary },
                      ]}
                    >
                      <Text style={styles.sendBtnText}>{isSent ? 'Sent' : 'Send'}</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>

            <TouchableOpacity activeOpacity={0.8} onPress={handleExternalShare} style={styles.externalShareBtn}>
              <Ionicons name="share-social-outline" size={16} color="#FFFFFF" />
              <Text style={styles.externalShareBtnText}>Share via Apps...</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 520,
    borderRadius: 26,
    borderWidth: 1,
    overflow: 'hidden',
    maxHeight: '92%',
    shadowColor: BRAND_COLORS.purplePrimary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.28,
    shadowRadius: 24,
    elevation: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  authorGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  authorAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  authorMeta: {
    justifyContent: 'center',
  },
  nameBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '800',
  },
  authorHandle: {
    fontSize: 11.5,
    marginTop: 1,
  },
  topActionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addPhotoTopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4.5,
    borderRadius: 10,
    borderWidth: 1.2,
  },
  addPhotoTopBtnText: {
    color: BRAND_COLORS.purplePrimary,
    fontSize: 11,
    fontWeight: '800',
  },
  filterTopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4.5,
    borderRadius: 10,
    borderWidth: 1.2,
    borderColor: BRAND_COLORS.purplePrimary,
  },
  filterTopBtnText: {
    fontSize: 11,
    fontWeight: '800',
  },
  editActionBtn: {
    padding: 6,
    borderRadius: 10,
  },
  closeBtn: {
    padding: 4,
  },
  filterPickerBar: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  filterPickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  filterPickerTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  filterListScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  filterChipItem: {
    alignItems: 'center',
    padding: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterSwatchBox: {
    width: 48,
    height: 48,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 4,
  },
  filterSwatchImg: {
    width: '100%',
    height: '100%',
  },
  filterChipText: {
    fontSize: 10.5,
  },
  body: {
    maxHeight: 650,
  },
  mediaCanvasWrapper: {
    width: '100%',
    backgroundColor: '#05050A',
    position: 'relative',
  },
  photoCarouselBox: {
    width: '100%',
    alignItems: 'center',
  },
  photoDisplayArea: {
    width: '100%',
    aspectRatio: 1,
    maxHeight: 460,
    position: 'relative',
    backgroundColor: '#05050A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainPhoto: {
    width: '100%',
    height: '100%',
  },
  swipeArrowBtn: {
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -18 }],
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  swipeArrowLeft: {
    left: 12,
  },
  swipeArrowRight: {
    right: 12,
  },
  carouselCounterBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 5,
  },
  carouselCounterText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  filterBadgeOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(124, 58, 237, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 10,
    zIndex: 5,
  },
  filterBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  thumbnailsStripWrapper: {
    width: '100%',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  thumbnailsStrip: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  thumbBtn: {
    width: 48,
    height: 48,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  thumbImg: {
    width: '100%',
    height: '100%',
  },
  thumbIdxPill: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 4,
    paddingHorizontal: 3,
    paddingVertical: 1,
  },
  thumbIdxText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '800',
  },
  thumbAddBtn: {
    width: 48,
    height: 48,
    borderRadius: 8,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  thumbAddText: {
    color: BRAND_COLORS.purplePrimary,
    fontSize: 9,
    fontWeight: '800',
  },
  actionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  actionCount: {
    fontSize: 13,
    fontWeight: '700',
  },
  shareActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
  },
  shareActionText: {
    fontSize: 12,
    fontWeight: '700',
  },
  savePostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  savePostBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  captionSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  captionDisplay: {
    marginBottom: 6,
  },
  captionText: {
    fontSize: 13.5,
    lineHeight: 19,
  },
  captionAuthor: {
    fontWeight: '800',
  },
  postHashtagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  postHashtagBadge: {
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  postHashtagText: {
    color: BRAND_COLORS.purplePrimary,
    fontSize: 11.5,
    fontWeight: '700',
  },
  editBox: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  editBoxTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  editInput: {
    minHeight: 64,
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    fontSize: 13,
    textAlignVertical: 'top',
  },
  editControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  deleteBtnText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700',
  },
  saveChangesBtnWrapper: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  saveChangesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  saveChangesBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  commentsSection: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 24,
  },
  commentsSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 10,
  },
  commentRow: {
    flexDirection: 'row',
    marginBottom: 10,
    gap: 10,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  commentBubble: {
    flex: 1,
    padding: 10,
    borderRadius: 14,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  commentAuthor: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  commentTime: {
    fontSize: 10.5,
  },
  commentBody: {
    fontSize: 12.5,
    lineHeight: 17,
  },
  addCommentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 8,
  },
  inputAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  commentInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 4,
  },
  postCommentBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: BRAND_COLORS.purplePrimary,
  },
  postCommentBtnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
  },
  shareCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
  },
  shareHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  shareTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  inAppList: {
    gap: 12,
    marginBottom: 16,
  },
  shareItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shareItemAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  shareItemName: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  shareItemHandle: {
    fontSize: 11.5,
  },
  sendBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  sendBtnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
  },
  externalShareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: BRAND_COLORS.purplePrimary,
    paddingVertical: 10,
    borderRadius: 12,
  },
  externalShareBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});

export default PostDetailModal;
