"use client";

import React from "react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import LoginForm from "@/components/LoginForm";
import AdminUsers from "@/components/AdminUsers";
import { apiGet, apiPost } from "@/lib/api";

/* ── Admin sub-pages ── */

function CalendarTab() {
  const t = useI18n();
  return <div className="space-y-4">
    <h2 className="text-xl font-bold">{t("admin.calendar")}</h2>
    <p className="text-muted">{t("admin.calendarDesc")}</p>
  </div>;
}

function SaintsTab() {
  const t = useI18n();
  return <div className="space-y-4">
    <h2 className="text-xl font-bold">{t("admin.saints")}</h2>
    <p className="text-muted">{t("admin.saintsDesc")}</p>
  </div>;
}

function TemplatesTab() {
  const t = useI18n();
  return <div className="space-y-4">
    <h2 className="text-xl font-bold">{t("admin.templates")}</h2>
    <p className="text-muted">{t("admin.templatesDesc")}</p>
  </div>;
}

function BlocksTab() {
  const t = useI18n();
  return <div className="space-y-4">
    <h2 className="text-xl font-bold">{t("admin.blocks")}</h2>
    <p className="text-muted">{t("admin.blocksDesc")}</p>
  </div>;
}

function ImportTab() {
  const t = useI18n();
  return <div className="space-y-4">
    <h2 className="text-xl font-bold">{t("admin.import")}</h2>
    <p className="text-muted">{t("admin.importDesc")}</p>
  </div>;
}

/* ── Main admin page ── */

const TABS = ["calendar", "saints", "templates", "blocks", "import", "users"] as const;
type Tab = typeof TABS[number];

export default function AdminPage() {
  const { user, loading, logout, isSuperadmin } = useAuth();
  const t = useI18n();
  const [activeTab, setActiveTab] = React.useState<Tab>("calendar");

  // Show login form if not authenticated
  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><p>...</p></div>;
  }

  if (!user) {
    return <LoginForm />;
  }

  // Regular admins don't see the Users tab
  const visibleTabs = isSuperadmin ? TABS : TABS.filter((t) => t !== "users");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("admin.title")}</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted">{user.display_name} ({user.role})</span>
          <button
            onClick={logout}
            className="rounded-lg border border-foreground/20 px-3 py-1.5 text-sm hover:bg-foreground/5 transition-colors"
          >
            {t("auth.logout")}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-lg border border-foreground/10 p-1">
        {visibleTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              activeTab === tab
                ? "bg-accent text-accent-foreground"
                : "text-muted hover:text-foreground hover:bg-foreground/5"
            }`}
          >
            {t(`admin.${tab}`)}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="rounded-xl border border-foreground/10 bg-surface p-6">
        {activeTab === "calendar" && <CalendarTab />}
        {activeTab === "saints" && <SaintsTab />}
        {activeTab === "templates" && <TemplatesTab />}
        {activeTab === "blocks" && <BlocksTab />}
        {activeTab === "import" && <ImportTab />}
        {activeTab === "users" && <AdminUsers />}
      </div>
    </div>
  );
}
