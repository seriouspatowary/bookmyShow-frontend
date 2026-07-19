"use client";

import React, { useState, useEffect, useRef, ChangeEvent, FormEvent, CSSProperties } from "react";
import { useSelector } from "react-redux";
import AdminNavbar from "@/app/components/admin/AdminNavbar";

// BookMyShow brand accent
const ACCENT = "#F84464";

interface TheatreForm {
  name: string;
  address: string;
  city: string;
  contactNumber: string;
}

interface Screen {
  _id: string;
  name: string;
  theatreId: string;
  totalSeats: number;
  createdAt?: string;
  updatedAt?: string;
}

interface Theatre extends TheatreForm {
  _id: string;
  screens: Screen[];
  createdAt?: string;
  updatedAt?: string;
}

type FormErrors = Partial<Record<keyof TheatreForm, string>>;

interface ScreenForm {
  name: string;
  totalSeats: string; // kept as string for the input, converted to Number on submit
}

type ScreenErrors = Partial<Record<keyof ScreenForm, string>>;

// A screen row inside the "edit theatre" form. `_id` present = existing
// screen being updated, absent = a new screen being added as part of the
// same update request.
interface EditScreenForm {
  _id?: string;
  name: string;
  totalSeats: string;
}

type EditScreenErrors = Partial<Record<"name" | "totalSeats", string>>;

const emptyScreenForm: ScreenForm = { name: "", totalSeats: "" };

const emptyForm: TheatreForm = {
  name: "",
  address: "",
  city: "",
  contactNumber: "",
};

const LIMIT = 10;

export default function AddTheatrePage() {
  const [form, setForm] = useState<TheatreForm>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [theatres, setTheatres] = useState<Theatre[]>([]);
  const [toast, setToast] = useState<string>("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ---- Search + pagination state ----
  const [searchInput, setSearchInput] = useState<string>(""); // raw typing
  const [search, setSearch] = useState<string>(""); // debounced value actually sent to the API
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  // ---- Add-screen state (inline form per theatre card, outside edit mode) ----
  const [screenFormForId, setScreenFormForId] = useState<string | null>(null); // which card has the form open
  const [screenForm, setScreenForm] = useState<ScreenForm>(emptyScreenForm);
  const [screenErrors, setScreenErrors] = useState<ScreenErrors>({});
  const [screenSubmitting, setScreenSubmitting] = useState<boolean>(false);

  // ---- Screens editable as part of the "edit theatre" form ----
  const [editScreens, setEditScreens] = useState<EditScreenForm[]>([]);
  const [editScreenErrors, setEditScreenErrors] = useState<Record<number, EditScreenErrors>>({});

  const accessToken = useSelector((state: any) => state.auth.accessToken);

  // Debounce the search box so we don't fire a request on every keystroke.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // ---- Fetch theatres (server-side search + pagination) ----
  // A single in-flight request is tracked via AbortController. Any new call
  // to fetchTheatres (from the search effect, pagination clicks, or a
  // retry button) aborts whatever request is currently pending first. That
  // means:
  //   1. We never have two overlapping requests racing to update state.
  //   2. A stale/slow response can't clobber a newer one.
  //   3. React StrictMode's dev-only double-invoke of effects results in the
  //      first request being aborted immediately instead of actually
  //      hitting the network twice.
  const abortControllerRef = useRef<AbortController | null>(null);

  async function fetchTheatres(
    pageNum: number = 1,
    searchTerm: string = search,
    options: { silent?: boolean } = {}
  ) {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // `silent` is used for refetches that happen right after an add/update/
    // delete — the list is already on screen and we just want to sync it
    // with the server, not blank it out and show a loading state. That
    // blanking is what made these actions feel like a full page refresh.
    const silent = options.silent ?? false;
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setFetchError("");
    try {
      const params = new URLSearchParams({
        page: String(pageNum),
        limit: String(LIMIT),
      });
      if (searchTerm) params.set("search", searchTerm);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API}/api/theatre?${params.toString()}`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${accessToken}` },
          credentials: "include",
          signal: controller.signal,
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to load theatres");
      }

      // Matches: { success, data: { theatres: [...], pagination: {...} } }
      // Falls back to a couple of alternate shapes so this doesn't break
      // if the backend key names shift slightly.
      const payload = data.data ?? data;
      const list: Theatre[] = (
        Array.isArray(payload) ? payload : payload.theatres || payload.items || payload.results || []
      ).map((t: any) => ({ ...t, screens: t.screens ?? [] }));

      const pagination = payload.pagination ?? payload;
      const pages: number =
        pagination.totalPages ??
        Math.max(1, Math.ceil((pagination.total ?? list.length) / LIMIT));
      const count: number = pagination.total ?? list.length;

      setTheatres(list);
      setTotalPages(pages);
      setTotalCount(count);
      setPage(pageNum);
    } catch (error: any) {
      if (error?.name === "AbortError") return; // superseded by a newer request, ignore
      // A background refresh failing quietly is fine — the on-screen data
      // is still whatever the mutation optimistically implies. Only surface
      // an error banner for user-driven (non-silent) loads.
      if (!silent) setFetchError(error.message || "Failed to load theatres");
    } finally {
      if (abortControllerRef.current === controller) {
        if (silent) setRefreshing(false);
        else setLoading(false);
      }
    }
  }

  // Single source of truth for loading the list: it runs on mount (since
  // `search` starts at "") and again whenever the debounced search term
  // changes. There is intentionally no separate "initial load" effect —
  // having both an on-mount effect AND a search-effect (with `search`
  // starting at "") was firing two requests back-to-back on every page
  // load, which was the "called so many times" issue.
  useEffect(() => {
    fetchTheatres(1, search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Cancel any in-flight request if the component unmounts mid-fetch.
  useEffect(() => {
    return () => abortControllerRef.current?.abort();
  }, []);

  function goToPage(next: number) {
    if (next < 1 || next > totalPages || next === page) return;
    fetchTheatres(next, search);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name as keyof TheatreForm]) {
      setErrors((er) => ({ ...er, [name]: "" }));
    }
  }

  function validate(): boolean {
    const er: FormErrors = {};
    if (!form.name.trim()) er.name = "Theatre name is required";
    if (!form.address.trim()) er.address = "Address is required";
    if (!form.city.trim()) er.city = "City is required";
    if (!form.contactNumber.trim()) er.contactNumber = "Contact number is required";
    else if (!/^\+?[0-9\s-]{7,15}$/.test(form.contactNumber.trim()))
      er.contactNumber = "Enter a valid contact number";
    setErrors(er);
    return Object.keys(er).length === 0;
  }

  function showToast(message: string) {
    setToast(message);
    setTimeout(() => setToast(""), 2500);
  }

  // ---- Screens management inside the edit form ----
  function addEditScreenRow() {
    setEditScreens((rows) => [...rows, { name: "", totalSeats: "" }]);
  }

  function removeEditScreenRow(index: number) {
    setEditScreens((rows) => rows.filter((_, i) => i !== index));
    setEditScreenErrors((errs) => {
      const next = { ...errs };
      delete next[index];
      return next;
    });
  }

  function updateEditScreenField(index: number, field: keyof EditScreenForm, value: string) {
    setEditScreens((rows) =>
      rows.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
    setEditScreenErrors((errs) => {
      if (!errs[index]?.[field as "name" | "totalSeats"]) return errs;
      return { ...errs, [index]: { ...errs[index], [field]: "" } };
    });
  }

  function validateEditScreens(): boolean {
    const allErrors: Record<number, EditScreenErrors> = {};
    let valid = true;
    editScreens.forEach((row, i) => {
      const rowErrors: EditScreenErrors = {};
      if (!row.name.trim()) rowErrors.name = "Screen name is required";
      if (!row.totalSeats.trim()) rowErrors.totalSeats = "Total seats is required";
      else if (!/^\d+$/.test(row.totalSeats.trim()) || Number(row.totalSeats) <= 0)
        rowErrors.totalSeats = "Enter a whole number greater than 0";
      if (Object.keys(rowErrors).length > 0) {
        allErrors[i] = rowErrors;
        valid = false;
      }
    });
    setEditScreenErrors(allErrors);
    return valid;
  }

  // ---- Add or update theatre ----
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const isEditing = Boolean(editingId);

    const isFormValid = validate();
    const areScreensValid = isEditing ? validateEditScreens() : true;
    if (!isFormValid || !areScreensValid) return;

    const payload: Record<string, any> = {
      name: form.name.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      contactNumber: form.contactNumber.trim(),
    };

    // Screen updates ride along with the theatre update request. Rows that
    // already have an `_id` are existing screens being edited; rows without
    // one are new screens being created alongside the update. Adjust this
    // shape to match whatever the updated /api/theatre/update endpoint
    // expects once it's finalized.
    if (isEditing) {
      payload.screens = editScreens.map((row) => ({
        ...(row._id ? { _id: row._id } : {}),
        name: row.name.trim(),
        totalSeats: Number(row.totalSeats),
      }));
    }

    // NOTE: only /api/theatre/add and /api/theatre (GET) were specified.
    // Update/delete below assume the same REST convention as the movie
    // endpoints — adjust these two URLs if your backend differs.
    const url = isEditing
      ? `${process.env.NEXT_PUBLIC_API}/api/theatre/update/${editingId}`
      : `${process.env.NEXT_PUBLIC_API}/api/theatre/add`;

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
        showToast(`"${payload.name}" updated`);
        setEditingId(null);
        setForm(emptyForm);
        setEditScreens([]);
        setEditScreenErrors({});
        // Screens (including any newly added ones with server-generated
        // ids) come back from the update response in the ideal case, but
        // refetching keeps everything — seat counts, new screen ids, etc —
        // reliably in sync regardless of what the update endpoint returns.
        // Silent: the list stays on screen, it just gets synced in place.
        fetchTheatres(page, search, { silent: true });
      } else {
        // A new theatre may land on a different page/search result depending
        // on how the backend sorts, so just refetch page 1 to stay in sync.
        showToast(`"${payload.name}" added`);
        setForm(emptyForm);
        fetchTheatres(1, search, { silent: true });
      }
    } catch (error: any) {
      alert(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  function handleEdit(theatre: Theatre) {
    setEditingId(theatre._id);
    setForm({
      name: theatre.name,
      address: theatre.address,
      city: theatre.city,
      contactNumber: theatre.contactNumber,
    });
    setErrors({});
    setEditScreens(
      (theatre.screens ?? []).map((s) => ({
        _id: s._id,
        name: s.name,
        totalSeats: String(s.totalSeats),
      }))
    );
    setEditScreenErrors({});
    // Close the standalone quick-add-screen form if it happened to be open
    // for this (or any other) card, since screens are now edited inline.
    setScreenFormForId(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleCancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
    setErrors({});
    setEditScreens([]);
    setEditScreenErrors({});
  }

  // ---- Delete theatre ----
  async function handleDelete(id: string) {
    if (!confirm("Remove this theatre?")) return;

    setDeletingId(id);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API}/api/theatre/delete/${id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${accessToken}` },
          credentials: "include",
        }
      );
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Failed to delete theatre");
      }
      if (editingId === id) handleCancelEdit();
      showToast("Theatre removed");

      // If this was the last item on the page (and not page 1), step back a page.
      const isLastItemOnPage = theatres.length === 1 && page > 1;
      fetchTheatres(isLastItemOnPage ? page - 1 : page, search, { silent: true });
    } catch (error: any) {
      alert(error.message);
    } finally {
      setDeletingId(null);
    }
  }

  // ---- Add screen (inline per-theatre quick-add form, outside edit mode) ----
  function toggleScreenForm(theatreId: string) {
    if (screenFormForId === theatreId) {
      setScreenFormForId(null);
      setScreenForm(emptyScreenForm);
      setScreenErrors({});
    } else {
      setScreenFormForId(theatreId);
      setScreenForm(emptyScreenForm);
      setScreenErrors({});
    }
  }

  function handleScreenChange(e: ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setScreenForm((f) => ({ ...f, [name]: value }));
    if (screenErrors[name as keyof ScreenForm]) {
      setScreenErrors((er) => ({ ...er, [name]: "" }));
    }
  }

  function validateScreen(): boolean {
    const er: ScreenErrors = {};
    if (!screenForm.name.trim()) er.name = "Screen name is required";
    if (!screenForm.totalSeats.trim()) er.totalSeats = "Total seats is required";
    else if (!/^\d+$/.test(screenForm.totalSeats.trim()) || Number(screenForm.totalSeats) <= 0)
      er.totalSeats = "Enter a whole number greater than 0";
    setScreenErrors(er);
    return Object.keys(er).length === 0;
  }

  async function handleScreenSubmit(e: FormEvent<HTMLFormElement>, theatreId: string) {
    e.preventDefault();
    if (!validateScreen()) return;

    const payload = {
      theatreId,
      name: screenForm.name.trim(),
      totalSeats: Number(screenForm.totalSeats),
    };

    setScreenSubmitting(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API}/api/theatre/add-screen`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to add screen");
      }

      showToast(`"${payload.name}" added to screens`);
      setScreenFormForId(null);
      setScreenForm(emptyScreenForm);
      fetchTheatres(page, search, { silent: true });
    } catch (error: any) {
      alert(error.message);
    } finally {
      setScreenSubmitting(false);
    }
  }

  return (
    <div style={styles.page}>
      <AdminNavbar/>

      <main style={styles.main}>
        <div style={styles.titleRow}>
          <h1 style={styles.h1}>{editingId ? "Edit theatre" : "Add a theatre"}</h1>
          <p style={styles.sub}>
            {editingId
              ? "Update the details and screens below, then save your changes."
              : "Fill in the details below to list a new theatre on BookMyShow."}
          </p>
        </div>

        <div style={styles.grid}>
          {/* Form card */}
          <form style={styles.card} onSubmit={handleSubmit} noValidate>
            <Field
              label="Theatre name"
              name="name"
              placeholder="e.g. PVR Cinemas"
              value={form.name}
              onChange={handleChange}
              error={errors.name}
            />
            <Field
              label="Address"
              name="address"
              placeholder="e.g. 3rd Floor, City Mall, MG Road"
              value={form.address}
              onChange={handleChange}
              error={errors.address}
            />
            <div style={styles.row2}>
              <Field
                label="City"
                name="city"
                placeholder="e.g. Bengaluru"
                value={form.city}
                onChange={handleChange}
                error={errors.city}
              />
              <Field
                label="Contact number"
                name="contactNumber"
                placeholder="e.g. +91 98765 43210"
                value={form.contactNumber}
                onChange={handleChange}
                error={errors.contactNumber}
              />
            </div>

            {/* Screens — only editable as part of updating an existing theatre */}
            {editingId && (
              <div style={styles.screensBlock}>
                <div style={styles.screensHeaderRow}>
                  <p style={styles.label}>Screens</p>
                  <button type="button" style={styles.addScreenRowBtn} onClick={addEditScreenRow}>
                    + Add screen
                  </button>
                </div>

                {editScreens.length === 0 && (
                  <p style={styles.sub}>No screens yet. Add one above.</p>
                )}

                {editScreens.map((row, index) => (
                  <div key={row._id ?? `new-${index}`} style={styles.screenFormRow}>
                    <div style={{ flex: 1 }}>
                      <input
                        type="text"
                        value={row.name}
                        onChange={(e) => updateEditScreenField(index, "name", e.target.value)}
                        placeholder="Screen name, e.g. Screen 1"
                        style={{
                          ...styles.input,
                          borderColor: editScreenErrors[index]?.name ? "#D6294C" : "#DADADA",
                        }}
                      />
                      {editScreenErrors[index]?.name && (
                        <p style={styles.errorText}>{editScreenErrors[index]?.name}</p>
                      )}
                    </div>
                    <div style={{ width: "140px" }}>
                      <input
                        type="number"
                        value={row.totalSeats}
                        onChange={(e) => updateEditScreenField(index, "totalSeats", e.target.value)}
                        placeholder="Total seats"
                        style={{
                          ...styles.input,
                          borderColor: editScreenErrors[index]?.totalSeats ? "#D6294C" : "#DADADA",
                        }}
                      />
                      {editScreenErrors[index]?.totalSeats && (
                        <p style={styles.errorText}>{editScreenErrors[index]?.totalSeats}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeEditScreenRow(index)}
                      style={styles.removeScreenBtn}
                      title="Remove screen"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: "flex", gap: "10px", marginTop: editingId ? "18px" : 0 }}>
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
                  : "Add theatre"}
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
              <p style={styles.previewName}>{form.name || "Theatre name"}</p>
              <p style={styles.previewMeta}>{form.address || "Address"}</p>
              <p style={styles.previewMeta}>
                {[form.city, form.contactNumber].filter(Boolean).join(" · ") ||
                  "City · Contact number"}
              </p>
              {editingId && (
                <p style={styles.previewMeta}>
                  {editScreens.length} screen{editScreens.length === 1 ? "" : "s"}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* All theatres from the API */}
        <section style={{ marginTop: "3rem" }}>
          <div style={styles.listHeaderRow}>
            <h2 style={styles.h2}>
              All theatres{" "}
              {!loading && <span style={styles.count}>{totalCount}</span>}
              {refreshing && <span style={styles.refreshingTag}>syncing…</span>}
            </h2>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name, city, address…"
              style={styles.searchInput}
            />
          </div>

          {loading && <p style={styles.sub}>Loading theatres…</p>}

          {!loading && fetchError && (
            <div style={styles.fetchErrorBox}>
              <span>{fetchError}</span>
              <button
                type="button"
                onClick={() => fetchTheatres(page, search)}
                style={styles.retryBtn}
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !fetchError && theatres.length === 0 && (
            <p style={styles.sub}>
              {search ? `No theatres match "${search}".` : "No theatres yet. Add one above."}
            </p>
          )}

          {!loading && !fetchError && theatres.length > 0 && (
            <>
              <div style={styles.theatreList}>
                {theatres.map((th) => (
                  <div key={th._id} style={styles.theatreCard}>
                    <div style={styles.theatreCardRow}>
                      <div style={styles.theatreInfo}>
                        <p style={styles.previewName}>{th.name}</p>
                        <p style={styles.previewMeta}>{th.address}</p>
                        <p style={styles.previewMeta}>
                          {[th.city, th.contactNumber].filter(Boolean).join(" · ")}
                        </p>
                        <p style={styles.previewMeta}>
                          {th.screens.length} screen{th.screens.length === 1 ? "" : "s"}
                          {th.screens.length > 0 &&
                            ` · ${th.screens.reduce((sum, s) => sum + s.totalSeats, 0)} seats`}
                        </p>
                      </div>
                      <div style={styles.theatreActions}>
                        <button
                          onClick={() => toggleScreenForm(th._id)}
                          style={styles.addScreenBtn}
                          type="button"
                        >
                          {screenFormForId === th._id ? "Cancel" : "+ Add screen"}
                        </button>
                        <button
                          onClick={() => handleEdit(th)}
                          style={styles.editBtn}
                          title="Edit"
                          type="button"
                        >
                          ✎
                        </button>
                        <button
                          onClick={() => handleDelete(th._id)}
                          style={styles.deleteBtn}
                          title="Remove"
                          type="button"
                          disabled={deletingId === th._id}
                        >
                          {deletingId === th._id ? "…" : "×"}
                        </button>
                      </div>
                    </div>

                    {screenFormForId === th._id && (
                      <form
                        style={styles.screenForm}
                        onSubmit={(e) => handleScreenSubmit(e, th._id)}
                        noValidate
                      >
                        <div style={styles.screenFormRow}>
                          <div style={{ flex: 1 }}>
                            <input
                              name="name"
                              type="text"
                              value={screenForm.name}
                              onChange={handleScreenChange}
                              placeholder="Screen name, e.g. Screen 1"
                              style={{
                                ...styles.input,
                                borderColor: screenErrors.name ? "#D6294C" : "#DADADA",
                              }}
                            />
                            {screenErrors.name && (
                              <p style={styles.errorText}>{screenErrors.name}</p>
                            )}
                          </div>
                          <div style={{ width: "140px" }}>
                            <input
                              name="totalSeats"
                              type="number"
                              value={screenForm.totalSeats}
                              onChange={handleScreenChange}
                              placeholder="Total seats"
                              style={{
                                ...styles.input,
                                borderColor: screenErrors.totalSeats ? "#D6294C" : "#DADADA",
                              }}
                            />
                            {screenErrors.totalSeats && (
                              <p style={styles.errorText}>{screenErrors.totalSeats}</p>
                            )}
                          </div>
                          <button
                            type="submit"
                            style={{
                              ...styles.screenSubmitBtn,
                              opacity: screenSubmitting ? 0.7 : 1,
                            }}
                            disabled={screenSubmitting}
                          >
                            {screenSubmitting ? "Adding..." : "Add"}
                          </button>
                        </div>
                      </form>
                    )}
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

interface FieldProps {
  label: string;
  name: keyof TheatreForm;
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

const styles: Record<string, CSSProperties> = {
  page: {
    fontFamily:
      "'Helvetica Neue', Arial, -apple-system, BlinkMacSystemFont, sans-serif",
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
  theatreList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginTop: "16px",
  },
  theatreCard: {
    background: "#fff",
    borderRadius: "10px",
    border: "1px solid #EAEAEA",
    padding: "16px 18px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  theatreCardRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
  },
  theatreInfo: { flex: 1, minWidth: 0 },
  theatreActions: { display: "flex", gap: "8px", flexShrink: 0, alignItems: "center" },
  addScreenBtn: {
    padding: "7px 12px",
    background: "#fff",
    border: `1px solid ${ACCENT}`,
    color: ACCENT,
    fontWeight: 600,
    fontSize: "12px",
    borderRadius: "6px",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  screenForm: {
    borderTop: "1px solid #EAEAEA",
    paddingTop: "12px",
  },
  screenFormRow: {
    display: "flex",
    gap: "10px",
    alignItems: "flex-start",
  },
  screenSubmitBtn: {
    padding: "11px 16px",
    background: ACCENT,
    color: "#fff",
    fontWeight: 700,
    fontSize: "13px",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  screensBlock: {
    borderTop: "1px solid #EAEAEA",
    marginTop: "1.25rem",
    paddingTop: "1.1rem",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  screensHeaderRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  addScreenRowBtn: {
    padding: "6px 10px",
    background: "#fff",
    border: `1px solid ${ACCENT}`,
    color: ACCENT,
    fontWeight: 600,
    fontSize: "12px",
    borderRadius: "6px",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  removeScreenBtn: {
    width: "44px",
    height: "44px",
    borderRadius: "6px",
    border: "1px solid #DADADA",
    background: "#fff",
    color: "#B0203A",
    fontSize: "18px",
    cursor: "pointer",
    flexShrink: 0,
  },
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