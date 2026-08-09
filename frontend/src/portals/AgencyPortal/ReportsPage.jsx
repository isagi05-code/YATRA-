import { useState } from 'react';
import { Download, FileBarChart2, FileText, LoaderCircle, Plus, ReceiptText } from 'lucide-react';
import { api } from '../../services/api';
import { Button, Card, PageHeader, PageLayout } from '../../components/ui';

const reports = [{ title: 'Revenue report', key: 'Profit', description: 'Revenue by tour, customer, month, and payment method.', icon: FileBarChart2 }, { title: 'Expense report', key: 'Expense', description: 'Itemised costs across fuel, stay, food, tolls, and allowances.', icon: ReceiptText }, { title: 'Tour summary', key: 'Tour', description: 'Tour-wise passenger, route, revenue, and profitability details.', icon: FileText }];
export default function ReportsPage() {
  const [downloading, setDownloading] = useState(null);
  const download = async report => { setDownloading(report.key); try { const data = await api.agency.getReports(report.key); const link = data?.export_links?.pdf; if (link) window.open(link.startsWith('http') ? link : `http://localhost:8000${link}`, '_blank', 'noopener'); else alert(`Successfully generated ${data?.report_type || report.title}.`); } catch (error) { console.error('Failed to generate report', error); alert(error.message || 'Unable to generate that report.'); } finally { setDownloading(null); } };
  return <PageLayout><PageHeader eyebrow="Exports" title="Reports" description="Create polished, export-ready summaries of your agency’s performance." actions={<Button icon={Plus}>Custom report</Button>} /><div className="agency-card-grid">{reports.map(report => { const Icon = report.icon; const generating = downloading === report.key; return <Card key={report.key} className="agency-report-card"><div className="agency-report-card__icon"><Icon size={23} /></div><h2>{report.title}</h2><p>{report.description}</p><Button variant="outline" icon={generating ? LoaderCircle : Download} disabled={generating} onClick={() => download(report)}>{generating ? 'Generating…' : 'Download'}</Button></Card>; })}</div></PageLayout>;
}
