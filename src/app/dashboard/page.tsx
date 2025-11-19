'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Dashboard from '@/components/Dashboard'
import DiagnosticForm from '@/components/DiagnosticForm'
import ClientManagement from '@/components/ClientManagement'
import BudgetGenerator from '@/components/BudgetGenerator'

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-blue-600 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">AutoFix AI</h1>
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 rounded ${activeTab === 'dashboard' ? 'bg-blue-800' : ''}`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('diagnostic')}
              className={`px-4 py-2 rounded ${activeTab === 'diagnostic' ? 'bg-blue-800' : ''}`}
            >
              Diagnóstico
            </button>
            <button
              onClick={() => setActiveTab('clients')}
              className={`px-4 py-2 rounded ${activeTab === 'clients' ? 'bg-blue-800' : ''}`}
            >
              Clientes
            </button>
            <button
              onClick={() => setActiveTab('budget')}
              className={`px-4 py-2 rounded ${activeTab === 'budget' ? 'bg-blue-800' : ''}`}
            >
              Orçamento
            </button>
            <button
              onClick={() => router.push('/register-workshop')}
              className="px-4 py-2 rounded bg-green-600 hover:bg-green-700"
            >
              Registrar Oficina
            </button>
          </div>
        </div>
      </nav>
      <main className="container mx-auto p-4">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'diagnostic' && <DiagnosticForm />}
        {activeTab === 'clients' && <ClientManagement />}
        {activeTab === 'budget' && <BudgetGenerator />}
      </main>
    </div>
  )
}