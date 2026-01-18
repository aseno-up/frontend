'use client'

import { useEffect, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MessageSquare, Settings } from 'lucide-react'
import { Header } from '@/components/dashboard/header'
import { WhatsAppConnectionTab } from '@/components/whatsapp/connection-tab'
import { WhatsAppSettingsTab } from '@/components/whatsapp/settings-tab'

interface WhatsAppPageProps {
  params: Promise<{ lng: string }>
}

export default function WhatsAppPage({ params }: WhatsAppPageProps) {
  const [lng, setLng] = useState('pt-BR')

  useEffect(() => {
    params.then(({ lng }) => setLng(lng))
  }, [params])

  return (
    <div className="flex h-full flex-col">
      <Header lng={lng} title="WhatsApp" tutorialPage="whatsapp" />

      <div className="flex-1 overflow-auto p-4 md:p-6">
        <div className="mx-auto max-w-6xl">
          <Tabs defaultValue="conexao" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="conexao" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <span>Conexão</span>
              </TabsTrigger>
              <TabsTrigger value="configuracoes" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span>Configurações</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="conexao">
              <WhatsAppConnectionTab />
            </TabsContent>

            <TabsContent value="configuracoes">
              <WhatsAppSettingsTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
