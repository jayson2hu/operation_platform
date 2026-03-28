import { axiosInstance, retryRequest } from './api'
import {
  Content,
  ContentCreate,
  ContentVersion,
  ContentVersionCreate,
  ContentVersionReviseRequest,
  PreviewResult,
  CopyPackResult,
  ApprovalPackResult,
  PublishTaskCreate,
  PublishTaskRead,
  ManualPublishRecordCreate,
  ManualPublishRecordRead,
  ChannelType,
} from '../types/api'

// ========== Content API ==========

export const contentAPI = {
  /**
   * 创建新内容
   */
  create: async (payload: ContentCreate): Promise<Content> => {
    const { data } = await axiosInstance.post<Content>('/contents', payload)
    return data
  },

  /**
   * 列出所有内容
   */
  list: async (teamId?: string): Promise<Content[]> => {
    const { data } = await axiosInstance.get<Content[]>('/contents', {
      params: teamId ? { team_id: teamId } : {},
    })
    return data
  },

  /**
   * 创建内容版本
   */
  createVersion: async (contentId: string, payload: ContentVersionCreate): Promise<ContentVersion> => {
    const { data } = await axiosInstance.post<ContentVersion>(
      `/contents/${contentId}/versions`,
      payload
    )
    return data
  },

  /**
   * 列出内容的所有版本
   */
  listVersions: async (contentId: string): Promise<ContentVersion[]> => {
    const { data } = await axiosInstance.get<ContentVersion[]>(
      `/contents/${contentId}/versions`
    )
    return data
  },

  /**
   * 修订内容版本
   */
  reviseVersion: async (
    contentId: string,
    baseVersionNo: number,
    payload: ContentVersionReviseRequest
  ): Promise<ContentVersion> => {
    const { data } = await axiosInstance.post<ContentVersion>(
      `/contents/${contentId}/versions/${baseVersionNo}/revise`,
      payload
    )
    return data
  },
}

// ========== Preview API ==========

export const previewAPI = {
  /**
   * 获取内容版本预览
   */
  getPreview: async (
    contentId: string,
    versionNo: number,
    channelType: ChannelType
  ): Promise<PreviewResult> => {
    const { data } = await axiosInstance.get<PreviewResult>(
      `/contents/${contentId}/versions/${versionNo}/preview`,
      {
        params: { channel_type: channelType },
      }
    )
    return data
  },

  /**
   * 获取Copy Pack（复制用）
   */
  getCopyPack: async (
    contentId: string,
    versionNo: number,
    channelType: ChannelType
  ): Promise<CopyPackResult> => {
    const { data } = await axiosInstance.get<CopyPackResult>(
      `/contents/${contentId}/versions/${versionNo}/copy-pack`,
      {
        params: { channel_type: channelType },
      }
    )
    return data
  },

  /**
   * 获取Approval Pack（审批用）
   */
  getApprovalPack: async (
    contentId: string,
    versionNo: number,
    channelType: ChannelType
  ): Promise<ApprovalPackResult> => {
    const { data } = await axiosInstance.get<ApprovalPackResult>(
      `/contents/${contentId}/versions/${versionNo}/approval-pack`,
      {
        params: { channel_type: channelType },
      }
    )
    return data
  },
}

// ========== Publishing API ==========

export const publishingAPI = {
  /**
   * 创建并执行发布任务（自动发布）
   */
  createPublishTask: async (payload: PublishTaskCreate): Promise<PublishTaskRead> => {
    const { data } = await axiosInstance.post<PublishTaskRead>('/publish-tasks', payload)
    return data
  },

  /**
   * 手动完成发布记录
   */
  manualCompletePublish: async (
    taskId: string,
    payload: ManualPublishRecordCreate
  ): Promise<ManualPublishRecordRead> => {
    const { data } = await axiosInstance.post<ManualPublishRecordRead>(
      `/publish-tasks/${taskId}/manual-complete`,
      payload
    )
    return data
  },
}

// ========== 导出所有API ==========
export const apiClient = {
  content: contentAPI,
  preview: previewAPI,
  publishing: publishingAPI,
}

export default apiClient
