import React, { useState, useEffect } from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME, BRAND_COLORS } from '../constants/theme';
import { HubPost, ThemeMode, UserProfile, CommentItem } from '../types/profile';
import { INSTAGRAM_FILTERS, getFilterById } from '../constants/filters';
import InstagramVideoPost from './InstagramVideoPost';

export interface PostsGridProps {
  posts: HubPost[];
  themeMode: ThemeMode;
  user?: UserProfile;
  onPressPost?: (post: HubPost) => void;
  onToggleLike?: (post: HubPost) => void;
  onToggleSave?: (post: HubPost) => void;
  onSharePost?: (post: HubPost) => void;
  onUpdatePost?: (updated: HubPost) => void;
  onDeletePost?: (postId: string) => void;
  isSelectionMode?: boolean;
  selectedPostIds?: string[];
  onLongPressPost?: (post: HubPost) => void;
  onSelectPost?: (post: HubPost) => void;
  allowViewModeToggle?: boolean;
  activeEditingPostId?: string | null;
  onClearActiveEditing?: () => void;
}

export const PostsGrid = ({
  posts,
  themeMode,
  user,
  onPressPost,
  onToggleLike,
  onToggleSave,
  onSharePost,
  onUpdatePost,
  onDeletePost,
  isSelectionMode = false,
  selectedPostIds = [],
  onLongPressPost,
  onSelectPost,
  allowViewModeToggle = true,
  activeEditingPostId,
  onClearActiveEditing,
}: PostsGridProps) => {
  const colors = THEME[themeMode as 'light' | 'dark'];

  // Default to 'feed' so posts and their inline controls are directly visible without clumsy modals
  const [viewMode, setViewMode] = useState<'grid' | 'feed'>('feed');

  // Active slide index for each post's photo carousel
  const [activeSlideIndexes, setActiveSlideIndexes] = useState<Record<string, number>>({});

  // Inline Section States (opened in the same section, no different layout)
  const [inlineCommentsPostId, setInlineCommentsPostId] = useState<string | null>(null);
  const [inlineEditingPostId, setInlineEditingPostId] = useState<string | null>(null);

  // Draft inputs for comments and edits
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [captionDrafts, setCaptionDrafts] = useState<Record<string, string>>({});
  const [filterDrafts, setFilterDrafts] = useState<Record<string, string>>({});

  // If parent sets activeEditingPostId (e.g. from top "Edit" button in Your Hubs), open inline edit
  useEffect(() => {
    if (activeEditingPostId) {
      setViewMode('feed');
      setInlineEditingPostId(activeEditingPostId);
      setInlineCommentsPostId(null);
      const targetPost = posts.find((p) => p.id === activeEditingPostId);
      if (targetPost) {
        setCaptionDrafts((prev) => ({ ...prev, [activeEditingPostId]: targetPost.caption || '' }));
        setFilterDrafts((prev) => ({ ...prev, [activeEditingPostId]: targetPost.filter || 'normal' }));
      }
    }
  }, [activeEditingPostId, posts]);

  const handleSlideChange = (postId: string, newIdx: number) => {
    setActiveSlideIndexes((prev) => ({ ...prev, [postId]: newIdx }));
  };

  // Toggle inline comment section in the same section
  const handleToggleComments = (postId: string) => {
    setInlineCommentsPostId((prev) => (prev === postId ? null : postId));
    // Close inline editing if open on this post
    if (inlineEditingPostId === postId) {
      setInlineEditingPostId(null);
      onClearActiveEditing?.();
    }
  };

  // Toggle inline edit section in the same section
  const handleToggleEdit = (post: HubPost) => {
    if (inlineEditingPostId === post.id) {
      setInlineEditingPostId(null);
      onClearActiveEditing?.();
    } else {
      setInlineEditingPostId(post.id);
      setInlineCommentsPostId(null);
      setCaptionDrafts((prev) => ({ ...prev, [post.id]: post.caption || '' }));
      setFilterDrafts((prev) => ({ ...prev, [post.id]: post.filter || 'normal' }));
    }
  };

  // Submit comment inline
  const handleSendComment = (post: HubPost) => {
    const text = (commentDrafts[post.id] || '').trim();
    if (!text) return;

    const newComment: CommentItem = {
      id: `c_${Date.now()}`,
      user: user?.name || 'Hymasri',
      avatar:
        user?.avatarUrl ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
      text,
      time: 'Just now',
    };

    const existingList = post.commentsList || [];
    const updatedList = [newComment, ...existingList];

    const updatedPost: HubPost = {
      ...post,
      comments: updatedList.length,
      commentsList: updatedList,
    };

    onUpdatePost?.(updatedPost);
    setCommentDrafts((prev) => ({ ...prev, [post.id]: '' }));
  };

  // Save changes from inline edit
  const handleSaveInlineEdit = (post: HubPost) => {
    const updatedCaption = captionDrafts[post.id] !== undefined ? captionDrafts[post.id].trim() : (post.caption || '');
    const updatedFilter = filterDrafts[post.id] !== undefined ? filterDrafts[post.id] : (post.filter || 'normal');

    const updatedPost: HubPost = {
      ...post,
      caption: updatedCaption,
      filter: updatedFilter !== 'normal' ? updatedFilter : undefined,
    };

    onUpdatePost?.(updatedPost);
    setInlineEditingPostId(null);
    onClearActiveEditing?.();
    Alert.alert('Post Updated', 'Your changes have been saved successfully.');
  };

  // Add more photos directly into post album
  const handlePickMorePhotos = async (post: HubPost) => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Needed', 'Please allow photo access to select additional photos.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.9,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newUris = result.assets.map((a) => a.uri);
        const existingAdditional = post.additionalImages || [];
        const combined = [...existingAdditional, ...newUris];
        const updatedPost: HubPost = {
          ...post,
          additionalImages: combined,
        };
        onUpdatePost?.(updatedPost);
        Alert.alert('Photos Added', `${newUris.length} photo(s) added to this post album.`);
      }
    } catch (e) {
      console.log('Error adding photos:', e);
      Alert.alert('Error', 'Could not open photo gallery.');
    }
  };

  // Delete post confirmation
  const handleDeletePost = (postId: string) => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to remove this post? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setInlineEditingPostId(null);
            onClearActiveEditing?.();
            onDeletePost?.(postId);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* View Switcher: Grid vs Swipeable Feed View */}
      {allowViewModeToggle && posts.length > 0 && !isSelectionMode && (
        <View style={[styles.viewToggleRow, { borderBottomColor: colors.border }]}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setViewMode('feed')}
            style={[
              styles.viewToggleBtn,
              viewMode === 'feed' && {
                backgroundColor: themeMode === 'light' ? '#EDE9FE' : '#2D1B54',
                borderColor: BRAND_COLORS.purplePrimary,
              },
            ]}
          >
            <Ionicons
              name="albums-outline"
              size={14}
              color={viewMode === 'feed' ? BRAND_COLORS.purplePrimary : colors.textMuted}
            />
            <Text
              style={[
                styles.viewToggleText,
                { color: viewMode === 'feed' ? BRAND_COLORS.purplePrimary : colors.textMuted },
              ]}
            >
              Feed View
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setViewMode('grid')}
            style={[
              styles.viewToggleBtn,
              viewMode === 'grid' && {
                backgroundColor: themeMode === 'light' ? '#EDE9FE' : '#2D1B54',
                borderColor: BRAND_COLORS.purplePrimary,
              },
            ]}
          >
            <Ionicons
              name="grid-outline"
              size={14}
              color={viewMode === 'grid' ? BRAND_COLORS.purplePrimary : colors.textMuted}
            />
            <Text
              style={[
                styles.viewToggleText,
                { color: viewMode === 'grid' ? BRAND_COLORS.purplePrimary : colors.textMuted },
              ]}
            >
              Grid View
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ============================================================ */}
      {/* 1. GRID VIEW MODE                                            */}
      {/* ============================================================ */}
      {viewMode === 'grid' ? (
        <View style={styles.grid}>
          {posts.map((post) => {
            const isSelected = selectedPostIds.includes(post.id);
            const selectionIndex = selectedPostIds.indexOf(post.id) + 1;
            const filterObj = getFilterById(post.filter);
            const allImages = [post.imageUrl, ...(post.additionalImages || [])];
            const hasMultiple = allImages.length > 1;

            const handlePress = () => {
              if (isSelectionMode) {
                onSelectPost?.(post);
              } else {
                // Seamlessly switch to feed view centered on this post in the same section
                setViewMode('feed');
              }
            };

            const handleLongPress = () => {
              onLongPressPost?.(post);
            };

            return (
              <TouchableOpacity
                key={post.id}
                activeOpacity={0.85}
                onPress={handlePress}
                onLongPress={handleLongPress}
                delayLongPress={300}
                style={[
                  styles.gridItem,
                  { borderColor: colors.cardBg },
                  isSelected && styles.gridItemSelected,
                ]}
              >
                <View style={[styles.imageWrapper, isSelected && styles.imageWrapperSelected]}>
                  <Image
                    source={{ uri: post.imageUrl }}
                    // @ts-ignore
                    style={[
                      styles.postImage,
                      Platform.OS === 'web' &&
                        filterObj.id !== 'normal' &&
                        ({ filter: filterObj.cssFilter } as any),
                    ]}
                    resizeMode="cover"
                  />

                  {/* Filter Tint Overlay */}
                  {filterObj.color !== 'transparent' && (
                    <View
                      pointerEvents="none"
                      style={[StyleSheet.absoluteFill, { backgroundColor: filterObj.color }]}
                    />
                  )}

                  {/* Multi-Photo Carousel Badge with Count */}
                  {!isSelectionMode && hasMultiple && (
                    <View style={styles.carouselCountBadge}>
                      <Ionicons name="copy-outline" size={10} color="#FFFFFF" />
                      <Text style={styles.carouselCountText}>{allImages.length}</Text>
                    </View>
                  )}

                  {/* Video Badge */}
                  {!isSelectionMode && post.mediaType === 'video' && (
                    <View style={styles.videoBadge}>
                      <Ionicons name="play" size={10} color="#FFFFFF" />
                      <Text style={styles.videoBadgeText}>Video</Text>
                    </View>
                  )}

                  {/* Quick Share Badge */}
                  {!isSelectionMode && (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={(e) => {
                        // @ts-ignore
                        e?.stopPropagation?.();
                        onSharePost?.(post);
                      }}
                      style={styles.gridShareBadge}
                    >
                      <Ionicons name="paper-plane" size={10} color="#FFFFFF" />
                    </TouchableOpacity>
                  )}

                  {/* Selection Indicator */}
                  {isSelectionMode && (
                    <View
                      style={[
                        styles.selectionIndicator,
                        isSelected
                          ? styles.selectionIndicatorActive
                          : styles.selectionIndicatorInactive,
                      ]}
                    >
                      {isSelected ? (
                        <Text style={styles.selectionIndexText}>{selectionIndex}</Text>
                      ) : (
                        <Ionicons name="ellipse-outline" size={18} color="rgba(255, 255, 255, 0.85)" />
                      )}
                    </View>
                  )}

                  {/* Like Interaction Badge */}
                  {!isSelectionMode && (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={(e) => {
                        // @ts-ignore
                        e?.stopPropagation?.();
                        onToggleLike?.(post);
                      }}
                      style={[
                        styles.likeBadge,
                        post.isLiked && { backgroundColor: 'rgba(255, 77, 109, 0.85)' },
                      ]}
                    >
                      <Ionicons
                        name={post.isLiked ? 'heart' : 'heart-outline'}
                        size={11}
                        color="#FFFFFF"
                      />
                      <Text style={styles.likeCount}>{post.likes}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : (
        /* ============================================================ */
        /* 2. SWIPEABLE FEED VIEW MODE (Same section, Clean & Elegant)   */
        /* ============================================================ */
        <View style={styles.feedContainer}>
          {posts.map((post) => {
            const allImages = [post.imageUrl, ...(post.additionalImages || [])];
            const activeFilterId = filterDrafts[post.id] !== undefined ? filterDrafts[post.id] : (post.filter || 'normal');
            const filterObj = getFilterById(activeFilterId);
            const activeIdx = activeSlideIndexes[post.id] || 0;
            const currentImg = allImages[Math.min(activeIdx, allImages.length - 1)] || post.imageUrl;

            const isCommentsOpen = inlineCommentsPostId === post.id;
            const isEditingOpen = inlineEditingPostId === post.id;
            const postComments = post.commentsList || [];

            const currentCaptionDraft =
              captionDrafts[post.id] !== undefined ? captionDrafts[post.id] : (post.caption || '');

            return (
              <View
                key={post.id}
                style={[
                  styles.feedCard,
                  { backgroundColor: colors.statCardBg, borderColor: colors.border },
                ]}
              >
                {/* 1. Card Header */}
                <View style={styles.feedCardHeader}>
                  <View style={styles.feedAuthorGroup}>
                    <Image
                      source={{ uri: user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop' }}
                      style={styles.feedAuthorAvatar}
                    />
                    <View>
                      <Text style={[styles.feedAuthorName, { color: colors.textPrimary }]}>
                        {user?.name || 'Hymasri'}
                      </Text>
                      <Text style={[styles.feedAuthorMeta, { color: colors.textMuted }]}>
                        {user?.handle || '@hymasri'} • {post.createdAt || 'Just now'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.feedHeaderRightActions}>
                    {filterObj.id !== 'normal' && (
                      <View style={[styles.filterIndicatorBadge, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                        <Ionicons name="color-filter-outline" size={11} color={BRAND_COLORS.purplePrimary} />
                        <Text style={[styles.filterIndicatorText, { color: BRAND_COLORS.purplePrimary }]}>
                          {filterObj.name}
                        </Text>
                      </View>
                    )}

                    {/* Inline Edit Header Pill */}
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => handleToggleEdit(post)}
                      style={[
                        styles.headerEditPill,
                        isEditingOpen
                          ? { backgroundColor: BRAND_COLORS.purplePrimary, borderColor: BRAND_COLORS.purplePrimary }
                          : { backgroundColor: colors.cardBg, borderColor: colors.border },
                      ]}
                    >
                      <Feather
                        name={isEditingOpen ? 'x' : 'edit-2'}
                        size={12}
                        color={isEditingOpen ? '#FFFFFF' : colors.textPrimary}
                      />
                      <Text
                        style={[
                          styles.headerEditPillText,
                          { color: isEditingOpen ? '#FFFFFF' : colors.textPrimary },
                        ]}
                      >
                        {isEditingOpen ? 'Close' : 'Edit'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* 2. Media Box: Swipeable Album with Smooth Controls */}
                <View style={styles.feedMediaBox}>
                  {post.mediaType === 'video' ? (
                    <InstagramVideoPost
                      videoUrl={post.imageUrl}
                      aspectRatio={post.aspectRatio || 1}
                      filter={post.filter}
                      cssFilter={filterObj.cssFilter}
                      filterColor={filterObj.color}
                      onDoubleTap={() => onToggleLike?.(post)}
                    />
                  ) : (
                    <View style={styles.feedImageContainer}>
                      <Image
                        source={{ uri: currentImg }}
                        // @ts-ignore
                        style={[
                          styles.feedImage,
                          Platform.OS === 'web' &&
                            filterObj.id !== 'normal' &&
                            ({ filter: filterObj.cssFilter } as any),
                        ]}
                        resizeMode="cover"
                      />
                      {filterObj.color !== 'transparent' && (
                        <View
                          pointerEvents="none"
                          style={[StyleSheet.absoluteFill, { backgroundColor: filterObj.color }]}
                        />
                      )}
                    </View>
                  )}

                  {/* Left / Right Swipe Arrows for multi-photo albums */}
                  {allImages.length > 1 && (
                    <>
                      {activeIdx > 0 && (
                        <TouchableOpacity
                          activeOpacity={0.85}
                          onPress={() => handleSlideChange(post.id, activeIdx - 1)}
                          style={[styles.feedNavArrow, styles.feedNavArrowLeft]}
                        >
                          <Ionicons name="chevron-back" size={18} color="#FFFFFF" />
                        </TouchableOpacity>
                      )}
                      {activeIdx < allImages.length - 1 && (
                        <TouchableOpacity
                          activeOpacity={0.85}
                          onPress={() => handleSlideChange(post.id, activeIdx + 1)}
                          style={[styles.feedNavArrow, styles.feedNavArrowRight]}
                        >
                          <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
                        </TouchableOpacity>
                      )}
                    </>
                  )}

                  {/* Album Counter Pill */}
                  {allImages.length > 1 && (
                    <View style={styles.feedCounterPill}>
                      <Ionicons name="images-outline" size={11} color="#FFFFFF" />
                      <Text style={styles.feedCounterText}>
                        {activeIdx + 1} / {allImages.length}
                      </Text>
                    </View>
                  )}
                </View>

                {/* 3. Pagination Dots for Multi-Photos */}
                {allImages.length > 1 && (
                  <View style={styles.feedDotsRow}>
                    {allImages.map((_, idx) => (
                      <TouchableOpacity
                        key={idx}
                        onPress={() => handleSlideChange(post.id, idx)}
                        style={[
                          styles.feedDot,
                          idx === activeIdx && styles.feedDotActive,
                        ]}
                      />
                    ))}
                  </View>
                )}

                {/* 4. Actions Row */}
                <View style={styles.feedActionsRow}>
                  <View style={styles.feedActionsLeft}>
                    {/* Like Action */}
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => onToggleLike?.(post)}
                      style={styles.feedActionItem}
                    >
                      <Ionicons
                        name={post.isLiked ? 'heart' : 'heart-outline'}
                        size={22}
                        color={post.isLiked ? '#FF4D6D' : colors.textPrimary}
                      />
                      <Text
                        style={[
                          styles.feedActionText,
                          { color: post.isLiked ? '#FF4D6D' : colors.textPrimary },
                        ]}
                      >
                        {post.likes}
                      </Text>
                    </TouchableOpacity>

                    {/* Comment Action: Toggles Comment Section in SAME section */}
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => handleToggleComments(post.id)}
                      style={[
                        styles.feedActionItem,
                        isCommentsOpen && styles.feedActionItemHighlight,
                      ]}
                    >
                      <Ionicons
                        name={isCommentsOpen ? 'chatbubble' : 'chatbubble-outline'}
                        size={20}
                        color={isCommentsOpen ? BRAND_COLORS.purplePrimary : colors.textPrimary}
                      />
                      <Text
                        style={[
                          styles.feedActionText,
                          { color: isCommentsOpen ? BRAND_COLORS.purplePrimary : colors.textPrimary },
                        ]}
                      >
                        {postComments.length}
                      </Text>
                    </TouchableOpacity>

                    {/* Share Action */}
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => onSharePost?.(post)}
                      style={styles.feedActionItem}
                    >
                      <Ionicons name="paper-plane-outline" size={20} color={colors.textPrimary} />
                    </TouchableOpacity>

                    {/* Edit Action: Toggles Edit Section in SAME section */}
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => handleToggleEdit(post)}
                      style={[
                        styles.feedActionItem,
                        isEditingOpen && styles.feedActionItemHighlight,
                      ]}
                    >
                      <Feather
                        name="edit-3"
                        size={18}
                        color={isEditingOpen ? BRAND_COLORS.purplePrimary : colors.textPrimary}
                      />
                      <Text
                        style={[
                          styles.feedActionText,
                          { color: isEditingOpen ? BRAND_COLORS.purplePrimary : colors.textPrimary },
                        ]}
                      >
                        Edit
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Bookmark Save */}
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => onToggleSave?.(post)}
                    style={styles.feedActionItem}
                  >
                    <Ionicons
                      name={post.isSaved ? 'bookmark' : 'bookmark-outline'}
                      size={20}
                      color={post.isSaved ? '#10B981' : colors.textPrimary}
                    />
                  </TouchableOpacity>
                </View>

                {/* 5. Caption & Hashtags Display */}
                {post.caption ? (
                  <View style={styles.feedCaptionRow}>
                    <Text style={[styles.feedCaptionText, { color: colors.textPrimary }]}>
                      <Text style={[styles.feedCaptionAuthor, { color: colors.textPrimary }]}>
                        {user?.name || 'Hymasri'}{' '}
                      </Text>
                      {post.caption}
                    </Text>
                  </View>
                ) : null}

                {post.hashtags && post.hashtags.length > 0 && (
                  <View style={styles.feedTagsRow}>
                    {post.hashtags.map((tag, idx) => (
                      <View key={idx} style={[styles.feedTagBadge, { backgroundColor: colors.cardBg }]}>
                        <Feather name="hash" size={10} color={BRAND_COLORS.purplePrimary} />
                        <Text style={styles.feedTagItem}>{tag.replace(/^#/, '')}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* ============================================================ */}
                {/* 6. INLINE COMMENT SECTION (In the SAME section)             */}
                {/* ============================================================ */}
                {isCommentsOpen && (
                  <View
                    style={[
                      styles.inlineSectionPanel,
                      { backgroundColor: colors.cardBg, borderColor: colors.border },
                    ]}
                  >
                    {/* Header */}
                    <View style={styles.inlineHeaderRow}>
                      <View style={styles.inlineHeaderLeft}>
                        <Ionicons name="chatbubble-outline" size={15} color={BRAND_COLORS.purplePrimary} />
                        <Text style={[styles.inlineHeaderTitle, { color: colors.textPrimary }]}>
                          Comments ({postComments.length})
                        </Text>
                      </View>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => setInlineCommentsPostId(null)}
                        style={styles.inlineCloseBtn}
                      >
                        <Ionicons name="close" size={16} color={colors.textSecondary} />
                      </TouchableOpacity>
                    </View>

                    {/* Comments List */}
                    <View style={styles.commentsListContainer}>
                      {postComments.length > 0 ? (
                        postComments.map((c) => (
                          <View key={c.id} style={styles.commentItemRow}>
                            <Image source={{ uri: c.avatar }} style={styles.commentItemAvatar} />
                            <View
                              style={[
                                styles.commentItemBubble,
                                { backgroundColor: colors.statCardBg, borderColor: colors.border },
                              ]}
                            >
                              <View style={styles.commentItemHeader}>
                                <Text style={[styles.commentItemAuthor, { color: colors.textPrimary }]}>
                                  {c.user}
                                </Text>
                                <Text style={[styles.commentItemTime, { color: colors.textMuted }]}>
                                  {c.time}
                                </Text>
                              </View>
                              <Text style={[styles.commentItemBody, { color: colors.textSecondary }]}>
                                {c.text}
                              </Text>
                            </View>
                          </View>
                        ))
                      ) : (
                        <View style={styles.emptyCommentsBox}>
                          <Ionicons name="chatbubbles-outline" size={26} color={colors.textMuted} />
                          <Text style={[styles.emptyCommentsText, { color: colors.textMuted }]}>
                            No comments yet. Write the first comment.
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Input Field */}
                    <View
                      style={[
                        styles.addCommentInputRow,
                        { backgroundColor: colors.statCardBg, borderColor: colors.border },
                      ]}
                    >
                      <Image
                        source={{ uri: user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop' }}
                        style={styles.commentInputAvatar}
                      />
                      <TextInput
                        style={[styles.commentTextInput, { color: colors.textPrimary }]}
                        placeholder="Write a comment..."
                        placeholderTextColor={colors.textMuted}
                        value={commentDrafts[post.id] || ''}
                        onChangeText={(txt) =>
                          setCommentDrafts((prev) => ({ ...prev, [post.id]: txt }))
                        }
                        returnKeyType="send"
                        onSubmitEditing={() => handleSendComment(post)}
                      />
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => handleSendComment(post)}
                        disabled={!(commentDrafts[post.id] || '').trim()}
                        style={[
                          styles.sendCommentBtn,
                          (commentDrafts[post.id] || '').trim()
                            ? { backgroundColor: BRAND_COLORS.purplePrimary }
                            : { backgroundColor: colors.border, opacity: 0.5 },
                        ]}
                      >
                        <Ionicons name="send" size={12} color="#FFFFFF" />
                        <Text style={styles.sendCommentBtnText}>Post</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* ============================================================ */}
                {/* 7. INLINE EDIT SECTION (In the SAME section)                */}
                {/* ============================================================ */}
                {isEditingOpen && (
                  <View
                    style={[
                      styles.inlineSectionPanel,
                      { backgroundColor: colors.cardBg, borderColor: BRAND_COLORS.purplePrimary, borderWidth: 1.5 },
                    ]}
                  >
                    {/* Header */}
                    <View style={styles.inlineHeaderRow}>
                      <View style={styles.inlineHeaderLeft}>
                        <Feather name="edit-3" size={15} color={BRAND_COLORS.purplePrimary} />
                        <Text style={[styles.inlineHeaderTitle, { color: colors.textPrimary }]}>
                          Edit Post in Hubs
                        </Text>
                      </View>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => {
                          setInlineEditingPostId(null);
                          onClearActiveEditing?.();
                        }}
                        style={styles.inlineCloseBtn}
                      >
                        <Ionicons name="close" size={16} color={colors.textSecondary} />
                      </TouchableOpacity>
                    </View>

                    {/* Caption Editing */}
                    <Text style={[styles.editFieldLabel, { color: colors.textSecondary }]}>
                      Edit Caption
                    </Text>
                    <TextInput
                      style={[
                        styles.editCaptionTextInput,
                        {
                          backgroundColor: colors.statCardBg,
                          borderColor: colors.border,
                          color: colors.textPrimary,
                        },
                      ]}
                      value={currentCaptionDraft}
                      onChangeText={(txt) =>
                        setCaptionDrafts((prev) => ({ ...prev, [post.id]: txt }))
                      }
                      placeholder="Write your post caption..."
                      placeholderTextColor={colors.textMuted}
                      multiline
                      numberOfLines={3}
                    />

                    {/* Filter Selector */}
                    {post.mediaType !== 'video' && (
                      <View style={styles.filterSelectorWrapper}>
                        <Text style={[styles.editFieldLabel, { color: colors.textSecondary }]}>
                          Select Filter
                        </Text>
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          contentContainerStyle={styles.filterChipsRow}
                        >
                          {INSTAGRAM_FILTERS.map((f) => {
                            const isSelected = activeFilterId === f.id;
                            return (
                              <TouchableOpacity
                                key={f.id}
                                activeOpacity={0.8}
                                onPress={() =>
                                  setFilterDrafts((prev) => ({ ...prev, [post.id]: f.id }))
                                }
                                style={[
                                  styles.filterChip,
                                  isSelected
                                    ? {
                                        backgroundColor: BRAND_COLORS.purplePrimary,
                                        borderColor: BRAND_COLORS.purplePrimary,
                                      }
                                    : { backgroundColor: colors.statCardBg, borderColor: colors.border },
                                ]}
                              >
                                <Ionicons
                                  name="color-filter-outline"
                                  size={12}
                                  color={isSelected ? '#FFFFFF' : colors.textSecondary}
                                />
                                <Text
                                  style={[
                                    styles.filterChipText,
                                    { color: isSelected ? '#FFFFFF' : colors.textSecondary },
                                  ]}
                                >
                                  {f.name}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </ScrollView>
                      </View>
                    )}

                    {/* Add More Photos Option */}
                    {post.mediaType !== 'video' && (
                      <View style={styles.addMoreRow}>
                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={() => handlePickMorePhotos(post)}
                          style={[
                            styles.addPhotosInlineBtn,
                            { borderColor: BRAND_COLORS.purplePrimary, backgroundColor: colors.statCardBg },
                          ]}
                        >
                          <Feather name="plus-circle" size={14} color={BRAND_COLORS.purplePrimary} />
                          <Text style={styles.addPhotosInlineBtnText}>
                            Add Photos to Album ({allImages.length} currently)
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {/* Action Controls: Delete, Cancel, Save */}
                    <View style={styles.editActionsFooter}>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => handleDeletePost(post.id)}
                        style={styles.deletePostBtn}
                      >
                        <Feather name="trash-2" size={14} color="#EF4444" />
                        <Text style={styles.deletePostBtnText}>Delete</Text>
                      </TouchableOpacity>

                      <View style={styles.editSaveGroup}>
                        <TouchableOpacity
                          activeOpacity={0.7}
                          onPress={() => {
                            setInlineEditingPostId(null);
                            onClearActiveEditing?.();
                          }}
                          style={[styles.cancelEditBtn, { borderColor: colors.border }]}
                        >
                          <Feather name="x" size={14} color={colors.textSecondary} />
                          <Text style={[styles.cancelEditBtnText, { color: colors.textSecondary }]}>
                            Cancel
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          activeOpacity={0.85}
                          onPress={() => handleSaveInlineEdit(post)}
                          style={styles.saveEditBtnWrapper}
                        >
                          <LinearGradient
                            colors={['#8B5CF6', '#7C3AED']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.saveEditBtn}
                          >
                            <Feather name="check" size={14} color="#FFFFFF" />
                            <Text style={styles.saveEditBtnText}>Save Changes</Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  viewToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  viewToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  viewToggleText: {
    fontSize: 12,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 6,
    paddingTop: 8,
  },
  gridItem: {
    width: '33.333%',
    aspectRatio: 1,
    padding: 3,
  },
  gridItemSelected: {
    padding: 1,
  },
  imageWrapper: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#0F0B1E',
  },
  imageWrapperSelected: {
    borderWidth: 2.5,
    borderColor: BRAND_COLORS.purplePrimary,
    borderRadius: 8,
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  carouselCountBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  carouselCountText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  videoBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(14, 165, 233, 0.85)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  videoBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  gridShareBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  selectionIndicator: {
    position: 'absolute',
    top: 6,
    left: 6,
    zIndex: 3,
  },
  selectionIndicatorActive: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: BRAND_COLORS.purplePrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectionIndicatorInactive: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  selectionIndexText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  likeBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  likeCount: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '700',
  },
  feedContainer: {
    paddingHorizontal: 12,
    paddingTop: 10,
    gap: 16,
  },
  feedCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    paddingBottom: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  feedCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  feedAuthorGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  feedAuthorAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.25)',
  },
  feedAuthorName: {
    fontSize: 13,
    fontWeight: '800',
  },
  feedAuthorMeta: {
    fontSize: 11,
    marginTop: 1,
  },
  feedHeaderRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterIndicatorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  filterIndicatorText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  headerEditPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 12,
    borderWidth: 1,
  },
  headerEditPillText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  feedMediaBox: {
    width: '100%',
    aspectRatio: 1,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#0A0815',
  },
  feedImageContainer: {
    width: '100%',
    height: '100%',
  },
  feedImage: {
    width: '100%',
    height: '100%',
  },
  feedNavArrow: {
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -17 }],
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  feedNavArrowLeft: {
    left: 10,
  },
  feedNavArrowRight: {
    right: 10,
  },
  feedCounterPill: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3.5,
    borderRadius: 8,
    zIndex: 5,
  },
  feedCounterText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '700',
  },
  feedDotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
  },
  feedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(124, 58, 237, 0.25)',
  },
  feedDotActive: {
    width: 18,
    backgroundColor: BRAND_COLORS.purplePrimary,
  },
  feedActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 10,
  },
  feedActionsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  feedActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 4,
  },
  feedActionItemHighlight: {
    borderRadius: 8,
  },
  feedActionText: {
    fontSize: 13,
    fontWeight: '700',
  },
  feedCaptionRow: {
    paddingHorizontal: 14,
    marginTop: 8,
  },
  feedCaptionText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  feedCaptionAuthor: {
    fontWeight: '800',
  },
  feedTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 14,
    marginTop: 6,
    gap: 6,
  },
  feedTagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  feedTagItem: {
    fontSize: 11,
    color: BRAND_COLORS.purplePrimary,
    fontWeight: '700',
  },
  inlineSectionPanel: {
    marginHorizontal: 10,
    marginTop: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
  },
  inlineHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(124, 58, 237, 0.15)',
    marginBottom: 10,
  },
  inlineHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  inlineHeaderTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  inlineCloseBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentsListContainer: {
    gap: 8,
    marginBottom: 10,
    maxHeight: 240,
  },
  commentItemRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  commentItemAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginTop: 2,
  },
  commentItemBubble: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  commentItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  commentItemAuthor: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  commentItemTime: {
    fontSize: 10,
  },
  commentItemBody: {
    fontSize: 12,
    lineHeight: 16,
  },
  emptyCommentsBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 6,
  },
  emptyCommentsText: {
    fontSize: 12,
  },
  addCommentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  commentInputAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  commentTextInput: {
    flex: 1,
    fontSize: 12.5,
    paddingVertical: 4,
  },
  sendCommentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  sendCommentBtnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
  },
  editFieldLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    marginBottom: 5,
  },
  editCaptionTextInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12.5,
    lineHeight: 17,
    minHeight: 64,
  },
  filterSelectorWrapper: {
    marginTop: 10,
  },
  filterChipsRow: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 4,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  addMoreRow: {
    marginTop: 10,
  },
  addPhotosInlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  addPhotosInlineBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  editActionsFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(124, 58, 237, 0.15)',
  },
  deletePostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  deletePostBtnText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700',
  },
  editSaveGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cancelEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  cancelEditBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  saveEditBtnWrapper: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  saveEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  saveEditBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});

export default PostsGrid;
