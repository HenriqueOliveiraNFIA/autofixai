'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Plus, Calendar as CalendarIcon, Trash2 } from 'lucide-react'

interface AgendaItem {
  id: string
  data: string
  hora: string
  servico: string
  descricao?: string
  car_id?: string
}

interface Car {
  id: string
  marca: string
  modelo: string
  matricula: string
}

export default function AgendaPage() {
  const router = useRouter()
  const [agenda, setAgenda] = useState<AgendaItem[]>([])
  const [cars, setCars] = useState<Car[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newEvent, setNewEvent] = useState({
    data: '',
    hora: '',
    servico: '',
    descricao: '',
    car_id: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const userId = localStorage.getItem('userId')
    if (!userId) {
      router.push('/login')
      return
    }

    try {
      // Carregar agenda
      const { data: agendaData } = await supabase
        .from('agenda')
        .select('*')
        .eq('owner_id', userId)
        .order('data', { ascending: true })
        .order('hora', { ascending: true })

      setAgenda(agendaData || [])

      // Carregar carros para seleção
      const { data: carsData } = await supabase
        .from('cars')
        .select('id, marca, modelo, matricula')
        .eq('owner_id', userId)

      setCars(carsData || [])
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddEvent = async () => {
    const userId = localStorage.getItem('userId')
    if (!userId) return

    try {
      await supabase.from('agenda').insert({
        owner_id: userId,
        data: newEvent.data,
        hora: newEvent.hora,
        servico: newEvent.servico,
        descricao: newEvent.descricao,
        car_id: newEvent.car_id || null
      })

      setIsAddDialogOpen(false)
      setNewEvent({ data: '', hora: '', servico: '', descricao: '', car_id: '' })
      loadData()
    } catch (error) {
      console.error('Erro ao adicionar evento:', error)
      alert('Erro ao adicionar evento')
    }
  }

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Deseja realmente apagar este evento?')) return

    try {
      await supabase.from('agenda').delete().eq('id', id)
      loadData()
    } catch (error) {
      console.error('Erro ao apagar evento:', error)
      alert('Erro ao apagar evento')
    }
  }

  const groupByDate = (items: AgendaItem[]) => {
    const grouped: { [key: string]: AgendaItem[] } = {}
    items.forEach(item => {
      if (!grouped[item.data]) {
        grouped[item.data] = []
      }
      grouped[item.data].push(item)
    })
    return grouped
  }

  const groupedAgenda = groupByDate(agenda)

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
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={() => router.push('/dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <h1 className="text-xl font-bold text-gray-900">Agenda</h1>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#ff8c00] hover:bg-[#e67e00]">
                <Plus className="w-4 h-4 mr-2" />
                Nova Marcação
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Marcação</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="data">Data</Label>
                    <Input
                      id="data"
                      type="date"
                      value={newEvent.data}
                      onChange={(e) => setNewEvent({ ...newEvent, data: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hora">Hora</Label>
                    <Input
                      id="hora"
                      type="time"
                      value={newEvent.hora}
                      onChange={(e) => setNewEvent({ ...newEvent, hora: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="servico">Serviço</Label>
                  <Input
                    id="servico"
                    value={newEvent.servico}
                    onChange={(e) => setNewEvent({ ...newEvent, servico: e.target.value })}
                    placeholder="Ex: Revisão completa"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="car_id">Carro (opcional)</Label>
                  <select
                    id="car_id"
                    value={newEvent.car_id}
                    onChange={(e) => setNewEvent({ ...newEvent, car_id: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="">Selecione um carro</option>
                    {cars.map(car => (
                      <option key={car.id} value={car.id}>
                        {car.marca} {car.modelo} - {car.matricula}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descricao">Descrição</Label>
                  <Textarea
                    id="descricao"
                    value={newEvent.descricao}
                    onChange={(e) => setNewEvent({ ...newEvent, descricao: e.target.value })}
                    placeholder="Detalhes adicionais..."
                    rows={3}
                  />
                </div>
                <Button 
                  className="w-full bg-[#ff8c00] hover:bg-[#e67e00]"
                  onClick={handleAddEvent}
                >
                  Adicionar Marcação
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {agenda.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Ainda não tem marcações agendadas</p>
              <Button 
                className="bg-[#ff8c00] hover:bg-[#e67e00]"
                onClick={() => setIsAddDialogOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeira Marcação
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedAgenda).map(([date, events]) => (
              <Card key={date}>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CalendarIcon className="w-5 h-5 mr-2 text-[#ff8c00]" />
                    {new Date(date + 'T00:00:00').toLocaleDateString('pt-PT', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {events.map((event) => (
                      <div key={event.id} className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-[#ff8c00]">{event.hora}</span>
                            <span className="text-gray-900 font-medium">{event.servico}</span>
                          </div>
                          {event.descricao && (
                            <p className="text-sm text-gray-600">{event.descricao}</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteEvent(event.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
