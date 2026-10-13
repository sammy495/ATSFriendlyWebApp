import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import axios from "axios"
import { ServerUrl } from '../App';
import Step3Report from '../components/Step3Report';
import { BsRobot, BsShieldCheck } from 'react-icons/bs';

function InterviewReport() {
  const { id } = useParams()
  const [report, setReport] = useState(null)

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const result = await axios.get(ServerUrl + "/api/interview/report/" + id, { withCredentials: true })
        console.log(result.data)
        setReport(result.data)
      } catch (error) {
        console.log(error)
      }
    }

    fetchReport()
  }, [])

  if (!report) {
    return (
      <div className="relative min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-100 flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden">
        {/* Background Decorative Blobs */}
        <div className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 rounded-full bg-blue-400/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 -right-24 w-[26rem] h-[26rem] rounded-full bg-sky-300/30 blur-3xl" />

        {/* Loading Container */}
        <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl shadow-blue-200/60 border border-sky-100 p-8 flex flex-col items-center text-center space-y-6 overflow-hidden">
          {/* Top Blue Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#2563EB] via-sky-400 to-[#1D4ED8]" />

          {/* Animated Logo Container */}
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 rounded-2xl bg-blue-500/20 animate-ping opacity-75" />
            <div className="relative bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] text-white p-4 rounded-2xl shadow-lg shadow-blue-300/60">
              <BsRobot size={32} />
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-extrabold text-gray-900 tracking-tight">
              Analyzing Interview Data
            </h3>
            <p className="text-sm text-gray-500 max-w-xs mx-auto leading-relaxed">
              Synthesizing response metrics, AI evaluations, and performance analytics...
            </p>
          </div>

          {/* Skeleton Loaders */}
          <div className="w-full space-y-3 pt-2">
            <div className="h-2.5 bg-sky-100 rounded-full w-full overflow-hidden relative">
              <div className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-[#2563EB] to-sky-400 w-1/2 animate-pulse rounded-full" />
            </div>
            <div className="flex justify-between items-center text-xs text-sky-600 font-medium px-1">
              <span className="flex items-center gap-1">
                <BsShieldCheck size={12} /> Encrypted Session
              </span>
              <span>Processing...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <Step3Report report={report} />
}

export default InterviewReport