// /js/theme.js
// Theme (light/dark) singleton - mirrors the class-exported-as-const pattern
// used by js/auth.js ("auth") and js/store.js ("db"). js/theme-init.js has
// already set the initial data-theme attribute before this module loads;
// this class handles subsequent reads/writes/toggling.

const STORAGE_KEY = 'empTrackThemeV1';

class ThemeManager {
    getTheme() {
        return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    }

    setTheme(nextTheme) {
        const theme = nextTheme === 'dark' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', theme);
        try { localStorage.setItem(STORAGE_KEY, theme); } catch (e) { /* storage unavailable */ }
        window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
        return theme;
    }

    toggleTheme() {
        return this.setTheme(this.getTheme() === 'dark' ? 'light' : 'dark');
    }

    // Wires a click handler onto btnEl that toggles the theme and swaps the
    // icon element's class between sunClass/moonClass to reflect the state
    // being switched TO (so a moon shows while in light mode, inviting a
    // switch to dark, and vice versa).
    bindToggleButton(btnEl, options = {}) {
        if (!btnEl) return;
        const iconEl = options.iconEl || btnEl.querySelector('i');
        const sunClass = options.sunClass || 'ph-sun';
        const moonClass = options.moonClass || 'ph-moon';

        const sync = () => {
            if (!iconEl) return;
            const isDark = this.getTheme() === 'dark';
            iconEl.classList.toggle(sunClass, isDark);
            iconEl.classList.toggle(moonClass, !isDark);
        };

        btnEl.addEventListener('click', () => {
            this.toggleTheme();
            sync();
        });

        sync();
    }
}

export const theme = new ThemeManager();
