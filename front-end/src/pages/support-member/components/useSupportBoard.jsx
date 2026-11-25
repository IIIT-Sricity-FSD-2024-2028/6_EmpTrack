import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useToast } from '../../../components/platform/ShellUI';
import { ticketsEntity } from '../../../store/entities';
import SupportTicketModal from './SupportTicketModal';

/**
 * Wires a page's ticket tables to the shared detail modal and quick-claim.
 * Ticket actions refetch the queues/stats through Redux, so pages pass nothing.
 *   const board = useSupportBoard();
 *   <SupportTicketTable onView={board.open} onClaim={board.claim} claimingId={board.claimingId} ... />
 *   {board.element}
 */
export default function useSupportBoard() {
  const dispatch = useDispatch();
  const [selectedId, setSelectedId] = useState(null); // UI state: which ticket the modal shows
  const [claimingId, setClaimingId] = useState(null);
  const [toast, showToast] = useToast();

  // Quick-claim from an Unassigned queue row, without opening the modal.
  const claim = async (ticket) => {
    setClaimingId(ticket.ticket_id);
    try {
      await dispatch(ticketsEntity.thunks.claim(ticket.ticket_id)).unwrap();
      showToast(`Ticket ${ticket.ticket_id} claimed.`);
    } catch (err) {
      showToast(err.message || 'Failed to claim ticket.', 'error');
    } finally {
      setClaimingId(null);
    }
  };

  const element = (
    <>
      {selectedId && <SupportTicketModal ticketId={selectedId} onClose={() => setSelectedId(null)} showToast={showToast} />}
      {toast}
    </>
  );

  return { open: (ticket) => setSelectedId(ticket.ticket_id), claim, claimingId, element };
}
