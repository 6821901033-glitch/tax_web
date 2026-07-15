import { redirect } from "next/navigation";
import { getSession } from "@/library/session";

export default async function Profile() {
  const user = await getSession();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="page">
      <h1>Profile</h1>
      <p>Name: {user.name as string}</p>
      
      <p>Role: {user.role as string}</p>
    </div>
  );
}