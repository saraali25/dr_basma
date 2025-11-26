import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Clock, PlayCircle } from "lucide-react";
import freeBadge from "@/assets/free-badge.png";

// Utility function to get full image URL
const getFullImageUrl = (url: string): string => {
  if (!url) return '';
  const trimmed = url.trim();

  // If absolute URL, upgrade to https when needed
  if (/^https?:\/\//i.test(trimmed)) {
    if (window.location.protocol === 'https:' && trimmed.startsWith('http://')) {
      return trimmed.replace(/^http:\/\//i, 'https://');
    }
    return trimmed;
  }

  // Build from API base, stripping trailing /api
  const rawBase = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
  const base = rawBase.replace(/\/api\/?$/i, '');

  const joined = trimmed.startsWith('/') ? `${base}${trimmed}` : `${base}/${trimmed}`;
  return window.location.protocol === 'https:' && joined.startsWith('http://')
    ? joined.replace(/^http:\/\//i, 'https://')
    : joined;
};

interface CourseCardProps {
  id: number;
  title: string;
  description: string;
  duration: string;
  videoCount: number;
  thumbnail?: string;
  price?: number | null;
  is_free?: boolean;
}

const CourseCard = ({
  id,
  title,
  description,
  duration,
  videoCount,
  thumbnail,
  price,
  is_free,
}: CourseCardProps) => {
  //const isFree = is_free || price === null || price === 0;
  const isFree = is_free ;
  return (
    <div className="group bg-card rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-border">
      {/* 🖼 Course image area */}
      <div className="relative overflow-hidden bg-muted aspect-[16/9]">
        <img
          src={thumbnail ? getFullImageUrl(thumbnail) : "/placeholder.svg"}
          alt={title || "Course placeholder"}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-100"
          onError={(e) => {
            e.currentTarget.src = "/placeholder.svg";
          }}
        />

        {/* 🌗 Always-visible gradient overlay for contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent opacity-90 group-hover:opacity-100 transition-opacity duration-300" />

        {/* 🏷️ Free badge for free courses - top right corner */}
        {isFree && (
          <img 
            src={freeBadge} 
            alt="مجاني" 
            className="absolute top-0 right-0 w-16 h-16 z-10"
          />
        )}

        {/* 📝 Optional fallback text if no thumbnail */}
        {!thumbnail && (
          <div className="absolute inset-0 flex items-center justify-center text-white text-sm font-medium bg-black/30">
            لا توجد صورة متاحة
          </div>
        )}
      </div>

      {/* 📋 Course info */}
      <div className="p-6 space-y-4">
        <h3 className="text-xl font-semibold text-card-foreground group-hover:text-primary transition-colors">
          {title}
        </h3>

        <p className="text-sm text-muted-foreground line-clamp-2">
          {description}
        </p>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>{duration}</span>
          </div>
          <div className="flex items-center gap-2">
            <PlayCircle className="h-4 w-4" />
            <span>{videoCount} فيديو</span>
          </div>
        </div>

        <Link to={`/courses/${id}`}>
          <Button className="w-full" variant="default">
            عرض الدورة
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default CourseCard;
