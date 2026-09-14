import { applySavedAccessibilityState, initAccessibilityControls } from './accessibility.js';
import { initServiceToggles, initServiceBuilder } from './services.js';
import { initMessageCounter, initConsultationForm } from './forms.js';

// Apply the saved choices as early as possible so every page shares the same state.
applySavedAccessibilityState();

document.addEventListener('DOMContentLoaded', function() {
    initAccessibilityControls();
    initServiceToggles();
    initServiceBuilder();
    initMessageCounter();
    initConsultationForm();
});
