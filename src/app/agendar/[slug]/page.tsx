"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Loader2, AlertCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { fetchClinicInfo, fetchProfessionals, fetchSpecialties } from "./api"
import type { ClinicInfo, Professional, Specialty } from "./api"
import { ClinicHeader } from "./components/clinic-header"
import { ProfileTab } from "./components/profile-tab"
import { ReviewsTab } from "./components/reviews-tab"
import { SurveyTab } from "./components/survey-tab"

type Tab = "perfil" | "avaliacoes" | "pesquisa"

export default function AgendarPage() {
  const params = useParams()
  const slug = params.slug as string

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>("perfil")

  const [clinic, setClinic] = useState<ClinicInfo | null>(null)
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [specialties, setSpecialties] = useState<Specialty[]>([])

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        setError(null)
        const [clinicData, profData, specData] = await Promise.all([
          fetchClinicInfo(slug),
          fetchProfessionals(slug),
          fetchSpecialties(slug),
        ])
        setClinic(clinicData)
        setProfessionals(profData)
        setSpecialties(specData)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido")
      } finally {
        setLoading(false)
      }
    }
    if (slug) fetchData()
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Erro</h2>
            <p className="text-slate-500">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const brandColor = "#0891b2"

  const tabs: { key: Tab; label: string }[] = [
    { key: "perfil", label: "Perfil" },
    { key: "avaliacoes", label: "Avaliações" },
    { key: "pesquisa", label: "Pesquisa de satisfação" },
  ]

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col" style={{ "--brand": brandColor } as React.CSSProperties}>
      <div className="max-w-[860px] mx-auto px-4 py-8 flex-1 w-full">
        {/* Tabs */}
        <div className="flex border-b border-slate-200 mb-7 gap-0">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-2.5 text-sm font-medium border-b-2 -mb-[1.5px] transition-colors ${
                activeTab === tab.key
                  ? "text-slate-900"
                  : "border-transparent text-slate-400 hover:text-slate-700"
              }`}
              style={activeTab === tab.key ? { borderBottomColor: brandColor, color: brandColor } : undefined}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "perfil" && clinic && (
          <>
            <ClinicHeader clinic={clinic} slug={slug} specialties={specialties} />
            <ProfileTab
              clinic={clinic}
              professionals={professionals}
              specialties={specialties}
              slug={slug}
            />
          </>
        )}

        {activeTab === "avaliacoes" && <ReviewsTab />}

        {activeTab === "pesquisa" && clinic && <SurveyTab clinicName={clinic.name} />}

      </div>

      {/* Sticky footer */}
      <div className="py-4 text-center text-xs text-slate-400">
        Agendamento online por <strong className="text-cyan-600 font-semibold">aseno</strong>
      </div>
    </div>
  )
}
