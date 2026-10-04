import { useMemo } from 'react'
import { marked } from 'marked'

interface Props {
  content: string
  className?: string
}

export function MarkdownPreview({ content, className = '' }: Props) {
  const html = useMemo(() => {
    try {
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
      className={`markdown-body text-sm leading-relaxed break-words [&>h1]:text-base [&>h1]:font-semibold [&>h1]:text-[var(--text-main)] [&>h1]:my-2 [&>h2]:text-sm [&>h2]:font-semibold [&>h2]:text-[var(--text-main)] [&>h2]:my-1.5 [&>h3]:text-xs [&>h3]:font-semibold [&>h3]:text-[var(--text-main)] [&>p]:my-1 [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5 [&>blockquote]:border-l-2 [&>blockquote]:border-amber-400 [&>blockquote]:pl-3 [&>blockquote]:italic [&>pre]:p-2.5 [&>pre]:rounded-lg [&>pre]:bg-black/20 [&>pre]:font-mono [&>pre]:text-xs [&>code]:font-mono [&>code]:text-xs [&>code]:px-1 [&>code]:rounded [&>code]:bg-black/15 ${className}`}
      style={{ color: 'var(--text-sub)' }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
