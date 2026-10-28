"use client";

import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { toast } from "sonner";

/* ── Types ──────────────────────────────────────────────────────────────── */

declare global {
  interface Window {
    QRCodeStyling: any;
    html2canvas: any;
    jsQR: any;
    PptxGenJS: any;
  }
}

interface SurveyField {
  name: string;
  param: string;
  placeholder: string;
}

interface SurveyConfig {
  id: string;
  name: string;
  baseUrl: string;
  fields: SurveyField[];
}

interface VisualSettings {
  frame: string;
  framePadding: number;
  topText: string;
  bottomText: string;
  textColor: string;
  textSize: number;
  fontStyle: string;
  badge: string;
  badgeSize: number;
  logoPos: string;
  logoSize: number;
  titleEnabled: boolean;
  titleText: string;
  titlePosition: "above" | "below";
  titleSize: number;
  titleColor: string;
  titleFontStyle: string;
  titleBold: boolean;
}

interface QRCustomization {
  size: number;
  fgColor: string;
  bgColor: string;
  mixed: boolean;
  useGradient: boolean;
  gradC1: string;
  gradC2: string;
  gradRot: string;
  dotType: string;
  cornerType: string;
  logo: string | null;
  visualSettings: VisualSettings;
}

interface HistoryItem {
  id?: number | string;
  localId?: string;
  title: string;
  tab: string;
  data: any;
  customization: QRCustomization;
  isFavorite: boolean;
  timestamp: string;
  userName?: string;
  userEmail?: string;
}

interface TemplateItem {
  id?: number | string;
  localId?: string;
  name: string;
  tab: string;
  data: any;
  customization: QRCustomization;
  isDefault: boolean;
}

/* ── Defaults ───────────────────────────────────────────────────────────── */

const DEFAULT_VISUAL: VisualSettings = {
  frame: "none", framePadding: 20, topText: "", bottomText: "",
  textColor: "#333333", textSize: 18, fontStyle: "Arial",
  badge: "none", badgeSize: 30, logoPos: "center", logoSize: 30,
  titleEnabled: false, titleText: "", titlePosition: "above",
  titleSize: 22, titleColor: "#0E2841", titleFontStyle: "Arial", titleBold: true,
};

const DEFAULT_CUSTOMIZATION: QRCustomization = {
  size: 300, fgColor: "#000000", bgColor: "#ffffff",
  mixed: false, useGradient: false,
  gradC1: "#ff8c00", gradC2: "#000000", gradRot: "0",
  dotType: "square", cornerType: "square",
  logo: null, visualSettings: { ...DEFAULT_VISUAL },
};

const ORANGE_PRESETS: TemplateItem[] = [
  {
    localId: "preset_orange_classic", name: "Orange Classic", tab: "custom", data: {},
    customization: { size: 300, fgColor: "#FF6600", bgColor: "#ffffff", mixed: false, useGradient: false, gradC1: "#ff8c00", gradC2: "#000000", gradRot: "0", dotType: "rounded", cornerType: "dot", logo: null, visualSettings: { ...DEFAULT_VISUAL, frame: "orange", framePadding: 15 } },
    isDefault: false,
  },
  {
    localId: "preset_orange_gradient", name: "Orange Gradient", tab: "custom", data: {},
    customization: { size: 300, fgColor: "#FF6600", bgColor: "#ffffff", mixed: false, useGradient: true, gradC1: "#FF6600", gradC2: "#0E2841", gradRot: "135", dotType: "classy-rounded", cornerType: "extra-rounded", logo: null, visualSettings: { ...DEFAULT_VISUAL, frame: "gradient", framePadding: 15 } },
    isDefault: false,
  },
  {
    localId: "preset_orange_mixed", name: "Orange Mixed", tab: "custom", data: {},
    customization: { size: 300, fgColor: "#000000", bgColor: "#ffffff", mixed: true, useGradient: false, gradC1: "#ff8c00", gradC2: "#000000", gradRot: "0", dotType: "extra-rounded", cornerType: "dot", logo: null, visualSettings: { ...DEFAULT_VISUAL } },
    isDefault: false,
  },
  {
    localId: "preset_navy_elegant", name: "Navy Elegant", tab: "custom", data: {},
    customization: { size: 300, fgColor: "#0E2841", bgColor: "#ffffff", mixed: false, useGradient: false, gradC1: "#ff8c00", gradC2: "#000000", gradRot: "0", dotType: "classy", cornerType: "square", logo: null, visualSettings: { ...DEFAULT_VISUAL, frame: "simple", framePadding: 20 } },
    isDefault: false,
  },
  {
    localId: "preset_scan_me", name: "Scan Me", tab: "custom", data: {},
    customization: { size: 300, fgColor: "#FF6600", bgColor: "#ffffff", mixed: false, useGradient: false, gradC1: "#ff8c00", gradC2: "#000000", gradRot: "0", dotType: "dots", cornerType: "dot", logo: null, visualSettings: { ...DEFAULT_VISUAL, frame: "orange", framePadding: 20, titleText: "SCAN ME", titlePosition: "above", titleColor: "#FF6600", titleSize: 20, titleFontStyle: "Arial", titleBold: true } },
    isDefault: false,
  },
  {
    localId: "preset_dark_mode", name: "Dark Mode", tab: "custom", data: {},
    customization: { size: 300, fgColor: "#FF6600", bgColor: "#0E2841", mixed: false, useGradient: false, gradC1: "#ff8c00", gradC2: "#000000", gradRot: "0", dotType: "rounded", cornerType: "extra-rounded", logo: null, visualSettings: { ...DEFAULT_VISUAL, frame: "shadow", framePadding: 15 } },
    isDefault: false,
  },
];

const BUILTIN_SURVEYS: Record<string, SurveyConfig> = {
  course_attendance: {
    id: "course_attendance", name: "Course Attendance (V1)",
    baseUrl: "https://msurvey.orange.com/Pre_training_questionnaire?",
    fields: [
      { name: "Instructor", param: "Instructor", placeholder: "Instructor name" },
      { name: "Course Name", param: "CourseName", placeholder: "Course title" },
      { name: "Location", param: "Course_loc", placeholder: "e.g., Kempinski" },
      { name: "Provider", param: "Provider", placeholder: "e.g., Impact" },
    ],
  },
  course_attendance_v2: {
    id: "course_attendance_v2", name: "Course Attendance (V2)",
    baseUrl: "https://msurvey.orange.com/Pre_training_questionnaire_V2?",
    fields: [
      { name: "Instructor", param: "Instructor", placeholder: "Instructor name" },
      { name: "Course Name", param: "CourseName", placeholder: "Course title" },
      { name: "Location", param: "Course_loc", placeholder: "e.g., Kempinski" },
      { name: "Provider", param: "Provider", placeholder: "e.g., Impact" },
    ],
  },
  course_evaluation: {
    id: "course_evaluation", name: "Course Evaluation",
    baseUrl: "https://msurvey.orange.com/Training_Course_Evaluation_E_A?",
    fields: [
      { name: "Instructor", param: "Instructor", placeholder: "Instructor name" },
      { name: "Course Name", param: "CourseName", placeholder: "Course title" },
      { name: "Location", param: "Course_loc", placeholder: "e.g., Kempinski" },
      { name: "Provider", param: "Provider", placeholder: "e.g., Impact" },
    ],
  },
  course_evaluation_v3: {
    id: "course_evaluation_v3", name: "Course Evaluation (V3)",
    baseUrl: "https://msurvey.orange.com/Training_Course_Evaluation_E_NEW?",
    fields: [
      { name: "Instructor", param: "Instructor", placeholder: "Instructor name" },
      { name: "Course Name", param: "CourseName", placeholder: "Course title" },
      { name: "Location", param: "Course_loc", placeholder: "e.g., Kempinski" },
      { name: "Provider", param: "Provider", placeholder: "e.g., Impact" },
    ],
  },
  genai_dinootoo: {
    id: "genai_dinootoo", name: "Gen AI - Dinootoo session",
    baseUrl: "https://msurvey.orange.com/Post_Session_GenAI_and_Dinootoo",
    fields: [],
  },
};

const SPECIAL_TYPE = "attendance_and_evaluation";
const SPECIAL_TYPE_V2 = "attendance_v2_and_evaluation";
const SPECIAL_TYPE_V3 = "attendance_v2_and_evaluation_v3";
const MANUAL_TYPE = "manual_custom";

const BADGE_ICONS: Record<string, string> = {
  wifi: "\u{1F4F6}", instagram: "\u{1F4F7}", whatsapp: "\u{1F4AC}",
  facebook: "\u{1F44D}", email: "\u{2709}\u{FE0F}", phone: "\u{1F4F1}",
};

const DOT_STYLES = ["square", "dots", "rounded", "extra-rounded", "classy", "classy-rounded"];
const CORNER_STYLES = ["square", "dot", "extra-rounded"];
const FONT_STYLES = ["Arial", "Helvetica", "Georgia", "Impact", "Courier New"];
const FRAME_TYPES = ["none", "simple", "rounded", "shadow", "orange", "gradient"];

/* ── localStorage helpers (fallback) ────────────────────────────────────── */

const LS_HISTORY = "qr_history_standalone";
const LS_TEMPLATES = "qr_templates_standalone";
const LS_SURVEYS = "qr_surveys_standalone";
const LS_CREATOR = "qr_creator_name";

function lsGet<T>(key: string, fallback: T): T {
  try {
    const v = typeof window !== "undefined" ? localStorage.getItem(key) : null;
    return v ? JSON.parse(v) : fallback;
  } catch { return fallback; }
}
function lsSet(key: string, value: any) {
  try { if (typeof window !== "undefined") localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

/* ── URL helpers ────────────────────────────────────────────────────────── */

function normalizeUrl(raw: string): string {
  let url = raw.trim();
  if (!url) return "";
  if (!/^(https?:\/\/|mailto:|tel:)/i.test(url)) url = "https://" + url;
  return url;
}

function buildUrl(baseUrl: string, fields: SurveyField[], values: Record<string, string>): string {
  const params: string[] = [];
  fields.forEach((f) => {
    const v = (values[f.param] || "").trim();
    if (v) params.push(`${f.param}=${encodeURIComponent(v)}`);
  });
  let url = baseUrl.trim();
  if (!url) return "";
  if (params.length === 0) return url;
  let sep = "?";
  if (url.includes("?")) sep = url.endsWith("?") || url.endsWith("&") ? "" : "&";
  return url + sep + params.join("&");
}

function checkUrlHealth(url: string): { valid: boolean; warning: string } {
  let warning = "";
  try { new URL(url); } catch { return { valid: false, warning: "Invalid URL format." }; }
  if (url.length > 250) warning = "URL is very long and may be hard to scan.";
  return { valid: true, warning };
}

/* ── Page Component ─────────────────────────────────────────────────────── */

export default function QRCodesPage() {
  const [userName, setUserName] = useState<string>("");
  const [scriptsReady, setScriptsReady] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_CREATOR) || "";
      setUserName(saved);
    } catch {}

    const SCRIPTS = [
      "https://unpkg.com/qr-code-styling@1.5.0/lib/qr-code-styling.js",
      "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js",
      "https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js",
      "https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js",
    ];
    let cancelled = false;
    function loadScript(src: string): Promise<void> {
      return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
        const s = document.createElement("script");
        s.src = src;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error(`Failed to load ${src}`));
        document.head.appendChild(s);
      });
    }
    (async () => {
      try {
        for (const src of SCRIPTS) await loadScript(src);
        if (!cancelled) setScriptsReady(true);
      } catch (e) {
        console.error("Script load error:", e);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleNameChange = (val: string) => {
    setUserName(val);
    try { localStorage.setItem(LS_CREATOR, val); } catch {}
  };

  // --- Tabs
  const [activeTab, setActiveTab] = useState<"custom" | "survey">("custom");

  // --- Custom tab
  const [customUrl, setCustomUrl] = useState("");
  const [urlWarning, setUrlWarning] = useState("");

  // --- Survey tab
  const [surveyType, setSurveyType] = useState("");
  const [surveyValues, setSurveyValues] = useState<Record<string, string>>({});
  const [surveyConfigs, setSurveyConfigs] = useState<Record<string, SurveyConfig>>({});
  const [manualBaseUrl, setManualBaseUrl] = useState("");
  const [manualFields, setManualFields] = useState<SurveyField[]>([]);
  const [showSurveyEditor, setShowSurveyEditor] = useState(false);
  const [editingSurvey, setEditingSurvey] = useState<SurveyConfig | null>(null);

  // --- Customization
  const [cust, setCust] = useState<QRCustomization>({ ...DEFAULT_CUSTOMIZATION });
  const [logoFile, setLogoFile] = useState<string | null>(null);

  // --- Visual enhancements
  const [visual, setVisual] = useState<VisualSettings>({ ...DEFAULT_VISUAL });
  const [visualTab, setVisualTab] = useState("frames");

  // --- QR result
  const [qrResults, setQrResults] = useState<{ id: string; title: string; url: string; verified: boolean | null; verifyMsg: string }[]>([]);
  const qrResultsRef = useRef<{ id: string; title: string }[]>([]);
  const titleTextRef = useRef<string | null>(null);
  const qrInstancesRef = useRef<Record<string, any>>({});
  const qrCanvasRef = useRef<Record<string, HTMLCanvasElement>>({});

  // --- History & Templates
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [showFavOnly, setShowFavOnly] = useState(false);

  // --- Collapsible sections
  const [sectionsOpen, setSectionsOpen] = useState<Record<string, boolean>>({ visual: false, templates: false, customize: true, history: true, surveyConfig: false });
  const toggleSection = (key: string) => setSectionsOpen((s) => ({ ...s, [key]: !s[key] }));

  // --- Template modal
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState("");

  // Load data on mount
  useEffect(() => {
    loadHistory();
    loadTemplates();
    loadSurveyConfigs();
  }, []);

  /* Live re-render on customization changes */
  useEffect(() => {
    if (qrResults.length === 0) return;
    let cancelled = false;
    const t = setTimeout(async () => {
      for (const r of qrResults) {
        if (cancelled) return;
        await renderQR(r.id, r.url);
        if (cancelled) return;
        await swapInComposedCanvas(r.id);
      }
    }, 120);
    return () => { cancelled = true; clearTimeout(t); };
  }, [cust.size, cust.fgColor, cust.bgColor, cust.useGradient, cust.gradC1, cust.gradC2, cust.gradRot, cust.dotType, cust.cornerType, cust.mixed]);

  /* Visual enhancements live re-render */
  useEffect(() => {
    if (qrResults.length === 0) return;
    let cancelled = false;
    const t = setTimeout(async () => {
      for (const r of qrResults) {
        if (cancelled) return;
        await swapInComposedCanvas(r.id);
      }
    }, 80);
    return () => { cancelled = true; clearTimeout(t); };
  }, [visual, logoFile]);

  // URL validation on change
  useEffect(() => {
    if (activeTab === "custom" && customUrl.trim()) {
      const url = normalizeUrl(customUrl);
      const { warning } = checkUrlHealth(url);
      setUrlWarning(warning);
    } else {
      setUrlWarning("");
    }
  }, [customUrl, activeTab]);

  /* ── Data loading with backend/Supabase and local fallback ──── */

  async function loadHistory() {
    try {
      const data = await api.get<any[]>("/api/qr/history");
      const items: HistoryItem[] = data.map((d) => ({
        id: d.id,
        title: d.title,
        tab: d.tab,
        data: typeof d.data_json === "string" ? JSON.parse(d.data_json) : d.data_json,
        customization: typeof d.customization_json === "string" ? JSON.parse(d.customization_json) : d.customization_json,
        isFavorite: d.is_favorite,
        timestamp: d.created_at,
        userName: d.user_name,
        userEmail: d.user_email,
      }));
      setHistory(items);
      lsSet(LS_HISTORY, items);
    } catch {
      setHistory(lsGet<HistoryItem[]>(LS_HISTORY, []));
    }
  }

  async function loadTemplates() {
    try {
      const data = await api.get<any[]>("/api/qr/templates");
      const items: TemplateItem[] = data.map((d) => ({
        id: d.id,
        name: d.name,
        isDefault: d.is_default,
        ...(typeof d.config_json === "string" ? JSON.parse(d.config_json) : d.config_json),
      }));
      setTemplates(items);
      lsSet(LS_TEMPLATES, items);
    } catch {
      setTemplates(lsGet<TemplateItem[]>(LS_TEMPLATES, []));
    }
  }

  async function loadSurveyConfigs() {
    try {
      const data = await api.get<any[]>("/api/qr/surveys");
      const configs: Record<string, SurveyConfig> = {};
      data.forEach((d) => {
        configs[d.survey_key] = {
          id: d.survey_key,
          name: d.name,
          baseUrl: d.base_url,
          fields: typeof d.fields_json === "string" ? JSON.parse(d.fields_json) : d.fields_json,
        };
      });
      setSurveyConfigs(configs);
      lsSet(LS_SURVEYS, configs);
    } catch {
      setSurveyConfigs(lsGet<Record<string, SurveyConfig>>(LS_SURVEYS, {}));
    }
  }

  /* ── History downloads ────────────────────────────────────── */

  function collectItemUrls(item: HistoryItem): { label: string; url: string }[] {
    if (item.tab === "custom") {
      const u = item.data?.url;
      return u ? [{ label: "URL", url: u }] : [];
    }
    const type = item.data?.type || "";
    const urls: Record<string, string> = item.data?.urls || {};
    const values: Record<string, string> = item.data?.values || {};
    const out: { label: string; url: string }[] = [];
    const push = (label: string, url: string) => { if (url) out.push({ label, url }); };

    if (Object.keys(urls).length > 0) {
      Object.entries(urls).forEach(([id, u]) => {
        let label = "URL";
        if (id === "attendance_qr") label = "Attendance";
        else if (id === "evaluation_qr") label = type === SPECIAL_TYPE_V3 ? "Evaluation (V3)" : "Evaluation";
        else label = ({ ...BUILTIN_SURVEYS, ...surveyConfigs }[type]?.name) || "Survey";
        push(label, u);
      });
    } else if (type === SPECIAL_TYPE || type === SPECIAL_TYPE_V2 || type === SPECIAL_TYPE_V3) {
      const attCfg = type === SPECIAL_TYPE ? BUILTIN_SURVEYS.course_attendance : BUILTIN_SURVEYS.course_attendance_v2;
      const evalCfg = type === SPECIAL_TYPE_V3 ? BUILTIN_SURVEYS.course_evaluation_v3 : BUILTIN_SURVEYS.course_evaluation;
      push("Attendance", buildUrl(attCfg.baseUrl, attCfg.fields, values));
      push(type === SPECIAL_TYPE_V3 ? "Evaluation (V3)" : "Evaluation", buildUrl(evalCfg.baseUrl, evalCfg.fields, values));
    } else if (type) {
      push(({ ...BUILTIN_SURVEYS, ...surveyConfigs }[type]?.name) || "Survey", getSurveyUrl(type, values));
    }
    return out;
  }

  function safeFileName(s: string): string {
    return (s || "qr").replace(/[^\w\d\- ]+/g, "_").replace(/\s+/g, "_").slice(0, 80) || "qr";
  }

  async function urlToPngDataUrl(url: string, size = 512): Promise<string> {
    if (!window.QRCodeStyling) throw new Error("QR library not ready");
    const tmp = document.createElement("div");
    tmp.style.display = "none";
    document.body.appendChild(tmp);
    try {
      const inst = new window.QRCodeStyling({ width: size, height: size, data: url });
      await inst.append(tmp);
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      const canvas = tmp.querySelector("canvas") as HTMLCanvasElement | null;
      if (!canvas) throw new Error("QR canvas missing");
      return canvas.toDataURL("image/png");
    } finally {
      document.body.removeChild(tmp);
    }
  }

  function triggerDownload(filename: string, href: string) {
    const a = document.createElement("a");
    a.href = href; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
  }

  async function downloadHistoryItem(item: HistoryItem) {
    if (!scriptsReady) { toast.error("Libraries still loading..."); return; }
    const parts = collectItemUrls(item);
    if (parts.length === 0) { toast.error("No URLs found in this entry"); return; }

    const base = safeFileName(item.title);
    const txt = parts.map((p) => `${p.label}: ${p.url}`).join("\r\n");
    triggerDownload(`${base}_URLs.txt`, "data:text/plain;charset=utf-8," + encodeURIComponent(txt));

    for (const p of parts) {
      try {
        const png = await urlToPngDataUrl(p.url, 512);
        triggerDownload(`${base}_${safeFileName(p.label)}.png`, png);
      } catch (e: any) {
        console.error("QR download failed:", e);
        toast.error(`Failed QR for ${p.label}`);
      }
    }
    toast.success(`Downloaded ${parts.length} QR + URL list`);
  }

  async function saveHistory(item: HistoryItem) {
    const creator = userName.trim() || "Colleague";
    const itemWithUser = { ...item, userName: creator };
    const updated = [itemWithUser, ...history].slice(0, 50);
    setHistory(updated);
    lsSet(LS_HISTORY, updated);

    try {
      await api.post("/api/qr/history", {
        title: item.title,
        tab: item.tab,
        data_json: JSON.stringify(item.data),
        customization_json: JSON.stringify(item.customization),
        is_favorite: item.isFavorite,
        user_name: creator,
      });
    } catch {
      // localStorage has it
    }
  }

  async function renameHistory(index: number) {
    const item = history[index];
    const next = window.prompt("Rename this history entry:", item.title);
    if (next === null) return;
    const title = next.trim();
    if (!title || title === item.title) return;
    const updated = [...history];
    updated[index] = { ...updated[index], title };
    setHistory(updated);
    lsSet(LS_HISTORY, updated);
    if (item.id) {
      try { await api.put(`/api/qr/history/${item.id}/title`, { title }); } catch {}
    }
  }

  async function deleteHistory(index: number) {
    const item = history[index];
    const updated = history.filter((_, i) => i !== index);
    setHistory(updated);
    lsSet(LS_HISTORY, updated);
    if (item.id) {
      try { await api.del(`/api/qr/history/${item.id}`); } catch {}
    }
  }

  async function toggleFavorite(index: number) {
    const updated = [...history];
    updated[index] = { ...updated[index], isFavorite: !updated[index].isFavorite };
    setHistory(updated);
    lsSet(LS_HISTORY, updated);
    if (updated[index].id) {
      try { await api.put(`/api/qr/history/${updated[index].id}/favorite`); } catch {}
    }
  }

  async function saveTemplate() {
    if (!templateName.trim()) { toast.error("Enter a template name"); return; }
    const tpl: TemplateItem = {
      localId: `tpl_${Date.now()}`, name: templateName.trim(),
      tab: activeTab, data: activeTab === "custom" ? { url: customUrl } : { type: surveyType, values: surveyValues },
      customization: { ...cust, logo: logoFile, visualSettings: { ...visual } },
      isDefault: templates.length === 0,
    };
    const updated = [...templates, tpl];
    setTemplates(updated);
    lsSet(LS_TEMPLATES, updated);
    setShowTemplateModal(false);
    setTemplateName("");
    toast.success("Template saved");
    try {
      await api.post("/api/qr/templates", {
        name: tpl.name, is_default: tpl.isDefault,
        config_json: JSON.stringify({ tab: tpl.tab, data: tpl.data, customization: tpl.customization }),
      });
    } catch {}
  }

  async function deleteTemplate(index: number) {
    const tpl = templates[index];
    const updated = templates.filter((_, i) => i !== index);
    setTemplates(updated);
    lsSet(LS_TEMPLATES, updated);
    if (tpl.id) { try { await api.del(`/api/qr/templates/${tpl.id}`); } catch {} }
  }

  async function saveSurveyConfig(config: SurveyConfig) {
    const key = config.id || `survey_${Date.now()}`;
    const updated = { ...surveyConfigs, [key]: { ...config, id: key } };
    setSurveyConfigs(updated);
    lsSet(LS_SURVEYS, updated);
    setShowSurveyEditor(false);
    setEditingSurvey(null);
    toast.success("Survey config saved");
    try {
      await api.post("/api/qr/surveys", {
        survey_key: key, name: config.name, base_url: config.baseUrl, fields_json: JSON.stringify(config.fields),
      });
    } catch {}
  }

  async function deleteSurveyConfig(key: string) {
    const updated = { ...surveyConfigs };
    const target = updated[key];
    delete updated[key];
    setSurveyConfigs(updated);
    lsSet(LS_SURVEYS, updated);
    if (target?.id) {
      try { await api.del(`/api/qr/surveys/${target.id}`); } catch {}
    }
  }

  /* ── QR Generation ────────────────────────────────────────── */

  function getGenerateUrl(): string | null {
    if (activeTab === "custom") {
      const url = normalizeUrl(customUrl);
      if (!url) return null;
      const { valid } = checkUrlHealth(url);
      return valid ? url : null;
    }
    return null;
  }

  function canGenerate(): boolean {
    if (activeTab === "custom") return !!getGenerateUrl();
    if (!surveyType) return false;
    if (surveyType === MANUAL_TYPE) return !!manualBaseUrl.trim();
    const hasValues = Object.values(surveyValues).some((v) => v.trim());
    return hasValues;
  }

  function getSurveyUrl(type: string, vals: Record<string, string>): string {
    if (type === MANUAL_TYPE) {
      const base = normalizeUrl(manualBaseUrl);
      return manualFields.length ? buildUrl(base, manualFields, vals) : base;
    }
    const config = { ...BUILTIN_SURVEYS, ...surveyConfigs }[type];
    if (!config) return "";
    return buildUrl(config.baseUrl, config.fields, vals);
  }

  function waitForQRContainersAndRender(
    results: { id: string; url: string }[],
    onAllRendered?: () => void
  ) {
    let attempts = 0;
    const tryRender = () => {
      const allExist = results.every((r) => document.getElementById(`qrCode_${r.id}`));
      const libReady = typeof window !== "undefined" && !!window.QRCodeStyling;
      if (allExist && libReady) {
        (async () => {
          for (const r of results) {
            await renderQR(r.id, r.url);
            await verifyQR(r.id, r.url);
            await swapInComposedCanvas(r.id);
          }
          onAllRendered?.();
        })();
      } else if (attempts < 100) {
        attempts++;
        setTimeout(tryRender, 50);
      } else {
        toast.error("QR library failed to load. Please refresh the page.");
      }
    };
    setTimeout(tryRender, 50);
  }

  async function generateQR() {
    if (!scriptsReady) { toast.error("Libraries still loading..."); return; }
    if (!canGenerate()) { toast.error("Please fill in the required fields"); return; }

    let effectiveTitleText = visual.titleText.trim();
    if (!effectiveTitleText) {
      const courseName = (surveyValues.CourseName || "").trim();
      const fallback = surveyType
        ? ((BUILTIN_SURVEYS as Record<string, SurveyConfig>)[surveyType]?.name
           || surveyConfigs[surveyType]?.name || "")
        : "";
      effectiveTitleText = courseName || fallback;
      if (effectiveTitleText) setVisual((v) => ({ ...v, titleText: effectiveTitleText }));
    }
    titleTextRef.current = effectiveTitleText;

    const results: typeof qrResults = [];
    qrInstancesRef.current = {};
    qrCanvasRef.current = {};

    if (activeTab === "custom") {
      const url = getGenerateUrl()!;
      results.push({ id: "custom_qr", title: "Custom URL", url, verified: null, verifyMsg: "" });
    } else if (surveyType === SPECIAL_TYPE || surveyType === SPECIAL_TYPE_V2 || surveyType === SPECIAL_TYPE_V3) {
      const attCfg = surveyType === SPECIAL_TYPE ? BUILTIN_SURVEYS.course_attendance : BUILTIN_SURVEYS.course_attendance_v2;
      const evalCfg = surveyType === SPECIAL_TYPE_V3 ? BUILTIN_SURVEYS.course_evaluation_v3 : BUILTIN_SURVEYS.course_evaluation;
      const attUrl = buildUrl(attCfg.baseUrl, attCfg.fields, surveyValues);
      const evalUrl = buildUrl(evalCfg.baseUrl, evalCfg.fields, surveyValues);
      results.push({ id: "attendance_qr", title: attCfg.name, url: attUrl, verified: null, verifyMsg: "" });
      results.push({ id: "evaluation_qr", title: evalCfg.name, url: evalUrl, verified: null, verifyMsg: "" });
    } else {
      const url = getSurveyUrl(surveyType, surveyValues);
      if (!url) { toast.error("Could not build URL"); return; }
      results.push({ id: "survey_qr", title: (({ ...BUILTIN_SURVEYS, ...surveyConfigs })[surveyType]?.name || "Survey"), url, verified: null, verifyMsg: "" });
    }

    qrResultsRef.current = results;
    setQrResults(results);

    waitForQRContainersAndRender(results, () => {
      const courseName = (surveyValues.CourseName || "").trim();
      const labelPart = results.map((r) => r.title).join(" + ");
      const histItem: HistoryItem = {
        localId: `h_${Date.now()}`,
        title: activeTab === "custom" || !courseName ? labelPart : `${courseName} — ${labelPart}`,
        tab: activeTab,
        data: activeTab === "custom" ? { url: results[0].url } : { type: surveyType, values: { ...surveyValues }, urls: Object.fromEntries(results.map((r) => [r.id, r.url])) },
        customization: { ...cust, logo: logoFile, visualSettings: { ...visual } },
        isFavorite: false, timestamp: new Date().toISOString(),
      };
      saveHistory(histItem);
    });
  }

  async function renderQR(id: string, data: string) {
    const container = document.getElementById(`qrCode_${id}`);
    if (!container || !window.QRCodeStyling) return;
    container.innerHTML = "";

    const dotsOptions: any = { type: cust.dotType };
    if (cust.useGradient) {
      dotsOptions.gradient = {
        type: "linear",
        rotation: (parseFloat(cust.gradRot) * Math.PI) / 180,
        colorStops: [{ offset: 0, color: cust.gradC1 }, { offset: 1, color: cust.gradC2 }],
      };
    } else {
      dotsOptions.color = cust.mixed ? "#000000" : cust.fgColor;
    }

    const options = {
      width: cust.size, height: cust.size, data,
      dotsOptions,
      backgroundOptions: { color: cust.bgColor },
      cornersSquareOptions: {
        color: cust.mixed ? "#ff8c00" : cust.fgColor,
        type: cust.cornerType,
      },
    };

    let liveCanvas: HTMLCanvasElement | null = null;
    try {
      const inst = new window.QRCodeStyling(options);
      qrInstancesRef.current[id] = inst;
      await inst.append(container);
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      liveCanvas = container.querySelector("canvas") as HTMLCanvasElement | null;
    } catch (e) {
      console.error("QR render failed:", e);
    }
    if (!liveCanvas) return;

    const clone = document.createElement("canvas");
    clone.width = liveCanvas.width;
    clone.height = liveCanvas.height;
    clone.getContext("2d")!.drawImage(liveCanvas, 0, 0);
    qrCanvasRef.current[id] = clone;

    applyVisualEnhancements(id);
  }

  async function verifyQR(id: string, originalUrl: string) {
    if (!window.QRCodeStyling || !window.jsQR) return;
    try {
      const tempContainer = document.createElement("div");
      tempContainer.style.display = "none";
      document.body.appendChild(tempContainer);
      const cleanQR = new window.QRCodeStyling({ width: 300, height: 300, data: originalUrl });
      await cleanQR.append(tempContainer);
      const canvas = tempContainer.querySelector("canvas");
      if (!canvas) { updateVerify(id, false, "Could not create verification canvas."); document.body.removeChild(tempContainer); return; }
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      const imageData = ctx!.getImageData(0, 0, canvas.width, canvas.height);
      const code = window.jsQR(imageData.data, imageData.width, imageData.height);
      document.body.removeChild(tempContainer);
      if (code && code.data === originalUrl) {
        updateVerify(id, true, "Verified: QR Code matches URL.");
      } else if (code) {
        updateVerify(id, false, "Mismatch: QR code does not match the URL.");
      } else {
        updateVerify(id, false, "Could not decode QR Code for verification.");
      }
    } catch {
      updateVerify(id, false, "Verification error.");
    }
  }

  function updateVerify(id: string, ok: boolean, msg: string) {
    setQrResults((prev) => prev.map((r) => r.id === id ? { ...r, verified: ok, verifyMsg: msg } : r));
  }

  function getEffectiveTitleLines(id: string): string[] {
    const results = qrResultsRef.current.length ? qrResultsRef.current : qrResults;
    const base = (titleTextRef.current ?? visual.titleText ?? "").trim();
    const lines: string[] = [];
    if (base) lines.push(base);
    if (results.length > 1) {
      const kind = id === "attendance_qr" ? "Attendance"
        : id === "evaluation_qr" ? "Evaluation"
        : (results.find((r) => r.id === id)?.title || "");
      if (kind) lines.push(kind);
    }
    return lines;
  }

  function applyVisualEnhancements(id: string) {
    const qrContainer = document.getElementById(`qrCode_${id}`);
    if (!qrContainer) return;
    const canvas = qrContainer.querySelector("canvas");
    if (!canvas) return;

    const oldWrapper = qrContainer.querySelector(".qr-wrapper") as HTMLElement | null;
    if (oldWrapper) {
      qrContainer.insertBefore(canvas, oldWrapper);
      oldWrapper.remove();
    }

    const badgeReserve = (visual.badge && visual.badge !== "none")
      ? Math.ceil(visual.badgeSize / 3) + 4
      : 0;

    const wrapper = document.createElement("div");
    wrapper.className = "qr-wrapper";
    wrapper.style.cssText = `
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      padding: ${10 + badgeReserve}px;
      background: white;
      width: fit-content;
      box-sizing: content-box;
    `;
    qrContainer.appendChild(wrapper);

    const frameBox = document.createElement("div");
    frameBox.className = "qr-frame-box";
    frameBox.style.cssText = `
      position: relative;
      display: inline-block;
      line-height: 0;
      box-sizing: content-box;
      padding: ${visual.frame !== "none" ? visual.framePadding + "px" : "0"};
      background: white;
    `;
    switch (visual.frame) {
      case "simple":   frameBox.style.border = "3px solid #333"; frameBox.style.borderRadius = "8px"; break;
      case "rounded":  frameBox.style.border = "3px solid #333"; frameBox.style.borderRadius = "20px"; break;
      case "shadow":   frameBox.style.border = "2px solid #ddd"; frameBox.style.borderRadius = "8px"; frameBox.style.boxShadow = "0 8px 25px rgba(0,0,0,0.15)"; break;
      case "orange":   frameBox.style.border = "4px solid #ff8c00"; frameBox.style.borderRadius = "8px"; frameBox.style.boxShadow = "0 4px 15px rgba(255, 140, 0, 0.3)"; break;
      case "gradient": frameBox.style.border = "4px solid"; frameBox.style.borderImage = "linear-gradient(45deg, #ff8c00, #ff6b35) 1"; frameBox.style.borderRadius = "8px"; break;
    }
    frameBox.appendChild(canvas);

    const flowText = (text: string, size: number, color: string, font: string, bold: boolean) => {
      const el = document.createElement("div");
      el.className = "qr-enhancement";
      el.textContent = text;
      el.style.cssText = `
        font-family: ${font};
        font-size: ${size}px;
        font-weight: ${bold ? "bold" : "normal"};
        color: ${color};
        text-align: center;
        line-height: 1.25;
        max-width: ${cust.size + visual.framePadding * 2 + 40}px;
        word-wrap: break-word;
        padding: 0;
      `;
      return el;
    };

    const titleLines = getEffectiveTitleLines(id);
    const titleAbove = titleLines.length > 0 && visual.titlePosition === "above";
    const titleBelow = titleLines.length > 0 && visual.titlePosition === "below";

    const appendTitleLines = () => {
      titleLines.forEach((line, i) => {
        wrapper.appendChild(flowText(
          line,
          i === 0 ? visual.titleSize : Math.round(visual.titleSize * 0.75),
          visual.titleColor, visual.titleFontStyle,
          i === 0 ? visual.titleBold : false,
        ));
      });
    };

    if (titleAbove) appendTitleLines();
    if (visual.topText) {
      wrapper.appendChild(flowText(visual.topText, visual.textSize, visual.textColor, visual.fontStyle, true));
    }

    wrapper.appendChild(frameBox);

    if (visual.bottomText) {
      wrapper.appendChild(flowText(visual.bottomText, visual.textSize, visual.textColor, visual.fontStyle, true));
    }
    if (titleBelow) appendTitleLines();

    if (visual.badge && visual.badge !== "none") {
      const badgeEl = document.createElement("div");
      badgeEl.className = "qr-enhancement";
      const sz = visual.badgeSize;
      badgeEl.innerHTML = BADGE_ICONS[visual.badge] || "";
      badgeEl.style.cssText = `
        position: absolute;
        top: -${sz / 3}px; right: -${sz / 3}px;
        width: ${sz}px; height: ${sz}px;
        border-radius: 50%;
        background: #ff8c00;
        display: flex; align-items: center; justify-content: center;
        font-size: ${sz * 0.6}px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        border: 2px solid white;
        line-height: 1;
      `;
      frameBox.appendChild(badgeEl);
    }

    if (logoFile && visual.logoPos && visual.logoPos !== "center") {
      const sizePx = (cust.size * (visual.logoSize / 100));
      const logoImg = document.createElement("img");
      logoImg.src = logoFile;
      logoImg.className = "qr-enhancement";
      const inset = `${visual.framePadding + 4}px`;
      logoImg.style.cssText = `
        position: absolute;
        width: ${sizePx}px;
        height: ${sizePx}px;
        object-fit: contain;
        background: white;
        padding: 2px;
        border-radius: 4px;
        ${visual.logoPos === "top-left" ? `top: ${inset}; left: ${inset};` : ""}
        ${visual.logoPos === "top-right" ? `top: ${inset}; right: ${inset};` : ""}
        ${visual.logoPos === "bottom-left" ? `bottom: ${inset}; left: ${inset};` : ""}
        ${visual.logoPos === "bottom-right" ? `bottom: ${inset}; right: ${inset};` : ""}
      `;
      frameBox.appendChild(logoImg);
    }
  }

  /* ── Downloads ─────────────────────────────────────────────── */

  function composeSVG(id: string): { svg: string; width: number; height: number } | null {
    const qrContainer = document.getElementById(`qrCode_${id}`);
    if (!qrContainer) return null;
    const srcCanvas = qrContainer.querySelector("canvas") as HTMLCanvasElement | null;
    const srcSvg = qrContainer.querySelector("svg") as SVGSVGElement | null;
    let qrDataUrl = "";
    if (srcCanvas) {
      try { qrDataUrl = srcCanvas.toDataURL("image/png"); } catch { return null; }
    } else if (srcSvg) {
      const ser = new XMLSerializer().serializeToString(srcSvg);
      qrDataUrl = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(ser)));
    } else {
      return null;
    }

    const qrSize = cust.size;
    const framePad = visual.frame !== "none" ? visual.framePadding : 0;
    const frameBorder = visual.frame === "none" ? 0
                       : visual.frame === "orange" || visual.frame === "gradient" ? 4 : 3;
    const outerGap = 16;
    const lineGap = 4;
    const blockGap = 12;

    const titleLines = getEffectiveTitleLines(id);
    const titleAbove = titleLines.length > 0 && visual.titlePosition === "above";
    const titleBelow = titleLines.length > 0 && visual.titlePosition === "below";

    type Block = { text: string; size: number; color: string; font: string; bold: boolean; pos: "above" | "below" };
    const blocks: Block[] = [];
    const titleBlocksFor = (pos: "above" | "below"): Block[] => titleLines.map((text, i) => ({
      text, size: i === 0 ? visual.titleSize : Math.round(visual.titleSize * 0.75),
      color: visual.titleColor, font: visual.titleFontStyle, bold: i === 0 ? visual.titleBold : false, pos,
    }));
    if (titleAbove)        blocks.push(...titleBlocksFor("above"));
    if (visual.topText)    blocks.push({ text: visual.topText, size: visual.textSize, color: visual.textColor, font: visual.fontStyle, bold: true, pos: "above" });
    if (visual.bottomText) blocks.push({ text: visual.bottomText, size: visual.textSize, color: visual.textColor, font: visual.fontStyle, bold: true, pos: "below" });
    if (titleBelow)        blocks.push(...titleBlocksFor("below"));

    const scratch = document.createElement("canvas").getContext("2d")!;
    const maxTextWidth = qrSize + framePad * 2 + 20;
    function wrap(b: Block): string[] {
      scratch.font = `${b.bold ? "bold " : ""}${b.size}px ${b.font}`;
      const words = b.text.split(/\s+/);
      const lines: string[] = [];
      let cur = "";
      for (const w of words) {
        const test = cur ? cur + " " + w : w;
        if (scratch.measureText(test).width <= maxTextWidth) cur = test;
        else { if (cur) lines.push(cur); cur = w; }
      }
      if (cur) lines.push(cur);
      return lines.length ? lines : [b.text];
    }

    const wrapped = blocks.map((b) => {
      const lines = wrap(b);
      const h = lines.length * b.size * 1.25 + (lines.length - 1) * lineGap;
      return { ...b, lines, height: h };
    });
    const above = wrapped.filter((b) => b.pos === "above");
    const below = wrapped.filter((b) => b.pos === "below");
    const aboveH = above.reduce((s, b) => s + b.height + blockGap, 0);
    const belowH = below.reduce((s, b) => s + b.height + blockGap, 0);

    const badgeOn = visual.badge && visual.badge !== "none";
    const badgeReserve = badgeOn ? Math.ceil(visual.badgeSize / 3) + 6 : 0;

    const frameW = qrSize + framePad * 2 + frameBorder * 2;
    const frameH = qrSize + framePad * 2 + frameBorder * 2;
    const totalW = frameW + outerGap * 2 + badgeReserve * 2;
    const totalH = aboveH + frameH + belowH + outerGap * 2 + badgeReserve;

    const frameX = (totalW - frameW) / 2;
    let cursorY = outerGap + badgeReserve;

    const xmlEsc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    const parts: string[] = [];
    parts.push(`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${totalW}" height="${totalH}" viewBox="0 0 ${totalW} ${totalH}">`);
    parts.push(`<rect width="${totalW}" height="${totalH}" fill="#ffffff"/>`);

    for (const b of above) {
      for (let i = 0; i < b.lines.length; i++) {
        const yBase = cursorY + (i + 1) * b.size * 1.25 - b.size * 0.25 + i * lineGap;
        parts.push(`<text x="${totalW / 2}" y="${yBase}" font-family="${xmlEsc(b.font)}" font-size="${b.size}" font-weight="${b.bold ? "bold" : "normal"}" fill="${b.color}" text-anchor="middle">${xmlEsc(b.lines[i])}</text>`);
      }
      cursorY += b.height + blockGap;
    }

    const frameY = cursorY;
    if (visual.frame !== "none") {
      const r = visual.frame === "rounded" ? 20 : 8;
      let strokeAttrs = "";
      let gradientDef = "";
      if (visual.frame === "simple" || visual.frame === "rounded") strokeAttrs = `stroke="#333333"`;
      if (visual.frame === "shadow")  strokeAttrs = `stroke="#dddddd"`;
      if (visual.frame === "orange")  strokeAttrs = `stroke="#ff8c00"`;
      if (visual.frame === "gradient") {
        gradientDef = `<defs><linearGradient id="fg_${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#ff8c00"/><stop offset="100%" stop-color="#ff6b35"/></linearGradient></defs>`;
        strokeAttrs = `stroke="url(#fg_${id})"`;
      }
      if (gradientDef) parts.push(gradientDef);
      parts.push(`<rect x="${frameX + frameBorder / 2}" y="${frameY + frameBorder / 2}" width="${frameW - frameBorder}" height="${frameH - frameBorder}" rx="${r}" ry="${r}" fill="#ffffff" ${strokeAttrs} stroke-width="${frameBorder}"/>`);
    }

    const qrX = frameX + frameBorder + framePad;
    const qrY = frameY + frameBorder + framePad;
    parts.push(`<image href="${qrDataUrl}" x="${qrX}" y="${qrY}" width="${qrSize}" height="${qrSize}"/>`);

    if (badgeOn) {
      const sz = visual.badgeSize;
      const bx = frameX + frameW - sz / 3;
      const by = frameY + sz / 3;
      parts.push(`<circle cx="${bx}" cy="${by}" r="${sz / 2 + 2}" fill="#ffffff"/>`);
      parts.push(`<circle cx="${bx}" cy="${by}" r="${sz / 2}" fill="#ff8c00"/>`);
      parts.push(`<text x="${bx}" y="${by + sz * 0.22}" font-family="Arial" font-size="${Math.floor(sz * 0.6)}" fill="#ffffff" text-anchor="middle">${xmlEsc(BADGE_ICONS[visual.badge] || "")}</text>`);
    }

    cursorY = frameY + frameH + blockGap;
    for (const b of below) {
      for (let i = 0; i < b.lines.length; i++) {
        const yBase = cursorY + (i + 1) * b.size * 1.25 - b.size * 0.25 + i * lineGap;
        parts.push(`<text x="${totalW / 2}" y="${yBase}" font-family="${xmlEsc(b.font)}" font-size="${b.size}" font-weight="${b.bold ? "bold" : "normal"}" fill="${b.color}" text-anchor="middle">${xmlEsc(b.lines[i])}</text>`);
      }
      cursorY += b.height + blockGap;
    }

    parts.push(`</svg>`);
    return { svg: parts.join(""), width: totalW, height: totalH };
  }

  async function swapInComposedCanvas(id: string) {
    const container = document.getElementById(`qrCode_${id}`);
    if (!container) return;
    const canvasAtStart = container.querySelector("canvas");

    const dataUrl = await getCapturedImage(id);
    if (!dataUrl) return;

    if (canvasAtStart && container.querySelector("canvas") !== canvasAtStart) return;
    if (!container.isConnected) return;

    await new Promise<void>((resolve) => {
      const img = new Image();
      img.onload = () => {
        if (!container.isConnected) { resolve(); return; }
        container.innerHTML = "";
        img.style.maxWidth = "100%";
        img.style.height = "auto";
        img.style.display = "block";
        img.style.margin = "0 auto";
        container.appendChild(img);
        resolve();
      };
      img.onerror = () => resolve();
      img.src = dataUrl;
    });
  }

  async function getCapturedImage(id: string): Promise<string | null> {
    const qrContainer = document.getElementById(`qrCode_${id}`);
    if (!qrContainer) { toast.error("QR container missing"); return null; }
    const srcCanvas =
      (qrContainer.querySelector("canvas") as HTMLCanvasElement | null)
      || qrCanvasRef.current[id]
      || null;
    if (!srcCanvas) { toast.error("QR canvas missing"); return null; }

    const qrSize = cust.size;
    const framePad = visual.frame !== "none" ? visual.framePadding : 0;
    const frameBorder = visual.frame === "none" ? 0
                       : visual.frame === "orange" || visual.frame === "gradient" ? 4 : 3;
    const outerGap = 16;
    const lineGap = 4;
    const blockGap = 12;
    const scale = 3;

    const titleLines = getEffectiveTitleLines(id);
    const titleAbove = titleLines.length > 0 && visual.titlePosition === "above";
    const titleBelow = titleLines.length > 0 && visual.titlePosition === "below";

    type Block = { text: string; size: number; color: string; font: string; bold: boolean; pos: "above" | "below" };
    const blocks: Block[] = [];
    const titleBlocksFor = (pos: "above" | "below"): Block[] => titleLines.map((text, i) => ({
      text, size: i === 0 ? visual.titleSize : Math.round(visual.titleSize * 0.75),
      color: visual.titleColor, font: visual.titleFontStyle, bold: i === 0 ? visual.titleBold : false, pos,
    }));
    if (titleAbove)        blocks.push(...titleBlocksFor("above"));
    if (visual.topText)    blocks.push({ text: visual.topText, size: visual.textSize, color: visual.textColor, font: visual.fontStyle, bold: true, pos: "above" });
    if (visual.bottomText) blocks.push({ text: visual.bottomText, size: visual.textSize, color: visual.textColor, font: visual.fontStyle, bold: true, pos: "below" });
    if (titleBelow)        blocks.push(...titleBlocksFor("below"));

    const measure = document.createElement("canvas").getContext("2d")!;
    const maxTextWidth = qrSize + framePad * 2 + 20;
    function wrap(b: Block): string[] {
      measure.font = `${b.bold ? "bold " : ""}${b.size}px ${b.font}`;
      const words = b.text.split(/\s+/);
      const lines: string[] = [];
      let cur = "";
      for (const w of words) {
        const t = cur ? cur + " " + w : w;
        if (measure.measureText(t).width <= maxTextWidth) cur = t;
        else { if (cur) lines.push(cur); cur = w; }
      }
      if (cur) lines.push(cur);
      return lines.length ? lines : [b.text];
    }
    const wrapped = blocks.map((b) => {
      const lines = wrap(b);
      const lineH = b.size * 1.25;
      const h = lines.length * lineH + (lines.length - 1) * lineGap;
      return { ...b, lines, height: h, lineH };
    });
    const above = wrapped.filter((b) => b.pos === "above");
    const below = wrapped.filter((b) => b.pos === "below");
    const aboveH = above.reduce((s, b) => s + b.height + blockGap, 0);
    const belowH = below.reduce((s, b) => s + b.height + blockGap, 0);

    const badgeOn = visual.badge && visual.badge !== "none";
    const badgeReserve = badgeOn ? Math.ceil(visual.badgeSize / 3) + 6 : 0;

    const frameW = qrSize + framePad * 2 + frameBorder * 2;
    const frameH = qrSize + framePad * 2 + frameBorder * 2;
    const totalW = frameW + outerGap * 2 + badgeReserve * 2;
    const totalH = aboveH + frameH + belowH + outerGap * 2 + badgeReserve;

    const out = document.createElement("canvas");
    out.width = Math.ceil(totalW * scale);
    out.height = Math.ceil(totalH * scale);
    const ctx = out.getContext("2d")!;
    ctx.scale(scale, scale);

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, totalW, totalH);

    let y = outerGap + badgeReserve;
    for (const b of above) {
      ctx.fillStyle = b.color;
      ctx.font = `${b.bold ? "bold " : ""}${b.size}px ${b.font}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      for (const line of b.lines) {
        const baseline = y + b.size;
        ctx.fillText(line, totalW / 2, baseline);
        y += b.lineH + lineGap;
      }
      y += blockGap - lineGap;
    }

    const frameX = (totalW - frameW) / 2;
    const frameY = y;
    function roundedPath(x: number, yy: number, w: number, h: number, r: number) {
      ctx.beginPath();
      ctx.moveTo(x + r, yy);
      ctx.arcTo(x + w, yy,     x + w, yy + h, r);
      ctx.arcTo(x + w, yy + h, x,     yy + h, r);
      ctx.arcTo(x,     yy + h, x,     yy,     r);
      ctx.arcTo(x,     yy,     x + w, yy,     r);
      ctx.closePath();
    }
    if (visual.frame !== "none") {
      const r = visual.frame === "rounded" ? 20 : 8;
      ctx.fillStyle = "#ffffff";
      roundedPath(frameX, frameY, frameW, frameH, r);
      ctx.fill();
      ctx.lineWidth = frameBorder;
      if (visual.frame === "simple" || visual.frame === "rounded") ctx.strokeStyle = "#333333";
      else if (visual.frame === "shadow")  ctx.strokeStyle = "#dddddd";
      else if (visual.frame === "orange")  ctx.strokeStyle = "#ff8c00";
      else if (visual.frame === "gradient") {
        const g = ctx.createLinearGradient(frameX, frameY, frameX + frameW, frameY + frameH);
        g.addColorStop(0, "#ff8c00"); g.addColorStop(1, "#ff6b35");
        ctx.strokeStyle = g;
      }
      roundedPath(frameX + frameBorder / 2, frameY + frameBorder / 2,
                  frameW - frameBorder, frameH - frameBorder, Math.max(0, r - frameBorder / 2));
      ctx.stroke();
    }

    const qrX = frameX + frameBorder + framePad;
    const qrY = frameY + frameBorder + framePad;
    try {
      ctx.drawImage(srcCanvas, qrX, qrY, qrSize, qrSize);
    } catch (e) {
      console.error("drawImage failed:", e);
      toast.error("QR draw failed: " + (e as Error).message);
      return null;
    }

    if (logoFile) {
      const sizePx = qrSize * (visual.logoSize / 100);
      const inset = 8;
      const pos = visual.logoPos || "center";
      let lx: number, ly: number;
      if (pos === "center") {
        lx = qrX + (qrSize - sizePx) / 2;
        ly = qrY + (qrSize - sizePx) / 2;
      } else if (pos === "top-left") {
        lx = qrX + inset; ly = qrY + inset;
      } else if (pos === "top-right") {
        lx = qrX + qrSize - sizePx - inset; ly = qrY + inset;
      } else if (pos === "bottom-left") {
        lx = qrX + inset; ly = qrY + qrSize - sizePx - inset;
      } else {
        lx = qrX + qrSize - sizePx - inset; ly = qrY + qrSize - sizePx - inset;
      }

      try {
        const logoImg = await new Promise<HTMLImageElement>((resolve, reject) => {
          const im = new Image();
          im.onload = () => resolve(im);
          im.onerror = () => reject(new Error("logo load failed"));
          im.src = logoFile;
        });
        const pad = 6;
        ctx.fillStyle = "#ffffff";
        roundedPath(lx - pad, ly - pad, sizePx + pad * 2, sizePx + pad * 2, 6);
        ctx.fill();
        ctx.drawImage(logoImg, lx, ly, sizePx, sizePx);
      } catch (e) {
        console.warn("Logo overlay skipped:", e);
      }
    }

    if (badgeOn) {
      const sz = visual.badgeSize;
      const bx = frameX + frameW - sz / 3;
      const by = frameY + sz / 3;
      ctx.beginPath(); ctx.arc(bx, by, sz / 2 + 2, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff"; ctx.fill();
      ctx.beginPath(); ctx.arc(bx, by, sz / 2, 0, Math.PI * 2);
      ctx.fillStyle = "#ff8c00"; ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.font = `${Math.floor(sz * 0.6)}px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(BADGE_ICONS[visual.badge] || "", bx, by + 1);
    }

    y = frameY + frameH + blockGap;
    for (const b of below) {
      ctx.fillStyle = b.color;
      ctx.font = `${b.bold ? "bold " : ""}${b.size}px ${b.font}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      for (const line of b.lines) {
        const baseline = y + b.size;
        ctx.fillText(line, totalW / 2, baseline);
        y += b.lineH + lineGap;
      }
      y += blockGap - lineGap;
    }

    try {
      return out.toDataURL("image/png");
    } catch (e) {
      console.error("toDataURL failed:", e);
      toast.error("Canvas tainted — try removing the logo");
      return null;
    }
  }

  async function downloadPNG(id: string) {
    const dataUrl = await getCapturedImage(id);
    if (!dataUrl) return;
    const link = document.createElement("a");
    link.download = `qr-code-${id}-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  }

  async function downloadSVG(id: string) {
    const composed = composeSVG(id);
    if (!composed) { toast.error("Failed to build SVG"); return; }
    const blob = new Blob([composed.svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = `qr-code-${id}-${Date.now()}.svg`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function downloadPPTX(id: string) {
    const dataUrl = await getCapturedImage(id);
    if (!dataUrl || !window.PptxGenJS) return;
    try {
      const pptx = new window.PptxGenJS();
      pptx.layout = "LAYOUT_16x9";
      const slide = pptx.addSlide();
      slide.background = { color: "FFFFFF" };
      const result = qrResults.find((r) => r.id === id);
      const title = visual.titleText || result?.title || "QR Code";
      slide.addText("Thank you!", { x: 0.5, y: 0.25, w: "90%", fontSize: 28, bold: true, align: "center", color: "333333" });
      slide.addImage({ data: dataUrl, x: 3.5, y: 1.1, w: 3.0, h: 3.0 });
      slide.addText(title, { x: 0.5, y: 4.4, w: "90%", fontSize: 18, bold: true, align: "center", color: "FF6600" });
      pptx.writeFile({ fileName: `QRCode-${Date.now()}.pptx` });
    } catch { toast.error("Failed to generate PPTX"); }
  }

  async function downloadDualPPTX() {
    if (!window.PptxGenJS) return;
    try {
      const att = await getCapturedImage("attendance_qr");
      const ev = await getCapturedImage("evaluation_qr");
      if (!att || !ev) return;
      const pptx = new window.PptxGenJS();
      pptx.layout = "LAYOUT_16x9";

      const courseName = (surveyValues.CourseName || "").trim();

      const s1 = pptx.addSlide();
      s1.background = { color: "FFFFFF" };
      s1.addText("Training Attendance", { x: 0.5, y: 0.25, w: "90%", h: 0.75, fontSize: 24, bold: true, align: "center", color: "333333" });
      s1.addImage({ data: att, x: 3.5, y: 1.1, w: 3.0, h: 3.0 });
      if (courseName) {
        s1.addText(courseName, { x: 0.5, y: 4.4, w: "90%", fontSize: 18, bold: true, align: "center", color: "FF6600" });
      }

      const s2 = pptx.addSlide();
      s2.background = { color: "FFFFFF" };
      s2.addText("Training Evaluation", { x: 0.5, y: 0.25, w: "90%", h: 0.75, fontSize: 24, bold: true, align: "center", color: "333333" });
      s2.addImage({ data: ev, x: 3.5, y: 1.1, w: 3.0, h: 3.0 });
      if (courseName) {
        s2.addText(courseName, { x: 0.5, y: 4.4, w: "90%", fontSize: 18, bold: true, align: "center", color: "FF6600" });
      }

      pptx.writeFile({ fileName: `QRCode-Dual-${Date.now()}.pptx` });
    } catch { toast.error("Failed to generate PPTX"); }
  }

  async function copyToClipboard(id: string) {
    const dataUrl = await getCapturedImage(id);
    if (!dataUrl) { toast.error("Failed to copy"); return; }
    try {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      toast.success("QR code copied to clipboard!");
    } catch { toast.error("Failed to copy to clipboard"); }
  }

  /* ── Reload from history / template ───────────────────────── */

  function loadFromItem(item: { tab: string; data: any; customization: QRCustomization }) {
    const c = item.customization;
    setCust({ ...c, logo: c.logo || null });
    setVisual({ ...c.visualSettings });
    setLogoFile(c.logo || null);
    titleTextRef.current = (c.visualSettings?.titleText || "").trim();

    const hasData = item.data && (
      (item.tab === "custom" && item.data.url) ||
      (item.tab === "survey" && item.data.type)
    );

    if (hasData) {
      setActiveTab(item.tab as "custom" | "survey");
      let results: any[] = [];

      if (item.tab === "custom") {
        const url = item.data.url || "";
        setCustomUrl(url);
        results.push({ id: "custom_qr", title: "Custom URL", url, verified: null, verifyMsg: "" });
      } else {
        const type = item.data.type || "";
        const values = item.data.values || {};
        setSurveyType(type);
        setSurveyValues(values);

        const urls = item.data.urls || {};
        if (Object.keys(urls).length > 0) {
          for (const [id, qrUrl] of Object.entries(urls)) {
            let title = "Survey";
            if (id === "attendance_qr") {
              const attCfg = type === SPECIAL_TYPE ? BUILTIN_SURVEYS.course_attendance : BUILTIN_SURVEYS.course_attendance_v2;
              title = attCfg.name;
            } else if (id === "evaluation_qr") {
              title = type === SPECIAL_TYPE_V3 ? BUILTIN_SURVEYS.course_evaluation_v3.name : BUILTIN_SURVEYS.course_evaluation.name;
            } else {
              title = ({ ...BUILTIN_SURVEYS, ...surveyConfigs }[type]?.name || "Survey");
            }
            results.push({ id, title, url: qrUrl as string, verified: null, verifyMsg: "" });
          }
        } else {
          const generatedUrl = getSurveyUrl(type, values);
          if (type === SPECIAL_TYPE || type === SPECIAL_TYPE_V2 || type === SPECIAL_TYPE_V3) {
            const attCfg = type === SPECIAL_TYPE ? BUILTIN_SURVEYS.course_attendance : BUILTIN_SURVEYS.course_attendance_v2;
            const evalCfg = type === SPECIAL_TYPE_V3 ? BUILTIN_SURVEYS.course_evaluation_v3 : BUILTIN_SURVEYS.course_evaluation;
            const attUrl = buildUrl(attCfg.baseUrl, attCfg.fields, values);
            const evalUrl = buildUrl(evalCfg.baseUrl, evalCfg.fields, values);
            results.push({ id: "attendance_qr", title: attCfg.name, url: attUrl, verified: null, verifyMsg: "" });
            results.push({ id: "evaluation_qr", title: evalCfg.name, url: evalUrl, verified: null, verifyMsg: "" });
          } else if (generatedUrl) {
            results.push({ id: "survey_qr", title: ({ ...BUILTIN_SURVEYS, ...surveyConfigs }[type]?.name || "Survey"), url: generatedUrl, verified: null, verifyMsg: "" });
          }
        }
      }

      qrResultsRef.current = results;
      setQrResults(results);
      waitForQRContainersAndRender(results);
    }
  }

  /* ── Reset ────────────────────────────────────────────────── */

  function resetCustomization() {
    setCust({ ...DEFAULT_CUSTOMIZATION });
    setVisual({ ...DEFAULT_VISUAL });
    setLogoFile(null);
  }

  function startFresh() {
    setCustomUrl("");
    setSurveyType("");
    setSurveyValues({});
    setQrResults([]);
    qrInstancesRef.current = {};
    qrCanvasRef.current = {};
  }

  const allSurveys = { ...BUILTIN_SURVEYS, ...surveyConfigs };
  const isSpecialCombo = surveyType === SPECIAL_TYPE || surveyType === SPECIAL_TYPE_V2 || surveyType === SPECIAL_TYPE_V3;
  const currentSurveyConfig = surveyType && !isSpecialCombo && surveyType !== MANUAL_TYPE ? allSurveys[surveyType] : null;
  const surveyPreviewUrl = surveyType && !isSpecialCombo ? getSurveyUrl(surveyType, surveyValues) : "";
  const specialAttUrl = isSpecialCombo ? buildUrl(
    (surveyType === SPECIAL_TYPE ? BUILTIN_SURVEYS.course_attendance : BUILTIN_SURVEYS.course_attendance_v2).baseUrl,
    (surveyType === SPECIAL_TYPE ? BUILTIN_SURVEYS.course_attendance : BUILTIN_SURVEYS.course_attendance_v2).fields,
    surveyValues,
  ) : "";
  const specialEvalUrl = isSpecialCombo ? buildUrl(
    (surveyType === SPECIAL_TYPE_V3 ? BUILTIN_SURVEYS.course_evaluation_v3 : BUILTIN_SURVEYS.course_evaluation).baseUrl,
    (surveyType === SPECIAL_TYPE_V3 ? BUILTIN_SURVEYS.course_evaluation_v3 : BUILTIN_SURVEYS.course_evaluation).fields,
    surveyValues,
  ) : "";

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) { setLogoFile(null); return; }
    const reader = new FileReader();
    reader.onload = (ev) => { setLogoFile(ev.target?.result as string); };
    reader.readAsDataURL(file);
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header & User Info */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">QR Code & MSurvey Generator</h1>
            <p className="text-gray-500 text-sm mt-1">Create branded, styled QR codes for Orange Egypt training sessions</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
              <span className="text-xs text-gray-500 font-medium">Your Name:</span>
              <input
                type="text"
                placeholder="e.g., Sarah"
                value={userName}
                onChange={(e) => handleNameChange(e.target.value)}
                className="text-xs font-semibold text-gray-800 bg-transparent border-0 outline-none w-28 placeholder:text-gray-400"
              />
            </div>
            <button onClick={startFresh} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors text-gray-700">
              Start Fresh
            </button>
          </div>
        </div>

        {!scriptsReady && (
          <Card className="p-4 bg-amber-50 border-amber-200">
            <div className="flex items-center gap-2 text-amber-800">
              <div className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
              Loading QR styling engine...
            </div>
          </Card>
        )}

        {/* Tabs */}
        <Card className="p-6">
          <div className="flex gap-1 p-1 bg-gray-100 rounded-lg mb-6">
            <button onClick={() => setActiveTab("custom")} className={`flex-1 py-2.5 px-4 rounded-md text-sm font-semibold transition-all ${activeTab === "custom" ? "bg-gradient-to-r from-[#FF6600] to-[#ff8c00] text-white shadow" : "text-gray-600 hover:bg-gray-200"}`}>
              Custom URL Generator
            </button>
            <button onClick={() => setActiveTab("survey")} className={`flex-1 py-2.5 px-4 rounded-md text-sm font-semibold transition-all ${activeTab === "survey" ? "bg-gradient-to-r from-[#FF6600] to-[#ff8c00] text-white shadow" : "text-gray-600 hover:bg-gray-200"}`}>
              MSurvey Builder (Attendance & Evaluation)
            </button>
          </div>

          {/* Tab 1: Custom URL */}
          {activeTab === "custom" && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="urlInput" className="text-sm font-semibold">URL to encode</Label>
                <Input id="urlInput" type="url" placeholder="https://example.com" value={customUrl} onChange={(e) => setCustomUrl(e.target.value)} className="mt-1" />
                {urlWarning && <p className="text-xs text-red-500 mt-1">{urlWarning}</p>}
              </div>
            </div>
          )}

          {/* Tab 2: Survey Builder */}
          {activeTab === "survey" && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-semibold">Survey Type</Label>
                <select value={surveyType} onChange={(e) => { setSurveyType(e.target.value); setSurveyValues({}); }} className="w-full mt-1 p-2.5 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#FF6600]/20 focus:border-[#FF6600] outline-none">
                  <option value="">Select a survey type...</option>
                  <option value={SPECIAL_TYPE_V3} style={{ fontWeight: "bold" }}>Course Attendance (V2) + Evaluation (V3)</option>
                  <option value={SPECIAL_TYPE_V2} style={{ fontWeight: "bold" }}>Course Attendance (V2) + Evaluation (V1)</option>
                  <option value={SPECIAL_TYPE} style={{ fontWeight: "bold" }}>Course Attendance (V1) + Evaluation (V1)</option>
                  <option disabled>-----------</option>
                  {Object.entries(allSurveys).map(([key, cfg]) => (
                    <option key={key} value={key}>{cfg.name}</option>
                  ))}
                  <option disabled>-----------</option>
                  <option value={MANUAL_TYPE}>Manual Base URL</option>
                </select>
              </div>

              {!surveyType && (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                  <div className="text-2xl text-[#FF6600] animate-bounce mb-2">&uarr;</div>
                  <h3 className="font-semibold text-gray-700">Select a Survey Type</h3>
                  <p className="text-sm text-gray-500">Choose a survey type above to start building your QR code</p>
                </div>
              )}

              {surveyType && surveyType !== MANUAL_TYPE && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {(isSpecialCombo ? BUILTIN_SURVEYS.course_attendance.fields : (currentSurveyConfig?.fields || [])).map((field) => (
                      <div key={field.param}>
                        <Label className="text-sm font-semibold">{field.name}</Label>
                        <Input placeholder={field.placeholder} value={surveyValues[field.param] || ""} onChange={(e) => setSurveyValues((v) => ({ ...v, [field.param]: e.target.value }))} className="mt-1" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {surveyType === MANUAL_TYPE && (
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-semibold">Base URL</Label>
                    <Input placeholder="https://example.com/form" value={manualBaseUrl} onChange={(e) => setManualBaseUrl(e.target.value)} className="mt-1" />
                    <p className="text-xs text-gray-500 mt-1">Paste a full link. If it doesn&apos;t start with http(s), https:// will be assumed.</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-semibold text-sm">Fields Builder</span>
                      <button onClick={() => setManualFields([...manualFields, { name: "", param: "", placeholder: "" }])} className="text-xs px-3 py-1.5 bg-[#FF6600] text-white rounded-lg hover:bg-[#e55b00]">+ Add Field</button>
                    </div>
                    {manualFields.map((f, i) => (
                      <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 mb-2">
                        <Input placeholder="Label" value={f.name} onChange={(e) => { const u = [...manualFields]; u[i] = { ...u[i], name: e.target.value }; setManualFields(u); }} />
                        <Input placeholder="Param" value={f.param} onChange={(e) => { const u = [...manualFields]; u[i] = { ...u[i], param: e.target.value }; setManualFields(u); }} />
                        <Input placeholder="Placeholder" value={f.placeholder} onChange={(e) => { const u = [...manualFields]; u[i] = { ...u[i], placeholder: e.target.value }; setManualFields(u); }} />
                        <button onClick={() => setManualFields(manualFields.filter((_, j) => j !== i))} className="px-2 text-red-500 hover:bg-red-50 rounded">x</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {surveyPreviewUrl && !isSpecialCombo && (
                <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-[#FF6600] space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-[#FF6600] text-sm">Generated URL:</span>
                    <div className="flex gap-1">
                      <a href={surveyPreviewUrl} target="_blank" rel="noopener noreferrer" className="text-xs px-2 py-1 bg-[#0E2841] text-white rounded hover:bg-[#1a3a5c]">Open</a>
                      <button type="button" onClick={() => { navigator.clipboard.writeText(surveyPreviewUrl); toast.success("URL copied"); }} className="text-xs px-2 py-1 bg-gray-200 rounded hover:bg-gray-300">Copy</button>
                    </div>
                  </div>
                  <code className="text-xs text-gray-600 break-all block">{surveyPreviewUrl}</code>
                </div>
              )}
              {isSpecialCombo && (specialAttUrl || specialEvalUrl) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {specialAttUrl && (
                    <div className="bg-gray-50 p-3 rounded-lg border-l-4 border-[#FF6600] space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-[#FF6600] text-sm">Attendance URL:</span>
                        <div className="flex gap-1">
                          <a href={specialAttUrl} target="_blank" rel="noopener noreferrer" className="text-xs px-2 py-1 bg-[#0E2841] text-white rounded hover:bg-[#1a3a5c]">Open</a>
                          <button type="button" onClick={() => { navigator.clipboard.writeText(specialAttUrl); toast.success("Attendance URL copied"); }} className="text-xs px-2 py-1 bg-gray-200 rounded hover:bg-gray-300">Copy</button>
                        </div>
                      </div>
                      <code className="text-xs text-gray-600 break-all block">{specialAttUrl}</code>
                    </div>
                  )}
                  {specialEvalUrl && (
                    <div className="bg-gray-50 p-3 rounded-lg border-l-4 border-[#0E2841] space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-[#0E2841] text-sm">Evaluation URL{surveyType === SPECIAL_TYPE_V3 ? " (V3)" : ""}:</span>
                        <div className="flex gap-1">
                          <a href={specialEvalUrl} target="_blank" rel="noopener noreferrer" className="text-xs px-2 py-1 bg-[#0E2841] text-white rounded hover:bg-[#1a3a5c]">Open</a>
                          <button type="button" onClick={() => { navigator.clipboard.writeText(specialEvalUrl); toast.success("Evaluation URL copied"); }} className="text-xs px-2 py-1 bg-gray-200 rounded hover:bg-gray-300">Copy</button>
                        </div>
                      </div>
                      <code className="text-xs text-gray-600 break-all block">{specialEvalUrl}</code>
                    </div>
                  )}
                </div>
              )}

              {/* Survey Config Section */}
              <div className="border rounded-lg overflow-hidden">
                <button onClick={() => toggleSection("surveyConfig")} className="w-full flex justify-between items-center p-3 bg-gray-50 hover:bg-gray-100 transition-colors">
                  <span className="font-semibold text-sm text-gray-700">Custom Survey Types Manager</span>
                  <span className="text-xs text-gray-400">{sectionsOpen.surveyConfig ? "Hide" : "Show"}</span>
                </button>
                {sectionsOpen.surveyConfig && (
                  <div className="p-4 space-y-3">
                    <button onClick={() => { setEditingSurvey({ id: "", name: "", baseUrl: "", fields: [{ name: "", param: "", placeholder: "" }] }); setShowSurveyEditor(true); }} className="w-full py-2 bg-green-500 text-white rounded-lg text-sm font-semibold hover:bg-green-600">+ Add New Survey Type</button>
                    {Object.entries(surveyConfigs).map(([key, cfg]) => (
                      <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-semibold text-sm">{cfg.name}</div>
                          <div className="text-xs text-gray-500 truncate max-w-[300px]">{cfg.baseUrl}</div>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => { setEditingSurvey({ ...cfg }); setShowSurveyEditor(true); }} className="px-2 py-1 text-xs bg-blue-500 text-white rounded">Edit</button>
                          <button onClick={() => deleteSurveyConfig(key)} className="px-2 py-1 text-xs bg-red-500 text-white rounded">Delete</button>
                        </div>
                      </div>
                    ))}
                    {showSurveyEditor && editingSurvey && (
                      <div className="bg-white p-4 rounded-lg border-2 border-[#FF6600]/30 space-y-3">
                        <div className="flex justify-between items-center border-b pb-2">
                          <span className="font-semibold">{editingSurvey.id ? "Edit Survey" : "New Survey"}</span>
                          <button onClick={() => { setShowSurveyEditor(false); setEditingSurvey(null); }} className="text-gray-400 hover:text-gray-600">x</button>
                        </div>
                        <div>
                          <Label className="text-sm">Survey Name</Label>
                          <Input value={editingSurvey.name} onChange={(e) => setEditingSurvey({ ...editingSurvey, name: e.target.value })} placeholder="e.g., Customer Satisfaction" className="mt-1" />
                        </div>
                        <div>
                          <Label className="text-sm">Base URL</Label>
                          <Input value={editingSurvey.baseUrl} onChange={(e) => setEditingSurvey({ ...editingSurvey, baseUrl: e.target.value })} placeholder="https://msurvey.orange.com/survey?" className="mt-1" />
                        </div>
                        <div className="flex gap-2 justify-end pt-2 border-t">
                          <button onClick={() => { setShowSurveyEditor(false); setEditingSurvey(null); }} className="px-4 py-2 text-sm bg-gray-200 rounded-lg">Cancel</button>
                          <button onClick={() => { if (!editingSurvey.name || !editingSurvey.baseUrl) { toast.error("Name and URL required"); return; } saveSurveyConfig(editingSurvey); }} className="px-4 py-2 text-sm bg-green-500 text-white rounded-lg">Save</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </Card>

        {/* Customization Section */}
        <Card className="p-6">
          <button onClick={() => toggleSection("customize")} className="w-full flex justify-between items-center mb-4">
            <h2 className="font-bold text-gray-900">Customization & Branding</h2>
            <span className="text-xs text-gray-400">{sectionsOpen.customize ? "Hide" : "Show"}</span>
          </button>
          {sectionsOpen.customize && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <div>
                <Label className="text-sm">QR Color</Label>
                <div className="flex items-center gap-2 mt-1">
                  <input type="color" value={cust.fgColor} onChange={(e) => setCust((c) => ({ ...c, fgColor: e.target.value, mixed: false }))} className="w-10 h-10 rounded cursor-pointer border-0" />
                  <div className="flex gap-1">
                    <button onClick={() => setCust((c) => ({ ...c, fgColor: "#ff8c00", mixed: false, useGradient: false }))} className="w-6 h-6 rounded-full bg-[#ff8c00] border-2 border-gray-200 hover:scale-110 transition-transform" title="Orange" />
                    <button onClick={() => setCust((c) => ({ ...c, fgColor: "#000000", mixed: false, useGradient: false }))} className="w-6 h-6 rounded-full bg-black border-2 border-gray-200 hover:scale-110 transition-transform" title="Black" />
                    <button onClick={() => setCust((c) => ({ ...c, mixed: true, useGradient: false }))} className="w-6 h-6 rounded-full border-2 border-gray-200 hover:scale-110 transition-transform" style={{ background: "linear-gradient(45deg, #ff8c00 50%, #000 50%)" }} title="Mixed" />
                  </div>
                </div>
                <label className="flex items-center gap-2 mt-2 text-sm">
                  <input type="checkbox" checked={cust.useGradient} onChange={(e) => setCust((c) => ({ ...c, useGradient: e.target.checked, mixed: false }))} />
                  Gradient
                </label>
                {cust.useGradient && (
                  <div className="bg-gray-50 p-2 rounded mt-2 space-y-2">
                    <div className="flex gap-2">
                      <div><label className="text-xs">Start</label><input type="color" value={cust.gradC1} onChange={(e) => setCust((c) => ({ ...c, gradC1: e.target.value }))} className="w-8 h-8 block" /></div>
                      <div><label className="text-xs">End</label><input type="color" value={cust.gradC2} onChange={(e) => setCust((c) => ({ ...c, gradC2: e.target.value }))} className="w-8 h-8 block" /></div>
                    </div>
                    <div><label className="text-xs">Angle</label><input type="range" min={0} max={360} value={cust.gradRot} onChange={(e) => setCust((c) => ({ ...c, gradRot: e.target.value }))} className="w-full" /></div>
                  </div>
                )}
              </div>
              <div>
                <Label className="text-sm">Background</Label>
                <input type="color" value={cust.bgColor} onChange={(e) => setCust((c) => ({ ...c, bgColor: e.target.value }))} className="w-10 h-10 rounded cursor-pointer border-0 mt-1 block" />
              </div>
              <div>
                <Label className="text-sm">Dot Style</Label>
                <select value={cust.dotType} onChange={(e) => setCust((c) => ({ ...c, dotType: e.target.value }))} className="w-full mt-1 p-2 border rounded-lg text-sm bg-white">
                  {DOT_STYLES.map((s) => <option key={s} value={s}>{s.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-sm">Corner Style</Label>
                <select value={cust.cornerType} onChange={(e) => setCust((c) => ({ ...c, cornerType: e.target.value }))} className="w-full mt-1 p-2 border rounded-lg text-sm bg-white">
                  {CORNER_STYLES.map((s) => <option key={s} value={s}>{s.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-sm">Size</Label>
                <div className="flex items-center gap-2 mt-1">
                  <input type="range" min={150} max={500} value={cust.size} onChange={(e) => setCust((c) => ({ ...c, size: parseInt(e.target.value) }))} className="flex-1" />
                  <span className="text-sm font-semibold text-[#FF6600] min-w-[60px]">{cust.size}px</span>
                </div>
              </div>
              <div>
                <Label className="text-sm">Logo (optional)</Label>
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="mt-1 text-sm w-full" />
                {logoFile && (
                  <div className="mt-2 flex items-center gap-2">
                    <img src={logoFile} alt="Logo" className="max-w-[50px] max-h-[50px] border rounded p-1 object-contain bg-white" />
                    <button onClick={() => setLogoFile(null)} className="text-xs text-red-500 hover:underline">Remove</button>
                  </div>
                )}
              </div>
              <div className="flex items-end">
                <button onClick={resetCustomization} className="w-full py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-medium transition-colors">Reset</button>
              </div>
            </div>
          )}
        </Card>

        {/* Visual Enhancements */}
        <Card className="overflow-hidden">
          <button onClick={() => toggleSection("visual")} className="w-full flex justify-between items-center p-4 bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700 transition-all">
            <span className="font-bold">Visual Enhancements & Baked Title</span>
            <span className="text-xs opacity-70">{sectionsOpen.visual ? "Collapse" : "Expand"}</span>
          </button>
          {sectionsOpen.visual && (
            <div className="p-4 space-y-4">
              <div className="flex gap-2 border-b pb-2">
                {[{ key: "title", label: "Title" }, { key: "frames", label: "Frames" }, { key: "logo", label: "Logo Position" }, { key: "badges", label: "Badges" }].map((t) => (
                  <button key={t.key} onClick={() => setVisualTab(t.key)} className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${visualTab === t.key ? "bg-purple-100 text-purple-700" : "text-gray-500 hover:bg-gray-100"}`}>{t.label}</button>
                ))}
              </div>

              {visualTab === "title" && (
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Label className="text-sm font-semibold">Title (baked into the QR image)</Label>
                      <button
                        onClick={() => {
                          const courseName = (surveyValues.CourseName || "").trim();
                          const fallback = surveyType
                            ? ({ ...BUILTIN_SURVEYS, ...surveyConfigs }[surveyType]?.name || "")
                            : "";
                          setVisual((v) => ({ ...v, titleText: courseName || fallback || v.titleText }));
                        }}
                        className="text-xs px-2 py-1 bg-[#FF6600] text-white rounded hover:bg-[#e55b00]"
                      >
                        Auto-fill from CourseName
                      </button>
                    </div>
                    <Input
                      placeholder="Type title — e.g., Microsoft Enablement Plan"
                      value={visual.titleText}
                      onChange={(e) => setVisual((v) => ({ ...v, titleText: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm">Position</Label>
                      <select
                        value={visual.titlePosition}
                        onChange={(e) => setVisual((v) => ({ ...v, titlePosition: e.target.value as "above" | "below" }))}
                        className="w-full mt-1 p-2 border rounded-lg text-sm bg-white"
                      >
                        <option value="above">Above QR</option>
                        <option value="below">Below QR</option>
                      </select>
                    </div>
                    <div>
                      <Label className="text-sm">Font</Label>
                      <select
                        value={visual.titleFontStyle}
                        onChange={(e) => setVisual((v) => ({ ...v, titleFontStyle: e.target.value }))}
                        className="w-full mt-1 p-2 border rounded-lg text-sm bg-white"
                      >
                        {FONT_STYLES.map((f) => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 items-end">
                    <div>
                      <Label className="text-sm">Color</Label>
                      <input
                        type="color"
                        value={visual.titleColor}
                        onChange={(e) => setVisual((v) => ({ ...v, titleColor: e.target.value }))}
                        className="w-10 h-10 mt-1 block"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Size ({visual.titleSize}px)</Label>
                      <input
                        type="range"
                        min={12}
                        max={40}
                        value={visual.titleSize}
                        onChange={(e) => setVisual((v) => ({ ...v, titleSize: parseInt(e.target.value) }))}
                        className="w-full mt-3"
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={visual.titleBold}
                          onChange={(e) => setVisual((v) => ({ ...v, titleBold: e.target.checked }))}
                        />
                        Bold
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {visualTab === "frames" && (
                <div>
                  <div className="grid grid-cols-6 gap-3 mb-4">
                    {FRAME_TYPES.map((f) => (
                      <button key={f} onClick={() => setVisual((v) => ({ ...v, frame: f }))} className={`aspect-square border-2 rounded-lg flex items-center justify-center text-xs transition-all ${visual.frame === f ? "border-purple-500 bg-purple-50" : "border-gray-200 hover:border-purple-300"}`}>
                        {f === "none" ? "None" : f.charAt(0).toUpperCase() + f.slice(1)}
                      </button>
                    ))}
                  </div>
                  <Label className="text-sm">Frame Padding</Label>
                  <input type="range" min={0} max={50} value={visual.framePadding} onChange={(e) => setVisual((v) => ({ ...v, framePadding: parseInt(e.target.value) }))} className="w-full" />
                </div>
              )}

              {visualTab === "logo" && (
                <div>
                  <Label className="text-sm">Logo Position</Label>
                  <div className="grid grid-cols-3 gap-2 max-w-[200px] my-3">
                    {["top-left", "", "top-right", "", "center", "", "bottom-left", "", "bottom-right"].map((pos, i) => pos ? (
                      <button key={pos} onClick={() => setVisual((v) => ({ ...v, logoPos: pos }))} className={`w-14 h-14 border-2 rounded-lg relative transition-all ${visual.logoPos === pos ? "border-purple-500 bg-purple-50" : "border-gray-200 hover:border-purple-300"}`}>
                        <div className={`w-3 h-3 bg-purple-500 rounded-full absolute ${pos === "center" ? "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" : pos === "top-left" ? "top-1 left-1" : pos === "top-right" ? "top-1 right-1" : pos === "bottom-left" ? "bottom-1 left-1" : "bottom-1 right-1"}`} />
                      </button>
                    ) : <div key={i} />)}
                  </div>
                  <div className="flex justify-between items-center mt-3">
                    <Label className="text-sm">Logo Size</Label>
                    <span className="text-xs font-semibold text-[#FF6600]">{visual.logoSize}% of QR</span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={60}
                    value={visual.logoSize}
                    onChange={(e) => setVisual((v) => ({ ...v, logoSize: parseInt(e.target.value) }))}
                    className="w-full"
                  />
                </div>
              )}

              {visualTab === "badges" && (
                <div>
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-3 mb-4">
                    <button onClick={() => setVisual((v) => ({ ...v, badge: "none" }))} className={`p-3 border-2 rounded-lg text-center transition-all ${visual.badge === "none" ? "border-purple-500 bg-purple-50" : "border-gray-200 hover:border-purple-300"}`}>
                      <div className="text-xl">-</div><div className="text-[10px] text-gray-500">None</div>
                    </button>
                    {Object.entries(BADGE_ICONS).map(([key, icon]) => (
                      <button key={key} onClick={() => setVisual((v) => ({ ...v, badge: key }))} className={`p-3 border-2 rounded-lg text-center transition-all ${visual.badge === key ? "border-purple-500 bg-purple-50" : "border-gray-200 hover:border-purple-300"}`}>
                        <div className="text-xl">{icon}</div><div className="text-[10px] text-gray-500 capitalize">{key}</div>
                      </button>
                    ))}
                  </div>
                  <Label className="text-sm">Badge Size</Label>
                  <input type="range" min={20} max={60} value={visual.badgeSize} onChange={(e) => setVisual((v) => ({ ...v, badgeSize: parseInt(e.target.value) }))} className="w-full" />
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Templates */}
        <Card className="overflow-hidden">
          <div onClick={() => toggleSection("templates")} className="w-full flex justify-between items-center p-4 bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer">
            <span className="font-bold text-blue-600">QR Templates & Presets</span>
            <div className="flex items-center gap-2">
              <button onClick={(e) => { e.stopPropagation(); setShowTemplateModal(true); }} className="text-xs px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600">Save Current</button>
              <span className="text-xs text-gray-400">{sectionsOpen.templates ? "Collapse" : "Expand"}</span>
            </div>
          </div>
          {sectionsOpen.templates && (
            <div className="p-4 space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-[#FF6600]" />
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Orange Brand Presets</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {ORANGE_PRESETS.map((tpl) => (
                    <div key={tpl.localId} onClick={() => loadFromItem(tpl)} className="relative p-3 border-2 border-[#FF6600]/30 rounded-lg cursor-pointer text-center transition-all hover:border-[#FF6600] hover:shadow bg-gradient-to-b from-orange-50 to-white">
                      <div className="w-12 h-12 mx-auto mb-2 rounded flex items-center justify-center" style={{ background: tpl.customization.bgColor }}>
                        <div className="w-5 h-5 rounded-sm" style={{ background: tpl.customization.useGradient ? `linear-gradient(135deg, ${tpl.customization.gradC1}, ${tpl.customization.gradC2})` : tpl.customization.fgColor }} />
                      </div>
                      <div className="text-xs font-semibold truncate">{tpl.name}</div>
                    </div>
                  ))}
                </div>
              </div>
              {templates.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Shared Templates</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                    {templates.map((tpl, i) => (
                      <div key={tpl.id || tpl.localId || i} onClick={() => loadFromItem(tpl)} className={`relative p-3 border-2 rounded-lg cursor-pointer text-center transition-all hover:border-blue-400 hover:shadow ${tpl.isDefault ? "border-amber-400 bg-amber-50" : "border-gray-200"}`}>
                        <div className="w-12 h-12 mx-auto mb-2 rounded flex items-center justify-center" style={{ background: tpl.customization?.bgColor || "#fff" }}>
                          <div className="w-5 h-5" style={{ background: tpl.customization?.fgColor || "#000" }} />
                        </div>
                        <div className="text-xs font-semibold truncate">{tpl.name}</div>
                        <button onClick={(e) => { e.stopPropagation(); deleteTemplate(i); }} className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded text-xs opacity-0 hover:opacity-100 transition-opacity">x</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Generate Button */}
        <div className="text-center py-2">
          <button onClick={generateQR} disabled={!canGenerate() || !scriptsReady} className="px-10 py-4 bg-gradient-to-r from-[#FF6600] to-[#ff8c00] text-white text-lg font-bold rounded-xl uppercase tracking-wider shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-lg">
            Generate QR Code
          </button>
        </div>

        {/* QR Results */}
        {qrResults.length > 0 && (
          <div className="flex flex-wrap justify-center gap-6">
            {qrResults.map((r) => (
              <Card key={r.id} className="p-6 text-center min-w-[300px] max-w-[420px] flex-1">
                <h3 className="font-bold text-lg mb-3">{r.title}</h3>
                <div id={`qrCode_${r.id}`} className="flex justify-center my-4" />
                {r.verified !== null && (
                  <div className={`text-sm font-semibold p-2 rounded-lg mt-2 ${r.verified ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                    {r.verified ? "✅" : "❌"} {r.verifyMsg}
                  </div>
                )}
                <div className="bg-gray-50 p-3 rounded-lg mt-3 text-left border-l-4 border-[#FF6600]">
                  <code className="text-xs text-gray-600 break-all">{r.url}</code>
                </div>
                <div className="flex flex-wrap gap-2 mt-4 justify-center">
                  <button onClick={() => downloadPNG(r.id)} className="px-3 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors">PNG</button>
                  <button onClick={() => downloadSVG(r.id)} className="px-3 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors">SVG</button>
                  {qrResults.length === 1 && <button onClick={() => downloadPPTX(r.id)} className="px-3 py-2 bg-[#d44a27] text-white text-sm rounded-lg hover:bg-[#b03d20] transition-colors">PPTX</button>}
                  <button onClick={() => copyToClipboard(r.id)} className="px-3 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors">Copy</button>
                </div>
              </Card>
            ))}
            {qrResults.length === 2 && (
              <div className="w-full text-center">
                <button onClick={downloadDualPPTX} className="px-6 py-3 bg-[#d44a27] text-white rounded-lg font-semibold hover:bg-[#b03d20] transition-colors shadow">
                  Download Combined PowerPoint (Dual-Slide)
                </button>
              </div>
            )}
          </div>
        )}

        {/* Shared History */}
        <Card className="overflow-hidden">
          <div onClick={() => toggleSection("history")} className="w-full flex justify-between items-center p-4 bg-green-50 hover:bg-green-100 transition-colors cursor-pointer">
            <div className="flex items-center gap-2">
              <span className="font-bold text-green-700">Shared Generation History</span>
              <span className="text-xs text-green-600 font-medium">({history.length} items seen by all)</span>
            </div>
            <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
              <label className="flex items-center gap-1 text-sm text-green-700 cursor-pointer">
                <input type="checkbox" checked={showFavOnly} onChange={(e) => setShowFavOnly(e.target.checked)} />
                Favorites Only
              </label>
              <button onClick={() => loadHistory()} className="text-xs px-2 py-1 bg-white border border-green-200 rounded text-green-700 hover:bg-green-50">Refresh</button>
              <span className="text-xs text-gray-400">{sectionsOpen.history ? "Collapse" : "Expand"}</span>
            </div>
          </div>
          {sectionsOpen.history && (
            <div className="p-4">
              {(showFavOnly ? history.filter((h) => h.isFavorite) : history).length === 0 ? (
                <p className="text-center text-gray-400 py-8 italic">No saved QR codes yet. Generated QR codes will appear here for everyone.</p>
              ) : (
                <div className="space-y-2 max-h-[350px] overflow-y-auto">
                  {(showFavOnly ? history.filter((h) => h.isFavorite) : history).map((item, displayIndex) => {
                    const realIndex = showFavOnly ? history.findIndex((h) => h.timestamp === item.timestamp) : displayIndex;
                    return (
                      <div key={item.id || item.timestamp || displayIndex} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="min-w-0 flex-1 mr-3">
                          <div className="font-semibold text-sm truncate text-gray-900">{item.title}</div>
                          <div className="text-xs text-gray-500 flex flex-wrap items-center gap-x-2 mt-0.5">
                            <span>{new Date(item.timestamp).toLocaleString()}</span>
                            {item.userName && (
                              <span className="inline-flex items-center gap-1 font-medium text-[#0E2841] bg-white px-1.5 py-0.5 rounded border border-gray-200">
                                👤 {item.userName}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => toggleFavorite(realIndex)}
                            className={`text-lg px-1 ${item.isFavorite ? "text-amber-400" : "text-gray-300"}`}
                          >{item.isFavorite ? "★" : "☆"}</button>
                          <button onClick={() => downloadHistoryItem(item)} className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 font-medium">Download</button>
                          <button onClick={() => loadFromItem(item)} className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 font-medium">Reload</button>
                          <button onClick={() => renameHistory(realIndex)} className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600">Edit</button>
                          <button onClick={() => deleteHistory(realIndex)} className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600">Delete</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-gray-400 py-4">
          Orange Egypt | L&D QR & MSurvey Hub | Created by Diaa Saad
        </div>
      </div>

      {/* Template Save Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setShowTemplateModal(false)}>
          <div className="bg-white p-6 rounded-xl max-w-[400px] w-[90%] shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-4">Save as Template</h3>
            <Input placeholder="Enter template name..." value={templateName} onChange={(e) => setTemplateName(e.target.value)} maxLength={30} autoFocus />
            <div className="flex gap-2 justify-end mt-4">
              <button onClick={() => setShowTemplateModal(false)} className="px-4 py-2 bg-gray-200 rounded-lg text-sm">Cancel</button>
              <button onClick={saveTemplate} className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600">Save</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
