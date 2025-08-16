import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI Meeting Notes Summarizer',
  description: 'AI-powered meeting notes summarizer using Groq API',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body>{children}</body>
    </html>
  )
}
