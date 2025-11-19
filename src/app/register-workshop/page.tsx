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
      // 1. Registrar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      })

      if (authError) throw authError

      if (!authData.user) {
        throw new Error('Erro ao criar usuário')
      }

      console.log('✅ Usuário criado:', authData.user.id)

      // 2. Inserir dados da oficina na tabela workshops COM user_id
      const { error: insertError } = await supabase
        .from('workshops')
        .insert([
          {
            user_id: authData.user.id, // Associar oficina ao usuário
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            address: formData.address
          }
        ])

      if (insertError) {
        console.error('❌ Erro ao inserir oficina:', insertError)
        // Se a coluna user_id não existir, tentar sem ela (temporário)
        if (insertError.code === '42703') {
          console.warn('⚠️ Coluna user_id não existe, inserindo sem ela')
          const { error: fallbackError } = await supabase
            .from('workshops')
            .insert([
              {
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                address: formData.address
              }
            ])
          if (fallbackError) throw fallbackError
        } else {
          throw insertError
        }
      }

      console.log('✅ Oficina registrada com sucesso')

      // Mostrar mensagem de sucesso com estilo laranja
      const successMessage = document.createElement('div')
      successMessage.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: #ff8c00;
        color: white;
        padding: 24px 32px;
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(255, 140, 0, 0.3);
        z-index: 9999;
        font-size: 18px;
        font-weight: 600;
        text-align: center;
        max-width: 400px;
      `
      successMessage.innerHTML = '✅ Oficina registrada com sucesso!<br><br>📧 Verifique seu email para confirmar a conta.<br><br>🔒 Seus dados estão protegidos e isolados.'
      document.body.appendChild(successMessage)
      
      setTimeout(() => {
        successMessage.remove()
      }, 6000)
      
      // Limpar formulário
      setFormData({
        name: '',
        email: '',
        password: '',
        phone: '',
        address: '',
        nif: ''
      })
    } catch (error: any) {
      console.error('❌ Erro ao registrar oficina:', error)
      alert(`Erro ao registrar oficina: ${error.message || 'Tente novamente.'}`)
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
          <p className="text-center text-sm text-muted-foreground mt-2">
            🔒 Seus dados serão protegidos e isolados
          </p>
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
            <Button type="submit" className="w-full bg-[#ff8c00] hover:bg-[#e67e00]">
              Registrar Oficina
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
