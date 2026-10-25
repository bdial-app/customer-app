import apiClient from "@/utils/axios";

export type WomenLedRole = "owner" | "co_owner" | "runs_it";
export type WomenLedState = "off" | "pending" | "approved" | "rejected" | "revoked";

/** The owner's Women-Led card: where it stands and what the badge gives. */
export interface MyWomenLed {
  state: WomenLedState;
  request: {
    id: string;
    womanName: string;
    role: WomenLedRole;
    note: string | null;
    hasProof: boolean;
    requestedAt: string;
    decidedAt: string | null;
    /** Why it wasn't approved, or why the team removed it. */
    reason: string | null;
    endedAt: string | null;
  } | null;
  ownerName: string;
  perks: { freeLeads: number; normalFreeLeads: number; freeDeals: number; normalFreeDeals: number };
}

export const ROLE_OPTIONS: { value: WomenLedRole; label: string; hint: string }[] = [
  { value: "owner", label: "She owns it", hint: "The business is hers" },
  { value: "co_owner", label: "She co-owns it", hint: "With a partner or family" },
  { value: "runs_it", label: "She runs it day to day", hint: "She manages the work and decisions" },
];

export const getMyWomenLed = async (): Promise<MyWomenLed> => (await apiClient.get("/women-led/mine")).data;

/** Optional proof (a photo or PDF). Only the Tijarah team can open it. */
export const uploadWomenLedProof = async (file: File): Promise<{ evidenceKey: string; name: string; type: string }> => {
  const form = new FormData();
  form.append("file", file);
  const { data } = await apiClient.post("/women-led/mine/proof", form, { headers: { "Content-Type": "multipart/form-data" } });
  return data;
};

export const requestWomenLed = async (body: {
  womanName: string;
  role: WomenLedRole;
  confirm: true;
  note?: string;
  evidenceKey?: string;
  evidenceName?: string;
  evidenceType?: string;
}): Promise<MyWomenLed> => (await apiClient.post("/women-led/mine/request", body)).data;

export const withdrawWomenLed = async (): Promise<MyWomenLed> => (await apiClient.post("/women-led/mine/withdraw")).data;

export const turnOffWomenLed = async (note?: string): Promise<MyWomenLed> =>
  (await apiClient.post("/women-led/mine/turn-off", { note })).data;
