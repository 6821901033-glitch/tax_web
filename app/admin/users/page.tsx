import { redirect } from "next/navigation";
import { getSession } from "@/library/session";

export default async function AdminUsersPage() {
  const user = await getSession();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <div className="page">
      <h1>Admin Users</h1>
      <p>หน้านี้เข้าได้เฉพาะ Admin เท่านั้น</p>
    </div>
  );
}