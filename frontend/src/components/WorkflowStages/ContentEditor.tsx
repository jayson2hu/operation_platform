import React, { useState } from 'react'
import { Save, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { Button } from '../ui/Button'

interface ContentEditorProps {
  title: string
  summary: string
  cta: string
  keywords: string[]
  onTitleChange: (title: string) => void
  onSummaryChange: (summary: string) => void
  onCtaChange: (cta: string) => void
  onKeywordsChange: (keywords: string[]) => void
  onSave: () => void
  onBack: () => void
  saving?: boolean
  error?: string
}

export const ContentEditor: React.FC<ContentEditorProps> = ({
  title,
  summary,
  cta,
  keywords,
  onTitleChange,
  onSummaryChange,
  onCtaChange,
  onKeywordsChange,
  onSave,
  onBack,
  saving = false,
  error,
}) => {
  const [newKeyword, setNewKeyword] = useState('')

  const addKeyword = () => {
    if (newKeyword.trim() && !keywords.includes(newKeyword.trim())) {
      onKeywordsChange([...keywords, newKeyword.trim()])
      setNewKeyword('')
    }
  }

  const removeKeyword = (keyword: string) => {
    onKeywordsChange(keywords.filter((k) => k !== keyword))
  }

  return (
    <div className="py-10 px-8 space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 左侧编辑面板 */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 space-y-6">
            <h3 className="text-xl font-bold text-gray-900">Edit Content</h3>

            {/* 标题 */}
            <div>
              <label className="text-sm font-bold text-gray-700 block mb-2">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => onTitleChange(e.target.value)}
                placeholder="Enter article title..."
                className="w-full bg-gray-50/50 border-2 border-gray-100 rounded-2xl px-4 py-3 text-gray-900 focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all outline-none font-medium"
              />
            </div>

            {/* 摘要 */}
            <div>
              <label className="text-sm font-bold text-gray-700 block mb-2">Summary</label>
              <textarea
                value={summary}
                onChange={(e) => onSummaryChange(e.target.value)}
                placeholder="Write a compelling summary..."
                rows={5}
                className="w-full bg-gray-50/50 border-2 border-gray-100 rounded-2xl px-4 py-3 text-gray-900 focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all outline-none font-medium resize-none"
              />
              <p className="text-xs text-gray-500 mt-2">
                {summary.length} characters • Ideal: 100-150
              </p>
            </div>

            {/* CTA */}
            <div>
              <label className="text-sm font-bold text-gray-700 block mb-2">Call to Action</label>
              <input
                type="text"
                value={cta}
                onChange={(e) => onCtaChange(e.target.value)}
                placeholder="e.g., 'Learn more', 'Subscribe now'..."
                className="w-full bg-gray-50/50 border-2 border-gray-100 rounded-2xl px-4 py-3 text-gray-900 focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all outline-none font-medium"
              />
            </div>

            {/* 关键词 */}
            <div>
              <label className="text-sm font-bold text-gray-700 block mb-2">Keywords</label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
                  placeholder="Add keyword..."
                  className="flex-1 bg-gray-50/50 border-2 border-gray-100 rounded-2xl px-4 py-3 text-gray-900 focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all outline-none font-medium text-sm"
                />
                <Button variant="secondary" size="md" onClick={addKeyword}>
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {keywords.map((keyword) => (
                  <div key={keyword} className="flex items-center gap-2 bg-teal-50 border border-teal-200 rounded-full px-3 py-2 text-sm">
                    <span className="text-teal-700 font-medium">{keyword}</span>
                    <button
                      onClick={() => removeKeyword(keyword)}
                      className="text-teal-500 hover:text-teal-700 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* 错误 */}
            {error && (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-rose-800 text-sm">
                <p>{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* 右侧版本历史 */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sticky top-8">
            <h3 className="font-bold text-gray-900 mb-4">Version History</h3>
            <div className="space-y-3 text-sm max-h-96 overflow-y-auto">
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3">
                <p className="font-semibold text-indigo-900">Version 1</p>
                <p className="text-indigo-600 text-xs mt-1">Current • Just now</p>
                <div className="flex gap-2 mt-2">
                  <button className="text-xs px-2 py-1 rounded bg-indigo-200 text-indigo-700 hover:bg-indigo-300 transition-colors">
                    Compare
                  </button>
                  <button className="text-xs px-2 py-1 rounded bg-indigo-200 text-indigo-700 hover:bg-indigo-300 transition-colors">
                    Restore
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 底部操作 */}
      <div className="flex gap-3 justify-end sticky bottom-0 bg-white/95 backdrop-blur-sm py-4 px-8 -mx-8 border-t border-gray-100">
        <Button variant="outline" onClick={onBack} disabled={saving}>
          <ChevronLeft size={18} className="mr-1" />
          Back
        </Button>
        <Button variant="primary" onClick={onSave} loading={saving} icon={saving ? undefined : <Save size={18} />}>
          {saving ? 'Saving...' : 'Save & Continue'}
        </Button>
      </div>
    </div>
  )
}
