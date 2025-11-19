export interface Client {
  id: string
  name: string
  email: string
  phone: string
  createdAt: Date
}

export interface Car {
  id: string
  clientId: string
  licensePlate: string
  make: string
  model: string
  year: number
  mileage: number
  createdAt: Date
}

export interface Symptom {
  id: string
  description: string
  category: 'noise' | 'smell' | 'light' | 'failure' | 'vibration'
}

export interface Diagnosis {
  id: string
  carId: string
  symptoms: Symptom[]
  possibleIssues: Issue[]
  createdAt: Date
}

export interface Issue {
  id: string
  name: string
  probability: number
  affectedParts: string[]
  estimatedCost: number
  urgency: 'low' | 'medium' | 'high' | 'critical'
  immediateActions: string[]
}

export interface RepairSimulation {
  id: string
  diagnosisId: string
  solutions: Solution[]
  recommendedSolution: string
}

export interface Solution {
  id: string
  name: string
  cost: number
  time: number
  risk: number
  durability: number
}

export interface Part {
  id: string
  name: string
  price: number
  installationTime: number
  compatibility: string[]
}

export interface Budget {
  id: string
  carId: string
  laborCost: number
  partsCost: number
  estimatedTime: number
  observations: string
  totalCost: number
  currency: string
}

export interface Alert {
  id: string
  carId: string
  type: 'maintenance' | 'critical'
  message: string
  createdAt: Date
}