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

      <div className="flex-1 overflow-hidden min-h-0 bg-muted/10">
        <div className="mx-auto h-full flex flex-col min-h-0">
          <Tabs defaultValue="conexao" className="w-full flex-1 flex flex-col overflow-hidden min-h-0">
            <div className="bg-background px-4 md:px-8 pt-2 border-b border-border/40 shrink-0">
              <TabsList className="flex h-12 w-full justify-start gap-4 md:gap-6 bg-transparent p-0 overflow-x-auto no-scrollbar">
                <TabsTrigger 
                  value="conexao" 
                  className="relative h-12 rounded-none border-b-2 border-transparent bg-transparent px-2 md:px-4 pb-3 pt-3 font-medium text-muted-foreground shadow-none transition-none data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none hover:text-primary flex items-center gap-2 whitespace-nowrap"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>Conexão</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="configuracoes" 
                  className="relative h-12 rounded-none border-b-2 border-transparent bg-transparent px-2 md:px-4 pb-3 pt-3 font-medium text-muted-foreground shadow-none transition-none data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none hover:text-primary flex items-center gap-2 whitespace-nowrap"
                >
                  <Settings className="h-4 w-4" />
                  <span>Configurações</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto w-full max-w-6xl mx-auto p-4 md:p-8 mt-0 min-h-0">
              <TabsContent value="conexao" className="mt-0 h-full">
                <WhatsAppConnectionTab />
              </TabsContent>

              <TabsContent value="configuracoes" className="mt-0 h-full">
                <WhatsAppSettingsTab />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
