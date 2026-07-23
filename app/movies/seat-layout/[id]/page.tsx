'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ChevronLeft,
  Accessibility,
  Pencil,
  Info,
  ZoomIn,
  ZoomOut,
  Armchair,
} from 'lucide-react';

const BASE_URL = process.env.NEXT_PUBLIC_API;

// ---------------------------------------------------------------------------
// Types (shaped after BASE_URL/api/show/layout/:id)
// ---------------------------------------------------------------------------

type SeatType = string; // "DIAMOND" | "GOLD" | "SILVER" | ...

interface RowLayout {
  seatCount: number;
  seatType: SeatType;
}

interface ScheduleEntry {
  date: string; // "2026-07-23"
  times: string[]; // "08:45"
}

interface ShowLayoutResponse {
  _id: string;
  movieId: string;
  theatreId: string;
  screenId: string;
  availableSeats: number;
  prices: Record<SeatType, number>;
  layout: Record<string, RowLayout>; // row letter -> row layout
  schedule: ScheduleEntry[];
  dimension: string;
  language: string;
  movieName: string;
  genre: string;
  duration: number;
  image: string;
  theatreName: string;
  theatreAddress: string;
  screenName: string;
  // Optional, if the backend starts returning it alongside layout:
  bookedSeats?: string[]; // e.g. ["A-3", "B-7"]
  bestsellerSeats?: string[]; // e.g. ["D-5", "D-6"]
}

type SeatStatus = 'available' | 'sold' | 'selected' | 'bestseller';

interface SeatSection {
  seatType: SeatType;
  price: number;
  rows: [string, RowLayout][];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Split a row's seat numbers into aisle-separated blocks, à la cinema layouts. */
function toAisleGroups(seatCount: number): number[][] {
  const seats = Array.from({ length: seatCount }, (_, i) => i + 1);
  const groups: number[][] = [];
  const blockSize = seatCount <= 6 ? seatCount : 4;
  while (seats.length) groups.push(seats.splice(0, blockSize));
  return groups;
}

function pad2(n: number) {
  return n.toString().padStart(2, '0');
}

function seatId(row: string, num: number) {
  return `${row}-${num}`;
}

function formatDateLabel(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatTimeLabel(time: string) {
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${pad2(hour12)}:${pad2(m)} ${period}`;
}

const MAX_TICKETS = 10;
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 2;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SeatLayoutPage() {
  const params = useParams();
  const router = useRouter();
  const showId = params?.id as string;

  const [data, setData] = useState<ShowLayoutResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const [ticketCount, setTicketCount] = useState(1);
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [pendingTicketCount, setPendingTicketCount] = useState(1);
  const [ticketsConfirmed, setTicketsConfirmed] = useState(false);
  const [selectedSeats, setSelectedSeats] = useState<Set<string>>(new Set());
  const [zoom, setZoom] = useState(1);
  const pinchDistanceRef = useRef<number | null>(null);

  // ---- fetch layout -------------------------------------------------------

  useEffect(() => {
    if (!showId) return;

    const controller = new AbortController();

    async function fetchLayout() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${BASE_URL}/api/show/layout/${showId}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`Request failed (${res.status})`);
        const json = await res.json();
        if (!json.success) throw new Error(json.message || 'Failed to load seat layout');

        setData(json.data);
        const firstDate = json.data.schedule?.[0];
        setSelectedDate(firstDate?.date ?? null);
        setSelectedTime(firstDate?.times?.[0] ?? null);
        setTicketModalOpen(true); // ask "how many seats?" before showing the map
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setError((err as Error).message || 'Something went wrong');
        }
      } finally {
        setLoading(false);
      }
    }

    fetchLayout();
    return () => controller.abort();
  }, [showId]);

  // ---- derived state --------------------------------------------------

  const rowOrder = useMemo(() => (data ? Object.keys(data.layout) : []), [data]);

  const sections: SeatSection[] = useMemo(() => {
    if (!data) return [];
    const result: SeatSection[] = [];
    for (const row of rowOrder) {
      const rowLayout = data.layout[row];
      const last = result[result.length - 1];
      if (last && last.seatType === rowLayout.seatType) {
        last.rows.push([row, rowLayout]);
      } else {
        result.push({
          seatType: rowLayout.seatType,
          price: data.prices[rowLayout.seatType] ?? 0,
          rows: [[row, rowLayout]],
        });
      }
    }
    // Highest price band first, like the reference design (legroom > prime > classic)
    return result.sort((a, b) => b.price - a.price);
  }, [data, rowOrder]);

  const priceCategories = useMemo(() => {
    if (!data) return [];
    return Object.entries(data.prices)
      .map(([type, price]) => ({ type, price }))
      .sort((a, b) => b.price - a.price);
  }, [data]);

  const bookedSeats = useMemo(() => new Set(data?.bookedSeats ?? []), [data]);
  const bestsellerSeats = useMemo(() => new Set(data?.bestsellerSeats ?? []), [data]);

  const totalAmount = useMemo(() => {
    if (!data) return 0;
    let sum = 0;
    for (const id of selectedSeats) {
      const [row] = id.split('-');
      const type = data.layout[row]?.seatType;
      sum += type ? data.prices[type] ?? 0 : 0;
    }
    return sum;
  }, [selectedSeats, data]);

  const activeSchedule = useMemo(
    () => data?.schedule.find((s) => s.date === selectedDate) ?? null,
    [data, selectedDate]
  );

  function getSeatStatus(id: string): SeatStatus {
    if (selectedSeats.has(id)) return 'selected';
    if (bookedSeats.has(id)) return 'sold';
    if (bestsellerSeats.has(id)) return 'bestseller';
    return 'available';
  }

  function toggleSeat(id: string) {
    if (!ticketsConfirmed) return;
    const status = getSeatStatus(id);
    if (status === 'sold') return;

    setSelectedSeats((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        return next;
      }
      if (next.size >= ticketCount) {
        // at capacity: drop the oldest pick so the new tap always registers
        const oldest = next.values().next().value;
        if (oldest !== undefined) next.delete(oldest);
      }
      next.add(id);
      return next;
    });
  }

  function openTicketModal() {
    setPendingTicketCount(ticketCount);
    setTicketModalOpen(true);
  }

  function confirmTicketCount() {
    setTicketCount(pendingTicketCount);
    setSelectedSeats(new Set()); // start seat picking fresh for the new count
    setTicketsConfirmed(true);
    setTicketModalOpen(false);
  }

  function clampZoom(value: number) {
    return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, +value.toFixed(2)));
  }

  function touchDistance(touches: React.TouchList) {
    const [a, b] = [touches[0], touches[1]];
    return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  }

  // Two-finger pinch (mobile / trackpad-as-touch devices)
  function handleTouchStart(e: React.TouchEvent) {
    if (e.touches.length === 2) {
      pinchDistanceRef.current = touchDistance(e.touches);
    }
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (e.touches.length === 2 && pinchDistanceRef.current !== null) {
      e.preventDefault();
      const distance = touchDistance(e.touches);
      const delta = distance / pinchDistanceRef.current;
      setZoom((z) => clampZoom(z * delta));
      pinchDistanceRef.current = distance;
    }
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (e.touches.length < 2) pinchDistanceRef.current = null;
  }

  // Trackpad pinch surfaces as a ctrl/meta + wheel event in browsers
  function handleWheel(e: React.WheelEvent) {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    setZoom((z) => clampZoom(z - e.deltaY * 0.01));
  }

  // ---- render -----------------------------------------------------------

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white text-gray-500">
        Loading seat layout&hellip;
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-white text-gray-700">
        <p>{error ?? 'Unable to load seat layout.'}</p>
        <button
          onClick={() => router.back()}
          className="rounded-full bg-green-600 px-5 py-2 text-sm font-medium text-white hover:bg-green-700"
        >
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-white text-gray-800">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-gray-200 px-6 py-3">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="text-gray-500 hover:text-gray-800"
            aria-label="Go back"
          >
            <ChevronLeft size={22} />
          </button>
          <div>
            <h1 className="text-base font-semibold leading-tight">{data.movieName}</h1>
            <p className="text-sm text-gray-500">
              {data.theatreName}
              {selectedDate && <> &middot; {formatDateLabel(selectedDate)}</>}
              {selectedTime && <> &middot; {formatTimeLabel(selectedTime)}</>}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Accessibility size={20} className="text-gray-500" />
          <button
            onClick={openTicketModal}
            disabled={!ticketsConfirmed}
            className="flex items-center gap-1.5 rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-500 hover:bg-red-50 disabled:opacity-0"
          >
            <Pencil size={13} />
            {ticketCount} Ticket{ticketCount > 1 ? 's' : ''}
          </button>
        </div>
      </header>

      {/* Showtime tabs */}
      {activeSchedule && (
        <div className="flex gap-3 border-b border-gray-100 bg-gray-50 px-6 py-3">
          {activeSchedule.times.map((time) => {
            const active = time === selectedTime;
            return (
              <button
                key={time}
                onClick={() => setSelectedTime(time)}
                className={`rounded-md border px-4 py-2 text-sm font-semibold transition-colors ${
                  active
                    ? 'border-green-600 bg-green-600 text-white'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-green-500'
                }`}
              >
                {formatTimeLabel(time)}
              </button>
            );
          })}
        </div>
      )}

      {/* Seat map */}
      <div
        className={`relative flex flex-1 items-center justify-center overflow-hidden touch-none transition-[filter] ${
          ticketModalOpen ? 'pointer-events-none blur-sm' : ''
        }`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
      >
        <div
          className="flex flex-col items-center gap-10 py-10 transition-transform"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
        >
          {sections.map((section) => (
            <section key={section.seatType} className="w-full">
              <div className="mb-4 flex items-baseline gap-2 border-b border-gray-100 pb-2">
                <h2 className="text-sm font-semibold tracking-wide text-gray-800">
                  &#8377;{section.price} {section.seatType} ROWS
                </h2>
              </div>

              <div className="flex flex-col gap-2">
                {section.rows.map(([row, rowLayout]) => {
                  const groups = toAisleGroups(rowLayout.seatCount);
                  return (
                    <div key={row} className="flex items-center gap-3">
                      <span className="w-4 shrink-0 text-center text-xs font-medium text-gray-400">
                        {row}
                      </span>
                      <div className="flex gap-8">
                        {groups.map((group, gi) => (
                          <div key={gi} className="flex gap-1.5">
                            {group.map((num) => {
                              const id = seatId(row, num);
                              const status = getSeatStatus(id);
                              return (
                                <button
                                  key={id}
                                  disabled={status === 'sold'}
                                  onClick={() => toggleSeat(id)}
                                  title={`${row}${pad2(num)} &middot; &#8377;${section.price}`}
                                  className={[
                                    'flex h-7 w-7 items-center justify-center rounded-[4px] border text-[11px] font-medium transition-colors',
                                    status === 'selected' &&
                                      'border-green-600 bg-green-600 text-white',
                                    status === 'sold' &&
                                      'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-300',
                                    status === 'bestseller' &&
                                      'border-amber-400 text-amber-600 hover:bg-amber-50',
                                    status === 'available' &&
                                      'border-gray-300 text-gray-600 hover:border-green-500 hover:text-green-600',
                                  ]
                                    .filter(Boolean)
                                    .join(' ')}
                                >
                                  {pad2(num)}
                                </button>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}

          {/* Screen indicator */}
          <div className="mt-6 flex flex-col items-center gap-2">
            <div className="h-2 w-3/4 rounded-t-full bg-gradient-to-b from-gray-300 to-transparent" />
            <p className="text-xs tracking-widest text-gray-400">ALL EYES THIS WAY PLEASE</p>
          </div>
        </div>

        {/* Zoom controls */}
        <div className="absolute bottom-6 right-6 flex flex-col gap-3">
          <button
            onClick={() => setZoom((z) => clampZoom(z + 0.1))}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm hover:bg-gray-50"
            aria-label="Zoom in"
          >
            <ZoomIn size={18} />
          </button>
          <button
            onClick={() => setZoom((z) => clampZoom(z - 0.1))}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm hover:bg-gray-50"
            aria-label="Zoom out"
          >
            <ZoomOut size={18} />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-8 border-t border-gray-100 py-3 text-sm text-gray-600">
        <LegendItem swatchClass="border border-gray-300" label="Available" />
        <LegendItem swatchClass="border border-gray-200 bg-gray-200" label="Sold" />
        <LegendItem
          swatchClass="border border-amber-400"
          label={
            <span className="flex items-center gap-1">
              Bestseller <Info size={12} className="text-gray-400" />
            </span>
          }
        />
        <LegendItem swatchClass="border border-green-600 bg-green-600" label="Selected" />
      </div>

    {/* Sticky booking bar */}
{ticketsConfirmed && (
  <div className="bg-gray-50 py-4">
    <div className="mx-auto max-w-7xl px-4">
      {selectedSeats.size > 0 && (
        <div className="mb-3 text-center text-sm text-gray-600">
          <span className="font-semibold text-gray-900">
            {selectedSeats.size}
          </span>{" "}
          of {ticketCount} seat{ticketCount > 1 ? "s" : ""} selected &middot;{" "}
          <span className="font-semibold text-gray-900">
            {Array.from(selectedSeats)
              .sort()
              .map((id) => id.replace("-", ""))
              .join(", ")}
          </span>
        </div>
      )}

      <div className='px-100'>
        <button
        disabled={selectedSeats.size < ticketCount}
        className="w-100 rounded-xl bg-rose-500 py-4 text-base font-semibold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:bg-gray-300"
      >
        {selectedSeats.size < ticketCount
          ? `Select ${ticketCount - selectedSeats.size} more seat${
              ticketCount - selectedSeats.size > 1 ? "s" : ""
            }`
          : `Pay ₹${totalAmount}`}
      </button>
      </div>
    </div>
  </div>
)}

      {/* "How many seats?" modal */}
      {ticketModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-xl">
            <div className="px-8 pt-8 text-center">
              <h2 className="text-xl font-semibold text-gray-900">How many seats?</h2>

              <div className="my-6 flex justify-center">
                <Armchair size={72} strokeWidth={1.2} className="text-gray-300" />
              </div>

              <div className="flex flex-wrap justify-center gap-3">
                {Array.from({ length: MAX_TICKETS }, (_, i) => i + 1).map((n) => {
                  const active = n === pendingTicketCount;
                  return (
                    <button
                      key={n}
                      onClick={() => setPendingTicketCount(n)}
                      className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                        active
                          ? 'bg-rose-500 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {n}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-7 grid grid-flow-col auto-cols-fr gap-2 overflow-x-auto border-t border-gray-100 px-8 py-5 text-center">
              {priceCategories.map(({ type, price }) => (
                <div key={type} className="min-w-[92px]">
                  <p className="text-xs font-medium tracking-wide text-gray-500">{type}</p>
                  <p className="mt-1 text-base font-semibold text-gray-900">&#8377;{price}</p>
                  <p className="mt-1 text-xs font-medium tracking-wide text-emerald-600">
                    AVAILABLE
                  </p>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center gap-2 bg-gray-50 px-8 py-3 text-sm text-gray-600">
              Book the
              <span className="inline-block h-4 w-4 rounded-[3px] border border-amber-400" />
              <span className="font-semibold text-gray-900">Bestseller Seats</span>
              in this cinema at no extra cost!
            </div>

            <div className="px-8 pb-8 pt-5">
              <button
                onClick={confirmTicketCount}
                className="w-full rounded-md bg-rose-500 py-3 text-base font-semibold text-white transition-colors hover:bg-rose-600"
              >
                Select Seats
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LegendItem({
  swatchClass,
  label,
}: {
  swatchClass: string;
  label: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className={`h-4 w-4 rounded-[3px] ${swatchClass}`} />
      <span>{label}</span>
    </div>
  );
}