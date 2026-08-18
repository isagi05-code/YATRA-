import { useState } from 'react';
import {
  MapPin, RotateCcw, Sparkles, Clock, Lightbulb, Calendar,
  Navigation, Ticket, Car, Train, Plane, Hotel, Phone, ChevronDown, ChevronUp, Tag
} from 'lucide-react';
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

/* ── Time-of-day indicator colours ───────────────────────── */
const TIME_COLORS = {
  Morning:      '#f59e0b',
  'Late Morning': '#f97316',
  Afternoon:    '#3b82f6',
  Evening:      '#8b5cf6',
};

/* ── Single activity row ──────────────────────────────────── */
function ActivityRow({ activity }) {
  const [expanded, setExpanded] = useState(false);
  const dot = TIME_COLORS[activity.time] ?? '#94a3b8';
  const hasMeta = activity.location || activity.distance_from_base || activity.entry_fee || activity.duration || activity.tips;

  return (
    <div className="ait-activity">
      <span className="ait-activity__dot" style={{ background: dot }} />
      <div className="ait-activity__body">
        <div className="ait-activity__header" onClick={() => hasMeta && setExpanded(e => !e)} style={{ cursor: hasMeta ? 'pointer' : 'default' }}>
          <div className="ait-activity__title-row">
            {activity.time_slot && (
              <span className="ait-activity__slot">
                <Clock size={11} /> {activity.time_slot}
              </span>
            )}
            <time className="ait-activity__time">{activity.time}</time>
            <strong className="ait-activity__name">{activity.name}</strong>
          </div>
          {hasMeta && (
            <span className="ait-activity__expand-icon">
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </span>
          )}
        </div>

        {activity.description && (
          <p className="ait-activity__desc">{activity.description}</p>
        )}

        {expanded && hasMeta && (
          <div className="ait-activity__meta">
            {activity.location && (
              <span className="ait-meta-pill">
                <MapPin size={11} /> {activity.location}
              </span>
            )}
            {activity.distance_from_base && (
              <span className="ait-meta-pill">
                <Navigation size={11} /> {activity.distance_from_base}
              </span>
            )}
            {activity.entry_fee && (
              <span className="ait-meta-pill ait-meta-pill--fee">
                <Ticket size={11} /> {activity.entry_fee}
              </span>
            )}
            {activity.duration && (
              <span className="ait-meta-pill">
                <Clock size={11} /> {activity.duration}
              </span>
            )}
            {activity.tips && (
              <div className="ait-activity__tip">
                <Lightbulb size={11} /> <span>{activity.tips}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── One day card ─────────────────────────────────────────── */
function DayCard({ day, index }) {
  const THEME_COLORS = {
    Heritage: '#f59e0b', Nature: '#22c55e', Adventure: '#ef4444',
    Spiritual: '#a855f7', Leisure: '#3b82f6', Culture: '#ec4899',
  };
  const themeColor = THEME_COLORS[day.theme] ?? '#64748b';

  return (
    <Card className="ait-day-card" padded={false}>
      <header className="ait-day-card__header">
        <div>
          <div className="ait-day-card__meta-row">
            <span className="ait-day-card__label">Day {day.day ?? index + 1}</span>
            {day.theme && (
              <span className="ait-day-card__theme" style={{ background: themeColor + '22', color: themeColor, border: `1px solid ${themeColor}44` }}>
                {day.theme}
              </span>
            )}
          </div>
          <h2 className="ait-day-card__title">{day.title ?? `Day ${index + 1}`}</h2>
          {day.highlights?.length > 0 && (
            <div className="ait-day-card__highlights">
              {day.highlights.map((h, i) => (
                <span key={i} className="ait-highlight-chip"><Tag size={10} /> {h}</span>
              ))}
            </div>
          )}
        </div>
        <div className="ait-day-card__costs">
          {day.estimated_cost != null && (
            <span className="ait-day-card__cost">
              ₹{Number(day.estimated_cost).toLocaleString('en-IN')}
              <small>/ day</small>
            </span>
          )}
        </div>
      </header>

      <div className="ait-day-card__body">
        {(day.activities ?? []).map((act, i) => (
          <ActivityRow key={i} activity={act} />
        ))}
        {!day.activities?.length && day.description && (
          <p className="ait-day-card__fallback">{day.description}</p>
        )}
      </div>

      {(day.transport_for_day || day.meals_budget) && (
        <footer className="ait-day-card__footer">
          {day.transport_for_day && (
            <span className="ait-footer-pill">
              <Car size={12} />
              <strong>{day.transport_for_day.mode}</strong>
              {day.transport_for_day.estimated_cost && ` · ${day.transport_for_day.estimated_cost}`}
              {day.transport_for_day.notes && <em> — {day.transport_for_day.notes}</em>}
            </span>
          )}
          {day.meals_budget && (
            <span className="ait-footer-pill ait-footer-pill--meals">
              🍽 Meals est. {day.meals_budget}
            </span>
          )}
        </footer>
      )}
    </Card>
  );
}

/* ── Budget sidebar ───────────────────────────────────────── */
function BudgetSidebar({ result }) {
  const total = result.estimated_budget ?? result.total_budget ?? 0;
  const breakdown = result.budget_breakdown ?? {};
  const tips = Array.isArray(result.tips)
    ? result.tips
    : (result.tips ? result.tips.split(';').map(t => t.trim()).filter(Boolean) : []);
  const accom = result.accommodation_suggestion;
  const reach = result.how_to_reach;
  const emergency = result.emergency_contacts;

  return (
    <aside className="ait-sidebar">
      {/* Budget total */}
      <Card className="ait-budget-card">
        <small className="ait-budget-card__label">AI budget estimate</small>
        <p className="ait-budget-card__total">₹{Number(total).toLocaleString('en-IN')}</p>
        {Object.entries(breakdown).map(([k, v]) => (
          <div className="ait-budget-card__row" key={k}>
            <span>{k.replace(/_/g, ' ')}</span>
            <strong>₹{Number(v).toLocaleString('en-IN')}</strong>
          </div>
        ))}
      </Card>

      {/* Accommodation suggestion */}
      {accom && (
        <Card className="ait-meta-card">
          <div className="ait-meta-card__heading"><Hotel size={14} /> <strong>Suggested Stay</strong></div>
          <p className="ait-accom__name">{accom.name}</p>
          <div className="ait-meta-card__item"><MapPin size={11} /> {accom.area}</div>
          <div className="ait-meta-card__item"><Ticket size={11} /> ₹{Number(accom.price_per_night).toLocaleString('en-IN')} / night</div>
          <div className="ait-meta-card__item"><Tag size={11} /> {accom.type}</div>
        </Card>
      )}

      {/* Best time + how to reach */}
      {(result.best_time_to_visit || reach) && (
        <Card className="ait-meta-card">
          {result.best_time_to_visit && (
            <div className="ait-meta-card__item">
              <Calendar size={14} /> <span><b>Best time:</b> {result.best_time_to_visit}</span>
            </div>
          )}
          {reach?.by_air && (
            <div className="ait-meta-card__item"><Plane size={13} /> <span>{reach.by_air}</span></div>
          )}
          {reach?.by_train && (
            <div className="ait-meta-card__item"><Train size={13} /> <span>{reach.by_train}</span></div>
          )}
          {reach?.by_road && (
            <div className="ait-meta-card__item"><Car size={13} /> <span>{reach.by_road}</span></div>
          )}
        </Card>
      )}

      {/* Tips */}
      {tips.length > 0 && (
        <Card className="ait-tips-card">
          <div className="ait-tips-card__heading">
            <Lightbulb size={14} /> <strong>Travel tips</strong>
          </div>
          <ul className="ait-tips-card__list">
            {tips.map((tip, i) => <li key={i}>{tip}</li>)}
          </ul>
        </Card>
      )}

      {/* Emergency contacts */}
      {emergency && (
        <Card className="ait-meta-card">
          <div className="ait-meta-card__heading"><Phone size={14} /> <strong>Emergency Numbers</strong></div>
          {Object.entries(emergency).map(([k, v]) => (
            <div className="ait-meta-card__item" key={k}>
              <span className="ait-emergency-label">{k.replace(/_/g, ' ')}</span>
              <strong>{v}</strong>
            </div>
          ))}
        </Card>
      )}
    </aside>
  );
}

/* ── Loading skeleton ─────────────────────────────────────── */
function LoadingSkeleton() {
  return (
    <div className="ait-skeleton-wrap">
      <p className="ait-skeleton-msg">✨ Generating your personalized itinerary…</p>
      {[1, 2, 3].map(n => (
        <div key={n} className="ait-skeleton-card">
          <div className="ait-skeleton__header" />
          <div className="ait-skeleton__line" />
          <div className="ait-skeleton__line ait-skeleton__line--short" />
          <div className="ait-skeleton__line" />
          <div className="ait-skeleton__line ait-skeleton__line--short" />
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
  const [groupSize, setGroupSize]     = useState('2');
  const [tripStyle, setTripStyle]     = useState('balanced');
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
          eyebrow="Yatra Intelligence"
          title="Build a thoughtful itinerary in moments."
          description="Enter a destination, trip length, and budget — Yatra AI creates a detailed day-wise travel plan with real locations, distances, timings, and prices."
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
            Duration (days)
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
              placeholder="e.g. 50000"
            />
          </label>
          <label className="ait-form__field">
            Group size
            <input
              type="number" min="1" max="50"
              value={groupSize}
              onChange={e => setGroupSize(e.target.value)}
            />
          </label>
          <label className="ait-form__field">
            Trip style
            <select value={tripStyle} onChange={e => setTripStyle(e.target.value)}>
              <option value="balanced">Balanced</option>
              <option value="budget">Budget-focused</option>
              <option value="luxury">Luxury</option>
              <option value="adventure">Adventure</option>
              <option value="cultural">Cultural & Heritage</option>
              <option value="spiritual">Spiritual</option>
            </select>
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
