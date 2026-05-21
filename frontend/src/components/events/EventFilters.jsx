'use client';
import { useDispatch, useSelector } from 'react-redux';
import { setFilter } from '../../store/slices/eventSlice';

const CITIES = ['Mumbai','Delhi','Bangalore','Pune','Chennai','Hyderabad','Kolkata','Ahmedabad','Jaipur','Online'];
const CATEGORIES = ['Technology','Business','Music','Arts & Culture','Sports & Fitness','Health & Wellness','Food & Drink','Education','Networking','Gaming','Film & Media','Fashion','Travel','Social','Other'];

export default function EventFilters() {
  const dispatch = useDispatch();
  const filters  = useSelector(s => s.events.filters);

  const Field = ({ label, children }) => (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wide text-[--color-text-muted] mb-2">{label}</label>
      {children}
    </div>
  );

  return (
    <div className="card p-5 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-5">
      <Field label="Category">
        <select
          value={filters.category}
          onChange={e => dispatch(setFilter({ key: 'category', value: e.target.value }))}
          className="input text-sm py-2"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </Field>

      <Field label="City">
        <select
          value={filters.city}
          onChange={e => dispatch(setFilter({ key: 'city', value: e.target.value }))}
          className="input text-sm py-2"
        >
          <option value="">All Cities</option>
          {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </Field>

      <Field label="Format">
        <select
          value={filters.format}
          onChange={e => dispatch(setFilter({ key: 'format', value: e.target.value }))}
          className="input text-sm py-2"
        >
          <option value="all">All Formats</option>
          <option value="online">Online</option>
          <option value="offline">In-Person</option>
          <option value="hybrid">Hybrid</option>
        </select>
      </Field>

      <Field label="Price">
        <select
          value={filters.type}
          onChange={e => dispatch(setFilter({ key: 'type', value: e.target.value }))}
          className="input text-sm py-2"
        >
          <option value="all">Any Price</option>
          <option value="free">Free Only</option>
          <option value="paid">Paid Only</option>
        </select>
      </Field>

      <Field label="From Date">
        <input
          type="date"
          value={filters.dateFrom}
          onChange={e => dispatch(setFilter({ key: 'dateFrom', value: e.target.value }))}
          className="input text-sm py-2"
        />
      </Field>

      <Field label="To Date">
        <input
          type="date"
          value={filters.dateTo}
          onChange={e => dispatch(setFilter({ key: 'dateTo', value: e.target.value }))}
          className="input text-sm py-2"
        />
      </Field>
    </div>
  );
}
