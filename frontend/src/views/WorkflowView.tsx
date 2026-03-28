import React from 'react'
import { useAppStore } from '../store/useAppStore'
import { useWorkflow } from '../hooks/useWorkflow'
import { WorkflowStepper } from '../components/WorkflowStepper'
import { TopicInput } from '../components/WorkflowStages/TopicInput'
import { ContentEditor } from '../components/WorkflowStages/ContentEditor'
import { PreviewPanel } from '../components/WorkflowStages/PreviewPanel'
import { PublishFlow } from '../components/WorkflowStages/PublishFlow'
import type { ChannelType } from '../types/api'

export const WorkflowView: React.FC = () => {
  const { topic, setTopic, selectedChannels, toggleChannel, previews, publishTask } = useAppStore()
  const teamId = '00000000-0000-0000-0000-000000000001' // TODO: 从认证获取

  const {
    currentStage,
    goToStage,
    nextStage,
    previousStage,
    saveContent,
    loadPreviews,
    publishContent,
    savingContent,
    contentError,
    loadingPreviews,
    previewError,
    publishing,
    publishError,
  } = useWorkflow(teamId)

  const [title, setTitle] = React.useState('')
  const [summary, setSummary] = React.useState('')
  const [cta, setCta] = React.useState('')
  const [keywords, setKeywords] = React.useState<string[]>([])

  // 处理阶段1：话题输入
  const handleTopicNext = async () => {
    await loadPreviews('content-id-placeholder', 1, selectedChannels)
    nextStage()
  }

  // 处理阶段2：内容编辑完成
  const handleContentSave = async () => {
    await saveContent(title, summary, cta, keywords)
  }

  // 处理阶段3：发布
  const handlePublish = async (channel: ChannelType) => {
    await publishContent('content-id-placeholder', channel)
  }

  return (
    <>
      <WorkflowStepper currentStage={currentStage} onStageClick={goToStage} />

      <div className="bg-[#fafbfc] min-h-screen">
        {currentStage === 'topic' && (
          <TopicInput
            topic={topic}
            selectedChannels={selectedChannels}
            onTopicChange={setTopic}
            onChannelsChange={(channels) => {
              channels.forEach((channel) => {
                if (!selectedChannels.includes(channel)) {
                  toggleChannel(channel)
                }
              })
              selectedChannels.forEach((channel) => {
                if (!channels.includes(channel)) {
                  toggleChannel(channel)
                }
              })
            }}
            onNext={handleTopicNext}
            loading={loadingPreviews}
            error={previewError || undefined}
          />
        )}

        {currentStage === 'edit' && (
          <ContentEditor
            title={title}
            summary={summary}
            cta={cta}
            keywords={keywords}
            onTitleChange={setTitle}
            onSummaryChange={setSummary}
            onCtaChange={setCta}
            onKeywordsChange={setKeywords}
            onSave={handleContentSave}
            onBack={previousStage}
            saving={savingContent}
            error={contentError || undefined}
          />
        )}

        {currentStage === 'preview' && (
          <PreviewPanel
            previews={previews}
            selectedChannels={selectedChannels}
            onBack={previousStage}
            onPublish={handlePublish}
            loading={publishing}
            error={publishError || undefined}
          />
        )}

        {currentStage === 'publish' && (
          <PublishFlow
            publishTask={publishTask}
            onBack={() => goToStage('preview')}
            onRetry={() => publishTask && handlePublish('wechat_oa')}
            loading={publishing}
            error={publishError || undefined}
          />
        )}
      </div>
    </>
  )
}

