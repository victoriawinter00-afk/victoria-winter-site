import { qs, qsa } from './dom.js';
import {
    getSelectedServices,
    updateConsultationBox,
    clearSelectedServices,
    resetServiceButtons
} from './services.js';

let personalMessage = null;
let charCounter = null;
let formStatus = null;

function setFormStatus(message, type) {
    if (!formStatus) return;
    formStatus.textContent = message;
    formStatus.className = 'form-status ' + (type || '');
}

// ---------- CHARACTER COUNTER ----------
export function initMessageCounter() {
    personalMessage = document.getElementById('personal-message');
    charCounter = document.getElementById('char-counter');

    if (personalMessage) {
        personalMessage.addEventListener('input', function() {
            const count = this.value.length;
            if (charCounter) {
                charCounter.textContent = count + ' / 1000';
            }
        });
    }
}

// ---------- REQUEST CONSULTATION (Fetch API Version) ----------
export function initConsultationForm() {
    const requestBtn = document.getElementById('request-consultation');
    formStatus = document.getElementById('form-status');

    if (!requestBtn) {
        return;
    }

    requestBtn.addEventListener('click', async function() {
        // Get client contact info
        const clientName = document.getElementById('client-name');
        const clientEmail = document.getElementById('client-email');
        const clientPhone = document.getElementById('client-phone');
        const prefs = qsa('.contact-pref:checked');

        // Build preferences string (if any are checked)
        let prefString = '';
        prefs.forEach(function(p) {
            if (prefString) prefString += ', ';
            prefString += p.value;
        });

        // --- STEP 1: Validate Name (required) ---
        const hasName = clientName && clientName.value.trim().length > 0;
        if (!hasName) {
            setFormStatus('Please enter your full name so we know who to contact.', 'error');
            if (clientName) clientName.focus();
            return;
        }

        // --- STEP 2: Validate Email OR Phone (at least one) ---
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const hasEmail = clientEmail && clientEmail.value.trim().length > 0;
        const isValidEmail = hasEmail && emailPattern.test(clientEmail.value.trim());

        const hasPhone = clientPhone && clientPhone.value.trim().length > 0;
        const phoneDigits = hasPhone ? clientPhone.value.replace(/\D/g, '') : '';
        const isValidPhone = hasPhone && phoneDigits.length === 10;

        // If neither is provided at all
        if (!isValidEmail && !isValidPhone) {
            // Check if email is provided but invalid
            if (hasEmail && !isValidEmail) {
                setFormStatus('Please enter a valid email address, or just a phone number.', 'error');
                if (clientEmail) clientEmail.focus();
                return;
            }
            // Check if phone is provided but invalid
            if (hasPhone && !isValidPhone) {
                setFormStatus('Please enter a valid 10-digit phone number, or just an email address.', 'error');
                if (clientPhone) clientPhone.focus();
                return;
            }
            // If neither is provided at all
            setFormStatus('Please provide a valid email address, a valid phone number, or both so we can contact you.', 'error');
            if (clientEmail) clientEmail.focus();
            return;
        }

        // --- STEP 3: Validate Services OR Message (at least one) ---
        const selectedServices = getSelectedServices();
        const hasServices = selectedServices.length > 0;
        const hasMessage = personalMessage && personalMessage.value.trim().length >= 5;

        if (!hasServices && !hasMessage) {
            this.classList.add('highlight');
            const descriptionMessage = document.getElementById('description-message');
            if (descriptionMessage) {
                descriptionMessage.textContent = 'Please select a service or write a message (at least 5 characters).';
            }
            // Highlight the service list and message box
            const selectedList = document.getElementById('selected-services-list');
            if (selectedList) selectedList.style.border = '2px solid #ffcc00';
            if (personalMessage) personalMessage.style.border = '2px solid #ffcc00';
            return;
        }

        // --- STEP 4: Build services text ---
        let servicesText = '';
        let total = 0;
        selectedServices.forEach(function(s) {
            servicesText += '- ' + s.name + ': $' + s.price + '\n';
            total += s.price;
        });

        // --- STEP 5: Build payload with client info ---
        const payload = {
            services: servicesText || null,
            total: total > 0 ? '$' + total : null,
            message: personalMessage ? personalMessage.value.trim() : null,
            clientName: clientName.value.trim(),
            clientEmail: clientEmail.value.trim(),
            clientPhone: clientPhone.value.trim(),
            contactPref: prefString || 'Not specified'
        };

        // Disable button
        this.disabled = true;
        this.textContent = 'Sending...';

        try {
            const response = await fetch('https://emailer.victoria00business00.workers.dev', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (response.ok) {
                setFormStatus(result.message || 'Your consultation request has been sent.', 'success');

                // Clear form
                clearSelectedServices();
                updateConsultationBox();
                if (personalMessage) personalMessage.value = '';
                if (charCounter) charCounter.textContent = '0 / 1000';
                if (clientName) clientName.value = '';
                if (clientEmail) clientEmail.value = '';
                if (clientPhone) clientPhone.value = '';
                qsa('.contact-pref').forEach(function(cb) {
                    cb.checked = false;
                });
                resetServiceButtons();
            } else {
                setFormStatus('Error: ' + (result.error || 'Something went wrong. Please try again.'), 'error');
            }
        } catch (error) {
            setFormStatus('Network error. Please check your connection and try again.', 'error');
        } finally {
            this.disabled = false;
            this.textContent = 'Request Consultation';
        }
    });
}
