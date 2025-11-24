import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BookOpen, Video, Users, BarChart3, FileText, Star } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { CourseManagement } from "@/components/admin/CourseManagement";
import { VideoManagement } from "@/components/admin/VideoManagement";
import { UserManagement } from "@/components/admin/UserManagement";
import { PDFManagement } from "@/components/admin/PDFManagement";
import { ReviewManagement } from "@/components/admin/ReviewManagement";
import api from "@/lib/api";

interface Stats {
  total_courses: number;
  published_courses: number;
  total_videos: number;
  total_users: number;
  total_enrollments: number;
  total_pdfs: number;
}

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    if (user && !user.is_staff) {
      toast({
        title: "غير مصرح",
        description: "ليس لديك صلاحية الوصول إلى لوحة التحكم",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [user, navigate, toast]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get("/admin/stats/");
      setStats(response.data);
    } catch (error) {
      console.error("Failed to fetch stats", error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" dir="rtl">
      <Navbar />

      <main className="flex-grow bg-muted/30">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="text-right">
              <h1 className="text-4xl font-bold mb-2">لوحة التحكم</h1>
              <p className="text-muted-foreground">إدارة الدورات والمستخدمين والمحتوى</p>
            </div>

            {/* Stats Overview */}
            {stats && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6">
                <div className="bg-card rounded-lg p-6 border border-border">
                  <div className="flex items-center gap-3 mb-2 flex-row-reverse">
                    <p className="text-sm text-muted-foreground text-right flex-1">إجمالي الدورات</p>
                    <div className="bg-primary/10 p-2 rounded">
                      <BookOpen className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-right">{stats.total_courses}</p>
                  <p className="text-xs text-muted-foreground mt-1 text-right">
                    {stats.published_courses} منشورة
                  </p>
                </div>
                <div className="bg-card rounded-lg p-6 border border-border">
                  <div className="flex items-center gap-3 mb-2 flex-row-reverse">
                    <p className="text-sm text-muted-foreground text-right flex-1">إجمالي الفيديوهات</p>
                    <div className="bg-secondary/10 p-2 rounded">
                      <Video className="h-5 w-5 text-secondary" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-right">{stats.total_videos}</p>
                </div>
                <div className="bg-card rounded-lg p-6 border border-border">
                  <div className="flex items-center gap-3 mb-2 flex-row-reverse">
                    <p className="text-sm text-muted-foreground text-right flex-1">ملفات PDF</p>
                    <div className="bg-accent/10 p-2 rounded">
                      <FileText className="h-5 w-5 text-accent" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-right">{stats.total_pdfs}</p>
                </div>
                <div className="bg-card rounded-lg p-6 border border-border">
                  <div className="flex items-center gap-3 mb-2 flex-row-reverse">
                    <p className="text-sm text-muted-foreground text-right flex-1">المستخدمون</p>
                    <div className="bg-accent/10 p-2 rounded">
                      <Users className="h-5 w-5 text-accent" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-right">{stats.total_users}</p>
                </div>
                <div className="bg-card rounded-lg p-6 border border-border">
                  <div className="flex items-center gap-3 mb-2 flex-row-reverse">
                    <p className="text-sm text-muted-foreground text-right flex-1">التسجيلات</p>
                    <div className="bg-primary/10 p-2 rounded">
                      <BarChart3 className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-right">{stats.total_enrollments}</p>
                </div>
              </div>
            )}

            
            {/* Management Tabs chatGPT suggestion */}
<Tabs defaultValue="courses" className="space-y-6" dir="rtl">
   <TabsList className="flex justify-end w-full max-w-3xl gap-2 border-b border-border pb-2 
             overflow-x-auto whitespace-nowrap no-scrollbar
             snap-x snap-mandatory scroll-smooth"
>
    <TabsTrigger
      value="courses"
      className="relative px-2 py-2 text-sm font-medium text-gray-600 data-[state=active]:text-primary
                 data-[state=active]:font-bold data-[state=active]:before:absolute data-[state=active]:before:right-0 
                 data-[state=active]:before:top-0 data-[state=active]:before:bottom-0 data-[state=active]:before:w-1 
                 data-[state=active]:before:bg-primary rounded-lg transition-all"
    >
      الدورات
    </TabsTrigger>

    <TabsTrigger
      value="videos"
      className="relative px-4 py-2 text-sm font-medium text-gray-600 data-[state=active]:text-primary
                 data-[state=active]:font-bold data-[state=active]:before:absolute data-[state=active]:before:right-0 
                 data-[state=active]:before:top-0 data-[state=active]:before:bottom-0 data-[state=active]:before:w-1 
                 data-[state=active]:before:bg-primary rounded-lg transition-all"
    >
      الفيديوهات
    </TabsTrigger>

    <TabsTrigger
      value="pdfs"
      className="relative px-4 py-2 text-sm font-medium text-gray-600 data-[state=active]:text-primary
                 data-[state=active]:font-bold data-[state=active]:before:absolute data-[state=active]:before:right-0 
                 data-[state=active]:before:top-0 data-[state=active]:before:bottom-0 data-[state=active]:before:w-1 
                 data-[state=active]:before:bg-primary rounded-lg transition-all"
    >
      ملفات PDF
    </TabsTrigger>

  <TabsTrigger
    value="users"
    className="relative px-4 py-2 text-sm font-medium text-gray-600 data-[state=active]:text-primary
               data-[state=active]:font-bold data-[state=active]:before:absolute data-[state=active]:before:right-0 
               data-[state=active]:before:top-0 data-[state=active]:before:bottom-0 data-[state=active]:before:w-1 
               data-[state=active]:before:bg-primary rounded-lg transition-all"
  >
    المستخدمون
  </TabsTrigger>

  <TabsTrigger
    value="reviews"
    className="relative px-4 py-2 text-sm font-medium text-gray-600 data-[state=active]:text-primary
               data-[state=active]:font-bold data-[state=active]:before:absolute data-[state=active]:before:right-0 
               data-[state=active]:before:top-0 data-[state=active]:before:bottom-0 data-[state=active]:before:w-1 
               data-[state=active]:before:bg-primary rounded-lg transition-all"
  >
    التقييمات
  </TabsTrigger>
</TabsList>

  <TabsContent value="courses" className="bg-card rounded-lg p-6 border border-border">
    <CourseManagement />
  </TabsContent>

  <TabsContent value="videos" className="bg-card rounded-lg p-6 border border-border">
    <VideoManagement />
  </TabsContent>

  <TabsContent value="pdfs" className="bg-card rounded-lg p-6 border border-border">
    <PDFManagement />
  </TabsContent>

  <TabsContent value="users" className="bg-card rounded-lg p-6 border border-border">
    <UserManagement />
  </TabsContent>

  <TabsContent value="reviews" className="bg-card rounded-lg p-6 border border-border">
    <ReviewManagement />
  </TabsContent>
</Tabs>

           
 
{/* Management Tabs Loveable design*/}
           {/* <Tabs defaultValue="courses" className="space-y-6"> 
              <TabsList className="grid w-full max-w-3xl grid-cols-4">
                <TabsTrigger value="courses">الدورات</TabsTrigger>
                <TabsTrigger value="videos">الفيديوهات</TabsTrigger>
                <TabsTrigger value="pdfs">ملفات PDF</TabsTrigger>
                <TabsTrigger value="users">المستخدمون</TabsTrigger>
              </TabsList>

              <TabsContent value="courses" className="bg-card rounded-lg p-6 border border-border">
                <CourseManagement />
              </TabsContent>

              <TabsContent value="videos" className="bg-card rounded-lg p-6 border border-border">
                <VideoManagement />
              </TabsContent>

              <TabsContent value="pdfs" className="bg-card rounded-lg p-6 border border-border">
                <PDFManagement />
              </TabsContent>

              <TabsContent value="users" className="bg-card rounded-lg p-6 border border-border">
                <UserManagement />
              </TabsContent>
            </Tabs> */}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;
