// API Types - 定义所有后端接口的请求和响应类型

// Content 相关
export interface Content {
  id: string
  team_id: string
  status: 'draft' | 'published'
  objective?: string
  audience?: string
  campaign_name?: string
  source_title: string
  source_summary?: string
  source_cta?: string
  keyword_set: string[]
  created_by?: string
  created_at?: string
  updated_at?: string
}

export interface ContentCreate {
  team_id: string
  source_title: string
  source_summary?: string
  source_cta?: string
  keyword_set?: string[]
  objective?: string
  audience?: string
  campaign_name?: string
  created_by?: string
}

export interface ContentVersion {
  id: string
  content_id: string
  version_no: number
  source_payload: Record<string, any>
  created_by?: string
  created_at?: string
}

export interface ContentVersionCreate {
  source_payload: Record<string, any>
  created_by?: string
}

export interface ContentVersionReviseRequest {
  source_title?: string
  source_summary?: string
  source_cta?: string
  keyword_set?: string[]
  source_payload_patch?: Record<string, any>
  created_by?: string
}

// Preview 相关
export type ChannelType = 'wechat_oa' | 'xiaohongshu'

export interface ValidationResult {
  status: 'valid' | 'warning' | 'blocked'
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

export interface ValidationError {
  code: string
  field: string
  level: 'blocked' | 'warning'
  message: string
}

export interface ValidationWarning {
  code: string
  field: string
  level: 'warning'
  message: string
}

export interface PreviewResult {
  content_id: string
  version_no: number
  channel_type: ChannelType
  rendered_preview: {
    channel_type: ChannelType
    title: string
    body: string
    structured_payload: Record<string, any>
  }
  copy_payload: Record<string, any>
  validation: ValidationResult
}

export interface CopyPackResult {
  content_id: string
  version_no: number
  channel_type: ChannelType
  copy_payload: Record<string, any>
  validation: ValidationResult
}

export interface ApprovalPackResult {
  content_id: string
  version_no: number
  channel_type: ChannelType
  approval_state: 'pending' | 'approved' | 'rejected' | 'ready' | 'needs_review' | 'blocked' | 'stale'
  is_latest_version: boolean
  snapshot_hash: string
  rendered_preview: {
    channel_type: ChannelType
    title: string
    body: string
    structured_payload: Record<string, any>
  }
  copy_payload: Record<string, any>
  validation: ValidationResult
}

// Publishing 相关
export interface PublishTask {
  id: string
  team_id: string
  content_id: string
  adaptation_id: string
  channel_account_id: string
  task_type: 'auto' | 'scheduled' | 'manual'
  scheduled_at?: string
  status: 'pending' | 'publishing' | 'succeeded' | 'failed'
  retry_count: number
  last_error?: string
  created_by?: string
  created_at?: string
  updated_at?: string
}

export interface PublishTaskCreate {
  team_id: string
  content_id: string
  channel_account_id: string
  channel_type: ChannelType
  adaptation_payload: Record<string, any>
  account_context?: Record<string, any>
  scheduled_at?: string
}

export interface PublishTaskRead {
  publish_task_id: string
  status: string
  attempt_no: number
  publish_log_id: string
  external_post_id?: string
  live_url?: string
  error_message?: string
}

export interface PublishLog {
  id: string
  publish_task_id: string
  attempt_no: number
  request_payload: Record<string, any>
  response_payload: Record<string, any>
  external_post_id?: string
  status: 'published' | 'failed'
  error_message?: string
  created_at?: string
}

export interface ManualPublishRecordCreate {
  status: 'published' | 'failed'
  live_url?: string
  external_post_id?: string
  operator_name?: string
  note?: string
  response_payload?: Record<string, any>
}

export interface ManualPublishRecordRead {
  publish_log_id: string
  publish_task_id: string
  attempt_no: number
  status: 'published' | 'failed'
  task_status: 'succeeded' | 'failed'
  live_url?: string
  external_post_id?: string
  operator_name?: string
  note?: string
}

// API Error
export interface ApiError {
  detail: string
  status?: number
}
