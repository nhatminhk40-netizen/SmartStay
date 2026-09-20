import React, { useState } from "react";
import { X, Users, Check, Heart, ArrowRight, ArrowLeft, Radar } from "lucide-react";
import { QUIZ_QUESTIONS, MOCK_CANDIDATES, calcCompatibility } from "@/lib/smartstayData";
import { cn } from "@/lib/utils";

export default function RoommateQuiz({ open, onClose, onComplete }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [done, setDone] = useState(false);

  if (!open) return null;

  const isLast = step === QUIZ_QUESTIONS.length - 1;
  const progress = ((step + (done ? 1 : 0)) / QUIZ_QUESTIONS.length) * 100;

  const pick = (opt) => {
    const next = [...answers];
    next[step] = opt;
    setAnswers(next);
    if (isLast) {
      setDone(true);
      onComplete?.(next);
    } else {
      setStep(step + 1);
    }
  };

  const candidates = done
    ? MOCK_CANDIDATES.map((c) => ({ ...c, compat: calcCompatibility(answers, c.answers) })).sort((a, b) => b.compat - a.compat)
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-indigo-600 p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                <Radar className="w-5 h-5" />
              </div>
              <div>
                <div className="font-display font-bold text-base">Roommate Matcher</div>
                <div className="text-[11px] text-indigo-100">5 câu hỏi · tính % tương thích</div>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20">
              <X className="w-4 h-4" />
            </button>
          </div>
          {!done && (
            <>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-indigo-100">Câu {step + 1} / {QUIZ_QUESTIONS.length}</span>
                <span className="font-bold">{Math.round(progress)}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/20 overflow-hidden">
                <div className="h-full bg-white rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
            </>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {!done ? (
            <div>
              <h3 className="font-display font-bold text-slate-900 text-lg mb-4">{QUIZ_QUESTIONS[step].q}</h3>
              <div className="space-y-2">
                {QUIZ_QUESTIONS[step].options.map((opt, i) => (
                  <button
                    key={opt}
                    onClick={() => pick(opt)}
                    className="w-full flex items-center justify-between p-3.5 rounded-xl border-2 border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 transition-all text-left group"
                  >
                    <span className="text-sm font-semibold text-slate-700">{opt}</span>
                    <div className="w-6 h-6 rounded-full border-2 border-slate-200 group-hover:border-indigo-500 flex items-center justify-center">
                      {answers[step] === opt && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                    </div>
                  </button>
                ))}
              </div>
              {step > 0 && (
                <button onClick={() => setStep(step - 1)} className="mt-4 flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
                  <ArrowLeft className="w-4 h-4" /> Quay lại
                </button>
              )}
            </div>
          ) : (
            <div>
              <div className="text-center mb-4">
                <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-2">
                  <Heart className="w-7 h-7 text-emerald-600" />
                </div>
                <h3 className="font-display font-bold text-slate-900 text-lg">Ứng viên ghép phòng</h3>
                <p className="text-sm text-slate-500">Sắp xếp theo % tương thích thói quen</p>
              </div>
              <div className="space-y-2.5">
                {candidates.map((c) => (
                  <div key={c.display_name} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-indigo-300 transition-colors">
                    <div className="w-11 h-11 rounded-full bg-indigo-100 flex items-center justify-center text-xl shrink-0">
                      {c.avatar_emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{c.display_name}</span>
                        <span className="text-[10px] text-slate-400">{c.campus}</span>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-1">{c.bio}</p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={cn("h-full rounded-full", c.compat >= 70 ? "bg-emerald-500" : c.compat >= 40 ? "bg-amber-400" : "bg-slate-400")}
                            style={{ width: `${c.compat}%` }}
                          />
                        </div>
                        <span className={cn("text-xs font-bold", c.compat >= 70 ? "text-emerald-600" : c.compat >= 40 ? "text-amber-600" : "text-slate-500")}>
                          {c.compat}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {done && (
          <div className="p-4 border-t border-slate-100">
            <button onClick={onClose} className="w-full py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-500 flex items-center justify-center gap-2">
              Hoàn tất <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}