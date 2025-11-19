'use client'

import { useState, useEffect } from 'react'
import Dashboard from '@/components/Dashboard'
import DiagnosticForm from '@/components/DiagnosticForm'
import ClientManagement from '@/components/ClientManagement'
import BudgetGenerator from '@/components/BudgetGenerator'
import ProfileSettings from '@/components/ProfileSettings'
import WorkAgenda from '@/components/WorkAgenda'
import { Menu, X } from 'lucide-react'

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'agenda', label: 'Agenda' },
    { id: 'diagnostic', label: 'Diagnóstico' },
    { id: 'clients', label: 'Clientes' },
    { id: 'budget', label: 'Folha de Obra' },
    { id: 'profile', label: 'Perfil' }
  ]

  useEffect(() => {
    // Escutar evento de navegação para Folha de Obra
    const handleNavigateToBudget = () => {
      setActiveTab('budget')
      setMobileMenuOpen(false)
    }

    window.addEventListener('navigateToBudget', handleNavigateToBudget)

    return () => {
      window.removeEventListener('navigateToBudget', handleNavigateToBudget)
    }
  }, [])

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
    setMobileMenuOpen(false)
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-[#ff8c00] text-white shadow-lg">
        <div className="container mx-auto px-4">
          {/* Header com logo e botão mobile */}
          <div className="flex justify-between items-center py-4">
            <h1 className="text-xl sm:text-2xl font-bold">AutoFix AI</h1>
            
            {/* Botão menu mobile */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 hover:bg-[#e67e00] rounded transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Menu desktop */}
            <div className="hidden md:flex space-x-2 lg:space-x-4">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`px-3 lg:px-4 py-2 rounded transition-colors text-sm lg:text-base ${
                    activeTab === tab.id ? 'bg-[#e67e00]' : 'hover:bg-[#e67e00]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Menu mobile dropdown */}
          {mobileMenuOpen && (
            <div className="md:hidden pb-4 space-y-2">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`w-full text-left px-4 py-3 rounded transition-colors ${
                    activeTab === tab.id ? 'bg-[#e67e00]' : 'hover:bg-[#e67e00]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </nav>

      <main className="container mx-auto px-0 sm:px-4 py-0 sm:py-4">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'agenda' && <WorkAgenda />}
        {activeTab === 'diagnostic' && <DiagnosticForm />}
        {activeTab === 'clients' && <ClientManagement />}
        {activeTab === 'budget' && <BudgetGenerator />}
        {activeTab === 'profile' && <ProfileSettings />}
      </main>
    </div>
  )
}
