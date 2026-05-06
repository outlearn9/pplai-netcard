import { ClerkProvider } from '@clerk/nextjs'

const isMock = process.env.NEXT_PUBLIC_MOCK_AUTH === 'true'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // If we are in mock mode, bypass ClerkProvider to avoid runtime errors in browser
  if (isMock) {
    return (
      <html lang="en">
        <body>{children}</body>
      </html>
    )
  }

  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  )
}
