import usePageTitle from '../../hooks/usePageTitle';

/**
 * Optional page wrapper: sets the header/tab title and renders the original
 * .page-header row (title + actions) above the page body.
 *
 * <PageContainer title="My Tasks" actions={<Button>New</Button>}>...</PageContainer>
 */
export default function PageContainer({ title, actions, showHeading = true, children, className }) {
  usePageTitle(title);

  return (
    <div className={className}>
      {showHeading && (title || actions) && (
        <div className="page-header">
          {title && <h2 style={{ margin: 0, fontSize: 'var(--text-xl)' }}>{title}</h2>}
          {actions && <div className="page-actions">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
