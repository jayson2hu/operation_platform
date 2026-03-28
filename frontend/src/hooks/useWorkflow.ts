import { useState, useCallback } from 'react'
import { useAppStore } from '../store/useAppStore'
import { apiClient } from '../services/apiClient'
import { ChannelType } from '../types/api'

export type WorkflowStage = 'topic' | 'edit' | 'preview' | 'publish'

interface UseWorkflowReturn {
  currentStage: WorkflowStage
  goToStage: (stage: WorkflowStage) => void
  nextStage: () => void
  previousStage: () => void

  // 内容操作
  saveContent: (title: string, summary: string, cta: string, keywords: string[]) => Promise<void>
  loadContent: (id: string) => Promise<void>
  savingContent: boolean
  contentError: string | null

  // 预览操作
  loadPreviews: (contentId: string, versionNo: number, channels: ChannelType[]) => Promise<void>
  loadingPreviews: boolean
  previewError: string | null

  // 发布操作
  publishContent: (contentId: string, channelType: ChannelType) => Promise<void>
  publishing: boolean
  publishError: string | null
}

export const useWorkflow = (teamId: string): UseWorkflowReturn => {
  const [currentStage, setCurrentStage] = useState<WorkflowStage>('topic')
  const [savingContent, setSavingContent] = useState(false)
  const [contentError, setContentError] = useState<string | null>(null)
  const [loadingPreviews, setLoadingPreviews] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [publishing, setPublishing] = useState(false)
  const [publishError, setPublishError] = useState<string | null>(null)

  const {
    currentContent,
    setCurrentContent,
    currentVersion,
    setCurrentVersion,
    setPreview,
    setPublishTask,
    addNotification,
  } = useAppStore()

  const stages: WorkflowStage[] = ['topic', 'edit', 'preview', 'publish']
  const currentStageIndex = stages.indexOf(currentStage)

  const goToStage = useCallback((stage: WorkflowStage) => {
    if (stages.indexOf(stage) <= currentStageIndex + 1) {
      setCurrentStage(stage)
    }
  }, [currentStageIndex])

  const nextStage = useCallback(() => {
    if (currentStageIndex < stages.length - 1) {
      setCurrentStage(stages[currentStageIndex + 1])
    }
  }, [currentStageIndex])

  const previousStage = useCallback(() => {
    if (currentStageIndex > 0) {
      setCurrentStage(stages[currentStageIndex - 1])
    }
  }, [currentStageIndex])

  const saveContent = useCallback(
    async (title: string, summary: string, cta: string, keywords: string[]) => {
      setSavingContent(true)
      setContentError(null)
      try {
        if (!currentContent) {
          // 创建新内容
          const content = await apiClient.content.create({
            team_id: teamId,
            source_title: title,
            source_summary: summary,
            source_cta: cta,
            keyword_set: keywords,
          })
          setCurrentContent(content)

          // 创建版本
          const version = await apiClient.content.createVersion(content.id, {
            source_payload: {
              source_title: title,
              source_summary: summary,
              source_cta: cta,
              keyword_set: keywords,
            },
          })
          setCurrentVersion(version)

          addNotification({
            type: 'success',
            message: '✓ 内容已创建并保存为版本 ' + version.version_no,
          })
        } else {
          // 修订版本
          const version = await apiClient.content.reviseVersion(
            currentContent.id,
            currentVersion?.version_no || 1,
            {
              source_title: title,
              source_summary: summary,
              source_cta: cta,
              keyword_set: keywords,
            }
          )
          setCurrentVersion(version)

          addNotification({
            type: 'success',
            message: '✓ 内容已更新为版本 ' + version.version_no,
          })
        }

        nextStage()
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to save content'
        setContentError(message)
        addNotification({
          type: 'error',
          message: '✗ ' + message,
        })
      } finally {
        setSavingContent(false)
      }
    },
    [currentContent, currentVersion, teamId, setCurrentContent, setCurrentVersion, addNotification, nextStage]
  )

  const loadContent = useCallback(
    async (id: string) => {
      setSavingContent(true)
      try {
        // 这里可以加载特定的content和version
        addNotification({
          type: 'info',
          message: 'Content loading...',
        })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load content'
        setContentError(message)
      } finally {
        setSavingContent(false)
      }
    },
    [addNotification]
  )

  const loadPreviews = useCallback(
    async (contentId: string, versionNo: number, channels: ChannelType[]) => {
      setLoadingPreviews(true)
      setPreviewError(null)
      try {
        for (const channel of channels) {
          const preview = await apiClient.preview.getPreview(contentId, versionNo, channel)
          setPreview(channel, preview)
        }
        addNotification({
          type: 'success',
          message: '✓ 预览已加载',
        })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load previews'
        setPreviewError(message)
        addNotification({
          type: 'error',
          message: '✗ ' + message,
        })
      } finally {
        setLoadingPreviews(false)
      }
    },
    [setPreview, addNotification]
  )

  const publishContent = useCallback(
    async (contentId: string, channelType: ChannelType) => {
      setPublishing(true)
      setPublishError(null)
      try {
        if (!currentVersion) throw new Error('No version selected')

        const result = await apiClient.publishing.createPublishTask({
          team_id: teamId,
          content_id: contentId,
          channel_account_id: 'default-account', // TODO: 从UI获取
          channel_type: channelType,
          adaptation_payload: {
            title: currentVersion.source_payload.source_title,
            body: currentVersion.source_payload.source_summary,
            structured_payload: {},
          },
          account_context: {},
        })

        setPublishTask(result)
        addNotification({
          type: 'success',
          message: '✓ 发布请求已提交',
        })
        nextStage()
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to publish'
        setPublishError(message)
        addNotification({
          type: 'error',
          message: '✗ ' + message,
        })
      } finally {
        setPublishing(false)
      }
    },
    [currentVersion, teamId, setPublishTask, addNotification, nextStage]
  )

  return {
    currentStage,
    goToStage,
    nextStage,
    previousStage,
    saveContent,
    loadContent,
    savingContent,
    contentError,
    loadPreviews,
    loadingPreviews,
    previewError,
    publishContent,
    publishing,
    publishError,
  }
}
