// Converted from front-end/company_admin/profile.html + js/views/company_admin/profile.js.
// Same layout as the HR profile (it reused hr/profile.css), without the stats row.
import HrProfile from '../hr/HrProfile';

export default function CaProfile() {
  return <HrProfile title="Company Admin Profile" roleLabel="Company Admin" showStats={false} />;
}
