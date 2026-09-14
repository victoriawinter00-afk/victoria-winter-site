import { qs, qsa } from './dom.js';

// Store selected services
const selectedServices = [];

let selectedList = null;
let totalEstimate = null;
let descriptionMessage = null;
let requestBtn = null;

export function getSelectedServices() {
    return selectedServices;
}

export function clearSelectedServices() {
    selectedServices.length = 0;
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

    // ---------- INITIAL STATE ----------
    if (selectedServices.length === 0 && descriptionMessage) {
        descriptionMessage.textContent = 'Please select a service or use the message box, and provide a contact method with your name to request a free consultation.';
    }
}
