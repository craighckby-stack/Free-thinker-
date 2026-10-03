/**
 * FREE THINKER ARCHITECTURAL ROOT PAGE
 * File: src/app/page.tsx
 * Role: Mounts PageClient with SSR disabled to prevent hydration context mismatches.
 */

import PageClient from '@/components/PageClient';

export default function Page(): React.JSX.Element {
  return <PageClient />;
}
