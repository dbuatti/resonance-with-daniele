// scripts/export-feedback-and-budgets.mjs
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE key in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const outDir = path.resolve(process.cwd(), 'exports');
fs.mkdirSync(outDir, { recursive: true });

function toCSV(rows) {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const escape = (v) => {
    if (v === null || v === undefined) return '';
    const s = String(v).replace(/"/g, '""');
    return /[",\n]/.test(s) ? `"${s}"` : s;
  };
  const lines = [headers.map(escape).join(',')];
  for (const r of rows) lines.push(headers.map(h => escape(r[h])).join(','));
  return lines.join('\n');
}

async function main() {
  const ts = new Date().toISOString().replace(/[:.]/g, '-');

  // Fetch events for joining
  const { data: events, error: eventsErr } = await supabase.from('events').select('*');
  if (eventsErr) throw eventsErr;
  const eventMap = Object.fromEntries((events || []).map(e => [e.id, e]));

  // Fetch feedback
  const { data: feedback, error: fbErr } = await supabase.from('event_feedback').select('*');
  if (fbErr) throw fbErr;
  const feedbackJoined = (feedback || []).map(f => ({
    feedback_id: f.id,
    event_id: f.event_id,
    event_title: eventMap[f.event_id]?.title || '',
    event_date: eventMap[f.event_id]?.date || '',
    event_location: eventMap[f.event_id]?.location || '',
    user_id: f.user_id,
    is_anonymous: f.is_anonymous,
    is_first_time: f.is_first_time,
    overall_feeling: f.overall_feeling,
    overall_feeling_other: f.overall_feeling_other,
    enjoyed_most: f.enjoyed_most,
    improvements: f.improvements,
    time_slot_rating: f.time_slot_rating,
    future_repertoire: f.future_repertoire,
    price_point: f.price_point,
    interest_next_month: Array.isArray(f.interest_next_month) ? f.interest_next_month.join('; ') : f.interest_next_month,
    best_times_ongoing: Array.isArray(f.best_times_ongoing) ? f.best_times_ongoing.join('; ') : f.best_times_ongoing,
    regular_attendance_interest: f.regular_attendance_interest,
    attendance_frequency: f.attendance_frequency,
    recommend_score: f.recommend_score,
    how_heard: f.how_heard,
    venue_feedback: f.venue_feedback,
    repertoire_feedback: f.repertoire_feedback,
    future_ideas: f.future_ideas,
    additional_comments: f.additional_comments,
    created_at: f.created_at,
  }));

  // Fetch expenses
  const { data: expenses, error: expErr } = await supabase.from('event_expenses').select('*');
  if (expErr) throw expErr;
  const expensesJoined = (expenses || []).map(e => ({
    expense_id: e.id,
    event_id: e.event_id,
    event_title: eventMap[e.event_id]?.title || '',
    event_date: eventMap[e.event_id]?.date || '',
    event_location: eventMap[e.event_id]?.location || '',
    description: e.description,
    amount: e.amount,
    category: e.category,
    created_at: e.created_at,
  }));

  // Write files
  fs.writeFileSync(path.join(outDir, `feedback-${ts}.csv`), toCSV(feedbackJoined));
  fs.writeFileSync(path.join(outDir, `expenses-${ts}.csv`), toCSV(expensesJoined));
  fs.writeFileSync(path.join(outDir, `events-${ts}.json`), JSON.stringify(events, null, 2));
  fs.writeFileSync(path.join(outDir, `feedback-${ts}.json`), JSON.stringify(feedbackJoined, null, 2));
  fs.writeFileSync(path.join(outDir, `expenses-${ts}.json`), JSON.stringify(expensesJoined, null, 2));

  console.log('Exported:');
  console.log('- exports/feedback-' + ts + '.csv/json');
  console.log('- exports/expenses-' + ts + '.csv/json');
  console.log('- exports/events-' + ts + '.json');
}

main().catch(e => { console.error(e); process.exit(1); });
