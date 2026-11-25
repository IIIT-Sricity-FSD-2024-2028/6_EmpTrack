// Converted from front-end/platform_admin/notifications.html + js/views/platform_admin/notifications.js
import NotificationFeed from '../../components/platform/NotificationFeed';
import { PortalShell } from '../../components/platform/ShellUI';
import { IS_DEMO } from '../../services/platformAdminService';

export default function Notifications() {
  return (
    <PortalShell portal="pa" title="Notifications" demo={IS_DEMO}>
      <NotificationFeed showLinks />
    </PortalShell>
  );
}
