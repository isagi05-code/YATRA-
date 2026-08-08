import * as Icons from 'lucide-react';
import './ui.css';

const join = (...values) => values.filter(Boolean).join(' ');

export function Button({ children, variant = 'primary', size, icon: Icon, className, type = 'button', ...props }) {
  return <button type={type} className={join('ui-button', `ui-button--${variant}`, size && `ui-button--${size}`, className)} {...props}>{Icon && <Icon size={size === 'sm' ? 14 : 16} />}{children}</button>;
}

export function Card({ children, className, padded = true, ...props }) {
  return <section className={join('ui-card', padded && 'ui-card--padded', className)} {...props}>{children}</section>;
}

export function PageLayout({ children, className }) { return <div className={join('ui-page fade-in', className)}>{children}</div>; }

export function PageHeader({ eyebrow, title, description, actions }) {
  return <header className="ui-page__header"><div>{eyebrow && <div className="ui-page__eyebrow">{eyebrow}</div>}<h1 className="ui-page__title">{title}</h1>{description && <p className="ui-page__description">{description}</p>}</div>{actions && <div className="ui-page__actions">{actions}</div>}</header>;
}

export function StatCard({ label, value, detail, icon: Icon = Icons.ChartNoAxesCombined, tone = 'blue' }) {
  return <Card className={join('ui-stat', `ui-stat--${tone}`)}><div className="ui-stat__top"><span className="ui-stat__label">{label}</span><span className="ui-stat__icon"><Icon size={19} /></span></div><div className="ui-stat__value">{value}</div>{detail && <p className="ui-stat__detail">{detail}</p>}</Card>;
}

export function ChartCard({ title, subtitle, children, className }) {
  return <Card className={join('ui-chart', className)}><div className="ui-card__header"><div><h2 className="ui-card__title">{title}</h2>{subtitle && <p className="ui-card__subtitle">{subtitle}</p>}</div></div><div className="ui-chart__body">{children}</div></Card>;
}

const statusTone = (value = '') => { const normalized = String(value).toLowerCase(); if (/(active|paid|approved|complete|available|success)/.test(normalized)) return 'success'; if (/(pending|upcoming|maintenance|review)/.test(normalized)) return 'warning'; if (/(cancel|reject|overdue|unavailable|loss)/.test(normalized)) return 'danger'; if (/(new|progress|running)/.test(normalized)) return 'info'; return 'neutral'; };
export function StatusBadge({ children, value = children, tone }) { return <span className={join('ui-status', `ui-status--${tone || statusTone(value)}`)}>{children}</span>; }

export function SearchBar({ value, onChange, placeholder = 'Search…', className }) { return <label className={join('ui-search', className)}><Icons.Search className="ui-search__icon" size={16} /><input className="ui-input" value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} /></label>; }
export function FilterBar({ children, className }) { return <div className={join('ui-filter-bar', className)}>{children}</div>; }

export function DataTable({ columns, rows, rowKey, empty = 'Nothing to show yet.' }) { return <div className="ui-table-wrap"><table className="ui-table"><thead><tr>{columns.map(column => <th key={column.key}>{column.label}</th>)}</tr></thead><tbody>{rows.length ? rows.map((row, index) => <tr key={rowKey ? row[rowKey] : index}>{columns.map(column => <td key={column.key}>{column.render ? column.render(row) : row[column.key] ?? '—'}</td>)}</tr>) : <tr><td colSpan={columns.length}>{empty}</td></tr>}</tbody></table></div>; }

export function LoadingState({ message = 'Loading…' }) { return <div className="ui-state"><Icons.LoaderCircle className="ui-spinner" size={38} /><p className="ui-state__text">{message}</p></div>; }
export function EmptyState({ icon: Icon = Icons.Inbox, title = 'Nothing here yet', message, action }) { return <div className="ui-state"><Icon size={42} strokeWidth={1.4} /><div><h2 className="ui-state__title">{title}</h2>{message && <p className="ui-state__text">{message}</p>}</div>{action}</div>; }

export function Modal({ title, description, children, onClose, footer, size = 'md' }) { return <div className="ui-modal-backdrop" role="presentation" onMouseDown={onClose}><section className={join('ui-modal', `ui-modal--${size}`)} role="dialog" aria-modal="true" aria-label={title} onMouseDown={event => event.stopPropagation()}><header className="ui-modal__header"><div><h2>{title}</h2>{description && <p>{description}</p>}</div><button className="ui-modal__close" onClick={onClose} aria-label="Close"><Icons.X size={18} /></button></header><div className="ui-modal__body">{children}</div>{footer && <footer className="ui-modal__footer">{footer}</footer>}</section></div>; }
export function FormField({ label, children, hint, required }) { return <label className="ui-field"><span>{label}{required && <b> *</b>}</span>{children}{hint && <small>{hint}</small>}</label>; }
export function FormGrid({ children, className }) { return <div className={join('ui-form-grid', className)}>{children}</div>; }
