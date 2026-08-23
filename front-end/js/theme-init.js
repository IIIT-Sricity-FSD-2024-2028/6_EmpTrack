// /js/theme-init.js
// Must be loaded as the FIRST tag in every page's <head>, before any
// stylesheet <link>, as a plain (non-module, non-deferred) script so it runs
// synchronously and blocks first paint - this avoids a flash of the wrong
// theme, which an ES module + DOMContentLoaded listener (see js/app.js) would
// be too late to prevent.
(function () {
    try {
        var saved = localStorage.getItem('empTrackThemeV1');
        var theme = saved === 'light' || saved === 'dark'
            ? saved
            : (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        document.documentElement.setAttribute('data-theme', theme);
    } catch (e) {
        document.documentElement.setAttribute('data-theme', 'light');
    }
})();
