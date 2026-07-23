"use client";

import React, { useState, useEffect, useRef, ChangeEvent, FormEvent, CSSProperties } from "react";
import { useSelector } from "react-redux";
import AdminNavbar from "@/app/components/admin/AdminNavbar";
import { apiFetch } from "@/app/lib/apiFetch";

// BookMyShow brand accent
const ACCENT = "#F84464";

interface Movie {
  _id: string;
  title: string;
}

interface TheatreOption {
  _id: string;
  name: string;
}

interface ScreenOption {
  _id: string;
  name: string;
}

// One calendar date with one or more show times on that date,
// e.g. { date: "2026-07-25", times: ["17:00", "20:00", "23:00"] }
interface DateTimeSlot {
  date: string; // YYYY-MM-DD
  times: string[]; // "HH:mm" (24h), kept sorted
}

const DIMENSION_OPTIONS = ["2D", "3D", "4DX", "IMAX 2D", "IMAX 3D"];

interface ShowForm {
  movieId: string;
  theatreId: string;
  screenId: string;
  availableSeats: string; // kept as string for the input, converted to Number on submit
  dimension: string; // e.g. "2D", "3D", "IMAX 2D"
  language: string; // e.g. "Hindi", "English"
}

type FormErrors = Partial<Record<keyof ShowForm | "prices" | "schedule", string>>;

// A show as it comes back from /api/show/list. Movie/theatre/screen are
// assumed to be populated (id + name) so the list can render readable
// labels without a second round of lookups. `prices` and `schedule` are
// optional so older records (or a backend that hasn't been updated yet)
// still render using the legacy single price/startTime/endTime fields.
interface Show {
  _id: string;
  movie: { _id: string; title: string };
  theatre: { _id: string; name: string };
  screen: { _id: string; name: string };
  startTime: string;
  endTime: string;
  price: number;
  prices?: Record<string, number>; // per seat-category price, e.g. { DIAMOND: 400, GOLD: 300 }
  schedule?: DateTimeSlot[]; // multiple dates, each with multiple show times
  availableSeats: number;
  dimension?: string;
  language?: string;
  createdAt?: string;
  updatedAt?: string;
}

const emptyForm: ShowForm = {
  movieId: "",
  theatreId: "",
  screenId: "",
  availableSeats: "",
  dimension: "",
  language: "",
};

const LIMIT = 10;

export default function AddShowPage() {
  const [form, setForm] = useState<ShowForm>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [toast, setToast] = useState<string>("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLoadingId, setEditLoadingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ---- Dropdown source data ----
  const [movies, setMovies] = useState<Movie[]>([]);
  const [moviesLoading, setMoviesLoading] = useState<boolean>(true);
  const [moviesError, setMoviesError] = useState<string>("");

  const [theatreOptions, setTheatreOptions] = useState<TheatreOption[]>([]);
  const [theatresLoading, setTheatresLoading] = useState<boolean>(true);
  const [theatresError, setTheatresError] = useState<string>("");

  const [screenOptions, setScreenOptions] = useState<ScreenOption[]>([]);
  const [screensLoading, setScreensLoading] = useState<boolean>(false);
  const [screensError, setScreensError] = useState<string>("");

  // ---- Seat-category pricing (loaded per selected screen) ----
  const [seatTypes, setSeatTypes] = useState<string[]>([]);
  const [seatTypesLoading, setSeatTypesLoading] = useState<boolean>(false);
  const [seatTypesError, setSeatTypesError] = useState<string>("");
  const [typePrices, setTypePrices] = useState<Record<string, string>>({});

  // ---- Multi-date / multi-time scheduling ----
  // The date/time pickers below are uncontrolled (read via refs on click)
  // rather than tied to React state — some browsers don't reliably reset a
  // controlled <input type="date"/"time"> after it's cleared programmatically,
  // which made it look like you could only ever add one date.
  const [dateSlots, setDateSlots] = useState<DateTimeSlot[]>([]);
  const dateInputRef = useRef<HTMLInputElement | null>(null);
  const timeInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // ---- Shows list state ----
  const [shows, setShows] = useState<Show[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string>("");

  // ---- Search + pagination state (mirrors the theatre list) ----
  const [searchInput, setSearchInput] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  const accessToken = useSelector((state: any) => state.auth.accessToken);

  // ---- Load movies once on mount ----
  useEffect(() => {
    (async () => {
      setMoviesLoading(true);
      setMoviesError("");
      try {
        const response = await apiFetch(`/api/movie/list`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Failed to load movies");
        setMovies(data.movies ?? []);
      } catch (error: any) {
        setMoviesError(error.message || "Failed to load movies");
      } finally {
        setMoviesLoading(false);
      }
    })();
  }, []);

  // ---- Load theatres once on mount (independent of movie selection) ----
  useEffect(() => {
    (async () => {
      setTheatresLoading(true);
      setTheatresError("");
      try {
        const response = await apiFetch(`/api/theatre/list`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Failed to load theatres");
        setTheatreOptions(data.data ?? []);
      } catch (error: any) {
        setTheatresError(error.message || "Failed to load theatres");
      } finally {
        setTheatresLoading(false);
      }
    })();
  }, []);

  // ---- Load screens whenever the selected theatre changes ----
  useEffect(() => {
    if (!form.theatreId) {
      setScreenOptions([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setScreensLoading(true);
      setScreensError("");
      try {
        const response = await apiFetch(`/api/theatre/screen/${form.theatreId}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Failed to load screens");
        if (!cancelled) setScreenOptions(data.data ?? []);
      } catch (error: any) {
        if (!cancelled) setScreensError(error.message || "Failed to load screens");
      } finally {
        if (!cancelled) setScreensLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [form.theatreId]);

  // ---- Load seat categories (DIAMOND / GOLD / PLATINUM / ...) whenever the
  // selected screen changes, so we can render one price input per category ----
  useEffect(() => {
    if (!form.screenId) {
      setSeatTypes([]);
      setTypePrices({});
      setForm((f) => ({ ...f, availableSeats: "" }));
      return;
    }
    let cancelled = false;
    (async () => {
      setSeatTypesLoading(true);
      setSeatTypesError("");
      try {
        const response = await apiFetch(`/api/theatre/get-distinct-type/${form.screenId}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Failed to load seat categories");
        const types: string[] = data.data?.seatTypes ?? [];
        const totalSeats: number | undefined = data.data?.totalSeats;
        if (!cancelled) {
          setSeatTypes(types);
          setTypePrices((prev) => {
            const next: Record<string, string> = {};
            types.forEach((t) => {
              next[t] = prev[t] ?? "";
            });
            return next;
          });
          // Available seats comes straight from the screen's capacity —
          // the field is read-only, so just populate it here.
          if (totalSeats != null) {
            setForm((f) => ({ ...f, availableSeats: String(totalSeats) }));
          }
        }
      } catch (error: any) {
        if (!cancelled) setSeatTypesError(error.message || "Failed to load seat categories");
      } finally {
        if (!cancelled) setSeatTypesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [form.screenId]);



  // Debounce the search box.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // ---- Fetch shows (server-side search + pagination), same abort-on-refetch
  // pattern as the theatre list so overlapping/stale requests can't race. ----
  const abortControllerRef = useRef<AbortController | null>(null);

  async function fetchShows(
    pageNum: number = 1,
    searchTerm: string = search,
    options: { silent?: boolean } = {}
  ) {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const silent = options.silent ?? false;
    if (silent) setRefreshing(true);
    else setLoading(true);
    setFetchError("");

    try {
      const params = new URLSearchParams({
        page: String(pageNum),
        limit: String(LIMIT),
      });
      if (searchTerm) params.set("search", searchTerm);

      const response = await apiFetch(`/api/show/list?${params.toString()}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to load shows");

      const payload = data.data ?? data;
      const list: Show[] = Array.isArray(payload)
        ? payload
        : payload.shows || payload.items || payload.results || [];

      const pagination = payload.pagination ?? payload;
      const pages: number =
        pagination.totalPages ?? Math.max(1, Math.ceil((pagination.total ?? list.length) / LIMIT));
      const count: number = pagination.total ?? list.length;

      setShows(list);
      setTotalPages(pages);
      setTotalCount(count);
      setPage(pageNum);
    } catch (error: any) {
      if (error?.name === "AbortError") return;
      if (!silent) setFetchError(error.message || "Failed to load shows");
    } finally {
      if (abortControllerRef.current === controller) {
        if (silent) setRefreshing(false);
        else setLoading(false);
      }
    }
  }

  useEffect(() => {
    fetchShows(1, search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  useEffect(() => {
    return () => abortControllerRef.current?.abort();
  }, []);

  function goToPage(next: number) {
    if (next < 1 || next > totalPages || next === page) return;
    fetchShows(next, search);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((f) => {
      // Selecting a different theatre invalidates whatever screen was picked.
      if (name === "theatreId" && value !== f.theatreId) {
        return { ...f, theatreId: value, screenId: "" };
      }
      return { ...f, [name]: value };
    });
    if (errors[name as keyof ShowForm]) {
      setErrors((er) => ({ ...er, [name]: "" }));
    }
  }

  function handleTypePriceChange(type: string, value: string) {
    setTypePrices((p) => ({ ...p, [type]: value }));
    if (errors.prices) setErrors((er) => ({ ...er, prices: "" }));
  }

  // ---- Date / time slot builder ----
  function addDate() {
    const value = dateInputRef.current?.value;
    if (!value) return;
    setDateSlots((slots) => {
      if (slots.some((s) => s.date === value)) return slots;
      return [...slots, { date: value, times: [] }].sort((a, b) => a.date.localeCompare(b.date));
    });
    if (dateInputRef.current) dateInputRef.current.value = "";
    if (errors.schedule) setErrors((er) => ({ ...er, schedule: "" }));
  }

  function removeDate(date: string) {
    setDateSlots((slots) => slots.filter((s) => s.date !== date));
    delete timeInputRefs.current[date];
  }

  function addTime(date: string) {
    const input = timeInputRefs.current[date];
    const time = input?.value?.trim();
    if (!time) return;
    setDateSlots((slots) =>
      slots.map((s) =>
        s.date === date && !s.times.includes(time)
          ? { ...s, times: [...s.times, time].sort() }
          : s
      )
    );
    if (input) input.value = "";
    if (errors.schedule) setErrors((er) => ({ ...er, schedule: "" }));
  }

  function removeTime(date: string, time: string) {
    setDateSlots((slots) =>
      slots.map((s) => (s.date === date ? { ...s, times: s.times.filter((t) => t !== time) } : s))
    );
  }

  function validate(): boolean {
    const er: FormErrors = {};
    if (!form.movieId) er.movieId = "Select a movie";
    if (!form.theatreId) er.theatreId = "Select a theatre";
    if (!form.screenId) er.screenId = "Select a screen";
    if (!form.dimension) er.dimension = "Select a dimension";
    if (!form.language.trim()) er.language = "Enter a language";
    if (!form.availableSeats.trim() || Number(form.availableSeats) <= 0)
      er.availableSeats = "Select a screen to load its seat capacity";

    if (form.screenId) {
      if (seatTypes.length === 0) {
        er.prices = "This screen has no seat categories to price";
      } else {
        const missing = seatTypes.some((t) => {
          const v = (typePrices[t] ?? "").trim();
          return !v || !/^\d+(\.\d{1,2})?$/.test(v) || Number(v) <= 0;
        });
        if (missing) er.prices = "Enter a valid price for every seat category";
      }
    }

    if (dateSlots.length === 0) er.schedule = "Add at least one date with a show time";
    else if (dateSlots.some((s) => s.times.length === 0))
      er.schedule = "Every date needs at least one show time";

    setErrors(er);
    return Object.keys(er).length === 0;
  }

  function showToast(message: string) {
    setToast(message);
    setTimeout(() => setToast(""), 2500);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validate()) return;

    const isEditing = Boolean(editingId);

    // NOTE: `prices` (per seat-category) and `schedule` (multiple dates,
    // each with multiple show times) are new shapes — make sure the
    // /api/show/add and /api/show/update endpoints are updated to accept
    // and persist them (e.g. by fanning out into one show doc per
    // date/time, or by storing the schedule directly on the show).
    const payload = {
      movieId: form.movieId,
      theatreId: form.theatreId,
      screenId: form.screenId,
      availableSeats: Number(form.availableSeats),
      dimension: form.dimension,
      language: form.language.trim(),
      prices: Object.fromEntries(
        Object.entries(typePrices).map(([type, val]) => [type, Number(val)])
      ),
      schedule: dateSlots.map((s) => ({ date: s.date, times: s.times })),
    };

    const url = isEditing ? `/api/show/update/${editingId}` : `/api/show/add`;

    setSubmitting(true);
    try {
      const response = await apiFetch(url, {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Something went wrong");

      const movieTitle = movies.find((m) => m._id === form.movieId)?.title ?? "Show";

      if (isEditing) {
        showToast(`"${movieTitle}" updated`);
        setEditingId(null);
        setForm(emptyForm);
        setDateSlots([]);
        setTypePrices({});
        fetchShows(page, search, { silent: true });
      } else {
        showToast(`"${movieTitle}" show added`);
        setForm(emptyForm);
        setDateSlots([]);
        setTypePrices({});
        fetchShows(1, search, { silent: true });
      }
    } catch (error: any) {
      alert(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  // Fetches the full show record (flat movieId/theatreId/screenId, prices
  // per seat category, and the full multi-date schedule) and populates the
  // form with it. We deliberately re-fetch rather than reuse the row from
  // the list, since /api/show/list only returns display-friendly names.
  async function handleEdit(showId: string) {
    setEditLoadingId(showId);
    try {
      const response = await apiFetch(`/api/show/getshow/${showId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to load show");

      const sh = data.data;

      setEditingId(sh._id);
      setForm({
        movieId: sh.movieId ?? "",
        theatreId: sh.theatreId ?? "",
        screenId: sh.screenId ?? "",
        availableSeats: String(sh.availableSeats ?? ""),
        dimension: sh.dimension ?? "",
        language: sh.language ?? "",
      });

      const prices: Record<string, number> = sh.prices ?? {};
      setTypePrices(
        Object.fromEntries(Object.entries(prices).map(([type, val]) => [type, String(val)]))
      );

      setDateSlots(sh.schedule ?? []);
      setErrors({});
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error: any) {
      alert(error.message || "Failed to load show");
    } finally {
      setEditLoadingId(null);
    }
  }

  function handleCancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
    setDateSlots([]);
    setTypePrices({});
    setErrors({});
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this show?")) return;

    setDeletingId(id);
    try {
      const response = await apiFetch(`/api/show/delete/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Failed to delete show");
      }
      if (editingId === id) handleCancelEdit();
      showToast("Show removed");

      const isLastItemOnPage = shows.length === 1 && page > 1;
      fetchShows(isLastItemOnPage ? page - 1 : page, search, { silent: true });
    } catch (error: any) {
      alert(error.message);
    } finally {
      setDeletingId(null);
    }
  }

  function formatDateTime(iso: string): string {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString(undefined, {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatDateLabel(dateStr: string): string {
    const d = new Date(`${dateStr}T00:00:00`);
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
  }

  const selectedMovieTitle = movies.find((m) => m._id === form.movieId)?.title;
  const selectedTheatreName = theatreOptions.find((t) => t._id === form.theatreId)?.name;
  const selectedScreenName = screenOptions.find((s) => s._id === form.screenId)?.name;
  const totalShowCount = dateSlots.reduce((n, s) => n + s.times.length, 0);

  return (
    <div style={styles.page}>
      <AdminNavbar />

      <main style={styles.main}>
        <div style={styles.titleRow}>
          <h1 style={styles.h1}>{editingId ? "Edit show" : "Add a show"}</h1>
          <p style={styles.sub}>
            {editingId
              ? "Update the show details below, then save your changes."
              : "Pick a movie, theatre and screen, price each seat category, then add show dates and times."}
          </p>
        </div>

        <div style={styles.grid}>
          {/* Form card */}
          <form style={styles.card} onSubmit={handleSubmit} noValidate>
            <div style={styles.row2}>
              <SelectField
                label="Movie"
                name="movieId"
                value={form.movieId}
                onChange={handleChange}
                error={errors.movieId}
                disabled={moviesLoading}
                placeholder={moviesLoading ? "Loading movies…" : "Select a movie"}
                options={movies.map((m) => ({ value: m._id, label: m.title }))}
              />
              <SelectField
                label="Theatre"
                name="theatreId"
                value={form.theatreId}
                onChange={handleChange}
                error={errors.theatreId}
                disabled={theatresLoading}
                placeholder={theatresLoading ? "Loading theatres…" : "Select a theatre"}
                options={theatreOptions.map((t) => ({ value: t._id, label: t.name }))}
              />
            </div>
            {moviesError && <p style={styles.errorText}>{moviesError}</p>}
            {theatresError && <p style={styles.errorText}>{theatresError}</p>}

            <SelectField
              label="Screen"
              name="screenId"
              value={form.screenId}
              onChange={handleChange}
              error={errors.screenId}
              disabled={!form.theatreId || screensLoading}
              placeholder={
                !form.theatreId
                  ? "Select a theatre first"
                  : screensLoading
                  ? "Loading screens…"
                  : screenOptions.length === 0
                  ? "This theatre has no screens yet"
                  : "Select a screen"
              }
              options={screenOptions.map((s) => ({ value: s._id, label: s.name }))}
            />
            {screensError && <p style={styles.errorText}>{screensError}</p>}

            <div style={styles.row2}>
              <SelectField
                label="Dimension"
                name="dimension"
                value={form.dimension}
                onChange={handleChange}
                error={errors.dimension}
                placeholder="Select a dimension"
                options={DIMENSION_OPTIONS.map((d) => ({ value: d, label: d }))}
              />
              <div style={{ marginBottom: "1.25rem" }}>
                <label htmlFor="language" style={styles.label}>
                  Language
                </label>
                <input
                  id="language"
                  name="language"
                  type="text"
                  value={form.language}
                  onChange={handleChange}
                  placeholder="e.g. Hindi, English"
                  style={{
                    ...styles.input,
                    borderColor: errors.language ? "#D6294C" : "#DADADA",
                  }}
                />
                {errors.language && <p style={styles.errorText}>{errors.language}</p>}
              </div>
            </div>

            {/* Seat-category pricing, loaded from the selected screen */}
            <div style={{ marginBottom: "1.25rem" }}>
              <label style={styles.label}>Seat category pricing</label>
              {!form.screenId && <p style={styles.sub}>Select a screen to load its seat categories.</p>}
              {form.screenId && seatTypesLoading && <p style={styles.sub}>Loading seat categories…</p>}
              {seatTypesError && <p style={styles.errorText}>{seatTypesError}</p>}
              {form.screenId && !seatTypesLoading && !seatTypesError && seatTypes.length === 0 && (
                <p style={styles.sub}>No seat categories found for this screen.</p>
              )}
              {seatTypes.length > 0 && (
                <div style={styles.typePriceGrid}>
                  {seatTypes.map((type) => (
                    <div key={type}>
                      <label htmlFor={`price-${type}`} style={styles.typePriceLabel}>
                        {type}
                      </label>
                      <input
                        id={`price-${type}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={typePrices[type] ?? ""}
                        onChange={(e) => handleTypePriceChange(type, e.target.value)}
                        placeholder="₹ price"
                        style={styles.input}
                      />
                    </div>
                  ))}
                </div>
              )}
              {errors.prices && <p style={styles.errorText}>{errors.prices}</p>}
            </div>

            <div style={{ marginBottom: "1.25rem" }}>
              <label htmlFor="availableSeats" style={styles.label}>
                Available seats <span style={styles.readOnlyTag}>from screen capacity</span>
              </label>
              <input
                id="availableSeats"
                name="availableSeats"
                type="number"
                readOnly
                value={form.availableSeats}
                placeholder={form.screenId ? "Loading…" : "Select a screen"}
                style={{
                  ...styles.input,
                  ...styles.readOnlyInput,
                  borderColor: errors.availableSeats ? "#D6294C" : "#DADADA",
                }}
              />
              {errors.availableSeats && <p style={styles.errorText}>{errors.availableSeats}</p>}
            </div>

            {/* Multi-date, multi-time scheduler */}
            <div style={{ marginBottom: "1.25rem" }}>
              <label style={styles.label}>Show dates & times</label>

              <div style={styles.addDateRow}>
                <input type="date" ref={dateInputRef} style={styles.input} />
                <button type="button" onClick={addDate} style={styles.smallAddBtn}>
                  + Add date
                </button>
              </div>

              {dateSlots.length === 0 && <p style={styles.sub}>No dates added yet.</p>}

              <div style={styles.dateSlotList}>
                {dateSlots.map((slot) => (
                  <div key={slot.date} style={styles.dateSlotCard}>
                    <div style={styles.dateSlotHeader}>
                      <strong>{formatDateLabel(slot.date)}</strong>
                      <button
                        type="button"
                        onClick={() => removeDate(slot.date)}
                        style={styles.removeDateBtn}
                        title="Remove date"
                      >
                        ×
                      </button>
                    </div>

                    {slot.times.length > 0 && (
                      <div style={styles.timeChipRow}>
                        {slot.times.map((t) => (
                          <span key={t} style={styles.timeChip}>
                            {t}
                            <button
                              type="button"
                              onClick={() => removeTime(slot.date, t)}
                              style={styles.timeChipRemove}
                              title="Remove time"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    <div style={styles.addDateRow}>
                      <input
                        type="time"
                        ref={(el) => {
                          timeInputRefs.current[slot.date] = el;
                        }}
                        style={styles.input}
                      />
                      <button
                        type="button"
                        onClick={() => addTime(slot.date)}
                        style={styles.smallAddBtn}
                      >
                        + Add time
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {errors.schedule && <p style={styles.errorText}>{errors.schedule}</p>}
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="submit"
                style={{ ...styles.submitBtn, opacity: submitting ? 0.7 : 1 }}
                disabled={submitting}
              >
                {submitting
                  ? editingId
                    ? "Saving..."
                    : "Adding..."
                  : editingId
                  ? "Save changes"
                  : "Add show"}
              </button>
              {editingId && (
                <button type="button" style={styles.cancelBtn} onClick={handleCancelEdit}>
                  Cancel
                </button>
              )}
            </div>

            {toast && <div style={styles.toast}>{toast}</div>}
          </form>

          {/* Live preview card */}
          <div style={styles.previewWrap}>
            <p style={styles.previewLabel}>Preview</p>
            <div style={styles.previewCard}>
              <p style={styles.previewName}>{selectedMovieTitle || "Movie"}</p>
              <p style={styles.previewMeta}>
                {[selectedTheatreName, selectedScreenName].filter(Boolean).join(" · ") ||
                  "Theatre · Screen"}
              </p>
              <p style={styles.previewMeta}>
                {[form.dimension, form.language].filter(Boolean).join(" · ") ||
                  "Dimension · Language"}
              </p>
              <p style={styles.previewMeta}>
                {seatTypes.length > 0
                  ? seatTypes
                      .map((t) => `${t}: ${typePrices[t] ? `₹${typePrices[t]}` : "—"}`)
                      .join(" · ")
                  : "Prices"}
              </p>
              <p style={styles.previewMeta}>
                {form.availableSeats ? `${form.availableSeats} seats` : "Available seats"}
              </p>
              <p style={styles.previewMeta}>
                {dateSlots.length > 0
                  ? `${dateSlots.length} date${dateSlots.length > 1 ? "s" : ""} · ${totalShowCount} show${
                      totalShowCount === 1 ? "" : "s"
                    }`
                  : "Dates & times"}
              </p>
            </div>
          </div>
        </div>

        {/* All shows from the API */}
        <section style={{ marginTop: "3rem" }}>
          <div style={styles.listHeaderRow}>
            <h2 style={styles.h2}>
              All shows{" "}
              {!loading && <span style={styles.count}>{totalCount}</span>}
              {refreshing && <span style={styles.refreshingTag}>syncing…</span>}
            </h2>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by movie, theatre, screen…"
              style={styles.searchInput}
            />
          </div>

          {loading && <p style={styles.sub}>Loading shows…</p>}

          {!loading && fetchError && (
            <div style={styles.fetchErrorBox}>
              <span>{fetchError}</span>
              <button type="button" onClick={() => fetchShows(page, search)} style={styles.retryBtn}>
                Retry
              </button>
            </div>
          )}

          {!loading && !fetchError && shows.length === 0 && (
            <p style={styles.sub}>
              {search ? `No shows match "${search}".` : "No shows yet. Add one above."}
            </p>
          )}

          {!loading && !fetchError && shows.length > 0 && (
            <>
              <div style={styles.showList}>
                {shows.map((sh) => (
                  <div key={sh._id} style={styles.showCard}>
                    <div style={styles.showCardRow}>
                      <div style={styles.showInfo}>
                        <p style={styles.previewName}>{sh.movie?.title}</p>
                        <p style={styles.previewMeta}>
                          {[sh.theatre?.name, sh.screen?.name].filter(Boolean).join(" · ")}
                        </p>
                        {(sh.dimension || sh.language) && (
                          <p style={styles.previewMeta}>
                            {[sh.dimension, sh.language].filter(Boolean).join(" · ")}
                          </p>
                        )}
                        <p style={styles.previewMeta}>
                          {sh.schedule && sh.schedule.length > 0
                            ? sh.schedule
                                .map((s) => `${formatDateLabel(s.date)} (${s.times.join(", ")})`)
                                .join(" · ")
                            : `${formatDateTime(sh.startTime)} → ${formatDateTime(sh.endTime)}`}
                        </p>
                        <p style={styles.previewMeta}>
                          {sh.prices && Object.keys(sh.prices).length > 0
                            ? Object.entries(sh.prices)
                                .map(([type, price]) => `${type}: ₹${price}`)
                                .join(" · ")
                            : `₹${sh.price}`}
                          {" · "}
                          {sh.availableSeats} seats available
                        </p>
                      </div>
                      <div style={styles.showActions}>
                        <button
                          onClick={() => handleEdit(sh._id)}
                          style={styles.editBtn}
                          title="Edit"
                          type="button"
                          disabled={editLoadingId === sh._id}
                        >
                          {editLoadingId === sh._id ? "…" : "✎"}
                        </button>
                        <button
                          onClick={() => handleDelete(sh._id)}
                          style={styles.deleteBtn}
                          title="Remove"
                          type="button"
                          disabled={deletingId === sh._id}
                        >
                          {deletingId === sh._id ? "…" : "×"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div style={styles.pagination}>
                  <button
                    type="button"
                    onClick={() => goToPage(page - 1)}
                    disabled={page <= 1}
                    style={{
                      ...styles.pageBtn,
                      opacity: page <= 1 ? 0.4 : 1,
                      cursor: page <= 1 ? "default" : "pointer",
                    }}
                  >
                    ← Prev
                  </button>

                  <span style={styles.pageInfo}>
                    Page {page} of {totalPages}
                  </span>

                  <button
                    type="button"
                    onClick={() => goToPage(page + 1)}
                    disabled={page >= totalPages}
                    style={{
                      ...styles.pageBtn,
                      opacity: page >= totalPages ? 0.4 : 1,
                      cursor: page >= totalPages ? "default" : "pointer",
                    }}
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}

interface SelectFieldProps {
  label: string;
  name: keyof ShowForm;
  value: string;
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
  error?: string;
  disabled?: boolean;
  placeholder: string;
  options: { value: string; label: string }[];
}

function SelectField({
  label,
  name,
  value,
  onChange,
  error,
  disabled,
  placeholder,
  options,
}: SelectFieldProps) {
  return (
    <div style={{ marginBottom: "1.25rem" }}>
      <label htmlFor={name} style={styles.label}>
        {label}
      </label>
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        style={{
          ...styles.input,
          borderColor: error ? "#D6294C" : "#DADADA",
          opacity: disabled ? 0.6 : 1,
          cursor: disabled ? "not-allowed" : "pointer",
        }}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p style={styles.errorText}>{error}</p>}
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    fontFamily: "'Helvetica Neue', Arial, -apple-system, BlinkMacSystemFont, sans-serif",
    background: "#F5F5F7",
    minHeight: "100vh",
    color: "#1A1A1A",
  },
  main: { maxWidth: "980px", margin: "0 auto", padding: "40px 32px 80px" },
  titleRow: { marginBottom: "28px" },
  h1: { fontSize: "26px", fontWeight: 700, margin: 0 },
  sub: { color: "#6B6B6B", fontSize: "14px", marginTop: "6px" },
  h2: {
    fontSize: "18px",
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  count: {
    fontSize: "12px",
    fontWeight: 600,
    color: ACCENT,
    background: "#FDE7EB",
    borderRadius: "10px",
    padding: "2px 9px",
  },
  refreshingTag: {
    fontSize: "11px",
    fontWeight: 600,
    color: "#8A8A8A",
    marginLeft: "6px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1.3fr 0.7fr",
    gap: "24px",
    alignItems: "start",
  },
  card: {
    background: "#fff",
    borderRadius: "10px",
    border: "1px solid #EAEAEA",
    padding: "28px",
  },
  row2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
  },
  label: {
    display: "block",
    fontSize: "13px",
    fontWeight: 600,
    marginBottom: "6px",
    color: "#3A3A3A",
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "11px 12px",
    fontSize: "14px",
    borderRadius: "6px",
    border: "1px solid #DADADA",
    outline: "none",
    fontFamily: "inherit",
    background: "#fff",
  },
  errorText: {
    color: "#D6294C",
    fontSize: "12px",
    marginTop: "5px",
    marginBottom: 0,
  },
  submitBtn: {
    flex: 1,
    padding: "12px",
    background: ACCENT,
    color: "#fff",
    fontWeight: 700,
    fontSize: "15px",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  cancelBtn: {
    padding: "12px 18px",
    background: "#fff",
    color: "#3A3A3A",
    fontWeight: 700,
    fontSize: "15px",
    border: "1px solid #DADADA",
    borderRadius: "6px",
    cursor: "pointer",
  },
  toast: {
    marginTop: "14px",
    background: "#EAF7EE",
    color: "#1D7A3C",
    fontSize: "13px",
    fontWeight: 600,
    padding: "9px 12px",
    borderRadius: "6px",
    textAlign: "center",
  },
  fetchErrorBox: {
    marginTop: "12px",
    background: "#FDECEE",
    color: "#B0203A",
    fontSize: "13px",
    fontWeight: 600,
    padding: "10px 14px",
    borderRadius: "6px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
  },
  retryBtn: {
    background: "transparent",
    border: "1px solid #B0203A",
    color: "#B0203A",
    borderRadius: "5px",
    padding: "4px 10px",
    fontSize: "12px",
    fontWeight: 700,
    cursor: "pointer",
  },
  previewWrap: { position: "sticky", top: "20px" },
  previewLabel: {
    fontSize: "12px",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    color: "#8A8A8A",
    marginBottom: "10px",
  },
  previewCard: {
    background: "#fff",
    borderRadius: "10px",
    border: "1px solid #EAEAEA",
    padding: "18px 16px",
  },
  previewName: {
    fontSize: "15px",
    fontWeight: 700,
    margin: 0,
  },
  previewMeta: {
    fontSize: "12px",
    color: "#8A8A8A",
    margin: "5px 0 0",
  },
  readOnlyTag: {
    fontSize: "11px",
    fontWeight: 600,
    color: "#8A8A8A",
    textTransform: "none",
    marginLeft: "6px",
  },
  readOnlyInput: {
    background: "#F5F5F5",
    color: "#6B6B6B",
    cursor: "not-allowed",
  },
  typePriceGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
    gap: "12px",
  },
  typePriceLabel: {
    display: "block",
    fontSize: "12px",
    fontWeight: 700,
    marginBottom: "6px",
    color: "#3A3A3A",
    letterSpacing: "0.03em",
  },
  addDateRow: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
    marginTop: "8px",
  },
  smallAddBtn: {
    padding: "9px 14px",
    background: "#fff",
    border: `1px solid ${ACCENT}`,
    color: ACCENT,
    fontWeight: 700,
    fontSize: "13px",
    borderRadius: "6px",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  dateSlotList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginTop: "12px",
  },
  dateSlotCard: {
    border: "1px solid #EAEAEA",
    borderRadius: "8px",
    padding: "12px 14px",
    background: "#FAFAFA",
  },
  dateSlotHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    fontSize: "14px",
  },
  removeDateBtn: {
    width: "22px",
    height: "22px",
    borderRadius: "50%",
    border: "none",
    background: "rgba(0,0,0,0.5)",
    color: "#fff",
    fontSize: "13px",
    lineHeight: "22px",
    cursor: "pointer",
  },
  timeChipRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    margin: "10px 0",
  },
  timeChip: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    background: "#FDE7EB",
    color: ACCENT,
    fontSize: "12px",
    fontWeight: 700,
    padding: "5px 8px",
    borderRadius: "14px",
  },
  timeChipRemove: {
    border: "none",
    background: "transparent",
    color: ACCENT,
    fontWeight: 700,
    cursor: "pointer",
    fontSize: "13px",
    lineHeight: 1,
    padding: 0,
  },
  showList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginTop: "16px",
  },
  showCard: {
    background: "#fff",
    borderRadius: "10px",
    border: "1px solid #EAEAEA",
    padding: "16px 18px",
  },
  showCardRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
  },
  showInfo: { flex: 1, minWidth: 0 },
  showActions: { display: "flex", gap: "8px", flexShrink: 0, alignItems: "center" },
  listHeaderRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
    flexWrap: "wrap",
  },
  searchInput: {
    width: "260px",
    maxWidth: "100%",
    boxSizing: "border-box",
    padding: "9px 12px",
    fontSize: "13px",
    borderRadius: "6px",
    border: "1px solid #DADADA",
    outline: "none",
    fontFamily: "inherit",
    background: "#fff",
  },
  pagination: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "18px",
    marginTop: "28px",
  },
  pageBtn: {
    padding: "8px 16px",
    background: "#fff",
    border: "1px solid #DADADA",
    borderRadius: "6px",
    fontSize: "13px",
    fontWeight: 600,
    color: "#3A3A3A",
  },
  pageInfo: {
    fontSize: "13px",
    fontWeight: 600,
    color: "#6B6B6B",
  },
  editBtn: {
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    border: "none",
    background: "rgba(0,0,0,0.6)",
    color: "#fff",
    fontSize: "13px",
    lineHeight: "28px",
    cursor: "pointer",
  },
  deleteBtn: {
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    border: "none",
    background: "rgba(0,0,0,0.6)",
    color: "#fff",
    fontSize: "17px",
    lineHeight: "28px",
    cursor: "pointer",
  },
};