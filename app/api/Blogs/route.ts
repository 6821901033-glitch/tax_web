import { NextResponse } from "next/server";
import { connectDB } from "@/library/mongodb";
import Blog from "@/models/Blog";

export async function GET() {
  try {
    await connectDB();

    const Blogs = await Blog.find()
      .sort({ title: 1 })
      .lean();

    return NextResponse.json({
      Blogs,
    });
  } catch (error) {
    // console.error("GET error:", error);

    return NextResponse.json(
      { message: "ไม่สามารถโหลดข้อมูลได้" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();

    const body = await request.json();

    const title = String(body.title ?? "").trim();
    const slug = String(body.slug ?? "")
      .trim()
      .toLowerCase();
    const description = String(body.description ?? "").trim();

    if (!title || !slug) {
      return NextResponse.json(
        { message: "กรุณากรอกชื่อและ slug" },
        { status: 400 }
      );
    }

    const existingBlog = await Blog.findOne({
      $or: [{ title }, { slug }],
    });

    if (existingBlog) {
      return NextResponse.json(
        { message: "ชื่อหรือ slug นี้มีอยู่แล้ว" },
        { status: 409 }
      );
    }

    const category = await Blog.create({
      title,
      slug,
      description,
    });

    return NextResponse.json(
      {
        message: "เพิ่มหมวดข้อมูลสำเร็จ",
        category,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST error:", error);

    return NextResponse.json(
      { message: "ไม่สามารถเพิ่มข้อมูลได้" },
      { status: 500 }
    );
  }
}