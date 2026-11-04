import type { TenantBranding } from "@prisma/client";
import { BRAND_PALETTE } from "./constants";

export const DEFAULT_BRANDING = {
  primaryColor: BRAND_PALETTE.primary,
  secondaryColor: BRAND_PALETTE.secondary,
  backgroundColor: BRAND_PALETTE.white,
  menuColor: BRAND_PALETTE.white,
  textColor: BRAND_PALETTE.ink,
  buttonColor: BRAND_PALETTE.ink,
  fontFamily: "sans",
  buttonStyle: "rounded",
  coverUrl: null,
  gallery: [] as string[],
  instagram: null,
  facebook: null,
  website: null,
  tagline: null,
  showTeam: true,
  showServices: true,
  showGallery: true,
  showHours: true,
  showAddress: true,
} as const;

export const BRAND_FONTS = [
  { value: "sans", label: "Moderna" },
  { value: "poppins", label: "Geométrica" },
  { value: "inter", label: "Minimalista" },
  { value: "serif", label: "Clássica" },
  { value: "lora", label: "Elegante" },
  { value: "playfair", label: "Luxo" },
  { value: "montserrat", label: "Impacto" },
] as const;

export type BrandFont = (typeof BRAND_FONTS)[number]["value"];

export type BrandingView = {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  menuColor: string;
  textColor: string;
  buttonColor: string;
  fontFamily: string;
  buttonStyle: string;
  coverUrl: string | null;
  gallery: string[];
  instagram: string | null;
  facebook: string | null;
  website: string | null;
  tagline: string | null;
  showTeam: boolean;
  showServices: boolean;
  showGallery: boolean;
  showHours: boolean;
  showAddress: boolean;
};

const HEX = /^#[0-9a-fA-F]{6}$/;

export function isHexColor(value: unknown): value is string {
  return typeof value === "string" && HEX.test(value);
}

export function isBrandFont(value: unknown): value is BrandFont {
  return BRAND_FONTS.some((font) => font.value === value);
}

export function safeHttpUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("/")) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return null;
}

const DATA_IMAGE = /^data:image\/(?:png|jpe?g|webp);base64,/i;

export function safeImageUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (DATA_IMAGE.test(trimmed)) return trimmed;
  return safeHttpUrl(trimmed);
}

export function normalizeGallery(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => safeImageUrl(item))
    .filter((item): item is string => Boolean(item))
    .slice(0, 12);
}

export function resolveBranding(
  branding: Partial<TenantBranding> | null | undefined,
  fallbackColor?: string | null,
): BrandingView {
  const fallback = isHexColor(fallbackColor) ? fallbackColor : DEFAULT_BRANDING.primaryColor;
  return {
    primaryColor: isHexColor(branding?.primaryColor)
      ? branding.primaryColor
      : fallback,
    secondaryColor: isHexColor(branding?.secondaryColor)
      ? branding.secondaryColor
      : DEFAULT_BRANDING.secondaryColor,
    backgroundColor: isHexColor(branding?.backgroundColor)
      ? branding.backgroundColor
      : DEFAULT_BRANDING.backgroundColor,
    menuColor: isHexColor(branding?.menuColor)
      ? branding.menuColor
      : DEFAULT_BRANDING.menuColor,
    textColor: isHexColor(branding?.textColor)
      ? branding.textColor
      : DEFAULT_BRANDING.textColor,
    buttonColor: isHexColor(branding?.buttonColor)
      ? branding.buttonColor
      : DEFAULT_BRANDING.buttonColor,
    fontFamily: isBrandFont(branding?.fontFamily) ? branding.fontFamily : "sans",
    buttonStyle:
      branding?.buttonStyle === "pill" || branding?.buttonStyle === "square"
        ? branding.buttonStyle
        : "rounded",
    coverUrl: safeImageUrl(branding?.coverUrl),
    gallery: normalizeGallery(branding?.gallery),
    instagram: safeHttpUrl(branding?.instagram),
    facebook: safeHttpUrl(branding?.facebook),
    website: safeHttpUrl(branding?.website),
    tagline: branding?.tagline?.trim() || null,
    showTeam: branding?.showTeam ?? true,
    showServices: branding?.showServices ?? true,
    showGallery: branding?.showGallery ?? true,
    showHours: branding?.showHours ?? true,
    showAddress: branding?.showAddress ?? true,
  };
}

function channel(value: number): number {
  const normalized = value / 255;
  return normalized <= 0.03928
    ? normalized / 12.92
    : Math.pow((normalized + 0.055) / 1.055, 2.4);
}

export function relativeLuminance(hex: string): number {
  if (!isHexColor(hex)) return 0;
  const value = hex.slice(1);
  const r = channel(parseInt(value.slice(0, 2), 16));
  const g = channel(parseInt(value.slice(2, 4), 16));
  const b = channel(parseInt(value.slice(4, 6), 16));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function readableTextOn(hex: string): string {
  return relativeLuminance(hex) > 0.55 ? BRAND_PALETTE.ink : BRAND_PALETTE.white;
}

export function mixHex(hex: string, target: string, weight: number): string {
  if (!isHexColor(hex) || !isHexColor(target)) return hex;
  const ratio = Math.min(1, Math.max(0, weight));
  const from = hex.slice(1);
  const to = target.slice(1);
  const parts = [0, 2, 4].map((offset) => {
    const a = parseInt(from.slice(offset, offset + 2), 16);
    const b = parseInt(to.slice(offset, offset + 2), 16);
    return Math.round(a + (b - a) * ratio)
      .toString(16)
      .padStart(2, "0");
  });
  return `#${parts.join("")}`;
}

export function brandingCssVars(branding: BrandingView): Record<string, string> {
  const radius =
    branding.buttonStyle === "pill" ? "9999px" : branding.buttonStyle === "square" ? "0.15rem" : "0.55rem";
  const font = brandFontStack(branding.fontFamily);
  const menuText = readableTextOn(branding.menuColor);
  return {
    "--brand": branding.primaryColor,
    "--brand-hover": mixHex(branding.primaryColor, "#000000", 0.16),
    "--brand-soft": mixHex(branding.primaryColor, "#ffffff", 0.45),
    "--brand-strong": mixHex(branding.primaryColor, "#000000", 0.22),
    "--brand-secondary": branding.secondaryColor,
    "--brand-bg": branding.backgroundColor,
    "--brand-menu": branding.menuColor,
    "--brand-menu-text": menuText,
    "--brand-menu-muted": mixHex(menuText, branding.menuColor, 0.34),
    "--brand-menu-line": mixHex(menuText, branding.menuColor, 0.78),
    "--brand-text": branding.textColor,
    "--brand-button": branding.buttonColor,
    "--brand-button-text": readableTextOn(branding.buttonColor),
    "--brand-surface": mixHex(branding.primaryColor, "#ffffff", 0.92),
    "--brand-line": mixHex(branding.textColor, "#ffffff", 0.82),
    "--brand-radius": radius,
    "--brand-font": font,
    "--ink": branding.textColor,
    "--paper": mixHex(branding.backgroundColor, branding.textColor, 0.045),
    "--line": mixHex(branding.textColor, branding.backgroundColor, 0.84),
    "--muted": mixHex(branding.textColor, branding.backgroundColor, 0.42),
    "--background": branding.backgroundColor,
    "--foreground": branding.textColor,
  };
}

function brandFontStack(fontFamily: string): string {
  switch (fontFamily) {
    case "serif":
      return 'Georgia, "Times New Roman", ui-serif, serif';
    case "lora":
      return 'var(--font-lora), Georgia, ui-serif, serif';
    case "playfair":
      return 'var(--font-playfair), Georgia, ui-serif, serif';
    case "poppins":
      return 'var(--font-poppins), ui-sans-serif, system-ui, "Segoe UI", Roboto, Arial, sans-serif';
    case "inter":
      return 'var(--font-inter), ui-sans-serif, system-ui, "Segoe UI", Roboto, Arial, sans-serif';
    case "montserrat":
      return 'var(--font-montserrat), ui-sans-serif, system-ui, "Segoe UI", Roboto, Arial, sans-serif';
    default:
      return '"Plus Jakarta Sans", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
  }
}

export function brandingFormDefaults(
  branding: Partial<TenantBranding> | null | undefined,
  fallbackColor?: string | null,
): BrandingView {
  return resolveBranding(branding, fallbackColor);
}
