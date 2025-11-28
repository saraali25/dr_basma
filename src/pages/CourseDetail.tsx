import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Clock, PlayCircle, CheckCircle, ArrowRight, FileText, Download, Star } from "lucide-react";
import { coursesAPI, enrollmentsAPI, videosAPI, feedbackAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Video {
  id: number;
  title: string;
  description: string;
  duration: string;
  order: number;
  video_url_display: string;
}

interface Enrollment {
  id: number;
  progress: number;
  watched_video_ids: number[];
}

interface PDF {
  id: number;
  title: string;
  description: string;
  pdf_url: string;
  order: number;
}

interface Course {
  id: number;
  title: string;
  description: string;
  duration: string;
  video_count: number;
  thumbnail: string;
  thumbnail_url?: string;
  is_enrolled?: boolean;
  price?: number | null;
  is_free?: boolean;
}

interface Review {
  id: number;
  user: {
    id: number;
    username: string;
    email: string;
  };
  rating: number;
  comment: string;
  created_at: string;
}

// Utility function to convert YouTube URL to embed format
const getYouTubeEmbedUrl = (url: string): string | null => {
  if (!url) return null;
  
  // Handle youtu.be format
  const youtuBeMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  if (youtuBeMatch) {
    return `https://www.youtube.com/embed/${youtuBeMatch[1]}`;
  }
  
  // Handle youtube.com/watch?v= format
  const youtubeMatch = url.match(/youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/);
  if (youtubeMatch) {
    return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
  }
  
  // Handle youtube.com/embed format (already embedded)
  if (url.includes('youtube.com/embed/')) {
    return url;
  }
  
  return null;
};

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

const CourseDetail = () => {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [pdfs, setPdfs] = useState<PDF[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolled, setEnrolled] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [watchedVideoIds, setWatchedVideoIds] = useState<number[]>([]);

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        const courseResponse = await coursesAPI.getById(Number(id));
        setCourse(courseResponse.data);
        
        // Fetch reviews for the course
        try {
          const reviewsResponse = await feedbackAPI.getAll(Number(id));
          const reviewsList = Array.isArray(reviewsResponse.data) 
            ? reviewsResponse.data 
            : (reviewsResponse.data?.results || []);
          setReviews(reviewsList);
        } catch (error) {
          console.log("Error fetching reviews:", error);
        }
        
        // Set enrollment status from course data
        if (isAuthenticated && courseResponse.data.is_enrolled) {
          setEnrolled(true);
          
          // Fetch enrollment data to get watched videos
          try {
            const enrollmentsResponse = await enrollmentsAPI.getAll();
            const userEnrollments = Array.isArray(enrollmentsResponse.data) 
              ? enrollmentsResponse.data 
              : enrollmentsResponse.data?.results || [];
            const courseEnrollment = userEnrollments.find(
              (e: Enrollment) => e.id === Number(id) || (e as any).course?.id === Number(id)
            );
            if (courseEnrollment) {
              setEnrollment(courseEnrollment);
              setWatchedVideoIds(courseEnrollment.watched_video_ids || []);
            }
          } catch (error) {
            console.log("Error fetching enrollment data:", error);
          }
          
          // Fetch videos and PDFs for enrolled users
          try {
            const videosResponse = await coursesAPI.getVideos(Number(id));
            const vids = Array.isArray(videosResponse.data)
              ? videosResponse.data
              : (videosResponse.data?.results || []);
            setVideos(vids);
            // Set first video as selected by default
            if (vids.length > 0) {
              setSelectedVideo(vids[0]);
            }
            
            // Fetch PDFs
            const pdfsResponse = await coursesAPI.getPDFs(Number(id));
            const pdfsData = Array.isArray(pdfsResponse.data)
              ? pdfsResponse.data
              : (pdfsResponse.data?.results || []);
            setPdfs(pdfsData);
          } catch (error) {
            console.log("Error fetching course materials:", error);
          }
        } else {
          setEnrolled(false);
        }
      } catch (error) {
        toast({
          title: "خطأ في تحميل الدورة",
          description: "حاولي مرة أخرى لاحقاً",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCourseData();
  }, [id, isAuthenticated, toast]);

  const handleVideoSelect = async (video: Video) => {
    setSelectedVideo(video);
    
    // Mark video as watched if enrolled and not already watched
    if (enrolled && !watchedVideoIds.includes(video.id)) {
      try {
        const response = await videosAPI.markVideoWatched(Number(id), video.id);

        // Locally update watched video IDs
        const updatedWatchedIds = [...watchedVideoIds, video.id];
        const uniqueWatchedCount = new Set(updatedWatchedIds).size;
        setWatchedVideoIds(updatedWatchedIds);

        // Prefer backend progress, but fall back to client-side calculation
        let progressFromApi = Number(response?.data?.progress);
        const totalVideos = Array.isArray(videos) ? videos.length : 0;

        if ((!progressFromApi || Number.isNaN(progressFromApi)) && totalVideos > 0) {
          progressFromApi = Math.round((uniqueWatchedCount / totalVideos) * 100);
        }

        if (enrollment) {
          setEnrollment({
            ...enrollment,
            progress: progressFromApi || enrollment.progress,
          });
        }

        toast({
          title: "تم تسجيل المشاهدة",
          description: `التقدم: ${progressFromApi || enrollment?.progress || 0}%`,
        });
      } catch (error) {
        console.error("Error marking video as watched:", error);
      }
    }
  };

  const handleEnrollClick = async () => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    
    if (enrolled) return;
    
    // Check if course is free or paid using is_free field
    const isFree = course?.is_free === true;
    
    if (isFree) {
      // Free course - enroll directly via API
      try {
        setLoading(true);
        await coursesAPI.enroll(Number(id));
        
        toast({
          title: "تم التسجيل بنجاح",
          description: "يمكنك الآن الوصول إلى محتوى الدورة",
        });
        
        // Refresh course data to show materials
        const courseResponse = await coursesAPI.getById(Number(id));
        setCourse(courseResponse.data);
        setEnrolled(true);

         toast({
          title:"تنشيط الصفحة",
          description: "نشطي الصفحة لتحميل محتوي الدورة",
        });
        
        // Fetch enrollment data
        try {
          const enrollmentsResponse = await enrollmentsAPI.getAll();
          const userEnrollments = Array.isArray(enrollmentsResponse.data) 
            ? enrollmentsResponse.data 
            : enrollmentsResponse.data?.results || [];
          const courseEnrollment = userEnrollments.find(
            (e: Enrollment) => e.id === Number(id) || (e as any).course?.id === Number(id)
          );
          if (courseEnrollment) {
            setEnrollment(courseEnrollment);
            setWatchedVideoIds(courseEnrollment.watched_video_ids || []);
          }
        } catch (error) {
          console.log("Error fetching enrollment data:", error);
        }
        
        // Fetch videos and PDFs
        try {
          const [videosResponse, pdfsResponse] = await Promise.all([
            coursesAPI.getVideos(Number(id)),
            coursesAPI.getPDFs(Number(id))
          ]);
          const vids = Array.isArray(videosResponse.data) ? videosResponse.data : [];
          setVideos(vids);
          if (vids.length > 0) {
            setSelectedVideo(vids[0]);
          }
          setPdfs(Array.isArray(pdfsResponse.data) ? pdfsResponse.data : []);
        } catch (error) {
          console.error('Error fetching course materials:', error);
        }
      } catch (error: any) {
        toast({
          title: "خطأ في التسجيل",
          description: error.response?.data?.message || "حاولي مرة أخرى لاحقاً",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    } else {
      // Paid course - redirect to WhatsApp
      const whatsappUrl = "https://wa.me/message/IFEAWYSTJ2DUE1";
      window.open(whatsappUrl, "_blank");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <p className="text-lg text-muted-foreground">الدورة غير موجودة</p>
        </div>
        <Footer />
      </div>
    );
  }

  // Group videos by module (assuming order represents module grouping)
  const groupedVideos = (Array.isArray(videos) ? videos : []).reduce((acc, video) => {
    const moduleIndex = Math.floor((video.order - 1) / 3);
    if (!acc[moduleIndex]) {
      acc[moduleIndex] = [];
    }
    acc[moduleIndex].push(video);
    return acc;
  }, {} as Record<number, Video[]>);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow">
        {/* Course Header */}
        <section className="bg-gradient-to-br from-primary/5 to-accent/5 py-12">
          <div className="container mx-auto px-4">
            <Link to="/courses" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
              <ArrowRight className="h-4 w-4" />
              العودة للدورات
            </Link>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-6">
                <h1 className="text-4xl md:text-5xl font-bold">{course.title}</h1>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {course.description}
                </p>

                <div className="flex flex-wrap gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    <span className="font-medium">{course.duration}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <PlayCircle className="h-5 w-5 text-primary" />
                    <span className="font-medium">{course.video_count} فيديو</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    <span className="font-medium">شهادة متضمنة</span>
                  </div>
                </div>
              </div>

              <div className="md:col-span-1">
                <div className="bg-card rounded-xl p-6 shadow-lg border border-border sticky top-24">
                  <div className="aspect-square bg-muted rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                    {(course.thumbnail_url || course.thumbnail) ? (
                      <img 
                        src={getFullImageUrl(course.thumbnail_url || course.thumbnail)} 
                        alt={course.title} 
                        className="w-full h-full object-cover rounded-lg"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder.svg';
                        }}
                      />
                    ) : (
                      <PlayCircle className="h-16 w-16 text-muted-foreground/30" />
                    )}
                  </div>
                  <Button
                    className="w-full mb-3"
                    size="lg"
                    variant={enrolled ? "outline" : "hero"}
                    onClick={handleEnrollClick}
                    disabled={enrolled || loading}
                  >
                    {enrolled
                      ? "مسجله بالفعل"
                      : !isAuthenticated
                        ? "سجلي الآن"
                        : course?.is_free
                          ? "ابدأي التعلم الآن"
                          : "اشتركي الآن في الدورة"}
                  </Button>
                  {enrolled && (
                    <Link to="/profile">
                      <Button className="w-full" variant="outline">
                        متابعة التعلم
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Course Content */}
        {enrolled && (
          <section className="py-16">
            <div className="container mx-auto px-4 max-w-6xl">
              <h2 className="text-3xl font-bold mb-8">محتوى الدورة</h2>
              
              
              {/* Videos Section */}
              {Array.isArray(videos) && videos.length > 0 && (
                <div className="mb-12">

                <div className="grid lg:grid-cols-3 gap-6">
                  {/* Video Player */}
                  <div className="lg:col-span-2 space-y-6">
                    {selectedVideo && (
                      <>
                        <div className="bg-card rounded-xl overflow-hidden shadow-lg border border-border">
                          <div className="aspect-video bg-black">
                            {(() => {
                              const embedUrl = getYouTubeEmbedUrl(selectedVideo.video_url_display);
                              if (embedUrl) {
                                return (
                                  <iframe
                                    width="100%"
                                    height="100%"
                                    src={embedUrl}
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    className="w-full h-full"
                                  ></iframe>
                                );
                              } else {
                                return (
                                  <div className="w-full h-full flex items-center justify-center text-white">
                                    <div className="text-center">
                                      <PlayCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                                      <p>عذرًا، لا يمكن عرض هذا الفيديو حاليًا.</p>
                                    </div>
                                  </div>
                                );
                              }
                            })()}
                          </div>
                        </div>
                        <div className="bg-card rounded-xl p-6 shadow-lg border border-border">
                          <h3 className="text-2xl font-bold mb-3">{selectedVideo.title}</h3>
                          {selectedVideo.description && (
                            <p className="text-muted-foreground leading-relaxed">{selectedVideo.description}</p>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Video List */}
                  <div className="lg:col-span-1">
                    <div className="bg-card rounded-xl shadow-lg border border-border overflow-hidden sticky top-24">
                      <div className="bg-muted/50 p-4 border-b border-border">
                        <h3 className="font-semibold text-lg">قائمة الفيديوهات</h3>
                      </div>
                      <div className="max-h-[600px] overflow-y-auto">
                        {Object.entries(groupedVideos).map(([moduleIndex, moduleVideos]) => (
                          <div key={moduleIndex}>
                            <div className="bg-muted/30 p-3 border-b border-border">
                              <p className="font-semibold text-sm">الوحدة {Number(moduleIndex) + 1}</p>
                            </div>
                            <div className="divide-y divide-border">
                              {moduleVideos.map((video) => {
                                const isWatched = watchedVideoIds.includes(video.id);
                                return (
                                  <div
                                    key={video.id}
                                    className={`p-4 hover:bg-muted/30 transition-colors cursor-pointer ${
                                      selectedVideo?.id === video.id ? 'bg-primary/10 border-r-4 border-primary' : ''
                                    }`}
                                    onClick={() => handleVideoSelect(video)}
                                  >
                                    <div className="flex items-start gap-3">
                                      {isWatched ? (
                                        <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0 text-green-500" />
                                      ) : (
                                        <PlayCircle className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                                          selectedVideo?.id === video.id ? 'text-primary' : 'text-muted-foreground'
                                        }`} />
                                      )}
                                      <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm mb-1 line-clamp-2">{video.title}</p>
                                        <span className="text-xs text-muted-foreground">{video.duration}</span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              )}
              
              {/* PDFs Section */}
              {Array.isArray(pdfs) && pdfs.length > 0 && (
                <div className="mt-12">
                  <h3 className="text-2xl font-bold mb-6">📄 مواد الدورة</h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pdfs.map((pdf) => (
                      <div
                        key={pdf.id}
                        className="bg-card rounded-lg border border-border p-6 hover:shadow-lg transition-shadow"
                      >
                        <div className="flex items-start gap-4">
                          <div className="bg-primary/10 p-3 rounded-lg">
                            <FileText className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold mb-1 line-clamp-2">{pdf.title}</h4>
                            {pdf.description && (
                              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                {pdf.description}
                              </p>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full"
                              onClick={() => window.open(pdf.pdf_url, '_blank')}
                            >
                              <Download className="h-4 w-4 ml-2" />
                              عرض
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reviews Section */}
              {reviews.length > 0 && (
                <div className="mt-12">
                  <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <Star className="h-6 w-6 text-primary" />
                 آراء الطالبات
                  </h3>
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div
                        key={review.id}
                        className="bg-card rounded-lg border border-border p-6 hover:shadow-lg transition-shadow"
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <p className="font-semibold text-foreground">
                                  {review.user.username}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(review.created_at).toLocaleDateString('ar-EG', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
                                </p>
                              </div>
                              <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`h-5 w-5 ${
                                      star <= review.rating
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                            <p className="text-foreground leading-relaxed">
                              {review.comment}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default CourseDetail;
