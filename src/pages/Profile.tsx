import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { PlayCircle, User, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import api, { enrollmentsAPI, coursesAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import ProfileEditDialog from "@/components/ProfileEditDialog";
import CourseCard from "@/components/CourseCard";
import CertificateDownloadDialog from "@/components/CertificateDownloadDialog";
import FeedbackDialog from "@/components/FeedbackDialog";

interface EnrolledCourse {
  id: number;
  progress: number;
  course: {
    id: number;
    title: string;
    description: string;
    duration: string;
    video_count: number;
    thumbnail: string;
    thumbnail_url?: string;
    category: { id: number; name: string };
    last_watched_video: { title: string } | null;
  };
}

interface Course {
  id: number;
  title: string;
  description: string;
  duration: string;
  video_count: number;
  thumbnail: string;
  thumbnail_url?: string;
  category: { id: number; name: string };
  is_free: boolean;
}

const Profile = () => {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [recommendedCourses, setRecommendedCourses] = useState<Course[]>([]);
  const [issuedCertificates, setIssuedCertificates] = useState<number[]>([]); // ✅ store courses with certificate
  const [loading, setLoading] = useState(true);

  const handleProfileUpdate = async () => {
    await refreshUser();
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1️⃣ Fetch enrollments
        const enrollmentResponse = await enrollmentsAPI.getAll();
        const rawData = enrollmentResponse.data;
        const enrollmentsRaw = Array.isArray(rawData)
          ? rawData
          : rawData.results || [];

        const enrollments: EnrolledCourse[] = enrollmentsRaw.map((item: any) => {
          const courseData = item.course || {};
          const categoryData = courseData.category || { id: 0, name: "غير مصنفة" };
          return {
            id: item.id,
            progress: item.progress || 0,
            course: {
              id: courseData.id || item.course_id || 0,
              title: courseData.title || "دورة غير معروفة",
              description: courseData.description || "",
              duration: courseData.duration || "",
              video_count: courseData.video_count || 0,
              thumbnail: courseData.thumbnail || "",
              thumbnail_url: courseData.thumbnail_url || "",
              category: categoryData,
              last_watched_video: item.last_watched_video || null,
              is_free: courseData.is_free || false,
            },
          };
        });

        setEnrolledCourses(enrollments);

        // 2️⃣ Fetch all courses for recommendations
        const coursesResponse = await coursesAPI.getAll();
        const allCourses = Array.isArray(coursesResponse.data)
          ? coursesResponse.data
          : coursesResponse.data?.results || [];

        // 3️⃣ Prepare IDs and categories
        const enrolledIds = enrollments.map((e) => e.course.id);
        const enrolledCategories = enrollments.map((e) => e.course.category.id);

        // 4️⃣ Recommend courses
        const recommended = allCourses
          .filter(
            (course: Course) =>
              !enrolledIds.includes(course.id) &&
              enrolledCategories.includes(course.category.id)
          )
          .slice(0, 3);

        setRecommendedCourses(recommended);

        // 5️⃣ Fetch issued certificates (backend endpoint `/api/certificates/`)
        try {
          const certRes = await api.get("/certificates/");
          if (Array.isArray(certRes.data)) {
            const courseIds = certRes.data.map((c: any) => c.course);
            setIssuedCertificates(courseIds);
          }
        } catch (err) {
          console.warn("Certificate check failed:", err);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
        toast({
          title: "خطأ في تحميل البيانات",
          description: "حاولي مرة أخرى لاحقاً",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  function getFullImageUrl(url: string): string {
    if (!url) return "/placeholder.svg";
    if (/^https?:\/\//i.test(url)) return url;
    return url.startsWith("/") ? url : `/${url}`;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow bg-muted/30">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-5xl mx-auto space-y-8">
            {/* Profile Header */}
            <div className="bg-card rounded-xl p-8 shadow-sm border border-border">
              <div className="flex items-start gap-6">
                <div className="bg-primary/10 p-6 rounded-full">
                  <User className="h-12 w-12 text-primary" />
                </div>
                <div className="flex-grow">
                  <h1 className="text-3xl font-bold mb-2">
                    {user?.first_name && user?.last_name
                      ? `${user.first_name} ${user.last_name}`
                      : user?.first_name || "المستخدم"}
                  </h1>
                  
                  <p className="text-sm sm:text-base text-muted-foreground mb-4">{user?.email}</p>
                  {user && <ProfileEditDialog user={user} onUpdate={handleProfileUpdate} />}
                </div>
              </div>
            </div>

            {/* Enrolled Courses */}
            <div>
              <h2 className="text-2xl font-bold mb-6">دوراتي</h2>
              {loading ? (
                <div className="flex justify-center items-center min-h-[200px]">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : enrolledCourses.length === 0 ? (
                <div className="text-center py-16 bg-card rounded-lg border border-border">
                  <p className="text-lg text-muted-foreground mb-4">لم تسجلي في أي دورة بعد</p>
                  <Link to="/courses">
                    <Button>تصفحي الدورات</Button>
                  </Link>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {enrolledCourses.map((enrollment) => {
                    const hasCertificate = issuedCertificates.includes(enrollment.course.id);
                    return (
                      <div key={enrollment.id} className="bg-card rounded-lg overflow-hidden shadow-sm border border-border">
                        <div className="aspect-video bg-muted flex items-center justify-center">
                          {(enrollment.course.thumbnail_url || enrollment.course.thumbnail) ? (
                            <img
                              src={getFullImageUrl(enrollment.course.thumbnail_url || enrollment.course.thumbnail)}
                              alt={enrollment.course.title}
                              className="w-full h-full object-cover rounded-lg"
                              onError={(e) => {
                                e.currentTarget.src = "/placeholder.svg";
                              }}
                            />
                          ) : (
                            <PlayCircle className="h-16 w-16 text-muted-foreground/30" />
                          )}
                        </div>
                        <div className="p-6 space-y-4">
                          <h3 className="font-semibold text-lg">{enrollment.course.title}</h3>

                          {/* Progress Bar */}
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">التقدم</span>
                              <span className="font-medium">{enrollment.progress}%</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-primary h-full rounded-full transition-all duration-300"
                                style={{ width: `${enrollment.progress}%` }}
                              />
                            </div>
                          </div>

                          <div className="pt-2 border-t border-border">
                            {enrollment.course.last_watched_video && (
                              <p className="text-sm text-muted-foreground mb-3">
                                آخر مشاهدة: {enrollment.course.last_watched_video.title}
                              </p>
                            )}
                            <Link to={`/courses/${enrollment.course.id}`}>
                              <Button className="w-full" variant="default">
                                متابعة التعلم
                              </Button>
                            </Link>

                            {/* Feedback Button */}
                            <div className="mt-2">
                              <FeedbackDialog
                                courseId={enrollment.course.id}
                                courseTitle={enrollment.course.title}
                              />
                            </div>

                            {/* ✅ Show certificate only when progress = 100 AND not already issued */}
                            {enrollment.progress === 100 && !hasCertificate && (
                              <CertificateDownloadDialog
                                courseTitle={enrollment.course.title}
                                courseId={enrollment.course.id}
                                progress={enrollment.progress}
                              />
                            )}

                            {/* ✅ Show notice if certificate already issued */}
                            {hasCertificate && (
                              <Button variant="secondary" className="w-full mt-2" disabled>
                                🏅  تم إصدار الشهادة
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recommended Courses */}
            {recommendedCourses.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <Sparkles className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-bold">دورات موصى بها لكي</h2>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recommendedCourses.map((course) => (
                    <CourseCard
                      key={course.id}
                      id={course.id}
                      title={course.title}
                      description={course.description}
                      duration={course.duration}
                      videoCount={course.video_count}
                      thumbnail={course.thumbnail_url || course.thumbnail}
                      is_free={course.is_free}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Browse More */}
            <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">مستعدة لتعلم المزيد؟</h2>
              <p className="text-muted-foreground mb-6">
                استكشفي كتالوجنا الكامل من الدورات لمواصلة رحلة نموك.
              </p>
              <Link to="/courses">
                <Button size="lg" variant="hero">
                  تصفحي جميع الدورات
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Profile;
