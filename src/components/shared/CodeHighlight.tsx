interface CodeHighlightProps {
  html: string
}

export default function CodeHighlight({ html }: CodeHighlightProps) {
  return <pre dangerouslySetInnerHTML={{ __html: html }} />
}
