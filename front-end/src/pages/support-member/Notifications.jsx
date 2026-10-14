// Converted from front-end/support_member/notifications.html + js/views/support_member/notifications.js
import NotificationFeed from '../../components/platform/NotificationFeed';
import { PortalShell } from '../../components/platform/ShellUI';
import { getNotifications, IS_DEMO } from '../../services/supportMemberService';

export default function Notifications() {
  return (
    <PortalShell portal="sm" title="Notifications" demo={IS_DEMO}>
      <NotificationFeed loader={getNotifications} />
    </PortalShell>
  );
}
