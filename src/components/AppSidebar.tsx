import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup,
  SidebarGroupContent, SidebarGroupLabel, SidebarHeader,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  GraduationCap, Tag, TableProperties,
  MessageSquareText, Users, LogOut, Sparkles, Braces, Archive, Mail, Stethoscope, FileVideo, ShieldQuestion, MailPlus, TreePine, FileText, FilePlus2,
  BookOpen, Video, ListChecks, Rocket, UserCheck, Percent, FileDown, ListOrdered, ImageIcon, Link2, Layers, Layout, FileImage, GalleryHorizontal,
  CalendarDays, Globe,
} from "lucide-react";

const topNav = [
  { title: "Очередь задач", url: "/queue", icon: ListOrdered },
  { title: "Контент-план", url: "/content-plan", icon: CalendarDays },
];

const contentCreationNav = [
  { title: "Создание поста", url: "/post", icon: FileImage },
  { title: "Создание карусели", url: "/carousel", icon: GalleryHorizontal },
  { title: "Конструктор писем", url: "/email-builder", icon: MailPlus },
  { title: "Конструктор цепочек", url: "/email-chains", icon: Link2 },
  { title: "Конструктор лендингов", url: "/landings", icon: Layout },
];

const offerPrepNav = [
  { title: "Диагностики", url: "/diagnostics", icon: Stethoscope },
  { title: "Мини-курс", url: "/offers/mini_course", icon: BookOpen },
  { title: "Вебинар", url: "/offers/webinar", icon: Video },
  { title: "Подготовка PDF", url: "/pdf-materials", icon: FilePlus2 },
  { title: "Предсписок", url: "/offers/pre_list", icon: ListChecks },
  { title: "Старт нового потока", url: "/offers/new_stream", icon: Rocket },
  { title: "Освободилось место", url: "/offers/spot_available", icon: UserCheck },
  { title: "Промокод", url: "/offers/discount", icon: Percent },
];

const contentPrepNav = [
  { title: "Библиотека баннеров", url: "/banner-library", icon: ImageIcon },
  { title: "Управление кейсами", url: "/cases", icon: FileVideo },
  { title: "Дерево тем", url: "/topics", icon: TreePine },
  { title: "Работа с возражениями", url: "/objections", icon: ShieldQuestion },
];

const emailSettingsNav = [
  { title: "Шаблоны писем", url: "/email-templates", icon: FileText },
  { title: "Настройка хедера и футера", url: "/email-settings", icon: Mail },
  { title: "Шаблоны цепочек", url: "/chain-templates", icon: Layers },
];

const adminNav = [
  { title: "Платные программы", url: "/manage-programs", icon: GraduationCap },
  { title: "Аккаунты соцсетей", url: "/social-accounts", icon: Globe },
  { title: "Теги", url: "/tags", icon: Tag },
  { title: "Таблица описаний", url: "/descriptions", icon: TableProperties },
  { title: "Архив", url: "/archive", icon: Archive },
  { title: "Управление промптами", url: "/prompts", icon: MessageSquareText },
  { title: "Переменные промптов", url: "/prompt-variables", icon: Braces },
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
      <SidebarContent className="sidebar-scroll">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {topNav.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    isActive={(location.pathname + location.search) === item.url || location.pathname === item.url}
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
        <SidebarGroup>
          <SidebarGroupLabel>Создание контента</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {contentCreationNav.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    isActive={(location.pathname + location.search) === item.url || location.pathname === item.url}
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
            <SidebarGroupLabel>Подготовка офферов</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {offerPrepNav.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      isActive={(location.pathname + location.search) === item.url || location.pathname === item.url}
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
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Подготовка контента</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {contentPrepNav.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      isActive={(location.pathname + location.search) === item.url || location.pathname === item.url}
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
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Администрирование</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminNav.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      isActive={(location.pathname + location.search) === item.url || location.pathname === item.url}
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
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Настройка email</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {emailSettingsNav.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      isActive={(location.pathname + location.search) === item.url || location.pathname === item.url}
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
