"use client";

import { Dispatch, SetStateAction } from "react";
import { ClientContext, TabletTab } from "./LobbyShell";
import CalendarTab from "./CalendarTab";
import GalleryTab from "./GalleryTab";
import GuardiaAccount from "./GuardiaAccount";
import BrandMirror from "./BrandMirror";
import AnalyticsTab from "./AnalyticsTab";
import CommentsInbox from "./CommentsInbox";
import ContentDirectionPanel from "./ContentDirectionPanel";
import PlanningPreferencesPanel from "./PlanningPreferencesPanel";
import PostComposerScreen from "../gio/PostComposerScreen";
// VideoTab archived - see guardia-core/archive/video_pipeline_jan15/

interface TabletModeProps {
  client: ClientContext | null;
  jwt: string | null;
  activeTab: TabletTab;
  setActiveTab: Dispatch<SetStateAction<TabletTab>>;
  onClose: () => void;
  onMessage: (msg: string) => void;
  selectedPostId?: number | null;
  activeAddons?: Set<string>;
}

export default function TabletMode({
  client,
  jwt,
  activeTab,
  setActiveTab,
  onClose,
  onMessage,
  selectedPostId,
  activeAddons,
}: TabletModeProps) {
  // Calculate badge counts from client context
  const galleryBadge = (client?.pending_uploads || 0) + (client?.styled_ready || 0);
  const calendarBadge = client?.scheduled_posts || 0;
  const needsSetup = client?.needs_platform_setup;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-0 sm:p-6 md:p-8">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Tablet container */}
      <div className="relative w-full h-full sm:max-w-[95vw] sm:max-h-[95vh] bg-[var(--bg-base)] border-0 sm:border sm:border-[var(--border)] rounded-none sm:rounded-2xl flex flex-col animate-tablet-open" style={{ overflow: 'clip' }}>
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-surface)]">
          {/* Left: Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
            <TabButton
              active={activeTab === "gallery"}
              onClick={() => setActiveTab("gallery")}
              badge={galleryBadge > 0 ? galleryBadge : undefined}
              badgeColor="amber"
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              }
              label="Factory"
            />
            <TabButton
              active={activeTab === "calendar"}
              onClick={() => setActiveTab("calendar")}
              badge={calendarBadge > 0 ? calendarBadge : undefined}
              badgeColor="green"
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              }
              label="Calendar"
            />
            <TabButton
              active={activeTab === "styles"}
              onClick={() => setActiveTab("styles")}
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              }
              label="Styles"
            />
            <TabButton
              active={activeTab === "analytics"}
              onClick={() => setActiveTab("analytics")}
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              }
              label="Analytics"
            />
            <TabButton
              active={activeTab === "engage"}
              onClick={() => setActiveTab("engage")}
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              }
              label="Engage"
            />
            <TabButton
              active={activeTab === "faro"}
              onClick={() => setActiveTab("faro")}
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              }
              label="Faro"
            />
            <TabButton
              active={activeTab === "post"}
              onClick={() => setActiveTab("post")}
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                </svg>
              }
              label="Post"
            />
            <TabButton
              active={activeTab === "store"}
              onClick={() => setActiveTab("store")}
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              }
              label="Store"
            />
            <TabButton
              active={activeTab === "account"}
              onClick={() => setActiveTab("account")}
              badge={needsSetup ? "!" : undefined}
              badgeColor="red"
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              }
              label="Account"
            />
          </div>

          {/* Right: Gio bubble + Close */}
          <div className="flex items-center gap-2">
            {/* Gio chat bubble — hidden on mobile to save space */}
            <button
              onClick={onClose}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-[var(--border)] rounded-full text-[var(--text-primary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)] transition-all"
              title="Back to Giovanni"
            >
              <div className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] text-white font-semibold"
                style={{ background: 'linear-gradient(135deg, #4338CA, #7c3aed)' }}>
                G
              </div>
              <span className="text-xs">Chat</span>
            </button>

            {/* Close button */}
            <button
              onClick={onClose}
              className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] rounded-lg transition-all"
              title="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === "calendar" && (
            <CalendarTab client={client} jwt={jwt} onMessage={onMessage} />
          )}
          {activeTab === "gallery" && (
            <GalleryTab client={client} jwt={jwt} onMessage={onMessage} />
          )}
          {activeTab === "styles" && client && jwt && (
            <div className="h-full overflow-y-auto">
              <BrandMirror
                clientId={client.id}
                jwt={jwt}
                onStyleUpdated={() => onMessage("Your style has been updated! Future content will use this new look.")}
              />
              <div className="border-t border-[var(--border)]">
                <ContentDirectionPanel
                  clientId={client.id}
                  industry={client.industry || ""}
                  jwt={jwt}
                  onMessage={onMessage}
                />
              </div>
              <div className="border-t border-[var(--border)]">
                <PlanningPreferencesPanel
                  clientId={client.id}
                  jwt={jwt}
                  onMessage={onMessage}
                />
              </div>
            </div>
          )}
          {activeTab === "analytics" && (
            <AnalyticsTab client={client} jwt={jwt} selectedPostId={selectedPostId} activeAddons={activeAddons} onNavigateToStore={() => setActiveTab("store")} />
          )}
          {activeTab === "engage" && client && jwt && (
            <div className="h-full overflow-y-auto p-6">
              <div className="max-w-3xl mx-auto">
                <CommentsInbox clientId={client.id} jwt={jwt} />
              </div>
            </div>
          )}
          {activeTab === "faro" && (
            <div className="h-full overflow-y-auto p-6">
              <div className="max-w-2xl mx-auto text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-violet-500/10 flex items-center justify-center">
                  <svg className="w-8 h-8 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">Your Faro Page</h2>
                <p className="text-[var(--text-secondary)]">Faro editor loading...</p>
              </div>
            </div>
          )}
          {activeTab === "post" && (
            <PostComposerScreen
              jwt={jwt}
              onComplete={() => setActiveTab("calendar")}
            />
          )}
          {activeTab === "store" && (
            <div className="h-full overflow-y-auto p-6">
              <div className="max-w-2xl mx-auto text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                  <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">Add-on Store</h2>
                <p className="text-[var(--text-secondary)]">Store loading...</p>
              </div>
            </div>
          )}
          {activeTab === "account" && (
            <div className="h-full overflow-y-auto">
              <GuardiaAccount />
            </div>
          )}
        </div>
      </div>

      {/* Animation styles */}
      <style jsx>{`
        @keyframes tablet-open {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .animate-tablet-open {
          animation: tablet-open 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

// Tab button component with optional badge
function TabButton({
  active,
  onClick,
  icon,
  label,
  badge,
  badgeColor = "amber",
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: number | string;
  badgeColor?: "amber" | "green" | "red";
}) {
  const badgeColors = {
    amber: "bg-amber-500 text-amber-950",
    green: "bg-emerald-500 text-emerald-950",
    red: "bg-red-500 text-white",
  };

  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all min-h-[44px] ${
        active
          ? "bg-[var(--accent-muted)] text-[var(--text-primary)]"
          : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]"
      }`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
      
      {/* Badge */}
      {badge !== undefined && (
        <span 
          className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold ${badgeColors[badgeColor]}`}
          style={{ 
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
            padding: '0 5px'
          }}
        >
          {badge}
        </span>
      )}
    </button>
  );
}
