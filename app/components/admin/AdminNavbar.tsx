"use client";

import React, { CSSProperties } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// BookMyShow brand accent
const ACCENT = "#F84464";

// Add future admin pages here — everything else (active-link highlighting,
// layout) is handled automatically.
export interface NavLink {
  label: string;
  href: string;
}

const NAV_LINKS: NavLink[] = [
  { label: "Movies", href: "/admin" },
  { label: "Cast & Crew", href: "/admin/movies" },
  { label: "Theatres", href: "/admin/theatres" },
  { label: "Shows", href: "/admin/manage-shows" },
];

interface AdminNavbarProps {
  links?: NavLink[];
}

export default function AdminNavbar({ links = NAV_LINKS }: AdminNavbarProps) {
  const pathname = usePathname();

  return (
    <header style={styles.header}>
      <div style={styles.logo}>
        book<span style={{ color: ACCENT }}>my</span>show
        <span style={styles.adminTag}>admin</span>
      </div>
      <nav style={styles.nav}>
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              style={{
                ...styles.navLink,
                ...(isActive ? styles.navLinkActive : {}),
              }}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}

const styles: Record<string, CSSProperties> = {
  header: {
    background: "#fff",
    borderBottom: "1px solid #EAEAEA",
    padding: "14px 32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    fontFamily:
      "'Helvetica Neue', Arial, -apple-system, BlinkMacSystemFont, sans-serif",
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
};