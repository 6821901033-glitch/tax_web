import { NextRequest, NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { connectDB } from "@/library/mongodb";
import Product from "@/models/Product";
import Category from "@/models/Category";

// ฟังก์ชันสำหรับ Escape ตัวอักษรพิเศษใน Regex
function escapeRegex(text: string) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const includeUnpublished =
      searchParams.get("includeUnpublished") === "true";

    const filter: Record<string, unknown> = {};

    if (!includeUnpublished) {
      filter.published = true;
    }

    // ป้องกัน App พังกรณีส่ง Category ID ไม่ถูกต้อง
    if (category) {
      if (isValidObjectId(category)) {
        filter.category = category;
      } else {
        return NextResponse.json(
          { message: "รูปแบบหมวดหมู่ไม่ถูกต้อง" },
          { status: 400 }
        );
      }
    }

    if (search) {
      const sanitizedSearch = escapeRegex(search);
      filter.$or = [
        { name: { $regex: sanitizedSearch, $options: "i" } },
        { description: { $regex: sanitizedSearch, $options: "i" } },
      ];
    }

    const products = await Product.find(filter)
      .populate("category", "name slug")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ products });
  } catch (error) {
    console.error("GET products error:", error);

    return NextResponse.json(
      { message: "ไม่สามารถโหลดสินค้าได้" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();

    const name = String(body.name ?? "").trim();
    const slug = String(body.slug ?? "").trim().toLowerCase();
    const description = String(body.description ?? "").trim();
    const price = Number(body.price);
    const stock = Number(body.stock);
    const category = String(body.category ?? "");
    const imageUrl = String(body.imageUrl ?? "").trim();
    const imagePublicId = String(body.imagePublicId ?? "").trim();

    if (
      !name ||
      !slug ||
      !description ||
      !Number.isFinite(price) ||
      !Number.isInteger(stock) ||
      price < 0 ||
      stock < 0 ||
      !category ||
      !imageUrl ||
      !imagePublicId 
    ) {
      return NextResponse.json(
        { message: "กรุณากรอกข้อมูลสินค้าให้ครบถ้วนและถูกต้อง" },
        { status: 400 }
      );
    }

    const existingProduct = await Product.findOne({ slug }).lean();

    if (existingProduct) {
      return NextResponse.json(
        { message: "slug สินค้านี้มีอยู่แล้ว" },
        { status: 409 }
      );
    }

    if (!isValidObjectId(category)) {
      return NextResponse.json(
        { message: "รูปแบบหมวดหมู่ไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const categoryExists = await Category.exists({ _id: category });

    if (!categoryExists) {
      return NextResponse.json(
        { message: "ไม่พบหมวดหมู่ที่เลือก" },
        { status: 404 }
      );
    }

    const product = await Product.create({
      name,
      slug,
      description,
      price,
      stock,
      category,
      imageUrl,
      imagePublicId,
      published: Boolean(body.published ?? true),
    });

    const populatedProduct = await Product.findById(product._id)
      .populate("category", "name slug")
      .lean();

    return NextResponse.json(
      {
        message: "เพิ่มสินค้าสำเร็จ",
        product: populatedProduct,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST product error:", error);

    return NextResponse.json(
      { message: "ไม่สามารถเพิ่มสินค้าได้" },
      { status: 500 }
    );
  }
}