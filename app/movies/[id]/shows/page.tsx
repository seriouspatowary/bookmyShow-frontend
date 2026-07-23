'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Heart, Search, ChevronDown, X, Armchair, Smartphone, Info } from 'lucide-react'

const BASE_URL = process.env.NEXT_PUBLIC_API

// ---------------- Types ----------------
interface Schedule {
  date: string
  times: string[]
}

interface Show {
  _id: string
  movieId: string
  theatreId: string
  screenId: string
  availableSeats: number
  prices: Record<string, number>
  schedule: Schedule[]
  dimension: string
  language: string
  movieName: string
  theatreName: string
  screenName: string
  genre: string      // e.g. "Drama/Family"
  duration: number    // in minutes, e.g. 160
}

interface ApiResponse {
  success: boolean
  data: Show[]
}

// ---------------- Helpers ----------------
function getNext7Days() {
  const days = []
  const today = new Date()
  for (let i = 0; i < 7; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    days.push({
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
      dayNum: d.getDate(),
      month: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
      iso: d.toISOString().split('T')[0],
    })
  }
  return days
}

function formatTime(time: string) {
  const [h, m] = time.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour12 = h % 12 === 0 ? 12 : h % 12
  return `${String(hour12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`
}

function minPrice(prices: Record<string, number>) {
  const vals = Object.values(prices)
  return vals.length ? Math.min(...vals) : 0
}

function initials(name: string) {
  const clean = name.replace(/[^a-zA-Z ]/g, '').trim()
  const first = clean.split(' ')[0] || name
  return first.slice(0, 4).toUpperCase()
}

// duration in minutes -> "2h 40m"
function formatDuration(minutes?: number) {
  if (!minutes || minutes <= 0) return ''
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

// "Drama/Family" -> ["Drama", "Family"]
function parseGenres(genre?: string) {
  if (!genre) return []
  return genre
    .split('/')
    .map((g) => g.trim())
    .filter(Boolean)
}

// "NORMAL" -> "Normal", "EXECUTIVE XL" -> "Executive Xl"
function toTitleCase(str: string) {
  return str
    .toLowerCase()
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

// ---------------- Page ----------------
export default function ShowsPage() {
  const params = useParams<{ id: string }>()
  const searchParams = useSearchParams()

  const language = searchParams.get('language') || 'Assamese'
  const dimension = searchParams.get('dimension') || '2D'

  const days = useMemo(() => getNext7Days(), [])
  const [selectedDate, setSelectedDate] = useState(days[0].iso)
  const [shows, setShows] = useState<Show[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [query, setQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [sortBy, setSortBy] = useState<'default' | 'price-low' | 'price-high'>('default')
  const [maxPrice, setMaxPrice] = useState<number | null>(null)
  const [favourites, setFavourites] = useState<Set<string>>(new Set())
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  const router = useRouter();

  useEffect(() => {
    async function fetchShows() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(
          `${BASE_URL}/api/show/allshow/${params.id}?language=${encodeURIComponent(
            language
          )}&dimension=${encodeURIComponent(dimension)}`
        )
        if (!res.ok) throw new Error(`Request failed with ${res.status}`)
        const json: ApiResponse = await res.json()
        setShows(json.success ? json.data : [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load shows')
      } finally {
        setLoading(false)
      }
    }
    if (params.id) fetchShows()
  }, [params.id, language, dimension])

  const movieName = shows[0]?.movieName || ''
  const movieDuration = shows[0]?.duration
  const movieGenres = useMemo(() => parseGenres(shows[0]?.genre), [shows])

  const filtered = useMemo(() => {
    let list = shows
      .map((show) => ({
        show,
        daySchedule: show.schedule.find((s) => s.date === selectedDate),
      }))
      .filter((x) => x.daySchedule && x.daySchedule.times.length > 0)

    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter((x) => x.show.theatreName.toLowerCase().includes(q))
    }

    if (maxPrice !== null) {
      list = list.filter((x) => minPrice(x.show.prices) <= maxPrice)
    }

    if (sortBy === 'price-low') {
      list = [...list].sort((a, b) => minPrice(a.show.prices) - minPrice(b.show.prices))
    } else if (sortBy === 'price-high') {
      list = [...list].sort((a, b) => minPrice(b.show.prices) - minPrice(a.show.prices))
    }

    return list
  }, [shows, selectedDate, query, maxPrice, sortBy])

  function toggleFavourite(id: string) {
    setFavourites((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function isFastFilling(availableSeats: number) {
    return availableSeats > 0 && availableSeats < 30
  }

  const hasActiveFilters = query.trim() !== '' || maxPrice !== null

  return (
    <div>
      <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-[1600px]">
        {/* Title + badges */}
        <div className="px-6 pt-8 pb-5 md:px-10">
          <h1 className="text-4xl font-bold text-gray-900">
            {movieName ? `${movieName} - (${language})` : '\u00A0'}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-2.5">
            {movieDuration ? <Badge>Movie runtime: {formatDuration(movieDuration)}</Badge> : null}
            <Badge>UA13+</Badge>
            {movieGenres.map((g) => (
              <Badge key={g}>{g}</Badge>
            ))}
          </div>
        </div>

        {/* Date strip + filter bar */}
        <div className="flex items-stretch border-t border-b border-gray-200 px-6 md:px-10">
          <div className="flex items-stretch overflow-x-auto">
            {days.map((d) => {
              const active = d.iso === selectedDate
              return (
                <button
                  key={d.iso}
                  onClick={() => setSelectedDate(d.iso)}
                  className={`flex min-w-[92px] flex-col items-center justify-center gap-0.5 px-3 py-4 transition-colors ${
                    active ? 'bg-[#e0475c] text-white' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-xs font-medium tracking-wide">{d.dayName}</span>
                  <span className="text-xl font-bold leading-tight">{d.dayNum}</span>
                  <span className="text-xs font-medium tracking-wide">{d.month}</span>
                </button>
              )
            })}
          </div>

          <div className="flex flex-1 items-stretch justify-end divide-x divide-gray-200 border-l border-gray-200">
            <FilterTab label={`${language} - ${dimension}`} underline />

            <FilterTab
              label="Price Range"
              hasChevron
              open={openMenu === 'price'}
              onClick={() => setOpenMenu(openMenu === 'price' ? null : 'price')}
            >
              {openMenu === 'price' && (
                <Dropdown>
                  {[150, 200, 250, 300, 400].map((p) => (
                    <DropdownItem
                      key={p}
                      active={maxPrice === p}
                      onClick={() => {
                        setMaxPrice(maxPrice === p ? null : p)
                        setOpenMenu(null)
                      }}
                    >
                      Under ₹{p}
                    </DropdownItem>
                  ))}
                </Dropdown>
              )}
            </FilterTab>

            <FilterTab label="Special Formats" hasChevron disabled />
            <FilterTab label="Other Filters" hasChevron disabled />
            <FilterTab label="Preferred Time" hasChevron disabled />

            <FilterTab
              label="Sort By"
              hasChevron
              underline={openMenu === 'sort'}
              open={openMenu === 'sort'}
              onClick={() => setOpenMenu(openMenu === 'sort' ? null : 'sort')}
            >
              {openMenu === 'sort' && (
                <Dropdown>
                  <DropdownItem
                    active={sortBy === 'default'}
                    onClick={() => { setSortBy('default'); setOpenMenu(null) }}
                  >
                    Default
                  </DropdownItem>
                  <DropdownItem
                    active={sortBy === 'price-low'}
                    onClick={() => { setSortBy('price-low'); setOpenMenu(null) }}
                  >
                    Price: Low to High
                  </DropdownItem>
                  <DropdownItem
                    active={sortBy === 'price-high'}
                    onClick={() => { setSortBy('price-high'); setOpenMenu(null) }}
                  >
                    Price: High to Low
                  </DropdownItem>
                </Dropdown>
              )}
            </FilterTab>

            <button
              onClick={() => setShowSearch((s) => !s)}
              className="flex items-center px-6 text-gray-500 hover:bg-gray-50"
            >
              <Search size={18} />
            </button>
          </div>
        </div>

        {/* Favourite hint / search / legend row */}
        <div className="flex items-center justify-between gap-4 bg-gray-50 px-6 py-3.5 md:px-10">
          <div className="flex flex-1 items-center gap-3">
            {showSearch ? (
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for cinemas"
                className="w-72 rounded border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-red-400"
              />
            ) : (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>Mark Favourite Cinemas by tapping on the</span>
                <Heart size={16} />
              </div>
            )}
            {hasActiveFilters && (
              <button
                onClick={() => {
                  setQuery('')
                  setMaxPrice(null)
                  setShowSearch(false)
                }}
                className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-5 text-xs text-gray-600">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-green-500" /> AVAILABLE
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500" /> FAST FILLING
            </span>
          </div>
        </div>

        {/* Theatre list */}
          <div className='mx-auto max-w-8xl px-8 py-10 '>
              <div className="px-6 md:px-10 bg-[#f5f5f5]">
          {loading && <div className="py-14 text-center text-gray-400">Loading showtimes…</div>}
          {error && <div className="py-14 text-center text-red-500">{error}</div>}
          {!loading && !error && filtered.length === 0 && (
            <div className="py-14 text-center text-gray-400">No shows available for this date.</div>
          )}

          <div className="divide-y divide-gray-200">
            {filtered.map(({ show, daySchedule }) => (
              <div key={show._id} className="py-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded border border-gray-200 bg-white text-[10px] font-bold leading-none text-gray-500">
                      {initials(show.theatreName)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-lg font-semibold text-gray-900">{show.theatreName}</h3>
                        <Info size={14} className="text-gray-400" />
                      </div>
                      <p className="mt-0.5 text-sm text-gray-400">
                        {show.availableSeats > 0 ? 'Cancellation available' : 'Non-cancellable'}
                      </p>
                      <div className="mt-2.5 flex items-center gap-3">
                        <Armchair size={18} className="text-orange-400" />
                        <Smartphone size={18} className="text-emerald-500" />
                      </div>
                    </div>
                  </div>
                  <button onClick={() => toggleFavourite(show._id)} className="pt-1">
                    <Heart
                      size={20}
                      className={
                        favourites.has(show._id)
                          ? 'fill-red-500 text-red-500'
                          : 'text-gray-300 hover:text-gray-400'
                      }
                    />
                  </button>
                </div>

                <div className="mt-4 flex flex-wrap gap-3.5">
                  {daySchedule!.times.map((time) => (
                    <div key={time} className="group relative">
                      <button
                        className={`rounded border px-6 py-3 text-sm font-medium transition-colors ${
                          isFastFilling(show.availableSeats)
                            ? 'border-amber-500 text-amber-600 hover:bg-amber-50'
                            : 'border-green-500 text-gray-700 hover:bg-green-50'
                        }`}
                        onClick={()=>router.push(`/movies/seat-layout/${show._id}`)}
                      >{formatTime(time)}
                        
                      </button>

                      {/* Hover price tooltip */}
                      <PriceTooltip prices={show.prices} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
          </div>
      </div>
    </div>
    </div>
  )
}

// ---------------- Small pieces ----------------
function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-gray-300 px-4 py-1.5 text-sm text-gray-700">
      {children}
    </span>
  )
}

function FilterTab({
  label,
  disabled,
  hasChevron,
  underline,
  open,
  onClick,
  children,
}: {
  label: string
  disabled?: boolean
  hasChevron?: boolean
  underline?: boolean
  open?: boolean
  onClick?: () => void
  children?: React.ReactNode
}) {
  return (
    <div className="relative flex">
      <button
        disabled={disabled}
        onClick={onClick}
        className={`flex items-center gap-1.5 px-6 text-sm whitespace-nowrap ${
          underline || open ? 'border-b-2 border-[#e0475c] text-gray-900' : 'text-gray-700'
        } ${disabled ? 'cursor-default' : 'hover:bg-gray-50'}`}
      >
        {label}
        {hasChevron && <ChevronDown size={14} className="text-gray-500" />}
      </button>
      {children}
    </div>
  )
}

function Dropdown({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute right-0 top-full z-20 mt-0 w-48 rounded-b border border-gray-200 bg-white py-1 shadow-lg">
      {children}
    </div>
  )
}

function DropdownItem({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode
  active?: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`block w-full px-4 py-2 text-left text-sm ${
        active ? 'bg-red-50 text-[#e0475c]' : 'text-gray-700 hover:bg-gray-50'
      }`}
    >
      {children}
    </button>
  )
}

// Hover tooltip showing per-category price, like the reference screenshot
function PriceTooltip({ prices }: { prices: Record<string, number> }) {
  const entries = Object.entries(prices)
  if (entries.length === 0) return null

  return (
    <div
      className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-3 hidden -translate-x-1/2
                 opacity-0 group-hover:flex group-hover:opacity-100 transition-opacity duration-150"
    >
      <div className="flex divide-x divide-gray-100 rounded-lg border border-gray-100 bg-white px-1 py-3 shadow-xl">
        {entries.map(([category, price]) => (
          <div key={category} className="flex flex-col items-center gap-1 px-5 first:pl-4 last:pr-4">
            <span className="whitespace-nowrap text-base font-semibold text-gray-900">
              ₹{price.toFixed(2)}
            </span>
            <span className="whitespace-nowrap text-xs font-medium text-gray-800">
              {toTitleCase(category)}
            </span>
            <span className="whitespace-nowrap text-xs font-medium text-green-600">Available</span>
          </div>
        ))}
      </div>
      {/* pointer/arrow */}
      <div className="absolute left-1/2 top-full -mt-1.5 h-3 w-3 -translate-x-1/2 rotate-45 border-b border-r border-gray-100 bg-white" />
    </div>
  )
}