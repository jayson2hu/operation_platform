import React, { useState } from 'react'
import { Sparkles, MessageSquare, Image, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '../ui/Button'
import type { ChannelType } from '../../types/api'
import { clsx } from 'clsx'

interface TopicInputProps {
  topic: string
  selectedChannels: ChannelType[]
  onTopicChange: (topic: string) => void
  onChannelsChange: (channels: ChannelType[]) => void
  onNext: () => void
  loading?: boolean
  error?: string
}

const channels = [
  { id: 'wechat_oa' as ChannelType, name: 'WeChat Official', icon: MessageSquare, color: 'teal', bg: 'bg-teal-50' },
  { id: 'xiaohongshu' as ChannelType, name: 'Xiaohongshu', icon: Image, color: 'rose', bg: 'bg-rose-50' },
]

export const TopicInput: React.FC<TopicInputProps> = ({
  topic,
  selectedChannels,
  onTopicChange,
  onChannelsChange,
  onNext,
  loading = false,
  error,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false)

  const toggleChannel = (id: ChannelType) => {
    onChannelsChange(
      selectedChannels.includes(id) ? selectedChannels.filter((c) => c !== id) : [...selectedChannels, id]
    )
  }

  return (
    <div className="py-10 px-8 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Content Workflow</h2>
          <p className="text-gray-500 mt-1.5 font-medium">Tell us your topic, and we'll generate multi-channel content.</p>
        </div>
        <div className="flex items-center space-x-2 bg-indigo-50 px-4 py-2 rounded-full border border-indigo-100">
          <Sparkles className="text-indigo-600" size={16} />
          <span className="text-xs font-bold text-indigo-700">AI-Powered</span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 主配置卡片 */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-8 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-shadow">
            <div className="space-y-6">
              {/* 话题输入 */}
              <div>
                <label className="flex items-center space-x-2 text-sm font-bold text-gray-700 mb-3">
                  <span>Topic or Keywords</span>
                  {!topic && <AlertCircle size={14} className="text-amber-500" />}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => onTopicChange(e.target.value)}
                    placeholder="e.g., How AI is transforming content creation in 2026"
                    disabled={loading}
                    className="w-full bg-gray-50/50 border-2 border-gray-100 rounded-2xl px-5 py-4 text-gray-900 placeholder-gray-400 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none text-lg font-medium"
                  />
                  {topic && <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500" size={20} />}
                </div>
              </div>

              {/* 频道选择 */}
              <div>
                <label className="text-sm font-bold text-gray-700 block mb-4">Target Channels</label>
                <div className="grid grid-cols-2 gap-4">
                  {channels.map((channel) => (
                    <button
                      key={channel.id}
                      onClick={() => toggleChannel(channel.id)}
                      className={clsx(
                        'flex items-center space-x-4 p-5 rounded-2xl border-2 transition-all text-left group',
                        selectedChannels.includes(channel.id)
                          ? 'border-indigo-500 bg-indigo-50/30'
                          : 'border-gray-50 bg-gray-50/30 hover:border-gray-200'
                      )}
                    >
                      <div className={clsx('w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-active:scale-95', channel.bg)}>
                        <channel.icon className={clsx('text-' + channel.color + '-600')} size={24} />
                      </div>
                      <div>
                        <p className={clsx('font-bold text-sm', selectedChannels.includes(channel.id) ? 'text-indigo-900' : 'text-gray-700')}>
                          {channel.name}
                        </p>
                        <p className="text-xs text-gray-400 font-medium">Auto-optimize for platform</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 高级选项 */}
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                {showAdvanced ? '▼ Advanced Options' : '▶ Advanced Options'}
              </button>

              {/* 错误显示 */}
              {error && (
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-rose-800 text-sm">
                  <p className="font-bold">Error</p>
                  <p>{error}</p>
                </div>
              )}
            </div>

            {/* 启动按钮 */}
            <div className="mt-10">
              <Button
                variant={topic.trim() && !loading ? 'primary' : 'secondary'}
                size="lg"
                disabled={!topic.trim() || loading}
                loading={loading}
                icon={loading ? undefined : <Sparkles size={20} />}
                onClick={onNext}
                className="w-full"
              >
                {loading ? 'Processing...' : 'Generate Content'}
              </Button>
            </div>
          </div>
        </div>

        {/* 右侧信息面板 */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-3xl p-8 text-white shadow-xl shadow-indigo-100">
            <h3 className="font-bold text-lg mb-2">💡 Pro Tips</h3>
            <p className="text-indigo-100 text-sm leading-relaxed mb-4">
              Be specific with topics. Include target audience, tone, and key messages for better results.
            </p>
            <div className="h-1 w-12 bg-indigo-400 rounded-full" />
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4">System Status</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500 font-medium">API Connection</span>
                <span className="text-emerald-500 font-bold">Online</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 font-medium">AI Models</span>
                <span className="text-emerald-500 font-bold">Ready</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 font-medium">Channels</span>
                <span className="text-emerald-500 font-bold">{selectedChannels.length}/2</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
