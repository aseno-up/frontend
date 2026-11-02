"use client"

import { useState } from "react"

// --- Hardcoded data ---

const consultationReviews = [
  {
    initials: "M",
    name: "Marcos",
    date: "5 de março de 2026",
    professional: "Dra. Ana Carolina Bispo de Araújo",
    procedure: "Consulta Psicologia",
    rating: 5,
    text: "Foi o meu primeiro contato com terapia, ainda me adaptando em poder falar sobre minha vida.",
    badges: ["Consulta verificada"],
  },
  {
    initials: "A",
    name: "Adnei",
    date: "4 de março de 2026",
    professional: "Dra. Ana Carolina Bispo de Araújo",
    procedure: "Consulta Psicologia",
    rating: 5,
    text: "Desenvolve um excelente trabalho, consegue deixar o paciente a vontade para expressar o que sente.",
    badges: ["Consulta verificada"],
  },
  {
    initials: "V",
    name: "VCMB",
    date: "fevereiro 2026",
    professional: "Dra. Carla Santos",
    procedure: "Estética Facial",
    rating: 5,
    text: "Tratamento impecável. Me senti acolhida desde a primeira sessão e os resultados superaram minhas expectativas.",
    badges: ["Opinião verificada"],
  },
  {
    initials: "P",
    name: "Pedro C.",
    date: "dezembro 2025",
    professional: "Dra. Carla Santos",
    procedure: "Drenagem Linfática",
    rating: 4,
    text: "Ótimo tratamento, clínica bem organizada. O único ponto a melhorar é o tempo de espera na recepção.",
    badges: ["Consulta verificada"],
  },
]

const professionalReviews = [
  {
    initials: "AC",
    name: "Dra. Ana Carolina Bispo de Araújo",
    specialty: "Psicóloga",
    rating: 5,
    totalReviews: 81,
    hasBooking: true,
  },
  {
    initials: "RC",
    name: "Dra. Rafaela Carneiro Donadone",
    specialty: "Psiquiatra",
    rating: 5,
    totalReviews: 29,
    hasBooking: true,
  },
  {
    initials: "JC",
    name: "Jeane Costa de Jesus",
    specialty: "Psicólogo",
    rating: 0,
    totalReviews: 0,
    hasBooking: false,
  },
  {
    initials: "MR",
    name: "Mariana Riccio",
    specialty: "Psicóloga",
    rating: 5,
    totalReviews: 2,
    hasBooking: false,
  },
  {
    initials: "CJ",
    name: "Costa Junior",
    specialty: "Psicólogo",
    rating: 0,
    totalReviews: 0,
    hasBooking: false,
  },
]

// --- Components ---

function Stars({ count }: { count: number }) {
  return (
    <span className="text-amber-500 text-[15px] tracking-wider">
      {"★".repeat(count)}
      {"☆".repeat(5 - count)}
    </span>
  )
}

function SmallStars({ count, size = "text-sm" }: { count: number; size?: string }) {
  return (
    <span className={`text-amber-500 ${size} tracking-wider`}>
      {"★".repeat(count)}
      {"☆".repeat(5 - count)}
    </span>
  )
}

type SubTab = "consultas" | "profissionais"

export function ReviewsTab() {
  const [subTab, setSubTab] = useState<SubTab>("consultas")

  const total = consultationReviews.length
  const avg = (consultationReviews.reduce((s, r) => s + r.rating, 0) / total).toFixed(1)
  const dist = [0, 0, 0, 0, 0]
  consultationReviews.forEach((r) => dist[r.rating - 1]++)

  return (
    <>
      {/* Summary (always visible) */}
      <div className="flex items-center gap-6 p-5 bg-white border border-slate-200 rounded-xl mb-4">
        <div className="text-center min-w-[70px]">
          <div className="text-[42px] font-semibold leading-none text-slate-900">{avg}</div>
          <Stars count={Math.round(Number(avg))} />
          <div className="text-xs text-slate-500">{total} avaliações</div>
        </div>
        <div className="flex-1">
          {[5, 4, 3, 2, 1].map((n) => (
            <div key={n} className="flex items-center gap-2 mb-1">
              <span className="text-xs text-slate-500 min-w-[12px] text-right">{n}</span>
              <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{ width: `${(dist[n - 1] / total) * 100}%` }}
                />
              </div>
              <span className="text-[11px] text-slate-500 min-w-[20px]">{dist[n - 1]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-0 border-b border-slate-200 mb-4">
        <button
          onClick={() => setSubTab("consultas")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-[1px] transition-colors cursor-pointer bg-transparent ${
            subTab === "consultas"
              ? "border-[#0891b2] text-[#0891b2]"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          Consultas
        </button>
        <button
          onClick={() => setSubTab("profissionais")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-[1px] transition-colors cursor-pointer bg-transparent ${
            subTab === "profissionais"
              ? "border-[#0891b2] text-[#0891b2]"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          Profissionais
        </button>
      </div>

      {/* Consultation reviews */}
      {subTab === "consultas" && (
        <>
          {consultationReviews.map((review, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-xl p-[18px] mb-3">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-xs font-semibold text-blue-800">
                    {review.initials}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{review.name}</span>
                      {review.badges.map((badge, j) => (
                        <span
                          key={j}
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                            badge.includes("Consulta")
                              ? "bg-green-50 text-green-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {badge}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <Stars count={review.rating} />
              </div>
              <p className="text-[13px] text-slate-600 leading-relaxed mb-2">{review.text}</p>
              <div className="text-xs text-slate-400">
                {review.date} · {review.professional} · {review.procedure}
              </div>
            </div>
          ))}
        </>
      )}

      {/* Professional reviews */}
      {subTab === "profissionais" && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {professionalReviews.map((prof, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 px-4 py-3.5 ${
                i < professionalReviews.length - 1 ? "border-b border-slate-100" : ""
              }`}
            >
              {/* Avatar */}
              <div className="w-11 h-11 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-sm font-semibold text-slate-500 shrink-0">
                {prof.initials}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-900 truncate">{prof.name}</div>
                <div className="text-xs text-slate-400">{prof.specialty}</div>
                {prof.totalReviews > 0 && (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <SmallStars count={prof.rating} size="text-xs" />
                    <span className="text-xs text-slate-400">{prof.totalReviews} opiniões</span>
                  </div>
                )}
              </div>

              {/* Action */}
              {prof.hasBooking && (
                <button className="px-4 py-1.5 rounded-md bg-[#0891b2] text-white text-xs font-medium cursor-pointer border-none hover:bg-[#0e7490] transition-colors shrink-0">
                  Agendar
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  )
}
