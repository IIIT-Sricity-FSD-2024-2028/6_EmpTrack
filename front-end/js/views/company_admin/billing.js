// /js/views/company_admin/billing.js
import { auth } from '../../auth.js';
import { db } from '../../store.js';
import { escapeHtml, showToast, openModal, closeModal, bindModalDismiss, formatDate, formatDateTime } from '../../utils/sa-common.js';

document.addEventListener('DOMContentLoaded', async () => {
    const user = auth.getCurrentUser();
    if (!user) return;

    let subscription = null;
    // 'confirm' | 'success' | 'error' - drives what a single click on btn-pay-confirm
    // does next, so the handler never stacks (register-once, branch-on-state).
    let payFlowStage = 'confirm';

    const subCard = document.getElementById('subscription-card');
    const historyTbody = document.getElementById('history-tbody');

    bindModalDismiss('confirmPaymentModal');

    function formatMoney(amount, currency) {
        const symbol = currency === 'INR' ? '₹' : '$';
        return symbol + Number(amount || 0).toLocaleString('en-US');
    }

    function statusBadgeClass(status) {
        return status === 'PAID' ? 'badge-active' : 'badge-pending';
    }

    function historyStatusBadgeClass(status) {
        if (status === 'PAID') return 'badge-active';
        if (status === 'FAILED') return 'badge-suspended';
        return 'badge-pending';
    }

    function setPayState(step) {
        ['confirm', 'processing', 'success', 'error'].forEach((s) => {
            document.getElementById(`pay-step-${s}`).classList.toggle('active', s === step);
        });
    }

    function renderSubscriptionCard() {
        if (!subscription) {
            subCard.innerHTML = `<div class="error-state"><i class="ph ph-warning-circle"></i> Failed to load subscription details.</div>`;
            return;
        }
        const isPaid = subscription.status === 'PAID';
        subCard.innerHTML = `
            <div class="billing-header">
                <div class="billing-plan-name"><i class="ph-fill ph-crown-simple"></i> ${escapeHtml(subscription.plan_name)}</div>
                <span class="badge ${statusBadgeClass(subscription.status)}">${isPaid ? 'PAID' : 'PENDING PAYMENT'}</span>
            </div>
            <div class="billing-grid">
                <div class="billing-field">
                    <span class="billing-label">Billing Cycle</span>
                    <span class="billing-value">${subscription.billing_cycle === 'MONTHLY' ? 'Monthly' : (subscription.billing_cycle || '-')}</span>
                </div>
                <div class="billing-field">
                    <span class="billing-label">Amount</span>
                    <span class="billing-value">${formatMoney(subscription.amount, subscription.currency)}</span>
                </div>
                ${isPaid ? `
                <div class="billing-field">
                    <span class="billing-label">Last Payment</span>
                    <span class="billing-value">${formatDate(subscription.last_payment_date)}</span>
                </div>
                <div class="billing-field">
                    <span class="billing-label">Transaction ID</span>
                    <span class="billing-value" style="font-size:14px;">${escapeHtml(subscription.last_transaction_id || '-')}</span>
                </div>
                ` : `
                <div class="billing-field">
                    <span class="billing-label">Next Billing Date</span>
                    <span class="billing-value">${subscription.next_billing_date ? formatDate(subscription.next_billing_date) : 'Due Now'}</span>
                </div>
                `}
            </div>
            ${isPaid
                ? `<button class="btn btn-outline" id="btn-view-history"><i class="ph ph-receipt"></i> View Payment History</button>`
                : `<button class="btn btn-primary" id="btn-complete-payment"><i class="ph ph-lightning"></i> Complete Payment</button>`}
        `;

        const viewHistoryBtn = document.getElementById('btn-view-history');
        if (viewHistoryBtn) viewHistoryBtn.addEventListener('click', () => {
            document.getElementById('history-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
        });

        const payBtn = document.getElementById('btn-complete-payment');
        if (payBtn) payBtn.addEventListener('click', openPaymentModal);
    }

    function openPaymentModal() {
        document.getElementById('pm-company').textContent = subscription.company_name;
        document.getElementById('pm-plan').textContent = subscription.plan_name;
        document.getElementById('pm-cycle').textContent = subscription.billing_cycle === 'MONTHLY' ? 'Monthly' : subscription.billing_cycle;
        document.getElementById('pm-amount').textContent = formatMoney(subscription.amount, subscription.currency);
        document.getElementById('pay-modal-title').textContent = 'Confirm Payment';
        payFlowStage = 'confirm';
        setPayState('confirm');
        document.getElementById('pay-modal-footer').style.display = 'flex';
        document.getElementById('btn-pay-cancel').style.display = 'inline-flex';
        document.getElementById('btn-pay-confirm').style.display = 'inline-flex';
        document.getElementById('btn-pay-confirm').disabled = false;
        document.getElementById('btn-pay-confirm').innerHTML = '<i class="ph ph-lightning"></i> Complete Payment';
        openModal('confirmPaymentModal');
    }

    async function renderHistory() {
        try {
            const history = await db.getMyPaymentHistory();
            if (history.length === 0) {
                historyTbody.innerHTML = `<tr class="empty-row"><td colspan="6"><i class="ph ph-receipt" style="font-size:28px; display:block; margin-bottom:8px;"></i>No payments yet.</td></tr>`;
                return;
            }
            historyTbody.innerHTML = history.map((t) => `
                <tr>
                    <td>${escapeHtml(t.plan_name)}</td>
                    <td>${formatMoney(t.amount, t.currency)}</td>
                    <td>${escapeHtml(t.payment_method || '-')}</td>
                    <td>${escapeHtml(t.transaction_id)}</td>
                    <td><span class="badge ${historyStatusBadgeClass(t.payment_status)}">${escapeHtml(t.payment_status)}</span></td>
                    <td>${formatDate(t.payment_date)}</td>
                </tr>
            `).join('');
        } catch (e) {
            historyTbody.innerHTML = `<tr class="error-row"><td colspan="6"><i class="ph ph-warning-circle"></i> Failed to load payment history.</td></tr>`;
        }
    }

    async function loadSubscription() {
        try {
            subscription = await db.getMySubscription();
        } catch (e) {
            subscription = null;
        }
        renderSubscriptionCard();
    }

    document.getElementById('btn-pay-confirm').addEventListener('click', async () => {
        if (payFlowStage === 'success') {
            closeModal('confirmPaymentModal');
            showToast('Payment recorded successfully.');
            await loadSubscription();
            await renderHistory();
            return;
        }

        const confirmBtn = document.getElementById('btn-pay-confirm');
        setPayState('processing');
        document.getElementById('pay-modal-footer').style.display = 'none';

        try {
            // Small artificial delay so "Payment Processing..." is visible - this is a
            // simulated/demo payment, there's no real gateway round-trip to wait for.
            const [result] = await Promise.all([
                db.completeMockPayment({ companyId: subscription.company_id, subscriptionId: subscription.plan_id }),
                new Promise((resolve) => setTimeout(resolve, 900)),
            ]);

            document.getElementById('ps-txn').textContent = result.transaction_id;
            document.getElementById('ps-amount').textContent = formatMoney(result.amount, result.currency);
            document.getElementById('ps-date').textContent = formatDateTime(result.paid_at);
            setPayState('success');
            payFlowStage = 'success';
            document.getElementById('pay-modal-title').textContent = 'Payment Successful';
            document.getElementById('pay-modal-footer').style.display = 'flex';
            document.getElementById('btn-pay-cancel').style.display = 'none';
            confirmBtn.style.display = 'inline-flex';
            confirmBtn.textContent = 'Done';
        } catch (e) {
            payFlowStage = 'error';
            document.getElementById('pe-message').textContent = e.message || 'Payment failed. Please try again.';
            setPayState('error');
            document.getElementById('pay-modal-title').textContent = 'Payment Failed';
            document.getElementById('pay-modal-footer').style.display = 'flex';
            document.getElementById('btn-pay-cancel').textContent = 'Close';
            document.getElementById('btn-pay-cancel').style.display = 'inline-flex';
            confirmBtn.style.display = 'none';
        }
    });

    await loadSubscription();
    await renderHistory();
});
