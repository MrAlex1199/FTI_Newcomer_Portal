import React from 'react'

function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-primary-600 mb-4">
          FTI Welcome Hub
        </h1>
        <p className="text-gray-600 text-lg">
          Internal Onboarding & Information Portal
        </p>
        <div className="mt-8 p-6 bg-white rounded-lg shadow-md max-w-md mx-auto">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            System Status
          </h2>
          <div className="flex items-center justify-center gap-2">
            <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-green-600 font-medium">Client Running</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
