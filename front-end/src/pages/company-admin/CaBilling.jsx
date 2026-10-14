// Converted from front-end/company_admin/billing.html + js/views/company_admin/billing.js
import { useCallback, useEffect, useRef, useState } from 'react';
import SaModal from '../../components/sa-common/SaModal';
import useSaToast from '../../components/sa-common/useSaToast';
import usePageTitle from '../../hooks/usePageTitle';
import * as ca from '../../services/companyAdminService';
import { formatDate, formatDateTime } from '../../utils/saCommon';
import './styles/_shared.css';
import './styles/billing.css';

const formatMoney = (amount, currency) => `${currency === 'INR' ? '₹' : '$'}${Number(amount || 0).toLocaleString('en-US')}`;
const cycleLabel = (cycle) => (cycle === 'MONTHLY' ? 'Monthly' : cycle || '-');

function historyBadgeClass(status) {
  if (status === 'PAID') return 'badge-active';
  if (status === 'FAILED') return 'badge-suspended';
  return 'badge-pending';
}

export default function CaBilling() {
  usePageTitle('Subscription & Billing');
  const [toast, showToast] = useSaToast();
  const [subscription, setSubscription] = useState(undefined); // undefined loading | null failed
  const [history, setHistory] = useState(null); // null loading | 'error' | []
  const [pay, setPay] = useState(null); // { stage: 'confirm' | 'processing' | 'success' | 'error', result?, message? }
  const historyRef = useRef(null);

  const load = useCallback(async () => {
    try {
      setSubscription(await ca.getMySubscription());
    } catch {
      setSubscription(null);
    }
    try {
      setHistory(await ca.getMyPaymentHistory());
    } catch {
      setHistory('error');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const completePayment = async () => {
    setPay({ stage: 'processing' });
    try {
      // Short artificial delay so "Payment Processing..." is visible; this is a simulated payment.
      const [result] = await Promise.all([
        ca.completeMockPayment({ companyId: subscription.company_id, subscriptionId: subscription.plan_id }),
        new Promise((resolve) => setTimeout(resolve, 900)),
      ]);
      setPay({ stage: 'success', result });
    } catch (e) {
      setPay({ stage: 'error', message: e.message || 'Payment failed. Please try again.' });
    }
  };

  const finish = async () => {
    setPay(null);
    showToast('Payment recorded successfully.');
    await load();
  };

  let card;
  if (subscription === undefined) {
    card = <div className="loader-row" style={{ textAlign: 'center', padding: 24 }}><div className="spinner"></div><div>Loading subscription details...</div></div>;
  } else if (subscription === null) {
    card = <div className="error-state"><i className="ph ph-warning-circle"></i> Failed to load subscription details.</div>;
  } else {
    const isPaid = subscription.status === 'PAID';
    card = (
      <>
        <div className="billing-header">
          <div className="billing-plan-name"><i className="ph-fill ph-crown-simple"></i> {subscription.plan_name}</div>
          <span className={`badge ${isPaid ? 'badge-active' : 'badge-pending'}`}>{isPaid ? 'PAID' : 'PENDING PAYMENT'}</span>
        </div>
        <div className="billing-grid">
          <div className="billing-field"><span className="billing-label">Billing Cycle</span><span className="billing-value">{cycleLabel(subscription.billing_cycle)}</span></div>
          <div className="billing-field"><span className="billing-label">Amount</span><span className="billing-value">{formatMoney(subscription.amount, subscription.currency)}</span></div>
          {isPaid ? (
            <>
              <div className="billing-field"><span className="billing-label">Last Payment</span><span className="billing-value">{formatDate(subscription.last_payment_date)}</span></div>
              <div className="billing-field"><span className="billing-label">Transaction ID</span><span className="billing-value" style={{ fontSize: 14 }}>{subscription.last_transaction_id || '-'}</span></div>
            </>
          ) : (
            <div className="billing-field"><span className="billing-label">Next Billing Date</span><span className="billing-value">{subscription.next_billing_date ? formatDate(subscription.next_billing_date) : 'Due Now'}</span></div>
          )}
        </div>
        {isPaid ? (
          <button type="button" className="btn btn-outline" id="btn-view-history" onClick={() => historyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
            <i className="ph ph-receipt"></i> View Payment History
          </button>
        ) : (
          <button type="button" className="btn btn-primary" id="btn-complete-payment" onClick={() => setPay({ stage: 'confirm' })}>
            <i className="ph ph-lightning"></i> Complete Payment
          </button>
        )}
      </>
    );
  }

  let rows;
  if (history === null) rows = <tr className="loader-row"><td colSpan={6}><div className="spinner"></div><div>Loading payment history...</div></td></tr>;
  else if (history === 'error') rows = <tr className="error-row"><td colSpan={6}><i className="ph ph-warning-circle"></i> Failed to load payment history.</td></tr>;
  else if (history.length === 0) rows = <tr className="empty-row"><td colSpan={6}><i className="ph ph-receipt" style={{ fontSize: 28, display: 'block', marginBottom: 8 }}></i>No payments yet.</td></tr>;
  else {
    rows = history.map((t) => (
      <tr key={t.transaction_id}>
        <td>{t.plan_name}</td>
        <td>{formatMoney(t.amount, t.currency)}</td>
        <td>{t.payment_method || '-'}</td>
        <td>{t.transaction_id}</td>
        <td><span className={`badge ${historyBadgeClass(t.payment_status)}`}>{t.payment_status}</span></td>
        <td>{formatDate(t.payment_date)}</td>
      </tr>
    ));
  }

  const stage = pay?.stage;
  let footer = null;
  if (stage === 'confirm') {
    footer = (
      <>
        <button type="button" className="btn btn-outline" id="btn-pay-cancel" onClick={() => setPay(null)}>Cancel</button>
        <button type="button" className="btn btn-primary" id="btn-pay-confirm" onClick={completePayment}><i className="ph ph-lightning"></i> Complete Payment</button>
      </>
    );
  } else if (stage === 'success') {
    footer = <button type="button" className="btn btn-primary" id="btn-pay-confirm" onClick={finish}>Done</button>;
  } else if (stage === 'error') {
    footer = <button type="button" className="btn btn-outline" id="btn-pay-cancel" onClick={() => setPay(null)}>Close</button>;
  }
  const titles = { confirm: 'Confirm Payment', processing: 'Confirm Payment', success: 'Payment Successful', error: 'Payment Failed' };

  return (
    <>
      <div className="ca-shell">
        <div className="card billing-card" id="subscription-card">{card}</div>

        <div className="section-header" ref={historyRef}>
          <h2 className="section-title">Payment History</h2>
        </div>

        <div className="card table-container" id="history-section">
          <table>
            <thead><tr><th>Plan</th><th>Amount</th><th>Payment Method</th><th>Transaction ID</th><th>Status</th><th>Payment Date</th></tr></thead>
            <tbody id="history-tbody">{rows}</tbody>
          </table>
        </div>
      </div>

      <SaModal
        id="confirmPaymentModal" open={Boolean(pay)} onClose={() => (stage === 'success' ? finish() : stage !== 'processing' && setPay(null))}
        title={titles[stage] || 'Confirm Payment'} titleId="pay-modal-title" maxWidth="460px" footer={footer ?? <></>}
      >
        {stage === 'confirm' && subscription && (
          <div className="pay-state active" id="pay-step-confirm">
            <div className="pay-summary" style={{ width: '100%' }}>
              <div className="pay-row"><span className="label">Company</span><span className="value" id="pm-company">{subscription.company_name}</span></div>
              <div className="pay-row"><span className="label">Plan</span><span className="value" id="pm-plan">{subscription.plan_name}</span></div>
              <div className="pay-row"><span className="label">Billing Cycle</span><span className="value" id="pm-cycle">{cycleLabel(subscription.billing_cycle)}</span></div>
              <div className="pay-row"><span className="label">Payment Method</span><span className="value">Demo Payment</span></div>
              <div className="pay-row total"><span className="label">Amount</span><span className="value" id="pm-amount">{formatMoney(subscription.amount, subscription.currency)}</span></div>
            </div>
            <div className="mock-disclaimer" style={{ width: '100%' }}>
              <i className="ph ph-info"></i>
              <span>This is a simulated payment for demonstration purposes. No real money will be transferred.</span>
            </div>
          </div>
        )}
        {stage === 'processing' && (
          <div className="pay-state active" id="pay-step-processing"><div className="spinner"></div><h4>Payment Processing...</h4></div>
        )}
        {stage === 'success' && (
          <div className="pay-state active" id="pay-step-success">
            <i className="ph-fill ph-check-circle pay-icon"></i>
            <h4>Payment Successful</h4>
            <div className="detail-grid success-detail-grid">
              <div className="detail-item"><span className="detail-label">Transaction ID</span><span className="detail-value" id="ps-txn">{pay.result.transaction_id}</span></div>
              <div className="detail-item"><span className="detail-label">Amount</span><span className="detail-value" id="ps-amount">{formatMoney(pay.result.amount, pay.result.currency)}</span></div>
              <div className="detail-item" style={{ gridColumn: '1/-1' }}><span className="detail-label">Date</span><span className="detail-value" id="ps-date">{formatDateTime(pay.result.paid_at)}</span></div>
            </div>
          </div>
        )}
        {stage === 'error' && (
          <div className="pay-state active" id="pay-step-error">
            <i className="ph-fill ph-warning-circle pay-icon" style={{ color: 'var(--ca-danger)' }}></i>
            <h4 id="pe-message">{pay.message}</h4>
          </div>
        )}
      </SaModal>

      {toast}
    </>
  );
}
