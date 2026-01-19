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

      <div className="flex-1 overflow-hidden p-4 md:p-6 min-h-0">
        <div className="mx-auto max-w-6xl h-full flex flex-col min-h-0">
          <Tabs defaultValue="conexao" className="w-full flex-1 flex flex-col overflow-hidden min-h-0">
            <TabsList className="grid w-full grid-cols-2 mb-6 flex-shrink-0">
              <TabsTrigger value="conexao" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <span>Conexão</span>
              </TabsTrigger>
              <TabsTrigger value="configuracoes" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span>Configurações</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="conexao" className="flex-1 overflow-y-auto mt-0 min-h-0">
              <WhatsAppConnectionTab />
            </TabsContent>

            <TabsContent value="configuracoes" className="flex-1 overflow-y-auto mt-0 min-h-0">
              <WhatsAppSettingsTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
