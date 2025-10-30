import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Video } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Episode {
  id: string;
  surgery_type: string;
  surgery_date: string;
  patients: {
    id: string;
    profiles?: {
      full_name: string | null;
      email: string;
    };
  };
}

interface EpisodesWithVisitLinksProps {
  episodes: Episode[];
}

export const EpisodesWithVisitLinks = ({ episodes }: EpisodesWithVisitLinksProps) => {
  const navigate = useNavigate();

  const startTeleVisit = (episodeId: string) => {
    navigate(`/tele-visit?episode=${episodeId}`);
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {episodes.map((episode) => (
        <Card key={episode.id}>
          <CardContent className="pt-6 space-y-3">
            <div>
              <h3 className="font-semibold">
                {episode.patients.profiles?.full_name || episode.patients.profiles?.email}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">{episode.surgery_type}</p>
              <p className="text-xs text-muted-foreground mt-2">
                Surgery Date: {new Date(episode.surgery_date).toLocaleDateString()}
              </p>
            </div>
            <Button 
              onClick={() => startTeleVisit(episode.id)}
              className="w-full"
              size="sm"
            >
              <Video className="h-4 w-4 mr-2" />
              Start Tele-Visit
            </Button>
          </CardContent>
        </Card>
      ))}
      {episodes.length === 0 && (
        <p className="text-muted-foreground col-span-full text-center py-8">
          No active episodes found
        </p>
      )}
    </div>
  );
};
