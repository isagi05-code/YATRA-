import { useState } from 'react';
import { MapPin, RotateCcw, Sparkles, Clock, Lightbulb, Calendar } from 'lucide-react';
import { api } from '../../services/api';
import { Button, Card, EmptyState, PageHeader, PageLayout } from '../../components/ui';

/* ── Quick-fill templates ─────────────────────────────────── */
const TEMPLATES = [
  { destination: 'Kedarnath', days: 7,  budget: 50000, name: 'Char Dham Yatra',   meta: 'Religious · Uttarakhand', emoji: '🕉️'  },
  { destination: 'Goa',       days: 5,  budget: 30000, name: 'Goa Beach Retreat', meta: 'Leisure · West India',    emoji: '🌊'  },
  { destination: 'Rajasthan', days: 8,  budget: 80000, name: 'Royal Rajasthan',   meta: 'Heritage · Rajasthan',   emoji: '🏰'  },
  { destination: 'Kerala',    days: 6,  budget: 60000, name: 'Kerala Backwaters', meta: 'Nature · South India',   emoji: '🌴'  },
  { destination: 'Ladakh',    days: 9,  budget: 90000, name: 'Ladakh Adventure',  meta: 'Adventure · J&K',        emoji: '🏔️'  },
  { destination: 'Varanasi',  days: 4,  budget: 25000, name: 'Ganga Ghats',       meta: 'Spiritual · UP',         emoji: '🪔'  },
];

/* ── Time-of-day indicator dots ───────────────────────────── */
const TIME_COLORS = { Morning: '#f59e0b', Afternoon: '#3b82f6', Evening: '#8b5cf6' };

/* ── Single activity row ──────────────────────────────────── */
function ActivityRow({ activity }) {
  const dot = TIME_COLORS[activity.time] ?? '#94a3b8';
  return (
    <div className="ait-activity">
      <span className="ait-activity__dot" style={{ background: dot }} />
      <div className="ait-activity__body">
        <div className="ait-activity__header">
          <time className="ait-activity__time">{activity.time}</time>
          <strong className="ait-activity__name">{activity.name}</strong>
        </div>
        {activity.description && (
          <p className="ait-activity__desc">{activity.description}</p>
        )}
      </div>
    </div>
  );
}

/* ── One day card ─────────────────────────────────────────── */
function DayCard({ day, index }) {
  return (
    <Card className="ait-day-card" padded={false}>
      <header className="ait-day-card__header">
        <div>
          <span className="ait-day-card__label">Day {day.day ?? index + 1}</span>
          <h2 className="ait-day-card__title">{day.title ?? `Day ${index + 1}`}</h2>
        </div>
        {day.estimated_cost != null && (
          <span className="ait-day-card__cost">
            ₹{Number(day.estimated_cost).toLocaleString('en-IN')}
          </span>
        )}
      </header>
      <div className="ait-day-card__body">
        {(day.activities ?? []).map((act, i) => (
          <ActivityRow key={i} activity={act} />
        ))}
        {/* Fallback: plain description when activities array is absent */}
        {!day.activities?.length && day.description && (
          <p className="ait-day-card__fallback">{day.description}</p>
        )}
      </div>
    </Card>
  );
}

/* ── Budget sidebar ───────────────────────────────────────── */
function BudgetSidebar({ result }) {
  const total = result.estimated_budget ?? result.total_budget ?? 0;
  const breakdown = result.budget_breakdown ?? {};
  const tips = result.tips ? result.tips.split(';').map(t => t.trim()).filter(Boolean) : [];

  return (
    <aside className="ait-sidebar">
      {/* Total */}
      <Card className="ait-budget-card">
        <small className="ait-budget-card__label">AI budget estimate</small>
        <p className="ait-budget-card__total">₹{Number(total).toLocaleString('en-IN')}</p>
        {Object.entries(breakdown).map(([k, v]) => (
          <div className="ait-budget-card__row" key={k}>
            <span>{k}</span>
            <strong>₹{Number(v).toLocaleString('en-IN')}</strong>
          </div>
        ))}
      </Card>

      {/* Meta */}
      {result.best_time_to_visit && (
        <Card className="ait-meta-card">
          <div className="ait-meta-card__item">
            <Calendar size={14} />
            <span><b>Best time:</b> {result.best_time_to_visit}</span>
          </div>
        </Card>
      )}

      {/* Tips */}
      {tips.length > 0 && (
        <Card className="ait-tips-card">
          <div className="ait-tips-card__heading">
            <Lightbulb size={14} />
            <strong>Travel tips</strong>
          </div>
          <ul className="ait-tips-card__list">
            {tips.map((tip, i) => <li key={i}>{tip}</li>)}
          </ul>
        </Card>
      )}
    </aside>
  );
}

/* ── Loading skeleton ─────────────────────────────────────── */
function LoadingSkeleton() {
  return (
    <div className="ait-skeleton-wrap">
      {[1, 2, 3].map(n => (
        <div key={n} className="ait-skeleton-card">
          <div className="ait-skeleton__header" />
          <div className="ait-skeleton__line" />
          <div className="ait-skeleton__line ait-skeleton__line--short" />
          <div className="ait-skeleton__line" />
        </div>
      ))}
    </div>
  );
}

/* ── Main page ────────────────────────────────────────────── */
export default function AiItineraryPage() {
  const [destination, setDestination] = useState('');
  const [days, setDays]               = useState('7');
  const [budget, setBudget]           = useState('');
  const [loading, setLoading]         = useState(false);
  const [result, setResult]           = useState(null);
  const [error, setError]             = useState('');

  const fill = (tpl) => {
    setDestination(tpl.destination);
    setDays(String(tpl.days));
    setBudget(String(tpl.budget));
    setResult(null);
    setError('');
  };

  const generate = async () => {
    if (!destination.trim()) {
      setError('Enter a destination to generate an itinerary.');
      return;
    }
    setError('');
    setLoading(true);
    setResult(null);
    try {
      const data = await api.agency.generateItinerary(
        destination.trim(),
        Number.parseInt(days) || 7,
        Number.parseFloat(budget) || 0
      );
      setResult(data);
    } catch (err) {
      setError(err.message || 'Failed to generate itinerary. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const days_list = result?.itinerary ?? [];

  return (
    <PageLayout>

      {/* ── Hero input ── */}
      <section className="ait-hero">
        <PageHeader
          eyebrow="VittAro Intelligence"
          title="Build a thoughtful itinerary in moments."
          description="Enter a destination, trip length, and budget — VittAro AI creates a day-wise travel plan."
        />
        <div className="ait-form">
          {error && <p className="ait-form__error">{error}</p>}
          <label className="ait-form__field">
            Destination
            <input
              value={destination}
              onChange={e => setDestination(e.target.value)}
              placeholder="Kedarnath, Rajasthan, Goa…"
              onKeyDown={e => e.key === 'Enter' && generate()}
            />
          </label>
          <label className="ait-form__field">
            Days
            <input
              type="number" min="1" max="30"
              value={days}
              onChange={e => setDays(e.target.value)}
            />
          </label>
          <label className="ait-form__field">
            Budget (₹)
            <input
              type="number" min="0"
              value={budget}
              onChange={e => setBudget(e.target.value)}
              placeholder="50,000"
            />
          </label>
          <Button icon={Sparkles} onClick={generate} disabled={loading}>
            {loading ? 'Generating…' : 'Generate itinerary'}
          </Button>
        </div>
      </section>

      {/* ── Templates ── */}
      {!result && !loading && (
        <>
          <PageHeader title="Start with a popular route" />
          <div className="agency-card-grid">
            {TEMPLATES.map(tpl => (
              <Card key={tpl.destination} className="agency-template-card" onClick={() => fill(tpl)}>
                <span>{tpl.emoji}</span>
                <h2>{tpl.name}</h2>
                <p>{tpl.meta} · {tpl.days} days</p>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* ── Loading ── */}
      {loading && <LoadingSkeleton />}

      {/* ── Result ── */}
      {result && (
        <div className="ait-result-grid">
          {/* Left: day cards */}
          <section>
            <div className="ait-result-header">
              <div>
                <PageHeader
                  title={`${result.destination ?? destination} · ${result.days ?? days}-day itinerary`}
                />
                {result.summary && <p className="ait-result-summary">{result.summary}</p>}
              </div>
              <Button variant="outline" icon={RotateCcw} onClick={() => setResult(null)}>
                New plan
              </Button>
            </div>

            {days_list.length > 0
              ? days_list.map((day, i) => <DayCard key={i} day={day} index={i} />)
              : <EmptyState icon={MapPin} title="No itinerary details returned" message="Try refining the destination or budget." />
            }
          </section>

          {/* Right: budget + tips */}
          <BudgetSidebar result={result} />
        </div>
      )}

    </PageLayout>
  );
}
