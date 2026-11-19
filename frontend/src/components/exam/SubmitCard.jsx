import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ConfirmDialog from "../common/ConfirmDialog";
import Toast from "../common/Toast";
import api from "../../services/api";

const SubmitCard = ({ sessionId, beforeSubmit }) => {
  const navigate = useNavigate();
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const handleSubmit = async () => {
    if (!sessionId) {
      setToast({
        type: "error",
        message: "No active session ID found. Cannot submit exam.",
      });
      setShowConfirm(false);
      return;
    }

    try {
      setSubmitting(true);
      // Make sure every pending answer is saved before the session is closed
      if (beforeSubmit) await beforeSubmit();
      await api.put(`/sessions/${sessionId}/end`);

      setToast({
        type: "success",
        message: "Exam submitted successfully! Redirecting to results...",
      });

      setTimeout(() => {
        navigate(`/student/results?sessionId=${sessionId}`, { replace: true });
      }, 1000);
    } catch (err) {
      console.error("End session error:", err);
      setToast({
        type: "error",
        message:
          err.response?.data?.message ||
          "Failed to submit exam session. Please try again.",
      });
      setShowConfirm(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-[#121520] border border-white/7 rounded-xl p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-white tracking-tight mb-2">
        Finish Assessment
      </h2>

      <p className="text-slate-400 text-xs mb-4 leading-relaxed">
        Ensure all questions are reviewed before final submission. This action is irreversible.
      </p>

      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        disabled={submitting}
        className="w-full bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-semibold text-xs py-2.5 rounded-lg transition active:scale-[0.98] shadow-sm"
      >
        {submitting ? "Submitting..." : "Submit Final Exam"}
      </button>

      {/* Confirmation Dialog */}
      {showConfirm && (
        <ConfirmDialog
          isOpen={showConfirm}
          title="Submit Final Exam"
          message="Are you sure you want to finish and submit your exam? You will not be able to change your answers after submission."
          confirmText={submitting ? "Submitting..." : "Yes, Submit Exam"}
          isDestructive={true}
          onConfirm={handleSubmit}
          onCancel={() => setShowConfirm(false)}
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default SubmitCard;
