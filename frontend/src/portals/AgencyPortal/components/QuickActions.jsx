import { Button } from '../../../components/ui';
import { BusFront, FileText, Receipt, UsersRound } from 'lucide-react';
const actions = [{ label: 'Expenses', icon: Receipt, page: 'expenses' }, { label: 'Fleet', icon: BusFront, page: 'vehicles' }, { label: 'Drivers', icon: UsersRound, page: 'drivers' }, { label: 'Reports', icon: FileText, page: 'reports' }];
export default function QuickActions({ onNavigate }) { return <div className="ui-page__actions">{actions.map(({ label, icon, page }) => <Button key={page} variant="outline" icon={icon} onClick={() => onNavigate(page)}>{label}</Button>)}</div>; }
