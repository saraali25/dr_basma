import { useRef } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";

interface Review {
  id: number;
  image_url?: string;
  title?: string;
  name?: string;
  role?: string;
  text?: string;
}

interface ReviewsCarouselProps {
  reviewPhotos: Review[];
}

export default function ReviewsCarousel({ reviewPhotos }: ReviewsCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = 300; // adjust scroll distance per click
    scrollRef.current.scrollBy({
      left: direction === "right" ? scrollAmount : -scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Heading */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">آراء المتدربين</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            تجارب حقيقية من متدربين نجحوا في تحقيق أهدافهم
          </p>
        </div>

        <div className="relative">
          {/* Left Button */}
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow z-10"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Right Button */}
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow z-10"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Scrollable Carousel */}
          <div
            ref={scrollRef}
            className="flex gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-4 px-4 hide-scrollbar"
          >
            {reviewPhotos.length > 0
              ? reviewPhotos.map((photo) => (
                  <div
                    key={photo.id}
                    className="flex-shrink-0 w-80 bg-card rounded-xl border border-border shadow-sm overflow-hidden snap-start"
                  >
                    {photo.image_url ? (
                      <img
                        src={photo.image_url}
                        alt={photo.title}
                        className="w-full h-64 object-contain bg-muted"
                      />
                    ) : (
                      <div className="p-6 space-y-4">
                        <div className="flex gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="h-5 w-5 text-secondary fill-secondary" />
                          ))}
                        </div>
                        <p className="text-card-foreground leading-relaxed">
                          {photo.text || "تجربة رائعة مع الدورة!"}
                        </p>
                        <div className="flex items-center gap-3">
                          <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center">
                            <span className="text-primary font-bold">{photo.name?.slice(0, 2)}</span>
                          </div>
                          <div>
                            <p className="font-semibold">{photo.name || "أسم المتدرب"}</p>
                            <p className="text-sm text-muted-foreground">{photo.role || "وظيفة"}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              : (
                <div className="text-center py-12 text-muted-foreground">
                  لا توجد آراء متاحة حالياً
                </div>
              )}
          </div>
        </div>
      </div>
    </section>
  );
}
