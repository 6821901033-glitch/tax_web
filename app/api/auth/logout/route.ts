import { NextResponse } from "next/server";
import { clearSession } from "@/library/session";

export async function POST() {
  await clearSession();
  return NextResponse.json({ message: "Logout success" });
}