'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { Car, Calendar, User, LogOut, Wrench, FileText, History } from 'lucide-react'

interface Profile {
  nome_oficina?: string
  nome?: string
}

interface AgendaItem {
  id: string
  data: string
  hora: string
  servico: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [totalCars, setTotalCars] = useState(0)
  const [totalTrabalhos, setTotalTrabalhos] = useState(0)
  const [totalFolhas, setTotalFolhas] = useState(0)
  const [nextAppointments, setNextAppointments] = useState<AgendaItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    const userId = localStorage.getItem('userId')
    if (!userId) {
      router.push('/login')
      return
    }

    try {
      // Carregar perfil
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('auth_id', userId)
        .single()

      setProfile(profileData)

      // Carregar total de carros
      const { data: carsData } = await supabase
        .from('cars')
        .select('id')
        .eq('owner_id', userId)

      setTotalCars(carsData?.length || 0)

      // Carregar total de trabalhos pendentes
      const { data: trabalhosData } = await supabase
        .from('trabalhos')
        .select('id')
        .eq('owner_id', userId)
        .in('status', ['a_resolver', 'em_andamento'])

      setTotalTrabalhos(trabalhosData?.length || 0)

      // Carregar total de folhas de obra
      const { data: folhasData } = await supabase
        .from('folhas_obra')
        .select('id')
        .eq('owner_id', userId)

      setTotalFolhas(folhasData?.length || 0)

      // Carregar próximas marcações
      const today = new Date().toISOString().split('T')[0]
      const { data: agendaData } = await supabase
        .from('agenda')
        .select('*')
        .eq('owner_id', userId)
        .gte('data', today)
        .order('data', { ascending: true })
        .limit(5)

      setNextAppointments(agendaData || [])
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('userId')
    localStorage.removeItem('userEmail')
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ff8c00] mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#ff8c00] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">AF</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {profile?.nome_oficina || 'AutoFix AI'}
              </h1>
              <p className="text-sm text-gray-600">{profile?.nome || 'Oficina'}</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h2>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-[#ff8c00] hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/carros')}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total de Carros</CardTitle>
              <Car className="w-5 h-5 text-[#ff8c00]" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{totalCars}</div>
              <p className="text-xs text-gray-500 mt-1">Veículos registrados</p>
            </CardContent>
          </Card>

          <Card className="border-[#ff8c00] hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/trabalhos')}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Trabalhos Pendentes</CardTitle>
              <Wrench className="w-5 h-5 text-[#ff8c00]" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{totalTrabalhos}</div>
              <p className="text-xs text-gray-500 mt-1">A resolver ou em andamento</p>
            </CardContent>
          </Card>

          <Card className="border-[#ff8c00] hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/folhas-obra')}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Folhas de Obra</CardTitle>
              <FileText className="w-5 h-5 text-[#ff8c00]" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{totalFolhas}</div>
              <p className="text-xs text-gray-500 mt-1">Documentos gerados</p>
            </CardContent>
          </Card>

          <Card className="border-[#ff8c00] hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/agenda')}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Próximas Marcações</CardTitle>
              <Calendar className="w-5 h-5 text-[#ff8c00]" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{nextAppointments.length}</div>
              <p className="text-xs text-gray-500 mt-1">Agendamentos futuros</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 lg:grid-cols-6 gap-4">
            <Button className="bg-[#ff8c00] hover:bg-[#e67e00]" onClick={() => router.push('/carros')}>
              <Car className="w-4 h-4 mr-2" />
              Adicionar Carro
            </Button>
            <Button className="bg-[#ff8c00] hover:bg-[#e67e00]" onClick={() => router.push('/trabalhos')}>
              <Wrench className="w-4 h-4 mr-2" />
              Novo Trabalho
            </Button>
            <Button className="bg-[#ff8c00] hover:bg-[#e67e00]" onClick={() => router.push('/folhas-obra')}>
              <FileText className="w-4 h-4 mr-2" />
              Ver Folhas de Obra
            </Button>
            <Button className="bg-[#ff8c00] hover:bg-[#e67e00]" onClick={() => router.push('/historico-veiculos')}>
              <History className="w-4 h-4 mr-2" />
              Histórico de Veículos
            </Button>
            <Button className="bg-[#ff8c00] hover:bg-[#e67e00]" onClick={() => router.push('/agenda')}>
              <Calendar className="w-4 h-4 mr-2" />
              Nova Marcação
            </Button>
            <Button className="bg-[#ff8c00] hover:bg-[#e67e00]" onClick={() => router.push('/perfil')}>
              <User className="w-4 h-4 mr-2" />
              Editar Perfil
            </Button>
          </CardContent>
        </Card>

        {/* Next Appointments */}
        {nextAppointments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Próximas Marcações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {nextAppointments.map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{appointment.servico}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(appointment.data).toLocaleDateString('pt-PT')} às {appointment.hora}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => router.push('/agenda')}>
                      Ver Detalhes
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
