"use client";

import React, { useState, useEffect, ChangeEvent, FormEvent, CSSProperties } from "react";
import { useSelector } from "react-redux";

// BookMyShow brand accent
const ACCENT = "#F84464";

const ROLE_SUGGESTIONS = [
  "Director",
  "Producer",
  "Writer",
  "Music Director",
  "Cinematographer",
  "Editor",
  "Executive Producer",
  "Costume Designer",
];

// ---- Types ----
interface MovieOption {
  _id: string;
  title: string;
}

interface CastMember {
  _id: string;
  movieId: string;
  name: string;
  character: string;
  image: string;
}

interface CrewMember {
  _id: string;
  movieId: string;
  name: string;
  role: string;
  image: string;
}

interface CastForm {
  name: string;
  character: string;
  image: string;
}

interface CrewForm {
  name: string;
  role: string;
  image: string;
}

type CastErrors = Partial<Record<keyof CastForm, string>>;
type CrewErrors = Partial<Record<keyof CrewForm, string>>;

const emptyCastForm: CastForm = { name: "", character: "", image: "" };
const emptyCrewForm: CrewForm = { name: "", role: "", image: "" };

export default function AdminMoviesPage() {
  const accessToken = useSelector((state: any) => state.auth.accessToken);

  // ---- Movie selector ----
  const [movies, setMovies] = useState<MovieOption[]>([]);
  const [loadingMovies, setLoadingMovies] = useState<boolean>(true);
  const [movieError, setMovieError] = useState<string>("");
  const [selectedMovieId, setSelectedMovieId] = useState<string>("");

  // ---- Cast state ----
  const [castForm, setCastForm] = useState<CastForm>(emptyCastForm);
  const [castErrors, setCastErrors] = useState<CastErrors>({});
  const [castList, setCastList] = useState<CastMember[]>([]);
  const [loadingCast, setLoadingCast] = useState<boolean>(false);
  const [castSubmitting, setCastSubmitting] = useState<boolean>(false);
  const [editingCastId, setEditingCastId] = useState<string | null>(null);
  const [deletingCastId, setDeletingCastId] = useState<string | null>(null);

  // ---- Crew state ----
  const [crewForm, setCrewForm] = useState<CrewForm>(emptyCrewForm);
  const [crewErrors, setCrewErrors] = useState<CrewErrors>({});
  const [crewList, setCrewList] = useState<CrewMember[]>([]);
  const [loadingCrew, setLoadingCrew] = useState<boolean>(false);
  const [crewSubmitting, setCrewSubmitting] = useState<boolean>(false);
  const [editingCrewId, setEditingCrewId] = useState<string | null>(null);
  const [deletingCrewId, setDeletingCrewId] = useState<string | null>(null);

  const [toast, setToast] = useState<string>("");

  // ---- Active tab: cast vs crew are managed as separate sections ----
  const [activeTab, setActiveTab] = useState<"cast" | "crew">("cast");

  function showToast(message: string) {
    setToast(message);
    setTimeout(() => setToast(""), 2500);
  }

  // ---- Fetch the movie list for the selector ----
  async function fetchMovies() {
    setLoadingMovies(true);
    setMovieError("");
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API}/api/movie/display`, {
        method: "GET",
        headers: { Authorization: `Bearer ${accessToken}` },
        credentials: "include",
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load movies");
      }
      setMovies(data.movies || []);
    } catch (error: any) {
      setMovieError(error.message || "Failed to load movies");
    } finally {
      setLoadingMovies(false);
    }
  }

  useEffect(() => {
    fetchMovies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Fetch cast + crew whenever the selected movie changes ----
  useEffect(() => {
    if (!selectedMovieId) {
      setCastList([]);
      setCrewList([]);
      return;
    }
    fetchCast(selectedMovieId);
    fetchCrew(selectedMovieId);
    // Reset in-progress edits when switching movies
    setEditingCastId(null);
    setCastForm(emptyCastForm);
    setCastErrors({});
    setEditingCrewId(null);
    setCrewForm(emptyCrewForm);
    setCrewErrors({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMovieId]);

async function fetchCast(movieId: string) {
  setLoadingCast(true);
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API}/api/movie/cast/${movieId}`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${accessToken}` },
        credentials: "include",
      }
    );
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to load cast");

    const payload = data.data ?? data;
    const raw = payload.cast ?? payload.castMembers ?? payload.items ?? payload;

    // API may return a single object OR an array — normalize to an array
    const list: CastMember[] = Array.isArray(raw) ? raw : raw ? [raw] : [];
    setCastList(list);
  } catch (error: any) {
    setCastList([]);
  } finally {
    setLoadingCast(false);
  }
}

async function fetchCrew(movieId: string) {
  setLoadingCrew(true);
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API}/api/movie/crew/${movieId}`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${accessToken}` },
        credentials: "include",
      }
    );
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to load crew");

    const payload = data.data ?? data;
    const raw = payload.crew ?? payload.crewMembers ?? payload.items ?? payload;

    const list: CrewMember[] = Array.isArray(raw) ? raw : raw ? [raw] : [];
    setCrewList(list);
  } catch (error: any) {
    setCrewList([]);
  } finally {
    setLoadingCrew(false);
  }
}
  // ---- Cast form handlers ----
  function handleCastChange(e: ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setCastForm((f) => ({ ...f, [name]: value }));
    if (castErrors[name as keyof CastForm]) {
      setCastErrors((er) => ({ ...er, [name]: "" }));
    }
  }

  function validateCast(): boolean {
    const er: CastErrors = {};
    if (!castForm.name.trim()) er.name = "Name is required";
    if (!castForm.character.trim()) er.character = "Character is required";
    if (!castForm.image.trim()) er.image = "Image URL is required";
    else if (!/^https?:\/\/.+/i.test(castForm.image.trim()))
      er.image = "Enter a valid image URL";
    setCastErrors(er);
    return Object.keys(er).length === 0;
  }

  async function handleCastSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedMovieId) return;
    if (!validateCast()) return;

    const payload = {
      movieId: selectedMovieId,
      name: castForm.name.trim(),
      character: castForm.character.trim(),
      image: castForm.image.trim(),
    };

    const isEditing = Boolean(editingCastId);
    const url = isEditing
      ? `${process.env.NEXT_PUBLIC_API}/api/movie/cast/update/${editingCastId}`
      : `${process.env.NEXT_PUBLIC_API}/api/movie/cast/add`;

    setCastSubmitting(true);
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
      if (!response.ok) throw new Error(data.message || "Something went wrong");

      showToast(isEditing ? `"${payload.name}" updated` : `"${payload.name}" added to cast`);
      setCastForm(emptyCastForm);
      setEditingCastId(null);
      fetchCast(selectedMovieId);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setCastSubmitting(false);
    }
  }

  function handleCastEdit(member: CastMember) {
    setEditingCastId(member._id);
    setCastForm({
      name: member.name,
      character: member.character,
      image: member.image,
    });
    setCastErrors({});
  }

  function handleCastCancelEdit() {
    setEditingCastId(null);
    setCastForm(emptyCastForm);
    setCastErrors({});
  }

  async function handleCastDelete(id: string) {
    if (!confirm("Remove this cast member?")) return;
    setDeletingCastId(id);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API}/api/movie/cast/delete/${id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${accessToken}` },
          credentials: "include",
        }
      );
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Failed to remove cast member");
      }
      if (editingCastId === id) handleCastCancelEdit();
      showToast("Cast member removed");
      fetchCast(selectedMovieId);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setDeletingCastId(null);
    }
  }

  // ---- Crew form handlers ----
  function handleCrewChange(e: ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setCrewForm((f) => ({ ...f, [name]: value }));
    if (crewErrors[name as keyof CrewForm]) {
      setCrewErrors((er) => ({ ...er, [name]: "" }));
    }
  }

  function validateCrew(): boolean {
    const er: CrewErrors = {};
    if (!crewForm.name.trim()) er.name = "Name is required";
    if (!crewForm.role.trim()) er.role = "Role is required";
    if (!crewForm.image.trim()) er.image = "Image URL is required";
    else if (!/^https?:\/\/.+/i.test(crewForm.image.trim()))
      er.image = "Enter a valid image URL";
    setCrewErrors(er);
    return Object.keys(er).length === 0;
  }

  async function handleCrewSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedMovieId) return;
    if (!validateCrew()) return;

    const payload = {
      movieId: selectedMovieId,
      name: crewForm.name.trim(),
      role: crewForm.role.trim(),
      image: crewForm.image.trim(),
    };

    const isEditing = Boolean(editingCrewId);
    const url = isEditing
      ? `${process.env.NEXT_PUBLIC_API}/api/movie/crew/update/${editingCrewId}`
      : `${process.env.NEXT_PUBLIC_API}/api/movie/crew/add`;

    setCrewSubmitting(true);
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
      if (!response.ok) throw new Error(data.message || "Something went wrong");

      showToast(isEditing ? `"${payload.name}" updated` : `"${payload.name}" added to crew`);
      setCrewForm(emptyCrewForm);
      setEditingCrewId(null);
      fetchCrew(selectedMovieId);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setCrewSubmitting(false);
    }
  }

  function handleCrewEdit(member: CrewMember) {
    setEditingCrewId(member._id);
    setCrewForm({
      name: member.name,
      role: member.role,
      image: member.image,
    });
    setCrewErrors({});
  }

  function handleCrewCancelEdit() {
    setEditingCrewId(null);
    setCrewForm(emptyCrewForm);
    setCrewErrors({});
  }

  async function handleCrewDelete(id: string) {
    if (!confirm("Remove this crew member?")) return;
    setDeletingCrewId(id);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API}/api/movie/crew/delete/${id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${accessToken}` },
          credentials: "include",
        }
      );
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Failed to remove crew member");
      }
      if (editingCrewId === id) handleCrewCancelEdit();
      showToast("Crew member removed");
      fetchCrew(selectedMovieId);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setDeletingCrewId(null);
    }
  }

  // Disambiguate movies that share a title by appending a short id suffix
  function movieLabel(movie: MovieOption): string {
    const duplicate = movies.filter((m) => m.title === movie.title).length > 1;
    return duplicate ? `${movie.title} (#${movie._id.slice(-5)})` : movie.title;
  }

  const selectedMovie = movies.find((m) => m._id === selectedMovieId);

  return (
    <div style={styles.page}>
      {/* Top bar */}
      <header style={styles.header}>
        <div style={styles.logo}>
          book<span style={{ color: ACCENT }}>my</span>show
          <span style={styles.adminTag}>admin</span>
        </div>
        <nav style={styles.nav}>
          <a href="/admin" style={styles.navLink}>
            Movies
          </a>
          <a href="#" style={{ ...styles.navLink, ...styles.navLinkActive }}>
            Cast &amp; Crew
          </a>
          <a href="#" style={styles.navLink}>
            Theatres
          </a>
        </nav>
      </header>

      <main style={styles.main}>
        <div style={styles.titleRow}>
          <h1 style={styles.h1}>Cast &amp; crew</h1>
          <p style={styles.sub}>
            Pick a movie, then add the people who worked on it.
          </p>
        </div>

        {/* Movie selector */}
        <div style={styles.selectorCard}>
          <label htmlFor="movie" style={styles.label}>
            Movie
          </label>
          {loadingMovies && <p style={styles.sub}>Loading movies…</p>}
          {!loadingMovies && movieError && (
            <div style={styles.fetchErrorBox}>
              <span>{movieError}</span>
              <button type="button" onClick={fetchMovies} style={styles.retryBtn}>
                Retry
              </button>
            </div>
          )}
          {!loadingMovies && !movieError && (
            <select
              id="movie"
              value={selectedMovieId}
              onChange={(e) => setSelectedMovieId(e.target.value)}
              style={styles.input}
            >
              <option value="">Select a movie…</option>
              {movies.map((m) => (
                <option key={m._id} value={m._id}>
                  {movieLabel(m)}
                </option>
              ))}
            </select>
          )}
        </div>

        {!selectedMovieId && !loadingMovies && !movieError && (
          <p style={{ ...styles.sub, marginTop: "20px" }}>
            Choose a movie above to manage its cast and crew.
          </p>
        )}

        {selectedMovieId && (
          <>
            {/* Tab switcher: Cast and Crew are managed as separate sections */}
            <div style={styles.tabRow}>
              <button
                type="button"
                onClick={() => setActiveTab("cast")}
                style={{
                  ...styles.tabBtn,
                  ...(activeTab === "cast" ? styles.tabBtnActive : {}),
                }}
              >
                Cast <span style={styles.tabCount}>{castList.length}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("crew")}
                style={{
                  ...styles.tabBtn,
                  ...(activeTab === "crew" ? styles.tabBtnActive : {}),
                }}
              >
                Crew <span style={styles.tabCount}>{crewList.length}</span>
              </button>
            </div>

            {/* ---- Cast ---- */}
            {activeTab === "cast" && (
            <section style={{ marginTop: "24px" }}>
              <h2 style={styles.h2}>
                Cast{" "}
                {!loadingCast && <span style={styles.count}>{castList.length}</span>}
              </h2>

              <div style={styles.grid}>
                <form style={styles.card} onSubmit={handleCastSubmit} noValidate>
                  <Field
                    label="Name"
                    name="name"
                    placeholder="e.g. Cillian Murphy"
                    value={castForm.name}
                    onChange={handleCastChange}
                    error={castErrors.name}
                  />
                  <Field
                    label="Character"
                    name="character"
                    placeholder="e.g. Odysseus"
                    value={castForm.character}
                    onChange={handleCastChange}
                    error={castErrors.character}
                  />
                  <Field
                    label="Photo URL"
                    name="image"
                    placeholder="https://example.com/photo.jpg"
                    value={castForm.image}
                    onChange={handleCastChange}
                    error={castErrors.image}
                  />
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button
                      type="submit"
                      style={{ ...styles.submitBtn, opacity: castSubmitting ? 0.7 : 1 }}
                      disabled={castSubmitting}
                    >
                      {castSubmitting
                        ? editingCastId
                          ? "Saving..."
                          : "Adding..."
                        : editingCastId
                        ? "Save changes"
                        : "Add cast member"}
                    </button>
                    {editingCastId && (
                      <button
                        type="button"
                        style={styles.cancelBtn}
                        onClick={handleCastCancelEdit}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>

                <div style={styles.previewWrap}>
                  <p style={styles.previewLabel}>Preview</p>
                  <PersonPreview
                    image={castForm.image}
                    name={castForm.name || "Actor name"}
                    subtitle={castForm.character || "Character"}
                  />
                  {selectedMovie && (
                    <p style={{ ...styles.sub, marginTop: "10px" }}>
                      For <strong>{selectedMovie.title}</strong>
                    </p>
                  )}
                </div>
              </div>

              {loadingCast && <p style={styles.sub}>Loading cast…</p>}
              {!loadingCast && castList.length === 0 && (
                <p style={styles.sub}>No cast members added yet.</p>
              )}
              {!loadingCast && castList.length > 0 && (
                <div style={styles.movieGrid}>
                  {castList.map((c) => (
                    <PersonCard
                      key={c._id}
                      image={c.image}
                      name={c.name}
                      subtitle={c.character}
                      onEdit={() => handleCastEdit(c)}
                      onDelete={() => handleCastDelete(c._id)}
                      deleting={deletingCastId === c._id}
                    />
                  ))}
                </div>
              )}
            </section>
            )}

            {/* ---- Crew ---- */}
            {activeTab === "crew" && (
            <section style={{ marginTop: "24px" }}>
              <h2 style={styles.h2}>
                Crew{" "}
                {!loadingCrew && <span style={styles.count}>{crewList.length}</span>}
              </h2>

              <div style={styles.grid}>
                <form style={styles.card} onSubmit={handleCrewSubmit} noValidate>
                  <Field
                    label="Name"
                    name="name"
                    placeholder="e.g. Christopher Nolan"
                    value={crewForm.name}
                    onChange={handleCrewChange}
                    error={crewErrors.name}
                  />
                  <div style={{ marginBottom: "1.25rem" }}>
                    <label htmlFor="role" style={styles.label}>
                      Role
                    </label>
                    <input
                      id="role"
                      name="role"
                      list="role-suggestions"
                      value={crewForm.role}
                      onChange={handleCrewChange}
                      placeholder="e.g. Director, Producer, Writer"
                      style={{
                        ...styles.input,
                        borderColor: crewErrors.role ? "#D6294C" : "#DADADA",
                      }}
                    />
                    <datalist id="role-suggestions">
                      {ROLE_SUGGESTIONS.map((r) => (
                        <option key={r} value={r} />
                      ))}
                    </datalist>
                    {crewErrors.role && <p style={styles.errorText}>{crewErrors.role}</p>}
                  </div>
                  <Field
                    label="Photo URL"
                    name="image"
                    placeholder="https://example.com/photo.jpg"
                    value={crewForm.image}
                    onChange={handleCrewChange}
                    error={crewErrors.image}
                  />
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button
                      type="submit"
                      style={{ ...styles.submitBtn, opacity: crewSubmitting ? 0.7 : 1 }}
                      disabled={crewSubmitting}
                    >
                      {crewSubmitting
                        ? editingCrewId
                          ? "Saving..."
                          : "Adding..."
                        : editingCrewId
                        ? "Save changes"
                        : "Add crew member"}
                    </button>
                    {editingCrewId && (
                      <button
                        type="button"
                        style={styles.cancelBtn}
                        onClick={handleCrewCancelEdit}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>

                <div style={styles.previewWrap}>
                  <p style={styles.previewLabel}>Preview</p>
                  <PersonPreview
                    image={crewForm.image}
                    name={crewForm.name || "Crew name"}
                    subtitle={crewForm.role || "Role"}
                  />
                  {selectedMovie && (
                    <p style={{ ...styles.sub, marginTop: "10px" }}>
                      For <strong>{selectedMovie.title}</strong>
                    </p>
                  )}
                </div>
              </div>

              {loadingCrew && <p style={styles.sub}>Loading crew…</p>}
              {!loadingCrew && crewList.length === 0 && (
                <p style={styles.sub}>No crew members added yet.</p>
              )}
              {!loadingCrew && crewList.length > 0 && (
                <div style={styles.movieGrid}>
                  {crewList.map((c) => (
                    <PersonCard
                      key={c._id}
                      image={c.image}
                      name={c.name}
                      subtitle={c.role}
                      onEdit={() => handleCrewEdit(c)}
                      onDelete={() => handleCrewDelete(c._id)}
                      deleting={deletingCrewId === c._id}
                    />
                  ))}
                </div>
              )}
            </section>
            )}
          </>
        )}

        {toast && <div style={styles.floatingToast}>{toast}</div>}
      </main>
    </div>
  );
}

// ---- Shared small components ----

interface FieldProps {
  label: string;
  name: string;
  placeholder: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  error?: string;
}

function Field({ label, name, placeholder, value, onChange, error }: FieldProps) {
  return (
    <div style={{ marginBottom: "1.25rem" }}>
      <label htmlFor={name} style={styles.label}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{ ...styles.input, borderColor: error ? "#D6294C" : "#DADADA" }}
      />
      {error && <p style={styles.errorText}>{error}</p>}
    </div>
  );
}

function PersonPreview({
  image,
  name,
  subtitle,
}: {
  image: string;
  name: string;
  subtitle: string;
}) {
  return (
    <div style={styles.posterCard}>
      <div style={styles.personImgWrap}>
        {image ? (
          <img
            src={image}
            alt={name}
            style={styles.posterImg}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <div style={styles.posterPlaceholder}>No photo yet</div>
        )}
      </div>
      <div style={styles.posterInfo}>
        <p style={styles.posterTitle}>{name}</p>
        <p style={styles.posterGenre}>{subtitle}</p>
      </div>
    </div>
  );
}

function PersonCard({
  image,
  name,
  subtitle,
  onEdit,
  onDelete,
  deleting,
}: {
  image: string;
  name: string;
  subtitle: string;
  onEdit: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  return (
    <div style={styles.movieCard}>
      <div style={styles.personImgWrap}>
        <img
          src={image}
          alt={name}
          style={styles.posterImg}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
        <div style={styles.cardActions}>
          <button onClick={onEdit} style={styles.editBtn} title="Edit" type="button">
            ✎
          </button>
          <button
            onClick={onDelete}
            style={styles.deleteBtn}
            title="Remove"
            type="button"
            disabled={deleting}
          >
            {deleting ? "…" : "×"}
          </button>
        </div>
      </div>
      <p style={styles.posterTitle}>{name}</p>
      <p style={styles.posterGenre}>{subtitle}</p>
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
    marginBottom: "4px",
  },
  count: {
    fontSize: "12px",
    fontWeight: 600,
    color: ACCENT,
    background: "#FDE7EB",
    borderRadius: "10px",
    padding: "2px 9px",
  },
  tabRow: {
    display: "flex",
    gap: "6px",
    marginTop: "28px",
    borderBottom: "1px solid #EAEAEA",
  },
  tabBtn: {
    padding: "10px 18px",
    background: "transparent",
    border: "none",
    borderBottom: "2px solid transparent",
    fontSize: "14px",
    fontWeight: 600,
    color: "#6B6B6B",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  tabBtnActive: {
    color: ACCENT,
    borderBottom: `2px solid ${ACCENT}`,
  },
  tabCount: {
    fontSize: "11px",
    fontWeight: 700,
    color: "#8A8A8A",
    background: "#F0F0F0",
    borderRadius: "10px",
    padding: "1px 7px",
  },
  selectorCard: {
    background: "#fff",
    borderRadius: "10px",
    border: "1px solid #EAEAEA",
    padding: "20px 24px",
    maxWidth: "420px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1.3fr 0.7fr",
    gap: "24px",
    alignItems: "start",
    marginTop: "16px",
  },
  card: {
    background: "#fff",
    borderRadius: "10px",
    border: "1px solid #EAEAEA",
    padding: "28px",
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
  personImgWrap: {
    position: "relative",
    aspectRatio: "1 / 1",
    background: "#EFEFEF",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
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
  movieGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
    gap: "18px",
    marginTop: "16px",
  },
  movieCard: { position: "relative" },
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
  floatingToast: {
    position: "fixed",
    bottom: "24px",
    left: "50%",
    transform: "translateX(-50%)",
    background: "#EAF7EE",
    color: "#1D7A3C",
    fontSize: "13px",
    fontWeight: 600,
    padding: "10px 18px",
    borderRadius: "8px",
    boxShadow: "0 4px 14px rgba(0,0,0,0.12)",
  },
};