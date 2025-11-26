import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Edit, Trash2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api, { coursesAPI, videosAPI } from "@/lib/api";

interface Video {
  id: number;
  title: string;
  video_url: string;
  duration: string;
  order: number;
  course: number|null;
  course_title: string;
  is_free: boolean;
}

interface Course {
  id: number;
  title: string;
}

export const VideoManagement = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  
  // Add this with your other useState declarations
  const [filterCourse, setFilterCourse] = useState<string>("all");
  
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: "",
    video_url: "",
    description: "",
    duration: "",
    order: 1,
    course: "",
    is_free: false,
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  // Re-fetch videos whenever the selected filter changes
  useEffect(() => {
    // keep selectedCourse in sync for the form default
    setSelectedCourse(filterCourse === "all" ? "" : filterCourse);
    fetchVideos(filterCourse);
  }, [filterCourse]);

  const fetchCourses = async () => {
    try {
      const response = await coursesAPI.getAllAdmin();
      const coursesData = Array.isArray(response.data) 
        ? response.data 
        : (response.data?.results || []);
      setCourses(coursesData);
      
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل تحميل الدورات",
        variant: "destructive",
      });
    }
  };

  /*const fetchVideos = async (courseId: string) => {
    if (!courseId) {
      setVideos([]);
      return;
    }
    
    setSelectedCourse(courseId);
    try {
      const response = await videosAPI.getAll(parseInt(courseId));
      const videosData = Array.isArray(response.data) 
        ? response.data 
        : (response.data?.results || []);
      setVideos(videosData);
    } catch (error) {
      console.error("Failed to fetch videos", error);
      toast({
        title: "خطأ",
        description: "فشل تحميل الفيديوهات",
        variant: "destructive",
      });
    }
  };*/

  const fetchVideos = async (courseId: string = "all") => {
    setLoading(true);
    try {
      let response;
      if (courseId === "all") {
        response = await videosAPI.getAll();
      } else {
        // API helper expects a numeric course id for filtering
        response = await videosAPI.getAll(parseInt(courseId));
      }

      const videosData = Array.isArray(response.data)
        ? response.data
        : (response.data?.results || []);
      setVideos(videosData);
    } catch (error) {
      console.error("Failed to fetch videos", error);
      toast({
        title: "خطأ",
        description: "فشل تحميل الفيديوهات",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        title: formData.title,
        video_url: formData.video_url,
        description: formData.description,
        duration: formData.duration,
       // course: parseInt(formData.course),
        course: formData.course ? parseInt(formData.course) : null,
        order: parseInt(formData.order.toString()),
        is_free: formData.is_free,
      };

      if (editingVideo) {
        const response = await videosAPI.update(editingVideo.id, payload);
        // Update the video in the local state
        setVideos(videos.map(v => v.id === editingVideo.id ? response.data : v));
        toast({ title: "تم التحديث", description: "تم تحديث الفيديو بنجاح" });
      } else {
        const response = await videosAPI.create(payload);
        // Add the new video to the local state
        setVideos([...videos, response.data]);
        toast({ title: "تم الإضافة", description: "تم إضافة الفيديو بنجاح" });
      }

      setDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error saving video:", error);
      toast({
        title: "خطأ",
        description: "فشل حفظ الفيديو",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("هل أنت متأكد من حذف هذا الفيديو؟")) return;

    try {
      await videosAPI.delete(id);
      // Remove the video from the local state
      setVideos(videos.filter(v => v.id !== id));
      toast({ title: "تم الحذف", description: "تم حذف الفيديو بنجاح" });
    } catch (error) {
      console.error("Error deleting video:", error);
      toast({
        title: "خطأ",
        description: "فشل حذف الفيديو",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (video: Video) => {
    setEditingVideo(video);
    setFormData({
      title: video.title,
      video_url: video.video_url,
      description: "",
      duration: video.duration,
      order: video.order,
      //course: video.course.toString(),
      course: video.course ? video.course.toString() : "",
      is_free: video.is_free || false,
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingVideo(null);
    setFormData({
      title: "",
      video_url: "",
      description: "",
      duration: "",
      order: 1,
      course: selectedCourse,
      is_free: false,
    });
  };

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-right">إدارة الفيديوهات</h2>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              إضافة فيديو
            </Button>
          </DialogTrigger>
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-right">{editingVideo ? "تعديل فيديو" : "إضافة فيديو جديد"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="course">الدورة</Label>
                <Select value={formData.course} onValueChange={(value) => setFormData({ ...formData, course: value })}>
                  <SelectTrigger id="course">
                    <SelectValue placeholder="اختر دورة" />
                  </SelectTrigger>
                  <SelectContent className="z-50 bg-popover">
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id.toString()}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="title">عنوان الفيديو</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="video_url">رابط الفيديو</Label>
                <Input
                  id="video_url"
                  value={formData.video_url}
                  onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                  placeholder="https://youtube.com/watch?v=..."
                  required
                />
                {formData.video_url && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    ✓ تم إدخال رابط الفيديو
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="description">الوصف</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="وصف الفيديو"
                />
              </div>
              <div>
                <Label htmlFor="duration">المدة</Label>
                <Input
                  id="duration"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  placeholder="مثال: 15:30"
                  required
                />
              </div>
              <div>
                <Label htmlFor="order">الترتيب</Label>
                <Input
                  id="order"
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                  min={1}
                  required
                />
              </div>
              <div className="flex items-center gap-3 space-x-reverse">
                <Checkbox
                  id="is_free"
                  checked={formData.is_free}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_free: checked as boolean })}
                />
                <Label htmlFor="is_free" className="cursor-pointer">مجاني</Label>
              </div>
              <Button type="submit" className="w-full">
                {editingVideo ? "تحديث" : "إنشاء"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

   {  /*  <div className="mb-4">
        <Label htmlFor="filterCourse">تصفية حسب الدورة</Label>
        <Select value={selectedCourse} onValueChange={fetchVideos}>
          <SelectTrigger id="filterCourse">
            <SelectValue placeholder="اختر دورة لعرض الفيديوهات" />
          </SelectTrigger>
          <SelectContent className="z-50 bg-popover">
            {courses.map((course) => (
              <SelectItem key={course.id} value={course.id.toString()}>
                {course.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div> */}

      <div className="mb-4">
              <Label htmlFor="filter-course">تصفية حسب الدورة</Label>
              <Select value={filterCourse} onValueChange={setFilterCourse}>
                <SelectTrigger dir="rtl" className="w-[250px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem dir="rtl" value="all">جميع الدورات</SelectItem>
                  {courses.map((course) => (
                    <SelectItem dir="rtl" key={course.id} value={course.id.toString()}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="border rounded-lg flex justify-center">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">الفيديوهات</TableHead>
                <TableHead className="text-right">المدة</TableHead>
                <TableHead className="text-right">الترتيب</TableHead>
                <TableHead className="text-right">عنوان الدورة</TableHead>
                <TableHead className="text-right">مجاني</TableHead>
                <TableHead className="text-leftt">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {videos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    لا توجد فيديوهات
                  </TableCell>
                </TableRow>
              ) : (
                videos.map((video) => (
                  <TableRow key={video.id}>
                    <TableCell className="font-medium text-right">
                      <div>
                        <div>{video.title}</div>
                        {video.video_url && (
                          <a 
                            href={video.video_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline"
                          >
                            رابط الفيديو
                          </a>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{video.duration}</TableCell>
                    <TableCell className="text-right">{video.order}</TableCell>
                    <TableCell className="text-right">{video.course_title}</TableCell>
                    <TableCell className="text-right">
                      {video.is_free ? (
                        <span className="text-green-600 font-semibold">✅</span>
                      ) : (
                        <span className="text-muted-foreground"> ❌</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right" dir="rtl">
                      <div className="flex gap-2 justify-end items-center">
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(video)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(video.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};
