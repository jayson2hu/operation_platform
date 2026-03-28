import React, { useState } from 'react'
import { CheckCircle2, AlertCircle, Copy, ExternalLink, ChevronLeft } from 'lucide-react'
import { Button } from '../ui/Button'
import type { PublishTaskRead } from '../../types/api'
import { clsx } from 'clsx'

interface PublishFlowProps {
  publishTask: PublishTaskRead | null
  onBack: () => void
  onRetry: () => void
  loading?: boolean
  error?: string
}

export const PublishFlow: React.FC<PublishFlowProps> = ({
  publishTask,
  onBack,
  onRetry,
  loading = false,
  error,
}) => {
  const [showManualMode, setShowManualMode] = useState(false)
  const [copied, setCopied] = useState(false)

  const isSuccess = publishTask?.status === 'succeeded'
  const isFailed = publishTask?.status === 'failed'
  const isPublishing = publishTask?.status === 'publishing'
  const isPending = publishTask?.status === 'pending'

  const copyUrl = () => {
    if (publishTask?.live_url) {
      navigator.clipboard.writeText(publishTask.live_url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="py-10 px-8 space-y-8 animate-in fade-in duration-500">
      <h2 className="text-3xl font-bold text-gray-900">Publish to Channels</h2>

      <div className="max-w-2xl mx-auto space-y-8">
        {/* 发布方式选择 */}
        {!publishTask && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 space-y-6">
            <h3 className="text-xl font-bold text-gray-900">Choose Publishing Mode</h3>

            {/* 自动发布 */}
            <div className="border-2 border-emerald-200 bg-emerald-50/30 rounded-2xl p-6 cursor-pointer transition-all hover:border-emerald-400">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="text-emerald-600" size={24} />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-emerald-900 mb-1">Automatic Publishing</h4>
                  <p className="text-emerald-700 text-sm">Publish directly via API. Instant and seamless.</p>
                </div>
              </div>
              <Button variant="success" size="md" loading={loading} className="mt-4 w-full">
                {loading ? 'Publishing...' : 'Publish Now'}
              </Button>
            </div>

            {/* 手动发布 */}
            <div className="border-2 border-amber-200 bg-amber-50/30 rounded-2xl p-6 cursor-pointer transition-all hover:border-amber-400">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="text-amber-600" size={24} />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-amber-900 mb-1">Manual Publishing</h4>
                  <p className="text-amber-700 text-sm">Copy content and publish yourself on platforms.</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="md"
                onClick={() => setShowManualMode(!showManualMode)}
                className="mt-4 w-full"
              >
                {showManualMode ? 'Hide' : 'Use Manual Mode'}
              </Button>
            </div>
          </div>
        )}

        {/* 发布状态 */}
        {publishTask && (
          <div className="space-y-6">
            {/* 状态卡片 */}
            <div
              className={clsx(
                'rounded-3xl p-8 border-2',
                isSuccess && 'bg-emerald-50 border-emerald-200',
                isFailed && 'bg-rose-50 border-rose-200',
                (isPending || isPublishing) && 'bg-sky-50 border-sky-200'
              )}
            >
              <div className="flex items-start gap-4">
                <div
                  className={clsx(
                    'w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0',
                    isSuccess && 'bg-emerald-100',
                    isFailed && 'bg-rose-100',
                    (isPending || isPublishing) && 'bg-sky-100'
                  )}
                >
                  {isSuccess && <CheckCircle2 className="text-emerald-600" size={32} />}
                  {isFailed && <AlertCircle className="text-rose-600" size={32} />}
                  {(isPending || isPublishing) && (
                    <div className="w-8 h-8 border-4 border-sky-200 border-t-sky-600 rounded-full animate-spin" />
                  )}
                </div>

                <div className="flex-1">
                  <h3
                    className={clsx(
                      'text-2xl font-bold mb-2',
                      isSuccess && 'text-emerald-900',
                      isFailed && 'text-rose-900',
                      (isPending || isPublishing) && 'text-sky-900'
                    )}
                  >
                    {isSuccess && '🎉 Published Successfully!'}
                    {isFailed && '❌ Publishing Failed'}
                    {isPending && 'Preparing to publish...'}
                    {isPublishing && 'Publishing in progress...'}
                  </h3>
                  <p
                    className={clsx(
                      'text-sm',
                      isSuccess && 'text-emerald-700',
                      isFailed && 'text-rose-700',
                      (isPending || isPublishing) && 'text-sky-700'
                    )}
                  >
                    {isSuccess && `Attempt #${publishTask.attempt_no} • Article is now live on ${publishTask.external_post_id}`}
                    {isFailed && `Attempt #${publishTask.attempt_no} • ${publishTask.error_message || 'Unknown error'}`}
                    {(isPending || isPublishing) && 'We are processing your content...'}
                  </p>
                </div>
              </div>

              {/* 成功后的详情 */}
              {isSuccess && publishTask.live_url && (
                <div className="mt-6 pt-6 border-t border-emerald-200 space-y-4">
                  <div>
                    <p className="text-xs font-bold text-emerald-700 uppercase mb-2">Live URL</p>
                    <div className="flex gap-2 items-center">
                      <div className="flex-1 bg-white rounded-lg px-4 py-3 text-sm text-gray-600 truncate border border-emerald-200">
                        {publishTask.live_url}
                      </div>
                      <button
                        onClick={copyUrl}
                        className={clsx(
                          'p-3 rounded-lg transition-all',
                          copied ? 'bg-emerald-200 text-emerald-700' : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'
                        )}
                      >
                        <Copy size={18} />
                      </button>
                      <a
                        href={publishTask.live_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 rounded-lg bg-emerald-100 text-emerald-600 hover:bg-emerald-200 transition-all"
                      >
                        <ExternalLink size={18} />
                      </a>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-4 border border-emerald-200 text-sm text-emerald-700">
                    <p className="font-semibold mb-2">✓ Content Successfully Published</p>
                    <p className="text-emerald-600 text-xs">Post ID: {publishTask.external_post_id}</p>
                  </div>
                </div>
              )}

              {/* 失败后的操作 */}
              {isFailed && (
                <div className="mt-6 pt-6 border-t border-rose-200">
                  <p className="text-sm text-rose-700 mb-4">You can try again or edit the content and retry.</p>
                  <div className="flex gap-2">
                    <Button variant="danger" size="md" onClick={onRetry} className="flex-1">
                      Retry Publishing
                    </Button>
                    <Button variant="outline" size="md" onClick={onBack} className="flex-1">
                      Back to Edit
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* 发布日志 */}
            {publishTask && (
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-bold text-gray-900 mb-4">Publish Attempt #{publishTask.attempt_no}</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between pb-3 border-b border-gray-200">
                    <span className="text-gray-600">Status</span>
                    <span className="font-bold text-gray-900">{publishTask.status}</span>
                  </div>
                  {publishTask.external_post_id && (
                    <div className="flex justify-between pb-3 border-b border-gray-200">
                      <span className="text-gray-600">Post ID</span>
                      <span className="font-mono text-gray-900">{publishTask.external_post_id}</span>
                    </div>
                  )}
                  {publishTask.error_message && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Error</span>
                      <span className="text-rose-600 font-semibold">{publishTask.error_message}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex gap-3 justify-center pt-6">
              <Button variant="outline" onClick={onBack} disabled={loading} className="px-6">
                <ChevronLeft size={16} className="mr-1" />
                Back
              </Button>
            </div>
          </div>
        )}

        {/* 错误提示 */}
        {error && (
          <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-4 text-rose-800">
            <p className="font-bold">Error</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}
      </div>
    </div>
  )
}
