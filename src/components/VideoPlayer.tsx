import { useState } from "react";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VideoPlayerProps {
  videoUrl: string;
  title?: string;
}

const VideoPlayer = ({ videoUrl, title }: VideoPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);

  // Extract video ID and determine platform
  const getEmbedUrl = (url: string): string | null => {
    // YouTube
    const youtubeMatch = url.match(
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
    );
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}?autoplay=1`;
    }

    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
    }

    // Direct video file
    if (url.match(/\.(mp4|webm|ogg)$/i)) {
      return url;
    }

    return null;
  };

  const embedUrl = getEmbedUrl(videoUrl);
  const isDirectVideo = videoUrl.match(/\.(mp4|webm|ogg)$/i);

  if (!embedUrl) {
    // Fallback for unsupported URLs - open in new tab
    return (
      <a href={videoUrl} target="_blank" rel="noopener noreferrer" className="block">
        <Button className="w-full" variant="default">
          <Play className="h-4 w-4 ml-2" />
          شاهدى الآن
        </Button>
      </a>
    );
  }

  if (!isPlaying) {
    return (
      <Button 
        className="w-full" 
        variant="default" 
        onClick={() => setIsPlaying(true)}
      >
        <Play className="h-4 w-4 ml-2" />
        شاهدى الآن
      </Button>
    );
  }

  return (
    <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black">
      {isDirectVideo ? (
        <video
          src={embedUrl}
          controls
          autoPlay
          className="w-full h-full"
          title={title}
        />
      ) : (
        <iframe
          src={embedUrl}
          title={title || "Video player"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full border-0"
        />
      )}
    </div>
  );
};

export default VideoPlayer;
