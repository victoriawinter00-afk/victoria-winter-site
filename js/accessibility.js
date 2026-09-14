import { qs } from './dom.js';

const THEME_STORAGE_KEY = 'theme-mode';
const COLORBLIND_STORAGE_KEY = 'colorblind-mode';

// Apply the saved choices before wiring up page controls so every page shares the same state.
export function applySavedAccessibilityState() {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    const savedColorblind = localStorage.getItem(COLORBLIND_STORAGE_KEY);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const prefersReducedLuminance = window.matchMedia('(prefers-contrast: more)').matches || window.matchMedia('(prefers-contrast: high)').matches;

    if (savedTheme === 'dark' || (!savedTheme && (prefersDark || prefersReducedLuminance))) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }

    if (savedColorblind === 'on') {
        document.body.classList.add('colorblind-mode');
    } else {
        document.body.classList.remove('colorblind-mode');
    }
}

export function initAccessibilityControls() {
    const themeToggle = qs('.theme-toggle');
    const colorblindToggle = qs('.colorblind-toggle');
    const resetButton = qs('.reset-accessibility');

    const applyThemeState = function() {
        const isDark = document.body.classList.contains('dark-mode');
        if (themeToggle) {
            themeToggle.textContent = 'Dark mode: ' + (isDark ? 'On' : 'Off');
            themeToggle.setAttribute('aria-pressed', String(isDark));
        }
    };

    const applyColorblindState = function() {
        const isColorblind = document.body.classList.contains('colorblind-mode');
        if (colorblindToggle) {
            colorblindToggle.textContent = 'Colorblind mode: ' + (isColorblind ? 'On' : 'Off');
            colorblindToggle.setAttribute('aria-pressed', String(isColorblind));
        }
    };

    applyThemeState();
    applyColorblindState();

    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            document.body.classList.toggle('dark-mode');
            const isDark = document.body.classList.contains('dark-mode');
            localStorage.setItem(THEME_STORAGE_KEY, isDark ? 'dark' : 'light');
            applyThemeState();
        });
    }

    if (colorblindToggle) {
        colorblindToggle.addEventListener('click', function() {
            document.body.classList.toggle('colorblind-mode');
            const isColorblind = document.body.classList.contains('colorblind-mode');
            localStorage.setItem(COLORBLIND_STORAGE_KEY, isColorblind ? 'on' : 'off');
            applyColorblindState();
        });
    }

    if (resetButton) {
        resetButton.addEventListener('click', function() {
            document.body.classList.remove('dark-mode', 'colorblind-mode');
            localStorage.removeItem(THEME_STORAGE_KEY);
            localStorage.removeItem(COLORBLIND_STORAGE_KEY);
            applyThemeState();
            applyColorblindState();
        });
    }
}
