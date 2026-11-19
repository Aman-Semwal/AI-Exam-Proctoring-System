import { useEffect, useState, useRef } from "react";
import { FaClock, FaExclamationCircle } from "react-icons/fa";
import api from "../../services/api";

const ExamTimer = ({ sessionId, onTimeExpired }) => {
  const [remainingSeconds, setRemainingSeconds] = useState(5400); // default 90m
  const [totalDurationMinutes, setTotalDurationMinutes] = useState(90);
  const [loading, setLoading] = useState(Boolean(sessionId));
  const expiredHandledRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    const initTimer = async () => {
      if (!sessionId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await api.get(`/sessions/${sessionId}`);
        const session = res.data?.data ?? res.data;

        if (isMounted && session) {
          let calculatedRemaining = null;

          if (session.endTime) {
            const end = new Date(session.endTime).getTime();
            const now = Date.now();
            calculatedRemaining = Math.max(0, Math.floor((end - now) / 1000));
          } else if (session.startTime) {
            const start = new Date(session.startTime).getTime();
            // Fetch exam duration if possible
            let durationMin = 90;
            if (session.examId) {
              try {
                const examRes = await api.get(`/exams/${session.examId}`);
                const exam = examRes.data?.data ?? examRes.data;
                if (exam?.durationMinutes) {
                  durationMin = Number(exam.durationMinutes);
                }
              } catch {
                // fallback durationMin = 90
              }
            }
            setTotalDurationMinutes(durationMin);
            const totalSec = durationMin * 60;
            const elapsedSec = Math.floor((Date.now() - start) / 1000);
            calculatedRemaining = Math.max(0, totalSec - elapsedSec);
          }

          if (calculatedRemaining !== null) {
            setRemainingSeconds(calculatedRemaining);
          }
        }
      } catch (err) {
        console.warn("Could not sync session time for timer:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initTimer();

    return () => {
      isMounted = false;
    };
  }, [sessionId]);

  // Countdown interval
  useEffect(() => {
    if (loading) return;

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (!expiredHandledRef.current) {
            expiredHandledRef.current = true;
            if (onTimeExpired) onTimeExpired();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [loading, onTimeExpired]);

  const hours = Math.floor(remainingSeconds / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);
  const seconds = remainingSeconds % 60;

  const pad = (n) => String(n).padStart(2, "0");
  const formattedTime = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

  const isLowTime = remainingSeconds <= 300 && remainingSeconds > 60;
  const isCriticalTime = remainingSeconds <= 60 && remainingSeconds > 0;
  const isExpired = remainingSeconds === 0;

  return (
    <div className="bg-[#121520] border border-white/7 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <FaClock
            size={11}
            className={
              isCriticalTime || isExpired
                ? "text-rose-400 animate-pulse"
                : isLowTime
                ? "text-amber-400"
                : "text-blue-400"
            }
          />
          Time Remaining
        </h2>
        <span className="text-[10px] text-slate-500 font-mono">
          Auto-Submit Active
        </span>
      </div>

      <div
        className={`text-center py-2.5 rounded-lg border transition-colors ${
          isExpired
            ? "bg-rose-500/10 border-rose-500/30"
            : isCriticalTime
            ? "bg-rose-500/10 border-rose-500/30"
            : isLowTime
            ? "bg-amber-500/10 border-amber-500/30"
            : "bg-[#090a0f] border-white/6"
        }`}
      >
        <h1
          className={`text-3xl font-bold font-mono tracking-wider transition-colors ${
            isExpired
              ? "text-rose-400 animate-pulse"
              : isCriticalTime
              ? "text-rose-400 animate-pulse"
              : isLowTime
              ? "text-amber-400"
              : "text-blue-400"
          }`}
        >
          {loading ? "--:--:--" : isExpired ? "00:00:00" : formattedTime}
        </h1>
        <p className="text-[11px] text-slate-500 mt-1 flex items-center justify-center gap-1">
          {isExpired ? (
            <span className="text-rose-400 font-semibold flex items-center gap-1">
              <FaExclamationCircle size={10} /> Time Expired
            </span>
          ) : (
            `Total Duration: ${totalDurationMinutes} Minutes`
          )}
        </p>
      </div>
    </div>
  );
};

export default ExamTimer;
