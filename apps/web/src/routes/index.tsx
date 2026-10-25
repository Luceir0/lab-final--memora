import { SITE_NAME } from '@memora/shared';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  return (
    <main>
      <h1>{SITE_NAME}</h1>
    </main>
  );
}
