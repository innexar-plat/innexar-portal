"use client";

import { useState, useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  FolderOpen,
  MessageSquare,
  PlusCircle,
  Receipt,
  User,
  LogOut,
  ChevronLeft,
  Bell,
  Menu,
  X,
  FileText,
} from "lucide-react";
import {
  useWorkspaceApi,
  workspaceFetch,
  getCustomerToken,
  CUSTOMER_TOKEN_KEY,
} from "@/lib/workspace-api";

interface NavItem {
  key: string;
  label: string;
  icon: React.ElementType;
  href: string;
  badge?: number;
}

interface PortalLayoutProps {
  children: React.ReactNode;
  customerName?: string;
  projectName?: string;
}

export default function PortalLayout({
  children,
  customerName,
  projectName,
}: PortalLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [features, setFeatures] = useState<{
    invoices?: boolean;
    tickets?: boolean;
    projects?: boolean;
  } | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const isWorkspaceApi = useWorkspaceApi();

  const t = useTranslations("auth.nav");

  useEffect(() => {
    if (!isWorkspaceApi) return;
    const token = getCustomerToken();
    if (!token) return;
    workspaceFetch("/api/portal/me/features", { token })
      .then((r) => (r.ok ? r.json() : null))
      .then(setFeatures)
      .catch(() => setFeatures(null));
    workspaceFetch("/api/portal/me/dashboard", { token })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { messages?: { unread_count?: number } } | null) =>
        setUnreadCount(d?.messages?.unread_count ?? 0)
      )
      .catch(() => setUnreadCount(0));
  }, [isWorkspaceApi]);

  const navItems = useMemo(() => {
    const all: NavItem[] = [
      { key: "dashboard", label: t("dashboard"), icon: LayoutDashboard, href: `/${locale}` },
      { key: "projects", label: t("projects"), icon: FolderOpen, href: `/${locale}/projects` },
      { key: "support", label: t("support"), icon: MessageSquare, href: `/${locale}/support` },
      { key: "new-project", label: t("newProject"), icon: PlusCircle, href: `/${locale}/new-project` },
      { key: "site-briefing", label: t("siteBriefing"), icon: FileText, href: `/${locale}/site-briefing` },
      { key: "billing", label: t("billing"), icon: Receipt, href: `/${locale}/billing` },
      {
        key: "notifications",
        label: t("notifications"),
        icon: Bell,
        href: `/${locale}/notifications`,
        badge: unreadCount,
      },
      { key: "profile", label: t("profile"), icon: User, href: `/${locale}/profile` },
    ];
    if (!isWorkspaceApi || !features) return all;
    return all.filter((item) => {
      if (
        item.key === "dashboard" ||
        item.key === "profile" ||
        item.key === "site-briefing"
      )
        return true;
      if (item.key === "projects") return features.projects !== false;
      if (item.key === "support") return features.tickets !== false;
      if (item.key === "billing") return features.invoices !== false;
      if (item.key === "new-project") return false;
      return true;
    });
  }, [isWorkspaceApi, features, locale, t, unreadCount]);

  const handleLogout = () => {
    localStorage.removeItem(CUSTOMER_TOKEN_KEY);
    localStorage.removeItem("customer_email");
    localStorage.removeItem("customer_id");
    router.push(`/${locale}/login`);
  };

  const isActive = (href: string) => {
    if (href === `/${locale}`) {
      return pathname === href || pathname === `/${locale}`;
    }
    return pathname?.startsWith(href) ?? false;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{
          width: sidebarOpen ? 280 : 80,
          x:
            mobileMenuOpen
              ? 0
              : typeof window !== "undefined" && window.innerWidth < 1024
                ? -280
                : 0,
        }}
        className={`fixed top-0 left-0 h-full bg-slate-900/95 backdrop-blur-xl border-r border-white/5 z-50 flex flex-col
          ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div className="h-20 flex items-center justify-between px-6 border-b border-white/5">
          <Link href={`/${locale}`} className="flex items-center">
            <motion.div
              animate={{ width: sidebarOpen ? "auto" : "40px" }}
              className="overflow-hidden"
            >
              {sidebarOpen ? (
                <Image
                  src="/logo-header-white.png"
                  alt="Innexar"
                  width={360}
                  height={90}
                  className="h-24 w-auto"
                />
              ) : (
                <Image
                  src="/favicon.png"
                  alt="Innexar"
                  width={40}
                  height={40}
                  className="rounded-xl"
                />
              )}
            </motion.div>
          </Link>

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden lg:flex w-8 h-8 items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            <motion.div animate={{ rotate: sidebarOpen ? 0 : 180 }}>
              <ChevronLeft className="w-4 h-4 text-slate-400" />
            </motion.div>
          </button>

          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <nav className="flex-1 py-6 px-3 overflow-y-auto">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                      ${
                        active
                          ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white border border-blue-500/30"
                          : "text-slate-400 hover:text-white hover:bg-white/5"
                      }`}
                  >
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className={`flex-shrink-0 ${active ? "text-blue-400" : "text-slate-400 group-hover:text-blue-400"}`}
                    >
                      <Icon className="w-5 h-5" />
                    </motion.div>

                    <AnimatePresence>
                      {sidebarOpen && (
                        <motion.span
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          className="flex-1 font-medium"
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>

                    {item.badge !== undefined &&
                      item.badge > 0 &&
                      sidebarOpen && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="px-2 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full"
                        >
                          {item.badge}
                        </motion.span>
                      )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-3 border-t border-white/5">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <AnimatePresence>
              {sidebarOpen && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="font-medium"
                >
                  {t("logout")}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </motion.aside>

      <div
        className={`transition-all duration-300 ${sidebarOpen ? "lg:ml-[280px]" : "lg:ml-20"}`}
      >
        <header className="sticky top-0 z-30 h-20 bg-slate-900/80 backdrop-blur-xl border-b border-white/5">
          <div className="h-full px-4 lg:px-8 flex items-center justify-between">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
            >
              <Menu className="w-5 h-5 text-white" />
            </button>

            <div className="hidden lg:flex items-center gap-2">
              <h1 className="text-xl font-bold text-white">
                {projectName || customerName || "Client Portal"}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <a
                href="https://wa.me/5513991821557"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#25D366]/20 hover:bg-[#25D366]/30 transition-colors text-[#25D366]"
                aria-label="Falar com suporte no WhatsApp"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.865 9.865 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </a>
              <Link
                href={`/${locale}/notifications`}
                className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
              >
                <Bell className="w-5 h-5 text-slate-400" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-xs font-bold bg-red-500 text-white rounded-full">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>

              <motion.div
                whileHover={{ scale: 1.05 }}
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center cursor-pointer"
              >
                <span className="text-sm font-bold text-white">
                  {(customerName || "C")[0].toUpperCase()}
                </span>
              </motion.div>
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
