"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import SupportPageLayout from "@/components/SupportPageLayout";
import { apiUrl } from "@/lib/apiConfig";

function ReviewStars({ rating = 0 }) {
  const value = Math.max(0, Math.min(5, Number(rating) || 0));

  return (
    <div className="flex items-center gap-1 text-yellow-400">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={`h-4 w-4 ${index < value ? "fill-current" : ""}`}
          aria-hidden="true"
        />
      ))}
      <span className="ml-2 text-sm font-medium text-gray-500">
        {value}/5
      </span>
    </div>
  );
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchReviews() {
      try {
        const res = await fetch(apiUrl("/reviews"), { cache: "no-store" });
        if (!res.ok) throw new Error("Unable to load reviews");

        const data = await res.json();
        setReviews(Array.isArray(data) ? data : []);
      } catch {
        setError("Reviews could not be loaded right now.");
      } finally {
        setLoading(false);
      }
    }

    fetchReviews();
  }, []);

  return (
    <SupportPageLayout
      eyebrow="Customer Stories"
      title="Reviews"
      description="See what customers say about their Singar Glow experience, from everyday beauty care to special event services."
    >
      {loading ? (
        <div className="rounded-xl border border-pink-100 bg-[#fff7fa] p-10 text-center text-gray-500">
          Loading customer reviews...
        </div>
      ) : error ? (
        <div className="rounded-xl border border-pink-100 bg-[#fff7fa] p-10 text-center text-gray-500">
          {error}
        </div>
      ) : reviews.length === 0 ? (
        <div className="rounded-xl border border-pink-100 bg-[#fff7fa] p-10 text-center text-gray-500">
          No customer reviews have been submitted yet.
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {reviews.map((review) => (
            <article
              key={`${review.bookingId}-${review.created_at}`}
              className="rounded-xl border border-pink-200 bg-white p-6 shadow-sm"
            >
              <ReviewStars rating={review.rating} />

              <p className="mt-4 text-sm leading-6 text-gray-600">
                {review.review}
              </p>

              <div className="mt-5 border-t border-pink-100 pt-4">
                <h2 className="font-semibold text-gray-900">
                  {review.customer || "Customer"}
                </h2>
                <p className="text-sm text-pink-500">
                  {review.itemType}: {review.itemName}
                </p>
                {review.created_at && (
                  <p className="mt-1 text-xs text-gray-400">
                    {new Date(review.created_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="mt-10 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 p-8 text-center text-white shadow-md">
        <h2 className="text-2xl font-bold">Ready for your own glow moment?</h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-white/90">
          Explore services and packages designed for beauty, comfort, and
          confidence.
        </p>
        <Link
          href="/services"
          className="mt-6 inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-pink-500"
        >
          Explore Services
        </Link>
      </div>
    </SupportPageLayout>
  );
}
