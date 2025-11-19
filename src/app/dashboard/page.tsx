'use client'

import { useState } from 'react'
import Dashboard from '@/components/Dashboard'
import DiagnosticForm from '@/components/DiagnosticForm'
import ClientManagement from '@/components/ClientManagement'
import BudgetGenerator from '@/components/BudgetGenerator'
import ProfileSettings from '@/components/ProfileSettings'

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('dashboard')

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-[#ff8c00] text-white p-4 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">AutoFix AI</h1>
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 rounded transition-colors ${activeTab === 'dashboard' ? 'bg-[#e67e00]' : 'hover:bg-[#e67e00]'}`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('diagnostic')}
              className={`px-4 py-2 rounded transition-colors ${activeTab === 'diagnostic' ? 'bg-[#e67e00]' : 'hover:bg-[#e67e00]'}`}
            >
              Diagnóstico
            </button>
            <button
              onClick={() => setActiveTab('clients')}
              className={`px-4 py-2 rounded transition-colors ${activeTab === 'clients' ? 'bg-[#e67e00]' : 'hover:bg-[#e67e00]'}`}
            >
              Clientes
            </button>
            <button
              onClick={() => setActiveTab('budget')}
              className={`px-4 py-2 rounded transition-colors ${activeTab === 'budget' ? 'bg-[#e67e00]' : 'hover:bg-[#e67e00]'}`}
            >
              Orçamento
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-4 py-2 rounded transition-colors ${activeTab === 'profile' ? 'bg-[#e67e00]' : 'hover:bg-[#e67e00]'}`}
            >
              Perfil
            </button>
          </div>
        </div>
      </nav>
      <main className="container mx-auto p-4">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'diagnostic' && <DiagnosticForm />}
        {activeTab === 'clients' && <ClientManagement />}
        {activeTab === 'budget' && <BudgetGenerator />}
        {activeTab === 'profile' && <ProfileSettings />}
      </main>
    </div>
  )
}
