"use client";

import { ScreenProps } from "./types";
import AnalyticsTab from "../lobby/AnalyticsTab";
import CommentsInbox from "../lobby/CommentsInbox";
import FaroAnalyticsSection from "./FaroAnalyticsSection";

/**
 * StatsScreen — Gio App
 *
 * Merges Analytics + Comments Inbox + Faro Analytics into one scrollable view.
 * - Top: KPI cards, engagement chart, platform breakdown, top posts (from AnalyticsTab)
 * - Middle: Comments inbox with reply actions (from CommentsInbox)
 * - Bottom: Faro bio page analytics (views, clicks, emails, CTR)
 *
 * AnalyticsTab's root div uses h-full overflow-y-auto, which we override
 * via [&>*] selector so it flows naturally within our scroll container.
 */
export default function StatsScreen({ client, jwt, onPostSelect: _onPostSelect, activeAddons, onNavigateToStore }: ScreenProps) {
  return (
    <div className="h-full overflow-y-auto bg-[var(--bg-base)]">
      {/* Analytics section — neutralize AnalyticsTab's own scroll container */}
      <div className="[&>*]:!h-auto [&>*]:!overflow-visible">
        <AnalyticsTab client={client} jwt={jwt} selectedPostId={null} activeAddons={activeAddons} onNavigateToStore={onNavigateToStore} />
      </div>

      {/* Comments section */}
      {client?.id && jwt && (
        <div className="px-4 md:px-6 pb-6 max-w-3xl mx-auto">
          <h3 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-3">
            Engagement
          </h3>
          <CommentsInbox clientId={client.id} jwt={jwt} />
        </div>
      )}

      {/* Faro page analytics section */}
      {jwt && (
        <div className="px-4 md:px-6 pb-8 max-w-3xl mx-auto">
          <FaroAnalyticsSection jwt={jwt} faroSlug={client?.faro_slug} />
        </div>
      )}
    </div>
  );
}
