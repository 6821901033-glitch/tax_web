"use client";

import Image from "next/image";
import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

interface Category {
  _id: string;
  name: string;
}

interface UploadResult {
  imageUrl: string;
  imagePublicId: string;
}

type FormState = {
  name: string;
  slug: string;
  description: string;
  price: string;
  stock: string;
  category: string;
  imageUrl: string;
  imagePublicId: string;
  published: boolean;
};

type Notice = {
  type: "error" | "success";
  text: string;
};

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

const initialForm: FormState = {
  name: "",
  slug: "",
  description: "",
  price: "",
  stock: "0",
  category: "",
  imageUrl: "",
  imagePublicId: "",
  published: true,
};

function createSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9ก-๙-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function ProductForm() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadCategories = useCallback(async () => {
    try {
      const response = await fetch("/api/categories");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message ?? "โหลดหมวดหมู่ไม่สำเร็จ");
      }

      setCategories(data.categories);
    } catch (error) {
      setNotice({
        type: "error",
        text: error instanceof Error ? error.message : "โหลดหมวดหมู่ไม่สำเร็จ",
      });
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    void fetch("/api/categories")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message ?? "โหลดหมวดหมู่ไม่สำเร็จ");
        }
        return data;
      })
      .then((data) => {
        if (active) {
          setCategories(data.categories);
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setNotice({
            type: "error",
            text: error instanceof Error ? error.message : "โหลดหมวดหมู่ไม่สำเร็จ",
          });
        }
      })
      .finally(() => {
        if (active) {
          setLoadingCategories(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  function updateForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((previous) => ({ ...previous, [key]: value }));
  }

  function handleNameChange(value: string) {
    setForm((previous) => ({
      ...previous,
      name: value,
      slug: createSlug(value),
    }));
  }

  async function handleImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      setNotice({ type: "error", text: "รองรับเฉพาะไฟล์ JPG, PNG และ WebP" });
      event.target.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setNotice({ type: "error", text: "รูปภาพต้องมีขนาดไม่เกิน 10 MB" });
      event.target.value = "";
      return;
    }

    try {
      setUploading(true);
      setNotice(null);

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data: Partial<UploadResult> & { message?: string } =
        await response.json();

      if (!response.ok || !data.imageUrl || !data.imagePublicId) {
        throw new Error(data.message ?? "อัปโหลดรูปไม่สำเร็จ");
      }

      setForm((previous) => ({
        ...previous,
        imageUrl: data.imageUrl!,
        imagePublicId: data.imagePublicId!,
      }));
      setNotice({ type: "success", text: "อัปโหลดรูปสำเร็จ" });
    } catch (error) {
      setNotice({
        type: "error",
        text: error instanceof Error ? error.message : "อัปโหลดรูปไม่สำเร็จ",
      });
    } finally {
      setUploading(false);
    }
  }

  function removeImage() {
    setForm((previous) => ({
      ...previous,
      imageUrl: "",
      imagePublicId: "",
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.imageUrl || !form.imagePublicId) {
      setNotice({ type: "error", text: "กรุณาอัปโหลดรูปสินค้าก่อนบันทึก" });
      return;
    }

    try {
      setSubmitting(true);
      setNotice(null);

      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          price: Number(form.price),
          stock: Number(form.stock),
        }),
      });
      const data: { message?: string } = await response.json();

      if (!response.ok) {
        throw new Error(data.message ?? "เพิ่มสินค้าไม่สำเร็จ");
      }

      setForm(initialForm);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setNotice({ type: "success", text: "เพิ่มสินค้าสำเร็จ" });
    } catch (error) {
      setNotice({
        type: "error",
        text: error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการบันทึกสินค้า",
      });
    } finally {
      setSubmitting(false);
    }
  }

  const disabled = submitting || uploading;

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-5 rounded-lg border p-6">
      <div>
        <h1 className="text-2xl font-bold">เพิ่มสินค้า</h1>
      </div>

      <div className="space-y-1">
        <label htmlFor="product-name" className="block font-medium">ชื่อสินค้า</label>
        <input id="product-name" type="text" value={form.name} onChange={(event) => handleNameChange(event.target.value)} className="w-full rounded-lg border px-3 py-2" required disabled={disabled} />
      </div>

      <div className="space-y-1">
        <label htmlFor="product-slug" className="block font-medium">Slug</label>
        <input id="product-slug" type="text" value={form.slug} onChange={(event) => updateForm("slug", createSlug(event.target.value))} className="w-full rounded-lg border px-3 py-2" required disabled={disabled} />
      </div>

      <div className="space-y-1">
        <label htmlFor="product-description" className="block font-medium">รายละเอียดสินค้า</label>
        <textarea id="product-description" value={form.description} onChange={(event) => updateForm("description", event.target.value)} className="min-h-32 w-full rounded-lg border px-3 py-2" required disabled={disabled} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="product-price" className="block font-medium">ราคา</label>
          <input id="product-price" type="number" min="0" step="0.01" inputMode="decimal" value={form.price} onChange={(event) => updateForm("price", event.target.value)} className="w-full rounded-lg border px-3 py-2" required disabled={disabled} />
        </div>
        <div className="space-y-1">
          <label htmlFor="product-stock" className="block font-medium">จำนวนสินค้า</label>
          <input id="product-stock" type="number" min="0" step="1" inputMode="numeric" value={form.stock} onChange={(event) => updateForm("stock", event.target.value)} className="w-full rounded-lg border px-3 py-2" required disabled={disabled} />
        </div>
      </div>

      <div className="space-y-1">
        <label htmlFor="product-category" className="block font-medium">หมวดหมู่</label>
        <select id="product-category" value={form.category} onChange={(event) => updateForm("category", event.target.value)} className="w-full rounded-lg border px-3 py-2" required disabled={disabled || loadingCategories}>
          <option value="">{loadingCategories ? "กำลังโหลดหมวดหมู่..." : "เลือกหมวดหมู่"}</option>
          {categories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}
        </select>
        {!loadingCategories && categories.length === 0 && <button type="button" onClick={() => { setLoadingCategories(true); void loadCategories(); }} className="text-sm underline" disabled={disabled}>โหลดหมวดหมู่ใหม่</button>}
      </div>

      <div className="space-y-2">
        <label htmlFor="product-image" className="block font-medium">รูปสินค้า</label>
        <input ref={fileInputRef} id="product-image" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageUpload} disabled={disabled} className="w-full rounded-lg border px-3 py-2" />
        <p className="text-sm text-gray-600">รองรับ JPG, PNG, WebP ขนาดไม่เกิน 10 MB</p>
        {uploading && <p className="text-sm">กำลังอัปโหลดรูป...</p>}
        {form.imageUrl && (
          <div className="space-y-2">
            <div className="relative h-64 w-full overflow-hidden rounded-lg border">
              <Image src={form.imageUrl} alt={form.name || "ตัวอย่างรูปสินค้า"} fill sizes="(max-width: 768px) 100vw, 672px" className="object-contain" />
            </div>
            <button type="button" onClick={removeImage} className="text-sm underline" disabled={disabled}>เปลี่ยนรูปสินค้า</button>
          </div>
        )}
      </div>

      <label className="flex items-center gap-2">
        <input type="checkbox" checked={form.published} onChange={(event) => updateForm("published", event.target.checked)} disabled={disabled} />
        แสดงสินค้าในหน้าร้านทันที
      </label>

      {notice && <p role="status" className={`rounded-lg p-3 text-sm ${notice.type === "error" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>{notice.text}</p>}

      <button type="submit" disabled={disabled || loadingCategories || categories.length === 0} className="rounded-lg bg-black px-5 py-2 text-white disabled:opacity-50">
        {submitting ? "กำลังบันทึก..." : uploading ? "กำลังอัปโหลดรูป..." : "เพิ่มสินค้า"}
      </button>
    </form>
  );
}