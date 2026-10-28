import { createClient, SupabaseClient } from "@supabase/supabase-js";

let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_KEY;

  if (!url || !key) {
    return null;
  }

  if (!supabaseInstance) {
    supabaseInstance = createClient(url, key, {
      auth: { persistSession: false },
    });
  }
  return supabaseInstance;
}

// In-memory fallback if Supabase is not configured yet
let memoryHistory: any[] = [];
let memoryTemplates: any[] = [];
let memorySurveys: any[] = [];

export const dbStore = {
  // --- History
  async getHistory() {
    const sb = getSupabase();
    if (sb) {
      const { data, error } = await sb
        .from("qr_history")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (!error && data) return data;
      console.warn("Supabase history error:", error);
    }
    return memoryHistory;
  },

  async addHistory(item: {
    title: string;
    tab: string;
    data_json: string;
    customization_json: string;
    is_favorite?: boolean;
    user_name?: string;
    user_email?: string;
  }) {
    const sb = getSupabase();
    if (sb) {
      const { data, error } = await sb
        .from("qr_history")
        .insert([
          {
            title: item.title,
            tab: item.tab,
            data_json: item.data_json,
            customization_json: item.customization_json,
            is_favorite: !!item.is_favorite,
            user_name: item.user_name || "Colleague",
            user_email: item.user_email || "",
          },
        ])
        .select()
        .single();
      if (!error && data) return data;
      console.warn("Supabase addHistory error:", error);
    }
    const fallbackItem = {
      id: Date.now(),
      created_at: new Date().toISOString(),
      ...item,
    };
    memoryHistory = [fallbackItem, ...memoryHistory].slice(0, 100);
    return fallbackItem;
  },

  async deleteHistory(id: string | number) {
    const sb = getSupabase();
    if (sb) {
      await sb.from("qr_history").delete().eq("id", id);
    }
    memoryHistory = memoryHistory.filter((h) => String(h.id) !== String(id));
  },

  async updateHistoryTitle(id: string | number, title: string) {
    const sb = getSupabase();
    if (sb) {
      await sb.from("qr_history").update({ title }).eq("id", id);
    }
    const idx = memoryHistory.findIndex((h) => String(h.id) === String(id));
    if (idx !== -1) memoryHistory[idx].title = title;
  },

  async toggleHistoryFavorite(id: string | number) {
    const sb = getSupabase();
    if (sb) {
      const { data } = await sb.from("qr_history").select("is_favorite").eq("id", id).single();
      if (data) {
        await sb.from("qr_history").update({ is_favorite: !data.is_favorite }).eq("id", id);
      }
    }
    const idx = memoryHistory.findIndex((h) => String(h.id) === String(id));
    if (idx !== -1) memoryHistory[idx].is_favorite = !memoryHistory[idx].is_favorite;
  },

  // --- Templates
  async getTemplates() {
    const sb = getSupabase();
    if (sb) {
      const { data, error } = await sb
        .from("qr_templates")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data) return data;
    }
    return memoryTemplates;
  },

  async addTemplate(tpl: { name: string; is_default: boolean; config_json: string }) {
    const sb = getSupabase();
    if (sb) {
      const { data, error } = await sb.from("qr_templates").insert([tpl]).select().single();
      if (!error && data) return data;
    }
    const item = { id: Date.now(), created_at: new Date().toISOString(), ...tpl };
    memoryTemplates = [...memoryTemplates, item];
    return item;
  },

  async deleteTemplate(id: string | number) {
    const sb = getSupabase();
    if (sb) {
      await sb.from("qr_templates").delete().eq("id", id);
    }
    memoryTemplates = memoryTemplates.filter((t) => String(t.id) !== String(id));
  },

  // --- Surveys
  async getSurveys() {
    const sb = getSupabase();
    if (sb) {
      const { data, error } = await sb.from("qr_surveys").select("*").order("created_at", { ascending: false });
      if (!error && data) return data;
    }
    return memorySurveys;
  },

  async addSurvey(survey: { survey_key: string; name: string; base_url: string; fields_json: string }) {
    const sb = getSupabase();
    if (sb) {
      const { data, error } = await sb.from("qr_surveys").insert([survey]).select().single();
      if (!error && data) return data;
    }
    const item = { id: Date.now(), created_at: new Date().toISOString(), ...survey };
    memorySurveys = [...memorySurveys, item];
    return item;
  },

  async deleteSurvey(id: string | number) {
    const sb = getSupabase();
    if (sb) {
      await sb.from("qr_surveys").delete().eq("id", id);
    }
    memorySurveys = memorySurveys.filter((s) => String(s.id) !== String(id));
  },
};
