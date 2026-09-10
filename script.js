// Wait for DOM to fully load
document.addEventListener('DOMContentLoaded', function() {

    const themeToggle = document.querySelector('.theme-toggle');
    const colorblindToggle = document.querySelector('.colorblind-toggle');
    const resetButton = document.querySelector('.reset-accessibility');

    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const reducedLuminance = window.matchMedia('(prefers-contrast: more)') || window.matchMedia('(prefers-contrast: high)');
    const savedTheme = localStorage.getItem('theme-mode');
    const savedColorblind = localStorage.getItem('colorblind-mode');

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

    if ((savedTheme && savedTheme === 'dark') || (!savedTheme && prefersDark)) {
        document.body.classList.add('dark-mode');
    }

    if (savedColorblind === 'on') {
        document.body.classList.add('colorblind-mode');
    }

    if (reducedLuminance && reducedLuminance.matches && !savedTheme) {
        document.body.classList.add('dark-mode');
    }

    applyThemeState();
    applyColorblindState();

    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            document.body.classList.toggle('dark-mode');
            const isDark = document.body.classList.contains('dark-mode');
            localStorage.setItem('theme-mode', isDark ? 'dark' : 'light');
            applyThemeState();
        });
    }

    if (colorblindToggle) {
        colorblindToggle.addEventListener('click', function() {
            document.body.classList.toggle('colorblind-mode');
            const isColorblind = document.body.classList.contains('colorblind-mode');
            localStorage.setItem('colorblind-mode', isColorblind ? 'on' : 'off');
            applyColorblindState();
        });
    }

    if (resetButton) {
        resetButton.addEventListener('click', function() {
            document.body.classList.remove('dark-mode', 'colorblind-mode');
            localStorage.removeItem('theme-mode');
            localStorage.removeItem('colorblind-mode');
            applyThemeState();
            applyColorblindState();
        });
    }

    // ---------- SERVICE TOGGLE (Expand/Collapse) ----------
    const toggles = document.querySelectorAll('.service-toggle');
    toggles.forEach(function(toggle, index) {
        const description = toggle.nextElementSibling;
        const descriptionId = 'service-description-' + (index + 1);
        toggle.setAttribute('type', 'button');
        toggle.setAttribute('aria-expanded', 'false');
        if (description && description.classList.contains('service-description')) {
            description.id = descriptionId;
            toggle.setAttribute('aria-controls', descriptionId);
        }

        toggle.addEventListener('click', function() {
            const controlledDescription = this.nextElementSibling;
            if (controlledDescription && controlledDescription.classList.contains('service-description')) {
                const isOpen = controlledDescription.classList.toggle('open');
                this.setAttribute('aria-expanded', String(isOpen));
            }
        });
    });

    // ---------- DOM ELEMENT REFERENCES ----------
    const addRemoveBtns = document.querySelectorAll('.add-remove-btn');
    document.querySelectorAll('button').forEach(function(button) {
        button.setAttribute('type', button.getAttribute('type') || 'button');
    });
    addRemoveBtns.forEach(function(button) {
        button.setAttribute('aria-label', 'Add or remove ' + button.getAttribute('data-service'));
    });
    const selectedList = document.getElementById('selected-services-list');
    const totalEstimate = document.getElementById('total-estimate');
    const descriptionMessage = document.getElementById('description-message');
    const requestBtn = document.getElementById('request-consultation');
    const personalMessage = document.getElementById('personal-message');
    const charCounter = document.getElementById('char-counter');
    const formStatus = document.getElementById('form-status');

    function setFormStatus(message, type) {
        if (!formStatus) return;
        formStatus.textContent = message;
        formStatus.className = 'form-status ' + (type || '');
    }

    // Store selected services
    let selectedServices = [];

    // ---------- UPDATE CONSULTATION BOX ----------
    function updateConsultationBox() {
        if (selectedList) {
            selectedList.innerHTML = '';
        }

        if (selectedServices.length === 0) {
            if (descriptionMessage) {
                descriptionMessage.textContent = 'Please select a service or use the message box, and provide a contact method with your name to request a free consultation.';
            }
            if (totalEstimate) {
                totalEstimate.innerHTML = '<strong>Estimated Total: $0</strong>';
            }
            return;
        }

        if (descriptionMessage) {
            descriptionMessage.textContent = 'Selected Services:';
        }

        let total = 0;
        selectedServices.forEach(function(service) {
            const li = document.createElement('li');
            li.textContent = service.name + ' — $' + service.price;
            if (selectedList) {
                selectedList.appendChild(li);
            }
            total += service.price;
        });

        if (totalEstimate) {
            totalEstimate.innerHTML = '<strong>Estimated Total: $' + total + '</strong>';
        }
    }

    // ---------- CHARACTER COUNTER ----------
    if (personalMessage) {
        personalMessage.addEventListener('input', function() {
            const count = this.value.length;
            if (charCounter) {
                charCounter.textContent = count + ' / 1000';
            }
        });
    }

    // ---------- ADD / REMOVE BUTTONS ----------
    addRemoveBtns.forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();

            const serviceName = this.getAttribute('data-service');
            const servicePrice = parseInt(this.getAttribute('data-price'));

            const existingIndex = selectedServices.findIndex(function(s) {
                return s.name === serviceName;
            });

            if (existingIndex !== -1) {
                selectedServices.splice(existingIndex, 1);
                this.classList.remove('added');
                this.textContent = 'Add / Remove';
            } else {
                selectedServices.push({ name: serviceName, price: servicePrice });
                this.classList.add('added');
                this.textContent = 'Added ✓';
            }

            updateConsultationBox();

            if (selectedServices.length > 0) {
                if (descriptionMessage) {
                    descriptionMessage.textContent = 'Selected Services:';
                }
                if (requestBtn) {
                    requestBtn.classList.remove('highlight');
                }
            }
        });
    });

    // ---------- REQUEST CONSULTATION (Fetch API Version) ----------
    if (requestBtn) {
        requestBtn.addEventListener('click', async function() {
            // Get client contact info
            const clientName = document.getElementById('client-name');
            const clientEmail = document.getElementById('client-email');
            const clientPhone = document.getElementById('client-phone');
            const prefs = document.querySelectorAll('.contact-pref:checked');

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
            const hasServices = selectedServices.length > 0;
            const hasMessage = personalMessage && personalMessage.value.trim().length >= 5;

            if (!hasServices && !hasMessage) {
                this.classList.add('highlight');
                if (descriptionMessage) {
                    descriptionMessage.textContent = 'Please select a service or write a message (at least 5 characters).';
                }
                // Highlight the service list and message box
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
                    selectedServices = [];
                    updateConsultationBox();
                    if (personalMessage) personalMessage.value = '';
                    if (charCounter) charCounter.textContent = '0 / 1000';
                    if (clientName) clientName.value = '';
                    if (clientEmail) clientEmail.value = '';
                    if (clientPhone) clientPhone.value = '';
                    document.querySelectorAll('.contact-pref').forEach(function(cb) {
                        cb.checked = false;
                    });
                    document.querySelectorAll('.add-remove-btn').forEach(function(btn) {
                        btn.classList.remove('added');
                        btn.textContent = 'Add / Remove';
                    });
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

    // ---------- INITIAL STATE ----------
    if (selectedServices.length === 0 && descriptionMessage) {
        descriptionMessage.textContent = 'Please select a service or use the message box, and provide a contact method with your name to request a free consultation.';
    }

});