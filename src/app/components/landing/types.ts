export type LandingNavigatePage = "login" | "register" | "collaboration" | "about" | "faq";

export interface LeaderboardEntry {
  rank: number;
  kelurahan: string;
  kecamatan: string;
  xp: number;
}
