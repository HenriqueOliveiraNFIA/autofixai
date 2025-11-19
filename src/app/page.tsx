'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function LandingPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">AF</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">AutoFix AI</h1>
          </div>
          <div className="flex space-x-4">
            <Button variant="outline" onClick={() => router.push('/login')}>
              Entrar
            </Button>
            <Button onClick={() => router.push('/register-workshop')}>
              Registrar Oficina
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-5xl font-bold text-gray-900 mb-6">
          Revolucione sua Oficina com IA
        </h2>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          Diagnóstico inteligente, gestão completa de clientes e veículos,
          orçamentos precisos e muito mais. Tudo em uma plataforma integrada
          para oficinas modernas.
        </p>
        <div className="flex justify-center space-x-4">
          <Button size="lg" onClick={() => router.push('/dashboard')}>
            Acessar Dashboard
          </Button>
          <Button size="lg" variant="outline" onClick={() => router.push('/register-workshop')}>
            Começar Agora
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Funcionalidades Avançadas
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardHeader>
                <CardTitle className="text-2xl mb-4">🤖 Diagnóstico IA</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Análise inteligente de sintomas e geração automática de diagnósticos
                  precisos para reparos automotivos.
                </p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardHeader>
                <CardTitle className="text-2xl mb-4">🚗 Gestão de Veículos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Controle completo da frota, histórico de reparos e manutenção
                  preventiva por matrícula.
                </p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardHeader>
                <CardTitle className="text-2xl mb-4">💰 Orçamentos Inteligentes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Geração automática de orçamentos com separação de mão de obra
                  e materiais, incluindo cálculo de IVA.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold mb-6">
            Pronto para transformar sua oficina?
          </h3>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Junte-se a centenas de oficinas que já estão usando o AutoFix AI
            para otimizar seus processos e aumentar a produtividade.
          </p>
          <Button size="lg" variant="secondary" onClick={() => router.push('/register-workshop')}>
            Registrar Minha Oficina
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; 2024 AutoFix AI. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  )
}