// ComfyUI-Usgromana-Gallery/web/core/theme.js
// Centralized theme and color system

export const THEME = {
    // Background colors
    bg: {
        primary: "rgba(3, 7, 18, 0.82)",
        secondary: "rgba(15, 23, 42, 0.78)",
        tertiary: "rgba(15, 23, 42, 0.65)",
        card: "rgba(20, 20, 20, 0.92)",
        overlay: "rgba(0, 0, 0, 0.82)",
        modal: "rgba(27, 27, 27, 0.9)",
        button: "rgba(15, 23, 42, 0.85)",
        buttonHover: "rgba(15, 23, 42, 0.98)",
        input: "rgba(15, 23, 42, 0.38)",
        panel: "rgba(15, 23, 42, 0.92)",
    },

    // Border colors
    border: {
        primary: "rgba(148, 163, 184, 0.35)",
        secondary: "rgba(148, 163, 184, 0.55)",
        tertiary: "rgba(148, 163, 184, 0.28)",
        subtle: "rgba(255, 255, 255, 0.12)",
        divider: "rgba(148, 163, 184, 0.30)",
    },

    // Text colors
    text: {
        primary: "#e5e7eb",
        secondary: "rgba(209, 213, 219, 0.85)",
        tertiary: "rgba(200, 200, 200, 0.7)",
        muted: "rgba(148, 163, 184, 0.6)",
    },

    // Accent colors
    accent: {
        rating: "#ffd86b",
        active: "rgba(56, 189, 248, 0.18)",
        activeBorder: "rgba(56, 189, 248, 0.7)",
        highlight: "rgba(180, 180, 255, 0.18)",
    },

    // Shadow
    shadow: {
        small: "0 8px 22px rgba(15, 23, 42, 0.85)",
        medium: "0 10px 28px rgba(0, 0, 0, 0.55)",
        large: "0 18px 55px rgba(0, 0, 0, 0.65)",
        button: "0 8px 22px rgba(15, 23, 42, 0.85)",
    },

    // Spacing
    spacing: {
        xs: "4px",
        sm: "6px",
        md: "8px",
        lg: "10px",
        xl: "12px",
    },

    // Border radius
    radius: {
        sm: "6px",
        md: "10px",
        lg: "12px",
        xl: "14px",
        full: "999px",
    },

    // Z-index layers
    zIndex: {
        overlay: 10000,
        modal: 20000,
        filterPanel: 20010,
        details: 20000,
        detailsTile: 20001,
    },
};

// Helper to get theme-aware styles
export function getThemeStyles(component) {
    const styles = {
        button: {
            borderRadius: THEME.radius.full,
            border: `1px solid ${THEME.border.secondary}`,
            padding: `${THEME.spacing.xs} ${THEME.spacing.lg}`,
            fontSize: "11px",
            cursor: "pointer",
            background: THEME.bg.button,
            color: THEME.text.primary,
        },
        input: {
            padding: `${THEME.spacing.xs} ${THEME.spacing.md}`,
            borderRadius: THEME.radius.full,
            border: `1px solid ${THEME.border.tertiary}`,
            background: THEME.bg.input,
            color: THEME.text.primary,
            fontSize: "11px",
            outline: "none",
        },
        card: {
            borderRadius: THEME.radius.md,
            background: THEME.bg.card,
            border: `1px solid ${THEME.border.subtle}`,
        },
    };

    return styles[component] || {};
}

