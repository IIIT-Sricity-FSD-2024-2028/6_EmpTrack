import { useState } from 'react';
import { useToast } from '../../../components/platform/ShellUI';
import { claimTicket } from '../../../services/supportMemberService';
import SupportTicketModal from './SupportTicketModal';

/**
 * Wires a page's ticket tables to the shared detail modal and quick-claim.
 * onChanged runs after any ticket action so the page can reload its lists.
 *   const board = useSupportBoard(reload);
 *   <SupportTicketTable onView={board.open} onClaim={board.claim} claimingId={board.claimingId} ... />
 *   {board.element}
 */
export default function useSupportBoard(onChanged) {
  const [selected, setSelected] = useState(null);
  const [claimingId, setClaimingId] = useState(null);
  const [toast, showToast] = useToast();

  // Quick-claim from an Unassigned queue row, without opening the modal.
  const claim = async (ticket) => {
    setClaimingId(ticket.ticket_id);
    try {
      await claimTicket(ticket.ticket_id);
      showToast(`Ticket ${ticket.ticket_id} claimed.`);
      onChanged();
    } catch (err) {
      showToast(err.message || 'Failed to claim ticket.', 'error');
    } finally {
      setClaimingId(null);
    }
  };

  const element = (
    <>
      {selected && <SupportTicketModal ticket={selected} onClose={() => setSelected(null)} onChanged={onChanged} showToast={showToast} />}
      {toast}
    </>
  );

  return { open: setSelected, claim, claimingId, element };
}
