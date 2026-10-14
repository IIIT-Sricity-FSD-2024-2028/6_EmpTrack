// Converted from front-end/technical_member/issue-history.html + js/views/technical_member/issue-history.js
import { useCallback, useEffect, useState } from 'react';
import SaPageTitle from '../../components/sa-common/SaPageTitle';
import SaPagination from '../../components/sa-common/SaPagination';
import useSaToast from '../../components/sa-common/useSaToast';
import * as tm from '../../services/technicalMemberService';
import { cx } from '../../utils/helpers';
import { paginate } from '../../utils/saCommon';
import IssueRows, { IssueTableHead } from './components/IssueRows';
import useIssueDetail from './components/useIssueDetail';
import { TM_PORTAL } from './tmConstants';
import './styles/_shared.css';

const PAGE_SIZE = 10;

const QUICK_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'unsubmitted', label: 'Resolved (Not Sent)' },
  { key: 'pending', label: 'Awaiting Verification' },
  { key: 'verified', label: 'Verified & Closed' },
];

function applyQuickFilter(issues, quickFilter) {
  if (quickFilter === 'unsubmitted') return issues.filter((t) => !t.verification_status);
  if (quickFilter === 'pending') return issues.filter((t) => t.verification_status === 'PENDING_VERIFICATION');
  if (quickFilter === 'verified') return issues.filter((t) => t.verification_status === 'VERIFIED');
  return issues;
}

export default function IssueHistory() {
  const [toast, showToast] = useSaToast();
  const [issues, setIssues] = useState([]);
  const [status, setStatus] = useState('loading');
  const [page, setPage] = useState(1);
  const [quickFilter, setQuickFilter] = useState('all');

  const loadIssues = useCallback(async () => {
    setStatus('loading');
    try {
      setIssues(await tm.getMyTechnicalIssues({ scope: 'history' }));
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    loadIssues();
  }, [loadIssues]);

  const { openIssue, issueModal } = useIssueDetail({ onChanged: loadIssues, showToast });

  const filtered = applyQuickFilter(issues, quickFilter);
  const { pageItems, page: safePage, totalPages, total } = paginate(filtered, page, PAGE_SIZE);

  return (
    <>
      <SaPageTitle tabTitle="EmpTrack - Issue History" title="Issue History" portal={TM_PORTAL} />

      <div className="tm-shell">
        <div className="section-header">
          <h2 className="section-title">Completed Work</h2>
        </div>

        <div className="card filter-bar">
          <div className="chip-tabs">
            {QUICK_FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                className={cx('chip-tab', quickFilter === f.key && 'active')}
                onClick={() => {
                  setQuickFilter(f.key);
                  setPage(1);
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="card table-container">
          <table>
            <IssueTableHead />
            <IssueRows
              id="ih-tbody"
              issues={pageItems}
              status={status}
              loadingText="Loading issue history..."
              errorText="Failed to load issue history."
              emptyMessage="No completed issues in this view."
              onOpen={openIssue}
            />
          </table>
          {status === 'ready' ? (
            <SaPagination id="ih-pagination" page={safePage} totalPages={totalPages} total={total} pageSize={PAGE_SIZE} onPageChange={setPage} />
          ) : (
            <div className="pagination" id="ih-pagination"></div>
          )}
        </div>
      </div>

      {issueModal}
      {toast}
    </>
  );
}
