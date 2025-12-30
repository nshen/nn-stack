'use client';

import { orpc } from '@/lib/orpc';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@nn-stack/ui/components/card';
import { Badge } from '@nn-stack/ui/components/badge';

export function PlanetsList() {
  const { data: planets, isLoading } = useQuery(orpc.planet.list.queryOptions());

  if (isLoading) return <div>Loading planets...</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Planets List (Hydrated)</h2>
      {planets?.length === 0 ? (
        <p>No planets found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {planets?.map((planet) => (
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