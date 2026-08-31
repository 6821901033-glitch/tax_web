import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "บทความ",
    description: "รวมบทความและข่าวสารล่าสุด",
};

export const dynamic = "force-dynamic";

export type BlogCardData = {
    _id: string;
    title: string;
    slug: string;
    content: string;
    createdAt: string;
};

type BlogCardProps = {
    blog?: BlogCardData | null;
};

function formatDate(date?: string) {
    if (!date) {
        return "";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
        return "";
    }

    return parsedDate.toLocaleDateString("th-TH", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
}

export default function BlogCard({ blog }: BlogCardProps) {
    const safeBlog: BlogCardData = blog ?? {
        _id: "",
        title: "",
        slug: "",
        content: "",
        createdAt: "",
    };

    const formattedDate = formatDate(safeBlog.createdAt);

    if (!safeBlog._id && !safeBlog.title && !safeBlog.content && !safeBlog.slug) {
        return (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-gray-500">
                ยังไม่มีบทความ
            </div>
        );
    }

    return (
        <article className="flex min-h-64 flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
            {formattedDate && (
                <time
                    dateTime={safeBlog.createdAt}
                    className="text-sm text-gray-500"
                >
                    {formattedDate}
                </time>
            )}

            <Link
                href={safeBlog._id ? `/blogs/${safeBlog._id}` : "#"}
                className="group"
            >
                <h2 className="mt-3 text-xl font-bold text-gray-900">
                    {safeBlog.title || "ไม่มีชื่อบทความ"}
                </h2>
            </Link>
            {safeBlog.slug && (
                <p className="mt-1 text-sm text-green-700">
                    #{safeBlog.slug}
                </p>
            )}

            {safeBlog.content ? (
                <div
                    className="prose prose-sm mt-4 max-w-none leading-7 text-gray-600
            prose-headings:text-gray-900
            prose-a:text-green-700
            prose-strong:text-gray-900
            prose-img:rounded-xl"
                    dangerouslySetInnerHTML={{
                        __html: safeBlog.content,
                    }}
                />
            ) : (
                <p className="mt-4 text-sm leading-7 text-gray-600">
                    บทความนี้ยังไม่มีรายละเอียด
                </p>
            )}
        </article>
    );
}