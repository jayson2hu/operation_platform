import { create } from 'zustand'
import { Content, ContentVersion, PreviewResult, PublishTaskRead, PublishLog, ChannelType } from '../types/api'
import { AppStoreState, Notification } from './types'

const INITIAL_STATE = {
  // 导航
  activeTab: 'workflow',

  // 工作流
  topic: '',
  isGenerating: false,

  // 内容管理
  currentContent: null,
  allContents: [],

  // 版本管理
  currentVersion: null,
  allVersions: [],

  // 预览
  previews: {} as Record<ChannelType, PreviewResult | null>,
  selectedChannels: ['wechat_oa'] as ChannelType[],

  // 发布
  publishTask: null,
  publishLogs: [],

  // UI状态
  loading: {} as Record<string, boolean>,
  errors: {} as Record<string, string | null>,
  notifications: [] as Notification[],
}

export const useAppStore = create<AppStoreState>((set) => ({
  ...INITIAL_STATE,

  // ========== 导航 ==========
  setActiveTab: (tab: string) => set({ activeTab: tab }),

  // ========== 工作流 ==========
  setTopic: (topic: string) => set({ topic }),
  setIsGenerating: (isGenerating: boolean) => set({ isGenerating }),

  // ========== 内容管理 ==========
  setCurrentContent: (content: Content | null) => set({ currentContent: content }),
  setAllContents: (contents: Content[]) => set({ allContents: contents }),

  // ========== 版本管理 ==========
  setCurrentVersion: (version: ContentVersion | null) => set({ currentVersion: version }),
  setAllVersions: (versions: ContentVersion[]) => set({ allVersions: versions }),

  // ========== 预览 ==========
  setPreview: (channel: ChannelType, preview: PreviewResult | null) =>
    set((state) => ({
      previews: {
        ...state.previews,
        [channel]: preview,
      },
    })),

  setSelectedChannels: (channels: ChannelType[]) => set({ selectedChannels: channels }),

  toggleChannel: (channel: ChannelType) =>
    set((state) => ({
      selectedChannels: state.selectedChannels.includes(channel)
        ? state.selectedChannels.filter((c) => c !== channel)
        : [...state.selectedChannels, channel],
    })),

  // ========== 发布 ==========
  setPublishTask: (task: PublishTaskRead | null) => set({ publishTask: task }),

  addPublishLog: (log: PublishLog) =>
    set((state) => ({
      publishLogs: [...state.publishLogs, log],
    })),

  clearPublishLogs: () => set({ publishLogs: [] }),

  // ========== UI状态 ==========
  setLoading: (operation: string, isLoading: boolean) =>
    set((state) => ({
      loading: {
        ...state.loading,
        [operation]: isLoading,
      },
    })),

  setError: (operation: string, error: string | null) =>
    set((state) => ({
      errors: {
        ...state.errors,
        [operation]: error,
      },
    })),

  // ========== 通知 ==========
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) =>
    set((state) => ({
      notifications: [
        ...state.notifications,
        {
          ...notification,
          id: Date.now().toString(),
          timestamp: Date.now(),
          closableAt: notification.autoClose !== false ? Date.now() + 3000 : undefined,
        },
      ],
    })),

  removeNotification: (id: string) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  clearNotifications: () => set({ notifications: [] }),

  // ========== 重置 ==========
  reset: () => set(INITIAL_STATE),
}))

