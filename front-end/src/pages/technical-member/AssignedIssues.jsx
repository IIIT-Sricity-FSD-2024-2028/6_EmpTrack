// Converted from front-end/technical_member/assigned-issues.html + js/views/technical_member/assigned-issues.js
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import SaPageTitle from '../../components/sa-common/SaPageTitle';
import SaPagination from '../../components/sa-common/SaPagination';
import useDebouncedCallback from '../../components/sa-common/useDebouncedCallback';
import useSaToast from '../../components/sa-common/useSaToast';
import * as tm from '../../services/technicalMemberService';
import { paginate } from '../../utils/saCommon';
import IssueRows, { IssueTableHead } from './components/IssueRows';
import useIssueDetail from './components/useIssueDetail';
import { TM_PORTAL } from './tmConstants';
import './styles/_shared.css';

const PAGE_SIZE = 10;

export default function AssignedIssues() {
  const [searchParams] = useSearchParams();
  const [toast, showToast] = useSaToast();
  // ?status= / ?priority= preselect the filters (links from the dashboard stat cards).
  const [filters, setFilters] = useState(() => ({
    status: searchParams.get('status') || 'all',
    priority: searchParams.get('priority') || 'all',
    search: '',
  }));
  const [searchInput, setSearchInput] = useState('');
  const [issues, setIssues] = useState([]);
  const [status, setStatus] = useState('loading');
  const [page, setPage] = useState(1);

  const filtersRef = useRef(filters);
  const loadIssues = useCallback(async () => {
    setStatus('loading');
    try {
      setIssues(await tm.getMyTechnicalIssues({ ...filtersRef.current, scope: 'active' }));
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    filtersRef.current = filters;
    loadIssues();
  }, [filters, loadIssues]);

  const { openIssue, issueModal } = useIssueDetail({ onChanged: loadIssues, showToast });

  const debouncedSearch = useDebouncedCallback((value) => {
    setPage(1);
    setFilters((f) => ({ ...f, search: value }));
  }, 350);

  const setFilter = (key) => (e) => {
    const { value } = e.target;
    setPage(1);
    setFilters((f) => ({ ...f, [key]: value }));
  };

  const clearFilters = () => {
    debouncedSearch.cancel();
    setSearchInput('');
    setPage(1);
    setFilters({ status: 'all', priority: 'all', search: '' });
  };

  const { pageItems, page: safePage, totalPages, total } = paginate(issues, page, PAGE_SIZE);

  return (
    <>
      <SaPageTitle tabTitle="EmpTrack - Assigned Issues" title="Assigned Issues" portal={TM_PORTAL} />

      <div className="tm-shell">
        <div className="section-header">
          <h2 className="section-title">Issues Assigned to You</h2>
        </div>

        <div className="card filter-bar">
          <div className="search-wrap">
            <i className="ph ph-magnifying-glass"></i>
            <input
              type="text"
              className="search-input"
              id="search-input"
              placeholder="Search by Issue ID, title, company or category..."
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                debouncedSearch(e.target.value.trim());
              }}
            />
          </div>
          <div className="filters-wrap">
            <select id="status-filter" className="filter-select" value={filters.status} onChange={setFilter('status')}>
              <option value="all">All Status</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
            </select>
            <select id="priority-filter" className="filter-select" value={filters.priority} onChange={setFilter('priority')}>
              <option value="all">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
            <button type="button" className="btn-clear" id="btn-clear-filters" onClick={clearFilters}><i className="ph ph-x"></i> Clear</button>
          </div>
        </div>

        <div className="card table-container">
          <table>
            <IssueTableHead />
            <IssueRows
              id="ai-tbody"
              issues={pageItems}
              status={status}
              loadingText="Loading assigned issues..."
              errorText="Failed to load assigned issues."
              emptyMessage="No assigned issues match your filters."
              onOpen={openIssue}
            />
          </table>
          {status === 'ready' ? (
            <SaPagination id="ai-pagination" page={safePage} totalPages={totalPages} total={total} pageSize={PAGE_SIZE} onPageChange={setPage} />
          ) : (
            <div className="pagination" id="ai-pagination"></div>
          )}
        </div>
      </div>

      {issueModal}
      {toast}
    </>
  );
}
