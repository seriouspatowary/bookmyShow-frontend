"use client"

import React, { useState, useEffect, ChangeEvent, FormEvent, CSSProperties } from "react";
import { useSelector } from "react-redux";

// BookMyShow brand accent
const ACCENT = "#F84464";

const DIMENSION_OPTIONS = ["2D", "3D", "IMAX 2D", "IMAX 3D", "4DX"];

interface MovieForm {
  title: string;
  genre: string;
  image: string;
  description: string;
  duration: string; // kept as string for the input, converted to Number on submit
  language: string;
  dimension: string;
  releaseDate: string; // yyyy-mm-dd, matches <input type="date">
}

// Shape sent to / received from the API. Distinct from MovieForm because
// duration is a real number here, not a controlled-input string.
interface MoviePayload {
  title: string;
  genre: string;
  image: string;
  description: string;
  duration: number;
  language: string;
  dimension: string;
  releaseDate: string;
}

interface Movie extends MoviePayload {
  _id: string;
}

type FormErrors = Partial<Record<keyof MovieForm, string>>;

const emptyForm: MovieForm = {
  title: "",
  genre: "",
  image: "",
  description: "",
  duration: "",
  language: "",
  dimension: DIMENSION_OPTIONS[0],
  releaseDate: "",
};

const LIMIT = 10;

export default function AddMoviePage() {
  const [form, setForm] = useState<MovieForm>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [movies, setMovies] = useState<Movie[]>([]);
  const [toast, setToast] = useState<string>("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ---- Pagination state ----
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  const accessToken = useSelector(
    (state: any) => state.auth.accessToken
  );

  // ---- Fetch movies (paginated, requires admin token) ----
  async function fetchMovies(pageNum: number = page) {
    setLoading(true);
    setFetchError("");
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API}/api/movie/admin?page=${pageNum}&limit=${LIMIT}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          credentials: "include",
        }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load movies");
      }

      // API returns { success: true, data: <paginated payload> }
      // Handle a few reasonable shapes for the paginated payload so the
      // frontend keeps working regardless of exact backend key names.
      const payload = data.data ?? data;

      const list: Movie[] = Array.isArray(payload)
        ? payload
        : payload.movies || payload.items || payload.results || [];

      const count: number =
        payload.total ?? payload.totalCount ?? payload.count ?? list.length;

      const pages: number =
        payload.totalPages ??
        payload.total_pages ??
        Math.max(1, Math.ceil(count / LIMIT));

      setMovies(list);
      setTotalCount(count);
      setTotalPages(pages);
      setPage(pageNum);
    } catch (error: any) {
      setFetchError(error.message || "Failed to load movies");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMovies(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function goToPage(next: number) {
    if (next < 1 || next > totalPages || next === page) return;
    fetchMovies(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleChange(
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name as keyof MovieForm]) {
      setErrors((er) => ({ ...er, [name]: "" }));
    }
  }

  function validate(): boolean {
    const er: FormErrors = {};
    if (!form.title.trim()) er.title = "Title is required";
    if (!form.genre.trim()) er.genre = "Genre is required";
    if (!form.image.trim()) er.image = "Image URL is required";
    else if (!/^https?:\/\/.+/i.test(form.image.trim()))
      er.image = "Enter a valid image URL";
    if (!form.description.trim()) er.description = "Description is required";
    if (!form.duration.trim()) er.duration = "Duration is required";
    else if (!/^\d+$/.test(form.duration.trim()) || Number(form.duration) <= 0)
      er.duration = "Enter duration in minutes (whole number)";
    if (!form.language.trim()) er.language = "Language is required";
    if (!form.dimension.trim()) er.dimension = "Dimension is required";
    if (!form.releaseDate.trim()) er.releaseDate = "Release date is required";
    setErrors(er);
    return Object.keys(er).length === 0;
  }

  function showToast(message: string) {
    setToast(message);
    setTimeout(() => setToast(""), 2500);
  }

  // ---- Add or update movie ----
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      title: form.title.trim(),
      genre: form.genre.trim(),
      image: form.image.trim(),
      description: form.description.trim(),
      duration: Number(form.duration),
      language: form.language.trim(),
      dimension: form.dimension.trim(),
      releaseDate: form.releaseDate, // yyyy-mm-dd, backend can parse to date
    };

    const isEditing = Boolean(editingId);
    const url = isEditing
      ? `${process.env.NEXT_PUBLIC_API}/api/movie/update/${editingId}`
      : `${process.env.NEXT_PUBLIC_API}/api/movie/add`;

    setSubmitting(true);
    try {
      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Something went wrong");
      }

      if (isEditing) {
        setMovies((m) =>
          m.map((mv) =>
            mv._id === editingId ? { ...mv, ...payload } : mv
          )
        );
        showToast(`"${payload.title}" updated`);
        setEditingId(null);
        setForm(emptyForm);
      } else {
        // A new movie may land on a different page depending on sort order,
        // so just refetch the current page from the server to stay in sync.
        showToast(`"${payload.title}" added`);
        setForm(emptyForm);
        fetchMovies(page);
      }

      console.log(data);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  // ---- Start editing a movie: populate the form ----
  function handleEdit(movie: Movie) {
    setEditingId(movie._id);
    setForm({
      title: movie.title,
      genre: movie.genre,
      image: movie.image,
      description: movie.description || "",
      duration: movie.duration != null ? String(movie.duration) : "",
      language: movie.language || "",
      dimension: movie.dimension || DIMENSION_OPTIONS[0],
      releaseDate: toDateInputValue(movie.releaseDate),
    });
    setErrors({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleCancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
    setErrors({});
  }

  // ---- Delete movie ----
  async function handleDelete(id: string) {
    if (!confirm("Remove this movie?")) return;

    setDeletingId(id);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API}/api/movie/delete/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          credentials: "include",
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Failed to delete movie");
      }

      if (editingId === id) handleCancelEdit();
      showToast("Movie removed");

      // If this was the last item on the page (and not page 1), step back a page.
      const isLastItemOnPage = movies.length === 1 && page > 1;
      fetchMovies(isLastItemOnPage ? page - 1 : page);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div style={styles.page}>
      {/* Top bar */}
      <header style={styles.header}>
        <div style={styles.logo}>
          book<span style={{ color: ACCENT }}>my</span>show
          <span style={styles.adminTag}>admin</span>
        </div>
        <nav style={styles.nav}>
          <a href="#" style={{ ...styles.navLink, ...styles.navLinkActive }}>
            Movies
          </a>
          <a href="/admin/movies" style={styles.navLink}>
            Add Cast Members
          </a>
        </nav>
      </header>

      <main style={styles.main}>
        <div style={styles.titleRow}>
          <h1 style={styles.h1}>{editingId ? "Edit movie" : "Add a movie"}</h1>
          <p style={styles.sub}>
            {editingId
              ? "Update the details below and save your changes."
              : "Fill in the details below to list a new movie on BookMyShow."}
          </p>
        </div>

        <div style={styles.grid}>
          {/* Form card */}
          <form style={styles.card} onSubmit={handleSubmit} noValidate>
            <Field
              label="Title"
              name="title"
              placeholder="e.g. East of Wall"
              value={form.title}
              onChange={handleChange}
              error={errors.title}
            />
            <Field
              label="Genre"
              name="genre"
              placeholder="e.g. Drama, Action, Comedy"
              value={form.genre}
              onChange={handleChange}
              error={errors.genre}
            />
            <Field
              label="Poster image URL"
              name="image"
              placeholder="https://example.com/poster.jpg"
              value={form.image}
              onChange={handleChange}
              error={errors.image}
            />

            <div style={{ marginBottom: "1.25rem" }}>
              <label htmlFor="description" style={styles.label}>
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Short synopsis of the movie"
                rows={4}
                style={{
                  ...styles.input,
                  ...styles.textarea,
                  borderColor: errors.description ? "#D6294C" : "#DADADA",
                }}
              />
              {errors.description && (
                <p style={styles.errorText}>{errors.description}</p>
              )}
            </div>

            <div style={styles.row2}>
              <Field
                label="Duration (minutes)"
                name="duration"
                placeholder="e.g. 169"
                value={form.duration}
                onChange={handleChange}
                error={errors.duration}
                type="number"
              />
              <Field
                label="Language"
                name="language"
                placeholder="e.g. English, Hindi"
                value={form.language}
                onChange={handleChange}
                error={errors.language}
              />
            </div>

            <div style={styles.row2}>
              <div style={{ marginBottom: "1.25rem" }}>
                <label htmlFor="dimension" style={styles.label}>
                  Dimension
                </label>
                <select
                  id="dimension"
                  name="dimension"
                  value={form.dimension}
                  onChange={handleChange}
                  style={{
                    ...styles.input,
                    borderColor: errors.dimension ? "#D6294C" : "#DADADA",
                  }}
                >
                  {DIMENSION_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                {errors.dimension && (
                  <p style={styles.errorText}>{errors.dimension}</p>
                )}
              </div>
              <Field
                label="Release date"
                name="releaseDate"
                placeholder=""
                value={form.releaseDate}
                onChange={handleChange}
                error={errors.releaseDate}
                type="date"
              />
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="submit"
                style={{
                  ...styles.submitBtn,
                  opacity: submitting ? 0.7 : 1,
                }}
                disabled={submitting}
              >
                {submitting
                  ? editingId
                    ? "Saving..."
                    : "Adding..."
                  : editingId
                  ? "Save changes"
                  : "Add movie"}
              </button>
              {editingId && (
                <button
                  type="button"
                  style={styles.cancelBtn}
                  onClick={handleCancelEdit}
                >
                  Cancel
                </button>
              )}
            </div>

            {toast && <div style={styles.toast}>{toast}</div>}
          </form>

          {/* Live preview card */}
          <div style={styles.previewWrap}>
            <p style={styles.previewLabel}>Preview</p>
            <div style={styles.posterCard}>
              <div style={styles.posterImgWrap}>
                {form.image ? (
                  <img
                    src={form.image}
                    alt={form.title || "Movie poster"}
                    style={styles.posterImg}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div style={styles.posterPlaceholder}>No image yet</div>
                )}
              </div>
              <div style={styles.posterInfo}>
                <p style={styles.posterTitle}>
                  {form.title || "Movie title"}
                </p>
                <p style={styles.posterGenre}>{form.genre || "Genre"}</p>
                <p style={styles.posterMeta}>
                  {[form.language, form.dimension, form.duration && `${form.duration} min`]
                    .filter(Boolean)
                    .join(" · ") || "Language · Dimension · Duration"}
                </p>
                {form.releaseDate && (
                  <p style={styles.posterMeta}>Releases {form.releaseDate}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* All movies from the API */}
        <section style={{ marginTop: "3rem" }}>
          <h2 style={styles.h2}>
            All movies{" "}
            {!loading && <span style={styles.count}>{totalCount}</span>}
          </h2>

          {loading && <p style={styles.sub}>Loading movies…</p>}

          {!loading && fetchError && (
            <div style={styles.fetchErrorBox}>
              <span>{fetchError}</span>
              <button
                type="button"
                onClick={() => fetchMovies(page)}
                style={styles.retryBtn}
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !fetchError && movies.length === 0 && (
            <p style={styles.sub}>No movies yet. Add one above.</p>
          )}

          {!loading && !fetchError && movies.length > 0 && (
            <>
              <div style={styles.movieGrid}>
                {movies.map((mv) => (
                  <div key={mv._id} style={styles.movieCard}>
                    <div style={styles.movieImgWrap}>
                      <img
                        src={mv.image}
                        alt={mv.title}
                        style={styles.posterImg}
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                      <div style={styles.cardActions}>
                        <button
                          onClick={() => handleEdit(mv)}
                          style={styles.editBtn}
                          title="Edit"
                          type="button"
                        >
                          ✎
                        </button>
                        <button
                          onClick={() => handleDelete(mv._id)}
                          style={styles.deleteBtn}
                          title="Remove"
                          type="button"
                          disabled={deletingId === mv._id}
                        >
                          {deletingId === mv._id ? "…" : "×"}
                        </button>
                      </div>
                    </div>
                    <p style={styles.posterTitle}>{mv.title}</p>
                    <p style={styles.posterGenre}>{mv.genre}</p>
                    <p style={styles.posterMeta}>
                      {[mv.language, mv.dimension, mv.duration && `${mv.duration} min`]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                ))}
              </div>

              {/* Pagination controls */}
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

// Normalizes a variety of date formats (ISO string, Date, etc.) into
// yyyy-mm-dd for the <input type="date"> element.
function toDateInputValue(value: unknown): string {
  if (!value) return "";
  const d = new Date(value as any);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

interface FieldProps {
  label: string;
  name: keyof MovieForm;
  placeholder: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  type?: string;
}

function Field({
  label,
  name,
  placeholder,
  value,
  onChange,
  error,
  type = "text",
}: FieldProps) {
  return (
    <div style={{ marginBottom: "1.25rem" }}>
      <label htmlFor={name} style={styles.label}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{
          ...styles.input,
          borderColor: error ? "#D6294C" : "#DADADA",
        }}
      />
      {error && <p style={styles.errorText}>{error}</p>}
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    fontFamily:
      "'Helvetica Neue', Arial, -apple-system, BlinkMacSystemFont, sans-serif",
    background: "#F5F5F7",
    minHeight: "100vh",
    color: "#1A1A1A",
  },
  header: {
    background: "#fff",
    borderBottom: "1px solid #EAEAEA",
    padding: "14px 32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logo: {
    fontSize: "22px",
    fontWeight: 700,
    color: "#1A1A1A",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  adminTag: {
    fontSize: "11px",
    fontWeight: 600,
    color: "#8A8A8A",
    border: "1px solid #DADADA",
    borderRadius: "4px",
    padding: "2px 8px",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  nav: { display: "flex", gap: "24px" },
  navLink: {
    textDecoration: "none",
    color: "#6B6B6B",
    fontSize: "14px",
    fontWeight: 500,
    paddingBottom: "4px",
  },
  navLinkActive: {
    color: ACCENT,
    borderBottom: `2px solid ${ACCENT}`,
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
  textarea: {
    resize: "vertical",
    minHeight: "90px",
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
    marginTop: "4px",
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
    marginTop: "4px",
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
  posterCard: {
    background: "#fff",
    borderRadius: "10px",
    border: "1px solid #EAEAEA",
    overflow: "hidden",
  },
  posterImgWrap: {
    aspectRatio: "2 / 3",
    background: "#EFEFEF",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  posterImg: { width: "100%", height: "100%", objectFit: "cover" },
  posterPlaceholder: { color: "#B0B0B0", fontSize: "13px" },
  posterInfo: { padding: "12px 14px" },
  posterTitle: {
    fontSize: "14px",
    fontWeight: 700,
    margin: 0,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  posterGenre: {
    fontSize: "12px",
    color: "#8A8A8A",
    margin: "3px 0 0",
  },
  posterMeta: {
    fontSize: "11px",
    color: "#A0A0A0",
    margin: "3px 0 0",
  },
  movieGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
    gap: "18px",
    marginTop: "16px",
  },
  movieCard: { position: "relative" },
  movieImgWrap: {
    position: "relative",
    aspectRatio: "2 / 3",
    background: "#EFEFEF",
    borderRadius: "8px",
    overflow: "hidden",
    marginBottom: "8px",
  },
  cardActions: {
    position: "absolute",
    top: "6px",
    right: "6px",
    display: "flex",
    gap: "6px",
  },
  editBtn: {
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    border: "none",
    background: "rgba(0,0,0,0.6)",
    color: "#fff",
    fontSize: "12px",
    lineHeight: "24px",
    cursor: "pointer",
  },
  deleteBtn: {
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    border: "none",
    background: "rgba(0,0,0,0.6)",
    color: "#fff",
    fontSize: "16px",
    lineHeight: "24px",
    cursor: "pointer",
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
};