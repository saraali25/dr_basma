import { useState } from "react";
import { Play } from "lucide-react";
//import { Button } from "@/components/ui/button";


interface VideoPlayerProps {
  videoUrl: string;
  title?: string;
  thumbnail?: string;
}

//const VideoPlayer = ({ videoUrl, title }: VideoPlayerProps) => {
  const VideoPlayer = ({ videoUrl, title, thumbnail }: VideoPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);

  // Extract video ID and determine platform
  //const getEmbedUrl = (url: string): string | null => {
  const getVideoInfo = (url: string): { embedUrl: string | null; thumbnailUrl: string | null; platform: string | null } => {
    // YouTube
    const youtubeMatch = url.match(
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
    );
    if (youtubeMatch) {
      //return `https://www.youtube.com/embed/${youtubeMatch[1]}?autoplay=1`;
      const videoId = youtubeMatch[1];
      return {
        embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1`,
        thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        platform: 'youtube'
      };
    }

    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
      //return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
      return {
        embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`,
        thumbnailUrl: null, // Vimeo requires API for thumbnails
        platform: 'vimeo'
      };
    
    }

    // Direct video file
    if (url.match(/\.(mp4|webm|ogg)$/i)) {
      //return url;
      return {
        embedUrl: url,
        thumbnailUrl: null,
        platform: 'direct'
      };
    }

    //return null;
    return { embedUrl: null, thumbnailUrl: null, platform: null };
  };

 // const embedUrl = getEmbedUrl(videoUrl);
  //const isDirectVideo = videoUrl.match(/\.(mp4|webm|ogg)$/i);
  const { embedUrl, thumbnailUrl, platform } = getVideoInfo(videoUrl);
  const displayThumbnail = thumbnail || thumbnailUrl;
  const isDirectVideo = platform === 'direct';

  if (!embedUrl) {
    // Fallback for unsupported URLs - open in new tab
    return (
      <a href={videoUrl} target="_blank" rel="noopener noreferrer" className="block">
      <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-muted flex items-center justify-center cursor-pointer group">
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center group-hover:bg-primary transition-colors group-hover:scale-110 duration-200">
            <Play className="h-8 w-8 text-primary-foreground fill-primary-foreground mr-[-2px]" />
          </div>
          <span className="absolute bottom-3 right-3 text-sm text-white font-medium">شاهدى الآن</span>
        </div>
      </a>
    );
  }

  if (!isPlaying) {
    return (
      <div 
        className="relative w-full aspect-video rounded-lg overflow-hidden bg-muted cursor-pointer group"
        onClick={() => setIsPlaying(true)}
      >
        {displayThumbnail ? (
          <img 
            src={displayThumbnail} 
            alt={title || "Video thumbnail"} 
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback if thumbnail fails to load (e.g., maxresdefault not available)
              const target = e.target as HTMLImageElement;
              if (thumbnailUrl && thumbnailUrl.includes('maxresdefault')) {
                target.src = thumbnailUrl.replace('maxresdefault', 'hqdefault');
              }
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-muted to-muted-foreground/20" />
        )}
        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center group-hover:bg-primary group-hover:scale-110 transition-all duration-200 shadow-lg">
            <Play className="h-8 w-8 text-primary-foreground fill-primary-foreground mr-[-2px]" />
          </div>
        </div>
        <span className="absolute bottom-3 right-3 text-sm text-white font-medium drop-shadow-md">شاهدى الآن</span>
      </div>
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
