export function qs(selector, root) {
    return (root || document).querySelector(selector);
}

export function qsa(selector, root) {
    return (root || document).querySelectorAll(selector);
}
