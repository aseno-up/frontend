'use client'

import { useEffect, useState } from 'react'
import { WhatsAppQRCode } from '@/types/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface QRCodeDisplayProps {
  qrCode: WhatsAppQRCode | null
  isLoading: boolean
  error?: string
  onRefresh: () => void
}

export function QRCodeDisplay({ qrCode, isLoading, error, onRefresh }: QRCodeDisplayProps) {
  const [countdown, setCountdown] = useState(60)

  useEffect(() => {
    if (qrCode && countdown > 0) {
      const timer = setInterval(() => {
        setCountdown((prev) => prev - 1)
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [qrCode, countdown])

  useEffect(() => {
    if (countdown === 0) {
      onRefresh()
      setCountdown(60)
    }
  }, [countdown, onRefresh])

  useEffect(() => {
    if (qrCode) {
      setCountdown(60)
    }
  }, [qrCode])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>QR Code</CardTitle>
          <CardDescription>Carregando QR Code...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <div className="animate-pulse bg-gray-200 w-64 h-64 rounded-lg" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Erro ao Carregar QR Code</CardTitle>
          <CardDescription className="text-red-500">{error}</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button onClick={onRefresh} variant="outline">
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!qrCode) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>QR Code</CardTitle>
          <CardDescription>
            QR Code nao disponivel. Clique para atualizar.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button onClick={onRefresh} variant="outline">
            Gerar QR Code
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>QR Code</CardTitle>
        <CardDescription>
          Escaneie com o WhatsApp para conectar. Expira em {countdown}s (tentativa {qrCode.count}/5)
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <div className="bg-white p-4 rounded-lg shadow-inner">
          {qrCode.base64 ? (
            <img
              src={qrCode.base64.startsWith('data:') ? qrCode.base64 : `data:image/png;base64,${qrCode.base64}`}
              alt="WhatsApp QR Code"
              className="w-64 h-64"
            />
          ) : (
            <div className="w-64 h-64 flex items-center justify-center bg-gray-100 rounded">
              <p className="text-sm text-muted-foreground">QR Code indisponivel</p>
            </div>
          )}
        </div>
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-2">
            Abra o WhatsApp no seu celular
          </p>
          <ol className="text-xs text-muted-foreground text-left list-decimal list-inside space-y-1">
            <li>Toque em Menu ou Configuracoes</li>
            <li>Selecione Dispositivos Conectados</li>
            <li>Toque em Conectar Dispositivo</li>
            <li>Aponte seu celular para esta tela</li>
          </ol>
        </div>
        <Button onClick={onRefresh} variant="outline" size="sm">
          Atualizar QR Code
        </Button>
      </CardContent>
    </Card>
  )
}
