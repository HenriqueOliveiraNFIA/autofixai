'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'

export default function RegisterWorkshop() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    nif: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // Registrar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      })

      if (authError) throw authError

      // Inserir dados da oficina na tabela workshops
      const { error: insertError } = await supabase
        .from('workshops')
        .insert([
          {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            nif: formData.nif,
            user_id: authData.user?.id
          }
        ])

      if (insertError) throw insertError

      alert('Oficina registrada com sucesso! Verifique seu email para confirmar a conta.')
      
      // Limpar formulário
      setFormData({
        name: '',
        email: '',
        password: '',
        phone: '',
        address: '',
        nif: ''
      })
    } catch (error) {
      console.error('Erro ao registrar oficina:', error)
      alert('Erro ao registrar oficina. Tente novamente.')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">
            Registrar Oficina
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nome da Oficina:</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full p-2 border rounded"
                placeholder="Nome da oficina"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email:</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full p-2 border rounded"
                placeholder="oficina@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Senha:</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full p-2 border rounded"
                placeholder="Senha segura"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Telefone:</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                className="w-full p-2 border rounded"
                placeholder="+351 912 345 678"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Morada:</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
                className="w-full p-2 border rounded"
                placeholder="Rua, número, cidade"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">NIF:</label>
              <input
                type="text"
                name="nif"
                value={formData.nif}
                onChange={handleChange}
                required
                className="w-full p-2 border rounded"
                placeholder="123456789"
              />
            </div>
            <Button type="submit" className="w-full">
              Registrar Oficina
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}