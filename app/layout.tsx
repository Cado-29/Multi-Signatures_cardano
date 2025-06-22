import '@meshsdk/react/styles.css';
import './globals.css';
import MeshProviderWrapper from './components/MeshProviderWrapper';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Cardano App',
  description: 'Next.js with Mesh SDK',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <MeshProviderWrapper>
          {children}
        </MeshProviderWrapper>
      </body>
    </html>
  );
}
