import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup,
  SidebarGroupContent, SidebarGroupLabel, SidebarHeader,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard, GraduationCap, Tag, TableProperties,
  MessageSquareText, Users, LogOut, Sparkles, Braces, Archive, Mail, Stethoscope,
} from "lucide-react";

const mainNav = [
  { title: "Панель управления", url: "/", icon: LayoutDashboard },
  { title: "Платные программы", url: "/programs", icon: GraduationCap },
  { title: "Теги", url: "/tags", icon: Tag },
  { title: "Таблица описаний", url: "/descriptions", icon: TableProperties },
  { title: "Архив", url: "/archive", icon: Archive },
];

const adminNav = [
  { title: "Управление промптами", url: "/prompts", icon: MessageSquareText },
  { title: "Переменные промптов", url: "/prompt-variables", icon: Braces },
  { title: "Настройки Email", url: "/email-settings", icon: Mail },
  { title: "Пользователи", url: "/users", icon: Users },
];

export function AppSidebar() {
  const { profile, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-sidebar-primary" />
          <span className="text-lg font-bold text-sidebar-foreground">ContentGen</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Основное</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    isActive={location.pathname === item.url}
                    onClick={() => navigate(item.url)}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Администрирование</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminNav.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      isActive={location.pathname === item.url}
                      onClick={() => navigate(item.url)}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter className="p-4">
        <div className="flex items-center justify-between text-sm text-sidebar-foreground/70">
          <span className="truncate">{profile?.full_name ?? "Пользователь"}</span>
          <button onClick={signOut} className="hover:text-sidebar-foreground transition-colors">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
