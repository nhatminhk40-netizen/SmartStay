import React, { useState } from "react";
import { X, Users, Check, Heart, ArrowRight, ArrowLeft, Radar, Phone, Sparkles } from "lucide-react";
import { QUIZ_QUESTIONS, MOCK_CANDIDATES, calcCompatibility } from "@/lib/smartstayData";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";

export default function RoommateQuiz({ open, onClose, onComplete }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [done, setDone] = useState(false);
  const [userName, setUserName] = useState("Sinh viên SmartStay");
  const [contactZalo, setContactZalo] = useState("");

  if (!open) return null;

  const currentQ = QUIZ_QUESTIONS[step];
  const isLast = step === QUIZ_QUESTIONS.length - 1;
  const progress = ((step + (done ? 1 : 0)) / QUIZ_QUESTIONS.length) * 100;

  const pick = async (optionId) => {
    const nextAnswers = { ...answers, [currentQ.id]: optionId };
    setAnswers(nextAnswers);

    if (isLast) {
      setDone(true);
      onComplete?.(nextAnswers);
      // Gửi hồ sơ lên backend
      try {
        await base44.entities.Survey.create({
          name: userName,
          contactZalo: contactZalo || "0901234567",
          campus: "FPT Can Tho",
          gender: "Linh hoạt",
          ...nextAnswers
        });
      } catch (err) {
        console.warn("Lưu survey lên backend:", err);
      }
    } else {
      setStep(step + 1);
    }
  };

  const candidates = done
    ? MOCK_CANDIDATES.map((c) => ({
        ...c,
        compat: calcCompatibility(answers, c.answers)
      })).sort((a, b) => b.compat - a.compat)
    : [];

  const reset = () => {
    setStep(0);
    setAnswers({});
    setDone(false);
  };

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
                <div className="font-display font-bold text-base">Smart Matcher (Tìm bạn ở ghép)</div>
                <div className="text-[11px] text-indigo-100">5 câu hỏi thói quen sống · tính % tương thích</div>
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
              <h3 className="font-display font-bold text-slate-900 text-base mb-1">{currentQ.text}</h3>
              <p className="text-xs text-slate-400 mb-4">Chọn phương án phản ánh đúng nhất nếp sống của bạn:</p>

              <div className="space-y-2.5">
                {currentQ.options.map((opt) => {
                  const isSelected = answers[currentQ.id] === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => pick(opt.id)}
                      className={cn(
                        "w-full flex items-center justify-between p-3.5 rounded-2xl border-2 transition-all text-left group",
                        isSelected
                          ? "border-indigo-600 bg-indigo-50/50 shadow-sm"
                          : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50"
                      )}
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-800">{opt.label}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{opt.desc}</div>
                      </div>
                      <div className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ml-2",
                        isSelected ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-300 group-hover:border-indigo-400"
                      )}>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {step > 0 && (
                <button onClick={() => setStep(step - 1)} className="mt-4 flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700">
                  <ArrowLeft className="w-3.5 h-3.5" /> Câu trước
                </button>
              )}
            </div>
          ) : (
            <div>
              <div className="text-center mb-5">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-2 text-emerald-600">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="font-display font-bold text-slate-900 text-lg">Ứng viên tương thích cao nhất</h3>
                <p className="text-xs text-slate-500">Mỗi tiêu chí trùng khớp đóng góp +20% độ tương thích</p>
              </div>

              <div className="space-y-3">
                {candidates.map((c) => (
                  <div key={c.id} className="p-3.5 rounded-2xl border border-slate-200 hover:border-indigo-200 hover:shadow-sm transition-all bg-white">
                    <div className="flex items-start gap-3">
                      <img src={c.avatar} alt={c.name} className="w-11 h-11 rounded-full object-cover shrink-0 border border-slate-200" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-slate-900 text-sm">{c.name}</span>
                          <span className={cn("text-xs font-extrabold px-2 py-0.5 rounded-md", c.compat >= 80 ? "bg-emerald-100 text-emerald-700" : c.compat >= 60 ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-700")}>
                            {c.compat}% tương thích
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{c.campus} · {c.gender}</div>
                        <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{c.bio}</p>

                        {/* Progress bar */}
                        <div className="mt-2.5 h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={cn("h-full rounded-full transition-all duration-500", c.compat >= 80 ? "bg-emerald-500" : c.compat >= 60 ? "bg-indigo-500" : "bg-slate-400")}
                            style={{ width: `${c.compat}%` }}
                          />
                        </div>

                        <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100">
                          <a
                            href={`https://zalo.me/${c.contactZalo}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700"
                          >
                            <Phone className="w-3.5 h-3.5" /> Kết nối Zalo: {c.contactZalo}
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {done && (
          <div className="p-4 border-t border-slate-100 flex gap-2">
            <button onClick={reset} className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50">
              Làm lại Quiz
            </button>
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-500 flex items-center justify-center gap-1.5">
              Hoàn tất <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}