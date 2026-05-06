'use client'

import { Highlight, type Language } from 'prism-react-renderer'

// Postman-like theme: keys=green, strings=green, numbers/booleans=orange-red, punctuation=default
const theme = {
  plain: { color: '#4a9153', backgroundColor: 'transparent' }, // default green (keys, strings)
  styles: [
    { types: ['property'], style: { color: '#4a9153' } },           // keys: green
    { types: ['string', 'attr-value'], style: { color: '#4a9153' } }, // strings: green
    { types: ['number'], style: { color: '#e07b53' } },              // numbers: orange-red
    { types: ['boolean', 'null'], style: { color: '#e07b53' } },     // bool/null: orange-red
    { types: ['punctuation', 'operator'], style: { color: '#555' } }, // braces/colons: gray
    { types: ['comment'], style: { color: '#999', fontStyle: 'italic' as const } },
    // bash/curl
    { types: ['function'], style: { color: '#555' } },               // curl command: gray
    { types: ['keyword'], style: { color: '#555' } },
  ],
}

interface CodeHighlightProps {
  code: string
  language: 'json' | 'bash'
}

export function CodeHighlight({ code, language }: CodeHighlightProps) {
  return (
    <Highlight code={code} language={language} theme={theme}>
      {({ tokens, getLineProps, getTokenProps }) => (
        <code className="block whitespace-pre font-mono">
          {tokens.map((line, i) => (
            <div key={i} {...getLineProps({ line })}>
              {line.map((token, j) => (
                <span key={j} {...getTokenProps({ token })} />
              ))}
            </div>
          ))}
        </code>
      )}
    </Highlight>
  )
}
