import { createFileRoute, useRouter } from '@tanstack/react-router';

import { CircleDetailPage } from '../features/circles/circle-detail-page';

/** Álbumes: la sección inicial del círculo, con su héroe y su chrome. */
export const Route = createFileRoute('/_app/circles/$circleId/')({
  component: CircleAlbumsRoute,
});

function CircleAlbumsRoute() {
  const { circleId } = Route.useParams();
  const { created, albumDeleted } = Route.useSearch();
  const router = useRouter();

  const clearSearch = () => {
    void router.navigate({
      to: '/circles/$circleId',
      params: { circleId },
      search: {},
      replace: true,
    });
  };

  return (
    <CircleDetailPage
      created={created}
      onCreatedToastClose={clearSearch}
      albumDeleted={albumDeleted}
      onAlbumDeletedToastClose={clearSearch}
    />
  );
}
