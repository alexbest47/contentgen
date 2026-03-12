import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Megaphone, FolderKanban } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [programs, courses, projects] = await Promise.all([
        supabase.from("paid_programs").select("id", { count: "exact", head: true }),
        supabase.from("mini_courses").select("id", { count: "exact", head: true }),
        supabase.from("projects").select("id", { count: "exact", head: true }),
      ]);
      return {
        programs: programs.count ?? 0,
        courses: courses.count ?? 0,
        projects: projects.count ?? 0,
      };
    },
  });

  const cards = [
    { title: "Платные программы", value: stats?.programs ?? 0, icon: GraduationCap, url: "/programs" },
    { title: "Мини-курсы", value: stats?.courses ?? 0, icon: BookOpen, url: "/programs" },
    { title: "Проекты", value: stats?.projects ?? 0, icon: FolderKanban, url: "/programs" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Добро пожаловать, {profile?.full_name ?? "Пользователь"}</h1>
        <p className="text-muted-foreground">Панель управления генератором контента</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((c) => (
          <Card key={c.title} className="cursor-pointer transition-shadow hover:shadow-md" onClick={() => navigate(c.url)}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{c.title}</CardTitle>
              <c.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{c.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
