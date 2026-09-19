import { qs, qsa } from './dom.js';

// Store selected services
const selectedServices = [];

const STORAGE_KEY = 'selected-services';

let selectedList = null;
let totalEstimate = null;
let descriptionMessage = null;
let requestBtn = null;

export function getSelectedServices() {
    return selectedServices;
}

// ---------- PERSISTENCE ----------
function persistSelectedServices() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedServices));
    } catch (error) {
        // Storage unavailable; keep selections in memory for this page.
    }
}

function loadSelectedServices() {
    let stored = [];
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                stored = parsed.filter(function(item) {
                    return item && typeof item.name === 'string' && (item.price === null || typeof item.price === 'number');
                });
            }
        }
    } catch (error) {
        stored = [];
    }

    selectedServices.length = 0;
    stored.forEach(function(item) {
        selectedServices.push({ name: item.name, price: item.price === null ? null : item.price });
    });
}

export function clearSelectedServices() {
    selectedServices.length = 0;
    persistSelectedServices();
}

// ---------- UPDATE CONSULTATION BOX ----------
export function updateConsultationBox() {
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
    let hasQuoted = false;
    selectedServices.forEach(function(service) {
        const li = document.createElement('li');
        if (service.price === null) {
            li.textContent = service.name + ' — Quoted';
            hasQuoted = true;
        } else {
            li.textContent = service.name + ' — $' + service.price;
            total += service.price;
        }

        if (selectedList) {
            const removeBtn = document.createElement('button');
            removeBtn.setAttribute('type', 'button');
            removeBtn.className = 'remove-service-btn';
            removeBtn.textContent = 'Remove';
            removeBtn.setAttribute('aria-label', 'Remove ' + service.name);
            removeBtn.addEventListener('click', function() {
                removeServiceByName(service.name);
            });
            li.appendChild(document.createTextNode(' '));
            li.appendChild(removeBtn);
            selectedList.appendChild(li);
        }
    });

    if (totalEstimate) {
        let html = '<strong>Estimated Total: $' + total + '</strong>';
        if (hasQuoted) {
            html += '<br>Quoted — estimate in agreement';
        }
        totalEstimate.innerHTML = html;
    }
}

function removeServiceByName(name) {
    const index = selectedServices.findIndex(function(service) {
        return service.name === name;
    });
    if (index === -1) {
        return;
    }

    selectedServices.splice(index, 1);
    persistSelectedServices();
    updateConsultationBox();

    qsa('.add-remove-btn').forEach(function(btn) {
        if (btn.getAttribute('data-service') === name) {
            btn.classList.remove('added');
            btn.textContent = 'Add / Remove';
        }
    });
}

export function resetServiceButtons() {
    qsa('.add-remove-btn').forEach(function(btn) {
        btn.classList.remove('added');
        btn.textContent = 'Add / Remove';
    });
}

// ---------- SERVICE TOGGLE (Expand/Collapse) ----------
export function initServiceToggles() {
    const toggles = qsa('.service-toggle');
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
}

// ---------- DOM ELEMENT REFERENCES + ADD / REMOVE ----------
export function initServiceBuilder() {
    const addRemoveBtns = qsa('.add-remove-btn');
    qsa('button').forEach(function(button) {
        button.setAttribute('type', button.getAttribute('type') || 'button');
    });
    addRemoveBtns.forEach(function(button) {
        button.setAttribute('aria-label', 'Add or remove ' + button.getAttribute('data-service'));
    });
    selectedList = document.getElementById('selected-services-list');
    totalEstimate = document.getElementById('total-estimate');
    descriptionMessage = document.getElementById('description-message');
    requestBtn = document.getElementById('request-consultation');

    loadSelectedServices();

    addRemoveBtns.forEach(function(btn) {
        const serviceName = btn.getAttribute('data-service');
        const isStored = selectedServices.some(function(service) {
            return service.name === serviceName;
        });
        if (isStored) {
            btn.classList.add('added');
            btn.textContent = 'Added ✓';
        }
    });

    addRemoveBtns.forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();

            const serviceName = this.getAttribute('data-service');
            const priceMode = this.getAttribute('data-price-mode') || 'fixed';
            let servicePrice = null;
            if (priceMode !== 'quoted') {
                const parsedPrice = parseInt(this.getAttribute('data-price'), 10);
                servicePrice = isNaN(parsedPrice) ? null : parsedPrice;
            }

            const existingIndex = selectedServices.findIndex(function(s) {
                return s.name === serviceName;
            });

            if (existingIndex !== -1) {
                selectedServices.splice(existingIndex, 1);
                this.classList.remove('added');
                this.textContent = 'Add / Remove';
            } else {
                const group = this.getAttribute('data-group');
                if (group) {
                    qsa('.add-remove-btn[data-group="' + group + '"]').forEach(function(other) {
                        if (other === this || !other.classList.contains('added')) {
                            return;
                        }
                        const otherName = other.getAttribute('data-service');
                        const otherIndex = selectedServices.findIndex(function(s) {
                            return s.name === otherName;
                        });
                        if (otherIndex !== -1) {
                            selectedServices.splice(otherIndex, 1);
                        }
                        other.classList.remove('added');
                        other.textContent = 'Add / Remove';
                    }, this);
                }

                selectedServices.push({ name: serviceName, price: servicePrice });
                this.classList.add('added');
                this.textContent = 'Added ✓';
            }

            persistSelectedServices();
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

    updateConsultationBox();

    // ---------- INITIAL STATE ----------
    if (selectedServices.length === 0 && descriptionMessage) {
        descriptionMessage.textContent = 'Please select a service or use the message box, and provide a contact method with your name to request a free consultation.';
    }
}
