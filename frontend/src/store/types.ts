import {
  Content,
  ContentVersion,
  PreviewResult,
  PublishTaskRead,
  PublishLog,
  ChannelType,
  ValidationResult,
} from '../types/api'

// 通知类型
export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  timestamp: number
  autoClose?: boolean
  closableAt?: number // 可关闭的时间戳
}

// 工作流状态
export interface WorkflowState {
  // 当前内容
  currentContent: Content | null
  allContents: Content[]

  // 当前版本
  currentVersion: ContentVersion | null
  allVersions: ContentVersion[]

  // 预览状态
  previews: Record<ChannelType, PreviewResult | null>
  selectedChannels: ChannelType[]

  // 发布状态
  publishTask: PublishTaskRead | null
  publishLogs: PublishLog[]
}

// 完整的App Store状态
export interface AppStoreState extends WorkflowState {
  // 导航
  activeTab: string
  setActiveTab: (tab: string) => void

  // 工作流
  topic: string
  setTopic: (topic: string) => void

  isGenerating: boolean
  setIsGenerating: (isGenerating: boolean) => void

  // 内容管理
  setCurrentContent: (content: Content | null) => void
  setAllContents: (contents: Content[]) => void

  // 版本管理
  setCurrentVersion: (version: ContentVersion | null) => void
  setAllVersions: (versions: ContentVersion[]) => void

  // 预览
  setPreview: (channel: ChannelType, preview: PreviewResult | null) => void
  setSelectedChannels: (channels: ChannelType[]) => void
  toggleChannel: (channel: ChannelType) => void

  // 发布
  setPublishTask: (task: PublishTaskRead | null) => void
  addPublishLog: (log: PublishLog) => void
  clearPublishLogs: () => void

  // UI状态
  loading: Record<string, boolean>
  setLoading: (operation: string, isLoading: boolean) => void

  errors: Record<string, string | null>
  setError: (operation: string, error: string | null) => void

  notifications: Notification[]
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void
  removeNotification: (id: string) => void
  clearNotifications: () => void

  // 重置
  reset: () => void
}
