import {
  Edit,
  MessageCircle,
  Star,
  Trash2,
  User,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

function ReviewsSection({ eventId, eventOrganizerId }) {
  const { user, isAuthenticated } = useAuth();

  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState({
    average_rating: 0,
    review_count: 0,
    rating_breakdown: {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    },
  });

  const [formData, setFormData] = useState({
    rating: 5,
    comment: "",
  });

  const [editingReviewId, setEditingReviewId] =
    useState(null);

  const [replyingReviewId, setReplyingReviewId] =
    useState(null);

  const [replyText, setReplyText] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] =
    useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const isOrganizerOwner =
    isAuthenticated &&
    user?.role === "ORGANIZER" &&
    Number(user?.id) === Number(eventOrganizerId);

  const fetchReviewsData = useCallback(
    async () => {
      const [reviewsResponse, summaryResponse] =
        await Promise.all([
          api.get(`/reviews/events/${eventId}/`),
          api.get(
            `/reviews/events/${eventId}/summary/`,
          ),
        ]);

      return {
        reviews:
          reviewsResponse.data.results ||
          reviewsResponse.data ||
          [],
        summary: summaryResponse.data,
      };
    },
    [eventId],
  );

  const loadReviews = async () => {
    try {
      const data = await fetchReviewsData();

      setReviews(data.reviews);

      setSummary(data.summary);
    } catch (requestError) {
      setError(
        requestError.response?.data?.detail ||
          "Unable to load reviews.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const data = await fetchReviewsData();

        if (active) {
          setReviews(data.reviews);

          setSummary(data.summary);
        }
      } catch (requestError) {
        if (active) {
          setError(
            requestError.response?.data?.detail ||
              "Unable to load reviews.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [fetchReviewsData]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      if (editingReviewId) {
        await api.patch(
          `/reviews/${editingReviewId}/`,
          formData,
        );

        setMessage("Review updated successfully.");
      } else {
        await api.post(
          `/reviews/events/${eventId}/`,
          formData,
        );

        setMessage("Review submitted successfully.");
      }

      setFormData({
        rating: 5,
        comment: "",
      });

      setEditingReviewId(null);

      await loadReviews();
    } catch (requestError) {
      const apiError = requestError.response?.data;

      setError(
        apiError?.detail ||
          apiError?.comment?.[0] ||
          apiError?.rating?.[0] ||
          apiError?.non_field_errors?.[0] ||
          "Unable to submit review.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const startEditing = (review) => {
    setEditingReviewId(review.id);

    setFormData({
      rating: review.rating,
      comment: review.comment,
    });

    setMessage("");
    setError("");

    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: "smooth",
    });
  };

  const cancelEditing = () => {
    setEditingReviewId(null);

    setFormData({
      rating: 5,
      comment: "",
    });
  };

  const deleteReview = async (reviewId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this review?",
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setMessage("");

    try {
      await api.delete(`/reviews/${reviewId}/`);

      setMessage("Review deleted successfully.");

      await loadReviews();
    } catch (requestError) {
      setError(
        requestError.response?.data?.detail ||
          "Unable to delete review.",
      );
    }
  };

  const submitReply = async (reviewId) => {
    if (!replyText.trim()) {
      setError("Enter a reply.");
      return;
    }

    setError("");
    setMessage("");

    try {
      await api.post(
        `/reviews/${reviewId}/reply/`,
        {
          reply: replyText.trim(),
        },
      );

      setReplyText("");
      setReplyingReviewId(null);

      setMessage("Reply added successfully.");

      await loadReviews();
    } catch (requestError) {
      setError(
        requestError.response?.data?.detail ||
          requestError.response?.data?.reply?.[0] ||
          "Unable to submit reply.",
      );
    }
  };

  return (
    <section className="rounded-2xl bg-white p-7 shadow-sm">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Reviews and Ratings
          </h2>

          <p className="mt-2 text-slate-500">
            Feedback shared by event participants.
          </p>
        </div>

        <div className="text-left sm:text-right">
          <div className="flex items-center gap-2 sm:justify-end">
            <Star
              size={24}
              className="fill-amber-400 text-amber-400"
            />

            <span className="text-3xl font-bold text-slate-900">
              {Number(
                summary.average_rating || 0,
              ).toFixed(1)}
            </span>
          </div>

          <p className="mt-1 text-sm text-slate-500">
            {summary.review_count} review
            {summary.review_count === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      <RatingBreakdown summary={summary} />

      {message && (
        <div className="mt-6 rounded-lg bg-green-50 px-4 py-3 text-green-700">
          {message}
        </div>
      )}

      {error && (
        <div className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-red-700">
          {error}
        </div>
      )}

      <div className="mt-8 border-t border-slate-200 pt-8">
        {loading ? (
          <p className="py-8 text-center text-slate-500">
            Loading reviews...
          </p>
        ) : reviews.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center">
            <p className="text-slate-500">
              No reviews have been added yet.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {reviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                isOrganizerOwner={isOrganizerOwner}
                replyingReviewId={replyingReviewId}
                replyText={replyText}
                onEdit={startEditing}
                onDelete={deleteReview}
                onStartReply={(reviewId) => {
                  setReplyingReviewId(reviewId);
                  setReplyText(
                    review.organizer_reply || "",
                  );
                }}
                onCancelReply={() => {
                  setReplyingReviewId(null);
                  setReplyText("");
                }}
                onReplyTextChange={setReplyText}
                onSubmitReply={submitReply}
              />
            ))}
          </div>
        )}
      </div>

      {isAuthenticated && user?.role === "USER" && (
        <ReviewForm
          formData={formData}
          editingReviewId={editingReviewId}
          submitting={submitting}
          onChange={setFormData}
          onSubmit={handleSubmit}
          onCancel={cancelEditing}
        />
      )}

      {!isAuthenticated && (
        <div className="mt-8 rounded-xl bg-slate-50 p-5 text-center text-slate-600">
          Log in to submit a review.
        </div>
      )}
    </section>
  );
}

function RatingBreakdown({ summary }) {
  const total = summary.review_count || 0;

  return (
    <div className="mt-7 max-w-xl space-y-3">
      {[5, 4, 3, 2, 1].map((rating) => {
        const count =
          summary.rating_breakdown?.[rating] ||
          summary.rating_breakdown?.[
            String(rating)
          ] ||
          0;

        const percentage =
          total === 0 ? 0 : (count / total) * 100;

        return (
          <div
            key={rating}
            className="flex items-center gap-3"
          >
            <span className="w-8 text-sm font-medium text-slate-600">
              {rating}
            </span>

            <Star
              size={15}
              className="fill-amber-400 text-amber-400"
            />

            <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-amber-400"
                style={{
                  width: `${percentage}%`,
                }}
              />
            </div>

            <span className="w-8 text-right text-sm text-slate-500">
              {count}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function ReviewCard({
  review,
  isOrganizerOwner,
  replyingReviewId,
  replyText,
  onEdit,
  onDelete,
  onStartReply,
  onCancelReply,
  onReplyTextChange,
  onSubmitReply,
}) {
  return (
    <article className="rounded-xl border border-slate-200 p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="flex gap-4">
          <div className="h-12 w-12 overflow-hidden rounded-full bg-indigo-50">
            {review.user_profile_image ? (
              <img
                src={review.user_profile_image}
                alt={review.username}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-indigo-700">
                <User size={22} />
              </div>
            )}
          </div>

          <div>
            <h3 className="font-bold text-slate-900">
              {review.user_full_name}
            </h3>

            <p className="text-sm text-slate-500">
              @{review.username}
            </p>

            <div className="mt-2 flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={16}
                  className={
                    star <= review.rating
                      ? "fill-amber-400 text-amber-400"
                      : "text-slate-300"
                  }
                />
              ))}
            </div>
          </div>
        </div>

        <div className="text-sm text-slate-500">
          {new Date(
            review.created_at,
          ).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </div>
      </div>

      <p className="mt-5 whitespace-pre-line leading-7 text-slate-600">
        {review.comment}
      </p>

      {review.organizer_reply && (
        <div className="mt-5 rounded-xl bg-indigo-50 p-5">
          <div className="flex items-center gap-2 font-semibold text-indigo-800">
            <MessageCircle size={17} />
            Organizer Reply
          </div>

          <p className="mt-3 leading-7 text-slate-700">
            {review.organizer_reply}
          </p>

          {review.replied_at && (
            <p className="mt-3 text-xs text-slate-500">
              Replied on{" "}
              {new Date(
                review.replied_at,
              ).toLocaleDateString("en-IN")}
            </p>
          )}
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        {review.is_owner && (
          <>
            <button
              type="button"
              onClick={() => onEdit(review)}
              className="inline-flex items-center gap-2 rounded-lg border border-indigo-700 px-4 py-2 font-semibold text-indigo-700 hover:bg-indigo-50"
            >
              <Edit size={16} />
              Edit
            </button>

            <button
              type="button"
              onClick={() => onDelete(review.id)}
              className="inline-flex items-center gap-2 rounded-lg border border-red-600 px-4 py-2 font-semibold text-red-600 hover:bg-red-50"
            >
              <Trash2 size={16} />
              Delete
            </button>
          </>
        )}

        {isOrganizerOwner && (
          <button
            type="button"
            onClick={() =>
              onStartReply(review.id)
            }
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-700 px-4 py-2 font-semibold text-white hover:bg-indigo-800"
          >
            <MessageCircle size={16} />
            {review.organizer_reply
              ? "Edit Reply"
              : "Reply"}
          </button>
        )}
      </div>

      {replyingReviewId === review.id && (
        <div className="mt-5 space-y-3">
          <textarea
            rows={4}
            value={replyText}
            onChange={(event) =>
              onReplyTextChange(event.target.value)
            }
            placeholder="Write an organizer reply"
            className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500"
          />

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancelReply}
              className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() =>
                onSubmitReply(review.id)
              }
              className="rounded-lg bg-indigo-700 px-4 py-2 font-semibold text-white"
            >
              Submit Reply
            </button>
          </div>
        </div>
      )}
    </article>
  );
}

function ReviewForm({
  formData,
  editingReviewId,
  submitting,
  onChange,
  onSubmit,
  onCancel,
}) {
  return (
    <div className="mt-8 border-t border-slate-200 pt-8">
      <h3 className="text-xl font-bold text-slate-900">
        {editingReviewId
          ? "Edit Your Review"
          : "Write a Review"}
      </h3>

      <form
        onSubmit={onSubmit}
        className="mt-5 space-y-5"
      >
        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">
            Rating
          </p>

          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((rating) => (
              <button
                key={rating}
                type="button"
                aria-label={`Rate ${rating} out of 5`}
                aria-pressed={rating <= formData.rating}
                onClick={() =>
                  onChange((previous) => ({
                    ...previous,
                    rating,
                  }))
                }
                className="rounded-full p-1 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <Star
                  size={30}
                  className={
                    rating <= formData.rating
                      ? "fill-amber-400 text-amber-400"
                      : "text-slate-300"
                  }
                />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label
            htmlFor="review-comment"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Review
          </label>

          <textarea
            id="review-comment"
            rows={6}
            value={formData.comment}
            onChange={(event) =>
              onChange((previous) => ({
                ...previous,
                comment: event.target.value,
              }))
            }
            placeholder="Share your experience"
            required
            className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-indigo-700 px-5 py-3 font-semibold text-white hover:bg-indigo-800 disabled:opacity-60"
          >
            {submitting
              ? "Submitting..."
              : editingReviewId
                ? "Update Review"
                : "Submit Review"}
          </button>

          {editingReviewId && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-slate-300 px-5 py-3 font-semibold text-slate-700"
            >
              Cancel Editing
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export default ReviewsSection;