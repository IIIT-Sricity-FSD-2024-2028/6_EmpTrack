// /js/utils/sa-common.js
// Shared helpers for the Super Admin dashboard pages (front-end/super_admin/*).

export function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

export function showToast(message, type = 'success') {
    const toast = document.getElementById('toast-container');
    if (!toast) return;
    toast.textContent = message;
    toast.className = type === 'error' ? 'error' : 'success';
    toast.classList.add('show');
    clearTimeout(toast._hideTimer);
    toast._hideTimer = setTimeout(() => toast.classList.remove('show'), 3500);
}

export function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.add('active');
}

export function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove('active');
}

export function bindModalDismiss(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal(id);
    });
    modal.querySelectorAll('[data-modal-close]').forEach((btn) => {
        btn.addEventListener('click', () => closeModal(id));
    });
}

export function animateCount(el, target) {
    if (!el) return;
    const start = 0;
    const duration = 700;
    const startTime = performance.now();
    function step(now) {
        const progress = Math.min((now - startTime) / duration, 1);
        const value = Math.round(start + (target - start) * progress);
        el.textContent = value.toLocaleString();
        if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
}

export function debounce(fn, delay = 300) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

export function formatDate(value) {
    if (!value) return '-';
    const d = new Date(value);
    if (isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatDateTime(value) {
    if (!value) return '-';
    const d = new Date(value);
    if (isNaN(d.getTime())) return String(value);
    return d.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function formatCurrency(value) {
    const n = Number(value) || 0;
    return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

// Simple client-side pagination over an already-filtered array.
export function paginate(items, page, pageSize) {
    const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const start = (safePage - 1) * pageSize;
    return {
        pageItems: items.slice(start, start + pageSize),
        page: safePage,
        totalPages,
        total: items.length,
    };
}

export function renderPagination(container, { page, totalPages, total, pageSize }, onPageChange) {
    if (!container) return;
    if (total === 0) {
        container.innerHTML = '';
        return;
    }
    const start = (page - 1) * pageSize + 1;
    const end = Math.min(page * pageSize, total);

    let pageButtons = '';
    for (let p = 1; p <= totalPages; p++) {
        if (p === 1 || p === totalPages || Math.abs(p - page) <= 1) {
            pageButtons += `<button class="page-btn ${p === page ? 'active' : ''}" data-page="${p}">${p}</button>`;
        } else if (p === page - 2 || p === page + 2) {
            pageButtons += `<span style="padding:0 4px;color:var(--text-muted);">&hellip;</span>`;
        }
    }

    container.innerHTML = `
        <div class="pagination-info">Showing ${start}-${end} of ${total}</div>
        <div class="pagination-controls">
            <button class="page-btn" data-page="${page - 1}" ${page === 1 ? 'disabled' : ''}><i class="ph ph-caret-left"></i></button>
            ${pageButtons}
            <button class="page-btn" data-page="${page + 1}" ${page === totalPages ? 'disabled' : ''}><i class="ph ph-caret-right"></i></button>
        </div>
    `;

    container.querySelectorAll('.page-btn[data-page]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const target = Number(btn.getAttribute('data-page'));
            if (target >= 1 && target <= totalPages) onPageChange(target);
        });
    });
}

export function loadChartJs() {
    return new Promise((resolve) => {
        if (typeof window.Chart !== 'undefined') { resolve(); return; }
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        script.onload = () => resolve();
        document.head.appendChild(script);
    });
}

export function chartTheme() {
    const rootStyles = getComputedStyle(document.body);
    const textColor = rootStyles.getPropertyValue('--text-muted').trim() || '#6B7280';
    const gridColor = rootStyles.getPropertyValue('--border-color').trim() || '#E5E7EB';
    return { textColor, gridColor };
}
