import React from 'react'
import { CheckCircle2, Circle } from 'lucide-react'
import { clsx } from 'clsx'

export type Stage = 'topic' | 'edit' | 'preview' | 'publish'

interface WorkflowStepperProps {
  currentStage: Stage
  onStageClick: (stage: Stage) => void
}

const stages: { id: Stage; label: string; color: string }[] = [
  { id: 'topic', label: '话题输入', color: 'indigo' },
  { id: 'edit', label: '内容编辑', color: 'teal' },
  { id: 'preview', label: '预览验证', color: 'rose' },
  { id: 'publish', label: '发布上线', color: 'emerald' },
]

export const WorkflowStepper: React.FC<WorkflowStepperProps> = ({ currentStage, onStageClick }) => {
  const currentIndex = stages.findIndex((s) => s.id === currentStage)

  return (
    <div className="py-6 px-8 bg-white border-b border-gray-100">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          {stages.map((stage, index) => {
            const isCompleted = index < currentIndex
            const isCurrent = stage.id === currentStage
            const canClick = index <= currentIndex + 1

            return (
              <React.Fragment key={stage.id}>
                {/* 步骤圆圈 */}
                <button
                  onClick={() => canClick && onStageClick(stage.id)}
                  disabled={!canClick}
                  className={clsx(
                    'flex-shrink-0 w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all',
                    isCompleted && 'bg-emerald-100 border-emerald-500',
                    isCurrent && `bg-${stage.color}-50 border-${stage.color}-500 ring-4 ring-${stage.color}-200`,
                    !isCompleted && !isCurrent && 'bg-gray-50 border-gray-200',
                    canClick && !isCurrent && 'cursor-pointer hover:border-gray-300',
                    !canClick && 'cursor-not-allowed opacity-50'
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  ) : (
                    <span className={clsx('font-bold text-sm', isCurrent ? `text-${stage.color}-700` : 'text-gray-500')}>
                      {index + 1}
                    </span>
                  )}
                </button>

                {/* 连接线 */}
                {index < stages.length - 1 && (
                  <div
                    className={clsx(
                      'flex-1 h-1 mx-4 rounded-full transition-all',
                      index < currentIndex ? 'bg-emerald-500' : 'bg-gray-200'
                    )}
                  />
                )}
              </React.Fragment>
            )
          })}
        </div>

        {/* 步骤标签 */}
        <div className="flex justify-between mt-4 text-xs font-bold text-gray-600">
          {stages.map((stage) => (
            <span key={stage.id} className="flex-1 text-center">
              {stage.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
