
"use client";

import Link from "next/link";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

type User = {
  name: string;
  email: string;
  role: "admin" | "user";
};


export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  // const [open, setOpen] = useState(false);

  // Refresh user state when route changes, because Navbar stays mounted in the root layout.
  useEffect(() => {
    let ignore = false;

    async function loadUser() {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const data = await res.json();

      if (!ignore) {
        setUser(data.user);
      }
    }

    loadUser();

    return () => {
      ignore = true;
    };
  }, [pathname]);

  // Login/logout pages dispatch this event so Navbar updates immediately without a full reload.
  useEffect(() => {
    function handleAuthChange(event: Event) {
      const authEvent = event as CustomEvent<{ user: User | null }>;
      setUser(authEvent.detail?.user ?? null);
    }

    window.addEventListener("auth-change", handleAuthChange);

    return () => {
      window.removeEventListener("auth-change", handleAuthChange);
    };
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", {
      method: "POST",
    });

    setUser(null);
    // Keep all mounted auth-aware components in sync after logout.
    window.dispatchEvent(
      new CustomEvent("auth-change", { detail: { user: null } })
    );
    router.push("/login");
    router.refresh();
  }


  return (
    <nav className="navbar">
      <div className="container">
        <Link href="/" className="logo">
          ROBOT SHOP
        </Link>

        <button className="menu-btn" onClick={() => setMenuOpen(!menuOpen)}>
          ☰
        </button>

        <ul className={menuOpen ? "nav-links active" : "nav-links"}>
          <li>
            <Link href="/">หน้าหลัก</Link>
          </li>
          <li>
            <Link href="/about">เกี่ยวกับเรา</Link>
          </li>
           <li>
            <Link href="/products">สินค้า</Link>
          </li>

          {user && (
            <li>
              <Link href="/dashboard">Dashboard</Link>
            </li>
          )}

          {user?.role === "admin" && (
            <>
              <li>
                <Link href="/admin/users">Admin</Link>
              </li>
              <li>
                <Link href="/admin/categories">เพิ่มหมวดหมู่</Link>
              </li>
              <li>
                <Link href="/admin/products">เพิ่มสินค้า</Link>
              </li>
            </>
          )}

          {!user ? (
            <>
              <li>
                <Link href="/login">Login</Link>
              </li>
              <li>
                <Link href="/register" className="btn-register">
                  Register
                </Link>
              </li>
            </>
          ) : (
            <>
              <li className="user-info">
                {user.name} ({user.role})
              </li>
              <li>
                <Link href="/profile">Profile</Link>
              </li>
              <li>
                <button onClick={logout} className="btn-logout">
                  Logout
                </button>
              </li>
            </>
          )}

        </ul>
      </div>
    </nav>
  );
}