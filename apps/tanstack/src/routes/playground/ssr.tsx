import { createFileRoute } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { orpc } from '~/lib/orpc';
import { Card, CardContent, CardHeader, CardTitle } from '@nn-stack/ui/components/card';
import { Badge } from '@nn-stack/ui/components/badge';
import { SourceCodeButton } from '~/components/source-code-button';

export const Route = createFileRoute('/playground/ssr')({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(orpc.planet.list.queryOptions()),
  component: SSRDemoPage,
});

function SSRDemoPage() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">SSR & Hydration Demo</h1>
          <p className="text-muted-foreground mt-2">
            The data below is prefetched on the server and hydrated on the client.
            View the page source to confirm the data is present in the HTML.
          </p>
        </div>
        <SourceCodeButton path="apps/tanstack/src/routes/playground/ssr.tsx" />
      </div>

      <div className="p-6 bg-muted/50 border rounded-lg">
        <PlanetsList />
      </div>
    </div>
  );
}

function PlanetsList() {
  const { data: planets } = useSuspenseQuery(orpc.planet.list.queryOptions());

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Planets List (Hydrated)</h2>
      {planets.length === 0 ? (
        <p>No planets found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {planets.map((planet) => (
            <Card key={planet.id}>
              <CardHeader className="pb-2">
                <CardTitle className="flex justify-between items-center text-lg">
                  {planet.name}
                  <Badge variant="outline">{planet.type}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Distance from Sun: <span className="font-medium text-foreground">{planet.distanceAu} AU</span>
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
