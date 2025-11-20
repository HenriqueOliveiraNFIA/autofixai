'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Plus, Car as CarIcon, Search } from 'lucide-react'

interface Car {
  id: string
  marca: string
  modelo: string
  matricula: string
  ano?: number
  km?: number
  foto_carro?: string
}

export default function CarrosPage() {
  const router = useRouter()
  const [cars, setCars] = useState<Car[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newCar, setNewCar] = useState({
    marca: '',
    modelo: '',
    matricula: '',
    ano: '',
    km: ''
  })

  useEffect(() => {
    loadCars()
  }, [])

  const loadCars = async () => {
    const userId = localStorage.getItem('userId')
    if (!userId) {
      router.push('/login')
      return
    }

    try {
      const { data } = await supabase
        .from('cars')
        .select('*')
        .eq('owner_id', userId)
        .order('data_registo', { ascending: false })

      setCars(data || [])
    } catch (error) {
      console.error('Erro ao carregar carros:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddCar = async () => {
    const userId = localStorage.getItem('userId')
    if (!userId) return

    try {
      await supabase.from('cars').insert({
        owner_id: userId,
        marca: newCar.marca,
        modelo: newCar.modelo,
        matricula: newCar.matricula,
        ano: newCar.ano ? parseInt(newCar.ano) : null,
        km: newCar.km ? parseInt(newCar.km) : null,
        data_registo: new Date().toISOString()
      })

      setIsAddDialogOpen(false)
      setNewCar({ marca: '', modelo: '', matricula: '', ano: '', km: '' })
      loadCars()
    } catch (error) {
      console.error('Erro ao adicionar carro:', error)
      alert('Erro ao adicionar carro')
    }
  }

  const filteredCars = cars.filter(car =>
    car.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
    car.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    car.matricula.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
            <h1 className="text-xl font-bold text-gray-900">Gestão de Carros</h1>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#ff8c00] hover:bg-[#e67e00]">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Carro
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Novo Carro</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="marca">Marca</Label>
                  <Input
                    id="marca"
                    value={newCar.marca}
                    onChange={(e) => setNewCar({ ...newCar, marca: e.target.value })}
                    placeholder="Ex: Toyota"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="modelo">Modelo</Label>
                  <Input
                    id="modelo"
                    value={newCar.modelo}
                    onChange={(e) => setNewCar({ ...newCar, modelo: e.target.value })}
                    placeholder="Ex: Corolla"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="matricula">Matrícula</Label>
                  <Input
                    id="matricula"
                    value={newCar.matricula}
                    onChange={(e) => setNewCar({ ...newCar, matricula: e.target.value })}
                    placeholder="Ex: AA-00-BB"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ano">Ano</Label>
                    <Input
                      id="ano"
                      type="number"
                      value={newCar.ano}
                      onChange={(e) => setNewCar({ ...newCar, ano: e.target.value })}
                      placeholder="2020"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="km">Quilómetros</Label>
                    <Input
                      id="km"
                      type="number"
                      value={newCar.km}
                      onChange={(e) => setNewCar({ ...newCar, km: e.target.value })}
                      placeholder="50000"
                    />
                  </div>
                </div>
                <Button 
                  className="w-full bg-[#ff8c00] hover:bg-[#e67e00]"
                  onClick={handleAddCar}
                >
                  Adicionar Carro
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Pesquisar por marca, modelo ou matrícula..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Cars Grid */}
        {filteredCars.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <CarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">
                {searchTerm ? 'Nenhum carro encontrado' : 'Ainda não tem carros registrados'}
              </p>
              <Button 
                className="bg-[#ff8c00] hover:bg-[#e67e00]"
                onClick={() => setIsAddDialogOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Primeiro Carro
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCars.map((car) => (
              <Card key={car.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{car.marca} {car.modelo}</span>
                    <CarIcon className="w-5 h-5 text-[#ff8c00]" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Matrícula:</span> {car.matricula}
                    </p>
                    {car.ano && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Ano:</span> {car.ano}
                      </p>
                    )}
                    {car.km && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Quilómetros:</span> {car.km.toLocaleString()} km
                      </p>
                    )}
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full mt-4"
                    onClick={() => router.push(`/carros/${car.id}`)}
                  >
                    Ver Detalhes
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
