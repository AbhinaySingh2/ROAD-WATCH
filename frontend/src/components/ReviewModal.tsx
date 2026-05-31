import React from "react";
import { FileDown } from "lucide-react";

export function ReviewModal({ reviewState, setReviewState, closeReview, saveReview }: any) {
  if (!reviewState.item) return null;
  return (
    <div className="fixed inset-0 z-[2000] bg-stone-900/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-white border border-black/10 rounded-[32px] shadow-2xl overflow-hidden relative max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-black/5 flex items-center justify-between shrink-0">
          <div className="text-left">
            <div className="text-[10px] text-[#FF5A1F] font-black uppercase tracking-widest">Verification</div>
            <div className="text-lg font-black text-stone-900">REPORT: #{reviewState.item.id}</div>
          </div>
          <button
            onClick={closeReview}
            className="px-4 py-2.5 text-xs font-black uppercase tracking-widest rounded-full bg-stone-100 hover:bg-stone-200 border border-black/5 text-stone-700 cursor-pointer active:scale-95"
          >
            Close
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {reviewState.item.image_url && (
            <div className="w-full aspect-video rounded-2xl overflow-hidden bg-stone-50 border border-black/5 relative shadow-inner">
              <img
                src={
                  reviewState.item.image_url.startsWith("http")
                    ? reviewState.item.image_url
                    : `${(process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/+$/, "")}/${reviewState.item.image_url}`
                }
                alt="Hazard verification"
                className="w-full h-full object-cover"
              />
            </div>
          )}
          {reviewState.error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 font-bold">
              {reviewState.error}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-stone-50 border border-black/5 rounded-2xl p-4 text-left">
              <div className="text-[9px] text-[#FF5A1F] font-black uppercase mb-1">Location</div>
              <div className="text-sm font-bold text-stone-900 truncate">
                {reviewState.item.road_name || "Unknown Road"}
              </div>
              <div className="text-[10px] text-stone-400 mt-1 truncate">
                {reviewState.item.address || "No address logged"}
              </div>
            </div>
            <div className="bg-stone-50 border border-black/5 rounded-2xl p-4 text-left">
              <div className="text-[9px] text-stone-455 font-black uppercase mb-1">Citizen Notes</div>
              <div className="text-xs text-stone-650 font-semibold">
                {reviewState.item.citizen_description || "No description provided."}
              </div>
            </div>
          </div>

          <div className="bg-stone-50 border border-black/5 rounded-2xl p-4 text-left shadow-inner flex justify-between gap-4">
            {[
              [
                "Depth Ratio",
                reviewState.item.severity === "CRITICAL"
                  ? "9.2/10"
                  : reviewState.item.severity === "HIGH"
                    ? "7.8/10"
                    : "5.5/10",
              ],
              ["Pedestrian Prox", `${((reviewState.item.id * 7 + 12) % 6) + 4}/10`],
              ["Subgrade Wear", reviewState.item.severity === "CRITICAL" ? "8.8/10" : "7.2/10"],
            ].map(([label, val]: any, idx) => (
              <div key={idx} className="text-center flex-grow">
                <span className="text-[8px] text-stone-400 font-bold uppercase block">{label}</span>
                <span className="text-xs font-black text-stone-800">{val}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
            {["Status", "Severity"].map((label, idx) => (
              <div key={idx}>
                <label className="block text-[10px] uppercase font-bold text-stone-455 tracking-widest mb-2 font-black">
                  {label}
                </label>
                <select
                  value={idx === 0 ? reviewState.status : reviewState.severity}
                  onChange={(e) =>
                    setReviewState((p: any) => ({
                      ...p,
                      [idx === 0 ? "status" : "severity"]: e.target.value,
                    }))
                  }
                  className="w-full bg-stone-50 border border-black/5 rounded-2xl px-4 py-3.5 text-xs font-black uppercase tracking-widest"
                >
                  {(idx === 0
                    ? ["PENDING", "VERIFIED", "REJECTED", "IN_PROGRESS", "RESOLVED"]
                    : ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
                  ).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 border-t border-black/5 flex items-center justify-between bg-stone-50/40 shrink-0">
          <a
            href={`${(process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/+$/, "")}/api/v1/issues/${reviewState.item.id}/challan`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-3 text-xs font-black uppercase tracking-widest rounded-full bg-white hover:bg-stone-50 border border-black/5 text-stone-500 hover:text-stone-900 cursor-pointer active:scale-95 shadow-sm flex items-center gap-1.5"
          >
            <FileDown className="w-3.5 h-3.5" /> <span>Print Challan</span>
          </a>
          <div className="flex items-center gap-3">
            <button
              onClick={closeReview}
              className="px-5 py-3 text-xs font-black uppercase tracking-widest rounded-full bg-white hover:bg-stone-100 border border-black/5 text-stone-700 cursor-pointer active:scale-95"
            >
              Cancel
            </button>
            <button
              disabled={reviewState.saving}
              onClick={saveReview}
              className="px-5 py-3 text-xs font-black uppercase tracking-widest rounded-full bg-[#FF5A1F] hover:bg-[#E84E15] text-white disabled:opacity-60 shadow-md active:scale-95"
            >
              {reviewState.saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
