/**
 * Gio App — Shared Types
 *
 * Standard interfaces for all Gio screens.
 * Compatible with legacy ClientContext from LobbyShell.
 */

export interface GioClient {
  id: string;
  business_name: string;
  contact_name: string;
  tier: "free" | "spark" | "pro" | "unleashed";
  preferred_style?: string;
  industry?: string;
  pending_uploads: number;
  styled_ready: number;
  scheduled_posts: number;
  posted_this_month: number;
  last_post?: string;
  facebook_connected?: boolean;
  instagram_connected?: boolean;
  needs_platform_setup?: boolean;
  faro_slug?: string;
  active_addons?: string[];
}

export interface ScreenProps {
  client: GioClient | null;
  jwt: string | null;
  onMessage?: (msg: string) => void;
  onPostSelect?: (postId: number) => void;
}
