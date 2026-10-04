import { useMemo } from 'react'
import { marked } from 'marked'

interface Props {
  content: string
  className?: string
}

export function MarkdownPreview({ content, className = '' }: Props) {
  const html = useMemo(() => {
    try {
      // Parse markdown to HTML
      return marked.parse(content || '', {
        breaks: true,
        gfm: true,
      }) as string
    } catch {
      return content
    }
  }, [content])

  return (
    <div
      className={`prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
