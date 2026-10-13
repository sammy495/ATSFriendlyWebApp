import React, { useState } from 'react'
import { FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { motion } from "motion/react"
import { buildStyles, CircularProgressbar } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import {
  Area,
  AreaChart,
  BarChart,
  Bar,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ReferenceLine,
  Legend
} from "recharts"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { BsRobot, BsDownload, BsShieldCheck, BsBarChartLine, BsGraphUp } from 'react-icons/bs';

function Step3Report({ report }) {
  const [chartType, setChartType] = useState('area'); // 'area' or 'bar'

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-blue-100">
        <p className="text-gray-500 text-lg font-medium animate-pulse">Loading Report...</p>
      </div>
    );
  }

  const navigate = useNavigate()
  const {
    finalScore = 0,
    confidence = 0,
    communication = 0,
    correctness = 0,
    questionWiseScore = [],
  } = report;

  // Enhanced dataset comparing actual score vs target benchmark (8) for grouped bar/trend charts
  const questionScoreData = questionWiseScore.map((scoreObj, index) => ({
    name: `Q${index + 1}`,
    score: scoreObj.score || 0,
    targetScore: 8
  }))

  const radarSkillData = [
    { subject: "Confidence", score: confidence, benchmark: 8, fullMark: 10 },
    { subject: "Communication", score: communication, benchmark: 8, fullMark: 10 },
    { subject: "Correctness", score: correctness, benchmark: 8, fullMark: 10 },
  ];

  const skills = [
    { label: "Confidence", value: confidence },
    { label: "Communication", value: communication },
    { label: "Correctness", value: correctness },
  ];

  let performanceText = "";
  let shortTagline = "";

  if (finalScore >= 8) {
    performanceText = "Ready for job opportunities.";
    shortTagline = "Excellent clarity and structured responses.";
  } else if (finalScore >= 5) {
    performanceText = "Needs minor improvement before interviews.";
    shortTagline = "Good foundation, refine articulation.";
  } else {
    performanceText = "Significant improvement required.";
    shortTagline = "Work on clarity and confidence.";
  }

  const score = finalScore;
  const percentage = (score / 10) * 100;

  const downloadPDF = () => {
    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;

    let currentY = 25;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(37, 99, 235);
    doc.text("AI Interview Performance Report", pageWidth / 2, currentY, { align: "center" });

    currentY += 5;
    doc.setDrawColor(37, 99, 235);
    doc.line(margin, currentY + 2, pageWidth - margin, currentY + 2);

    currentY += 15;
    doc.setFillColor(239, 246, 255);
    doc.roundedRect(margin, currentY, contentWidth, 20, 4, 4, "F");

    doc.setFontSize(14);
    doc.setTextColor(29, 78, 216);
    doc.text(`Final Score: ${finalScore}/10`, pageWidth / 2, currentY + 12, { align: "center" });

    currentY += 30;
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, currentY, contentWidth, 30, 4, 4, "F");

    doc.setFontSize(12);
    doc.setTextColor(51, 65, 85);
    doc.text(`Confidence: ${confidence}/10`, margin + 10, currentY + 10);
    doc.text(`Communication: ${communication}/10`, margin + 10, currentY + 18);
    doc.text(`Correctness: ${correctness}/10`, margin + 10, currentY + 26);

    currentY += 45;

    let advice = finalScore >= 8
      ? "Excellent performance. Maintain confidence and structure. Continue refining clarity and supporting answers with strong real-world examples."
      : finalScore >= 5
        ? "Good foundation shown. Improve clarity and structure. Practice delivering concise, confident answers with stronger supporting examples."
        : "Significant improvement required. Focus on structured thinking, clarity, and confident delivery. Practice answering aloud regularly.";

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, currentY, contentWidth, 35, 4, 4);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text("Professional Advice", margin + 10, currentY + 10);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(71, 85, 105);

    const splitAdvice = doc.splitTextToSize(advice, contentWidth - 20);
    doc.text(splitAdvice, margin + 10, currentY + 20);

    currentY += 50;

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [["#", "Question", "Score", "Feedback"]],
      body: questionWiseScore.map((q, i) => [
        `${i + 1}`,
        q.question,
        `${q.score}/10`,
        q.feedback,
      ]),
      styles: { fontSize: 9, cellPadding: 5, valign: "top" },
      headStyles: { fillColor: [37, 99, 235], textColor: 255, halign: "center" },
      columnStyles: {
        0: { cellWidth: 10, halign: "center" },
        1: { cellWidth: 55 },
        2: { cellWidth: 20, halign: "center" },
        3: { cellWidth: "auto" },
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });

    doc.save("AI_Interview_Report.pdf");
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-100 px-4 sm:px-6 lg:px-10 py-8 relative overflow-hidden'>
      <div className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 rounded-full bg-blue-400/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 -right-24 w-[26rem] h-[26rem] rounded-full bg-sky-300/30 blur-3xl" />

      {/* Header */}
      <div className='relative z-10 mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
        <div className='w-full flex items-center gap-4 flex-wrap'>
          <button
            onClick={() => navigate("/history")}
            className='p-3.5 rounded-2xl bg-white border border-sky-100 shadow-md hover:shadow-lg transition text-gray-700 hover:text-[#2563EB] cursor-pointer'>
            <FaArrowLeft />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="bg-sky-100 text-[#1D4ED8] text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <BsRobot size={12} /> HireSense.AI Report
              </span>
            </div>
            <h1 className='text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mt-1'>
              Interview Analytics Dashboard
            </h1>
            <p className='text-gray-500 text-sm'>
              AI-powered evaluation & candidate competency metrics
            </p>
          </div>
        </div>

        <button
          onClick={downloadPDF}
          className='flex items-center justify-center gap-2 bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-2xl shadow-lg shadow-blue-300/50 hover:shadow-xl transition-all duration-300 font-semibold text-sm sm:text-base text-nowrap cursor-pointer'>
          <BsDownload size={16} /> Download PDF
        </button>
      </div>

      {/* Grid Layout */}
      <div className='relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8'>

        {/* LEFT COLUMN */}
        <div className='space-y-6'>

          {/* Overall Performance Card */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-xl shadow-blue-100/80 border border-sky-100 p-6 sm:p-8 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#2563EB] via-sky-400 to-[#1D4ED8]" />

            <h3 className="text-gray-500 mb-4 text-xs font-bold uppercase tracking-wider">
              Overall Performance Score
            </h3>

            <div className='relative w-28 h-28 sm:w-32 sm:h-32 mx-auto my-2'>
              <CircularProgressbar
                value={percentage}
                text={`${score}/10`}
                styles={buildStyles({
                  textSize: "20px",
                  pathColor: "#2563EB",
                  textColor: "#1D4ED8",
                  trailColor: "#E0F2FE",
                  strokeLinecap: "round"
                })}
              />
            </div>

            <div className="mt-4 pt-2 border-t border-sky-50">
              <p className="font-extrabold text-gray-900 text-base sm:text-lg">
                {performanceText}
              </p>
              <p className="text-gray-500 text-xs sm:text-sm mt-1 leading-relaxed">
                {shortTagline}
              </p>
            </div>
          </motion.div>

          {/* Skill Evaluation Radar Chart */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className='bg-white rounded-3xl shadow-xl shadow-blue-100/80 border border-sky-100 p-6 sm:p-8'>

            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900">
                  Skill Competency Radar
                </h3>
                <p className="text-xs text-gray-400">Multi-dimensional profile vs benchmark</p>
              </div>
              <span className="flex items-center gap-1 text-[11px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full">
                <BsShieldCheck size={12} /> Target: 8/10
              </span>
            </div>

            <div className="h-64 sm:h-72 -mx-4">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarSkillData}>
                  <PolarGrid stroke="#e0f2fe" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#1e293b', fontSize: 12, fontWeight: 600 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 10]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <Radar name="Benchmark Target" dataKey="benchmark" stroke="#93c5fd" fill="#38bdf8" fillOpacity={0.15} strokeDasharray="4 4" />
                  <Radar name="Candidate Score" dataKey="score" stroke="#2563EB" fill="#2563EB" fillOpacity={0.45} />
                  <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', borderColor: '#bae6fd', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className='space-y-3 pt-3 border-t border-sky-50'>
              {skills.map((s, i) => (
                <div key={i} className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-gray-600 font-medium">{s.label}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-sky-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-[#2563EB] to-sky-400 h-full rounded-full" style={{ width: `${s.value * 10}%` }} />
                    </div>
                    <span className='font-bold text-[#1D4ED8] w-8 text-right'>{s.value}/10</span>
                  </div>
                </div>
              ))}
            </div>

          </motion.div>

        </div>

        {/* RIGHT COLUMN */}
        <div className='lg:col-span-2 space-y-6'>

          {/* ================= REFINED PERFORMANCE SCORE TREND ================= */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className='bg-white rounded-3xl shadow-xl shadow-blue-100/80 border border-sky-100 p-5 sm:p-8'>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900">
                  Performance Score Trend
                </h3>
                <p className="text-xs text-gray-400">Candidate progression vs benchmark (8/10)</p>
              </div>

              {/* View Switcher: Area Trend vs Grouped Bar */}
              <div className="flex items-center bg-sky-50 p-1 rounded-xl border border-sky-100 self-start sm:self-auto">
                <button
                  onClick={() => setChartType('area')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${chartType === 'area'
                    ? 'bg-white text-[#2563EB] shadow-sm'
                    : 'text-gray-500 hover:text-gray-900'
                    }`}>
                  <BsGraphUp size={13} /> Smooth Area
                </button>
                <button
                  onClick={() => setChartType('bar')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${chartType === 'bar'
                    ? 'bg-white text-[#2563EB] shadow-sm'
                    : 'text-gray-500 hover:text-gray-900'
                    }`}>
                  <BsBarChartLine size={13} /> Grouped Bar
                </button>
              </div>
            </div>

            <div className='h-64 sm:h-72'>
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'area' ? (
                  /* Option 1: Area Chart with Benchmark Line */
                  <AreaChart data={questionScoreData}>
                    <defs>
                      <linearGradient id="scoreBlue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563EB" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#38BDF8" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f9ff" />
                    <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 10]} stroke="#64748b" tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderRadius: '12px',
                        borderColor: '#bae6fd',
                        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Legend verticalAlign="top" height={36} />
                    <ReferenceLine y={8} label={{ value: 'Target (8)', fill: '#0284c7', fontSize: 11, position: 'insideTopRight' }} stroke="#0284c7" strokeDasharray="4 4" />
                    <Area
                      name="Candidate Score"
                      type="monotone"
                      dataKey="score"
                      stroke="#2563EB"
                      fillOpacity={1}
                      fill="url(#scoreBlue)"
                      strokeWidth={3}
                    />
                  </AreaChart>
                ) : (
                  /* Option 2: Grouped Bar Chart (Actual Score vs Benchmark) */
                  <BarChart data={questionScoreData} barGap={6}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f9ff" />
                    <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 10]} stroke="#64748b" tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderRadius: '12px',
                        borderColor: '#bae6fd',
                        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Legend verticalAlign="top" height={36} />
                    <Bar name="Candidate Score" dataKey="score" fill="#2563EB" radius={[6, 6, 0, 0]} />
                    <Bar name="Benchmark Target" dataKey="targetScore" fill="#BAE6FD" radius={[6, 6, 0, 0]} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Detailed Question Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className='bg-white rounded-3xl shadow-xl shadow-blue-100/80 border border-sky-100 p-5 sm:p-8'>

            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-6">
              Question Breakdown & Feedback
            </h3>

            <div className='space-y-5'>
              {questionWiseScore.map((q, i) => (
                <div key={i} className='bg-gradient-to-br from-sky-50/50 to-white p-5 sm:p-6 rounded-2xl border border-sky-100 shadow-sm'>

                  <div className='flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4'>
                    <div>
                      <p className="text-xs font-semibold text-[#2563EB] mb-1 uppercase tracking-wider">
                        Question {i + 1}
                      </p>
                      <p className="font-bold text-gray-800 text-sm sm:text-base leading-relaxed">
                        {q.question || "Question not available"}
                      </p>
                    </div>

                    <div className='bg-sky-100 text-[#1D4ED8] border border-sky-200 px-3 py-1 rounded-full font-extrabold text-xs sm:text-sm w-fit self-start'>
                      {q.score ?? 0}/10
                    </div>
                  </div>

                  <div className='bg-white border border-sky-100 p-4 rounded-xl shadow-xs'>
                    <p className='text-xs text-[#2563EB] font-bold mb-1 flex items-center gap-1.5'>
                      <BsRobot size={12} /> AI Performance Evaluation
                    </p>
                    <p className='text-sm text-gray-700 leading-relaxed'>
                      {q.feedback && q.feedback.trim() !== ""
                        ? q.feedback
                        : "No feedback available for this question."}
                    </p>
                  </div>

                </div>
              ))}
            </div>

          </motion.div>

        </div>
      </div>

    </div>
  )
}

export default Step3Report