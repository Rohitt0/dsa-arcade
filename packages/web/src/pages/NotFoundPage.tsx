import { Link } from 'react-router-dom';
import { CenteredLayout } from '../layouts/AppShell';
import { PixelButton } from '../components/ui';

export function NotFoundPage() {
  return (
    <CenteredLayout>
      <div className="text-center">
        <p className="font-pixel text-5xl text-gold">404</p>
        <h1 className="mt-6 text-lg text-parchment">You wandered off the map</h1>
        <p className="mt-3 text-sm text-stone-300">This path leads nowhere.</p>
        <Link to="/" className="mt-8 inline-block">
          <PixelButton>Return to safety</PixelButton>
        </Link>
      </div>
    </CenteredLayout>
  );
}
