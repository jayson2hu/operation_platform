import React, { useState } from 'react'
import { Copy, CheckCircle2, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '../ui/Button'
import type { ChannelType, PreviewResult, ValidationResult } from '../../types/api'
import { clsx } from 'clsx'

interface PreviewPanelProps {
  previews: Record<ChannelType, PreviewResult | null>
  selectedChannels: ChannelType[]
  onBack: () => void
  onPublish: (channel: ChannelType) => void
  loading?: boolean
  error?: string
}

const channels = [
  { id: 'wechat_oa' as ChannelType, name: 'WeChat Official' },
  { id: 'xiaohongshu' as ChannelType, name: 'Xiaohongshu' },
]

export const PreviewPanel: React.FC<PreviewPanelProps> = ({
  previews,
  selectedChannels,
  onBack,
  onPublish,
  loading = false,
  error,
}) => {
  const [activeChannel, setActiveChannel] = useState<ChannelType>(selectedChannels[0] || 'wechat_oa')
  const [copied, setCopied] = useState(false)

  const currentPreview = previews[activeChannel]
  const validation = currentPreview?.validation

  const copyToClipboard = () => {
    if (currentPreview?.copy_payload) {
      const text = JSON.stringify(currentPreview.copy_payload, null, 2)
      navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const isBlocked = validation?.status === 'blocked'
  const hasWarnings = validation?.status === 'warning'
  const isValid = validation?.status === 'valid'

  return (
    <div className="py-10 px-8 space-y-8 animate-in fade-in duration-500">
      {/* 频道选择 */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
        <div className="flex gap-2 overflow-x-auto">
          {channels.map((channel) => (
            <button
              key={channel.id}
              onClick={() => setActiveChannel(channel.id)}
              className={clsx(
                'px-4 py-2 rounded-xl font-semibold text-sm transition-all whitespace-nowrap',
                activeChannel === channel.id
                  ? 'bg-rose-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
            >
              {channel.name}
              {validation && (
                <span className={clsx('ml-2',
                  isValid ? 'text-emerald-400' :
                  hasWarnings ? 'text-amber-400' :
                  'text-rose-400'
                )}>
                  {isValid ? '✓' : hasWarnings ? '⚠' : '✕'}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 中间预览区域 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 预览窗口 */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Live Preview</h3>

            {currentPreview ? (
              <div className="space-y-6">
                {/* 标题 */}
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase mb-2">Title</p>
                  <h4 className="text-2xl font-bold text-gray-900">{currentPreview.rendered_preview.title}</h4>
                </div>

                {/* 正文预览 - 根据渠道类型渲染 */}
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase mb-2">Content</p>
                  {activeChannel === 'wechat_oa' ? (
                    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                      <div className="bg-white rounded-xl p-4 shadow-sm">
                        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                          {currentPreview.rendered_preview.body}
                        </p>
                        {currentPreview.rendered_preview.structured_payload?.digest && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <p className="text-xs text-gray-500 font-semibold mb-2">Digest</p>
                            <p className="text-sm text-gray-600">
                              {currentPreview.rendered_preview.structured_payload.digest}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-rose-50 rounded-2xl p-6 border border-rose-200">
                      <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                        {currentPreview.rendered_preview.body}
                      </p>
                      {currentPreview.rendered_preview.structured_payload?.hashtags && (
                        <div className="mt-4 pt-4 border-t border-rose-200 flex flex-wrap gap-2">
                          {currentPreview.rendered_preview.structured_payload.hashtags.map((tag: string) => (
                            <span key={tag} className="bg-rose-100 text-rose-700 px-3 py-1 rounded-full text-xs font-semibold">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Copy文本 */}
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase mb-2">Copy Text</p>
                  <div className="relative bg-gray-50 rounded-2xl p-4 border border-gray-200">
                    <pre className="text-xs text-gray-600 whitespace-pre-wrap break-words overflow-x-auto max-h-48">
                      {JSON.stringify(currentPreview.copy_payload, null, 2)}
                    </pre>
                    <button
                      onClick={copyToClipboard}
                      className={clsx(
                        'absolute top-3 right-3 p-2 rounded-lg transition-all',
                        copied ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      )}
                    >
                      {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>

                {/* 错误提示 */}
                {error && (
                  <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-rose-800 text-sm">
                    <p className="font-bold">Error</p>
                    <p>{error}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p>Loading preview...</p>
              </div>
            )}
          </div>
        </div>

        {/* 右侧验证面板 */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sticky top-8 space-y-6">
            {/* 状态指示 */}
            <div>
              <h3 className="font-bold text-gray-900 mb-3">Validation Status</h3>
              <div className={clsx(
                'rounded-2xl p-4 flex items-center gap-3',
                isValid && 'bg-emerald-50 border border-emerald-200',
                hasWarnings && 'bg-amber-50 border border-amber-200',
                isBlocked && 'bg-rose-50 border border-rose-200'
              )}>
                {isValid && <CheckCircle2 className="text-emerald-600" size={20} />}
                {hasWarnings && <AlertCircle className="text-amber-600" size={20} />}
                {isBlocked && <AlertCircle className="text-rose-600" size={20} />}
                <span className={clsx(
                  'font-bold',
                  isValid && 'text-emerald-700',
                  hasWarnings && 'text-amber-700',
                  isBlocked && 'text-rose-700'
                )}>
                  {isValid && 'Ready to Publish'}
                  {hasWarnings && 'Review Warnings'}
                  {isBlocked && 'Fix Errors'}
                </span>
              </div>
            </div>

            {/* 错误列表 */}
            {validation?.errors && validation.errors.length > 0 && (
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase mb-2">Errors ({validation.errors.length})</p>
                <div className="space-y-2">
                  {validation.errors.map((err, idx) => (
                    <div key={idx} className="bg-rose-50 border border-rose-200 rounded-lg p-2 text-xs text-rose-700">
                      <p className="font-semibold">{err.code}</p>
                      <p className="text-rose-600 text-xs">{err.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 警告列表 */}
            {validation?.warnings && validation.warnings.length > 0 && (
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase mb-2">Warnings ({validation.warnings.length})</p>
                <div className="space-y-2">
                  {validation.warnings.map((warn, idx) => (
                    <div key={idx} className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-xs text-amber-700">
                      <p className="font-semibold">{warn.code}</p>
                      <p className="text-amber-600 text-xs">{warn.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 操作按钮 */}
            <div className="space-y-2 pt-4 border-t border-gray-200">
              <Button
                variant="primary"
                size="md"
                disabled={isBlocked || loading}
                loading={loading}
                onClick={() => onPublish(activeChannel)}
                className="w-full"
              >
                Publish Now
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={onBack}
                disabled={loading}
                className="w-full"
              >
                <ChevronLeft size={16} className="mr-1" />
                Back
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
