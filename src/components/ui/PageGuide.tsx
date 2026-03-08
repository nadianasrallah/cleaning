import { useState } from 'react'
import { HelpCircle, X, ChevronDown, ChevronUp, Lightbulb } from 'lucide-react'

interface GuideTip {
  title: string
  description: string
}

interface PageGuideProps {
  title: string
  description: string
  tips: GuideTip[]
  quickStart?: string
}

export default function PageGuide({ title, description, tips, quickStart }: PageGuideProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isDismissed, setIsDismissed] = useState(() => {
    const dismissed = localStorage.getItem(`guide_dismissed_${title}`)
    return dismissed === 'true'
  })

  if (isDismissed) {
    return (
      <button
        onClick={() => {
          setIsDismissed(false)
          localStorage.removeItem(`guide_dismissed_${title}`)
        }}
        className="inline-flex items-center gap-2 text-sm text-teal-600 hover:text-teal-700 mb-4"
      >
        <HelpCircle className="h-4 w-4" />
        Show Guide
      </button>
    )
  }

  return (
    <div className="bg-gradient-to-r from-teal-50 to-sky-50 border border-teal-100 mb-6">
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-teal-100 rounded-lg mt-0.5">
              <Lightbulb className="h-5 w-5 text-teal-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900">{title}</h3>
                <span className="text-xs font-bold uppercase tracking-widest text-teal-600 bg-teal-100 px-2 py-0.5">
                  Guide
                </span>
              </div>
              <p className="text-sm text-slate-600 mt-1">{description}</p>
              
              {quickStart && (
                <div className="mt-3 p-3 bg-white/70 border border-teal-100">
                  <p className="text-xs font-bold uppercase tracking-widest text-teal-700 mb-1">Quick Start</p>
                  <p className="text-sm text-slate-700">{quickStart}</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`p-2.5 rounded-lg transition-all font-bold ${
                isExpanded
                  ? 'bg-teal-600 text-white shadow-md hover:bg-teal-700'
                  : 'bg-teal-100 text-teal-600 hover:bg-teal-200 hover:shadow-md'
              }`}
              title={isExpanded ? 'Collapse tips' : 'Expand tips'}
            >
              {isExpanded ? <ChevronUp className="h-6 w-6" /> : <ChevronDown className="h-6 w-6" />}
            </button>
            <button
              onClick={() => {
                setIsDismissed(true)
                localStorage.setItem(`guide_dismissed_${title}`, 'true')
              }}
              className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              title="Dismiss guide"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        {isExpanded && tips.length > 0 && (
          <div className="mt-4 pt-4 border-t border-teal-100">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Tips & Best Practices</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {tips.map((tip, index) => (
                <div key={index} className="p-3 bg-white/70 border border-teal-100">
                  <p className="font-semibold text-sm text-slate-900">{tip.title}</p>
                  <p className="text-sm text-slate-600 mt-1">{tip.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
