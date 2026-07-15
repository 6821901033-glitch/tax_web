"use client";

import { FormEvent, useState } from "react";

export default function CategoryForm() {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function createSlug(value: string) {
    return value
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9ก-๙-]/g, "");
  }

  function handleNameChange(value: string) {
    setName(value);
    setSlug(createSlug(value));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setSubmitting(true);
      setMessage("");

      const response = await fetch("/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          slug,
          description,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message ?? "เพิ่มหมวดหมู่ไม่สำเร็จ");
      }

      setMessage("เพิ่มหมวดหมู่สำเร็จ");
      setName("");
      setSlug("");
      setDescription("");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "เกิดข้อผิดพลาด"
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-xl space-y-4 rounded-xl border p-6"
    >
      <h1 className="text-2xl font-bold">เพิ่มหมวดหมู่</h1>

      <div>
        <label className="mb-1 block font-medium">
          ชื่อหมวดหมู่
        </label>

        <input
          type="text"
          value={name}
          onChange={(event) =>
            handleNameChange(event.target.value)
          }
          className="w-full rounded-lg border px-3 py-2"
          required
        />
      </div>

      <div>
        <label className="mb-1 block font-medium">Slug</label>

        <input
          type="text"
          value={slug}
          onChange={(event) => setSlug(event.target.value)}
          className="w-full rounded-lg border px-3 py-2"
          required
        />
      </div>

      <div>
        <label className="mb-1 block font-medium">
          รายละเอียด
        </label>

        <textarea
          value={description}
          onChange={(event) =>
            setDescription(event.target.value)
          }
          className="min-h-28 w-full rounded-lg border px-3 py-2"
        />
      </div>

      {message && (
        <p className="rounded-lg bg-gray-100 p-3">
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-lg bg-black px-5 py-2 text-white disabled:opacity-50"
      >
        {submitting ? "กำลังบันทึก..." : "เพิ่มหมวดหมู่"}
      </button>
    </form>
  );
}