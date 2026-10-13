import React from 'react'
import { motion } from "motion/react"
import {
    FaUserTie,
    FaBriefcase,
    FaFileUpload,
    FaMicrophoneAlt,
    FaChartLine,
} from "react-icons/fa";
import { useState } from 'react';
import axios from "axios"
import { ServerUrl } from '../App';
import { useDispatch, useSelector } from 'react-redux';
import { setUserData } from '../redux/userSlice';
function Step1SetUp({ onStart }) {
    const { userData } = useSelector((state) => state.user)
    const dispatch = useDispatch()
    const [role, setRole] = useState("");
    const [experience, setExperience] = useState("");
    const [mode, setMode] = useState("Technical");
    const [resumeFile, setResumeFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [projects, setProjects] = useState([]);
    const [skills, setSkills] = useState([]);
    const [resumeText, setResumeText] = useState("");
    const [analysisDone, setAnalysisDone] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);


    const handleUploadResume = async () => {
        if (!resumeFile || analyzing) return;
        setAnalyzing(true)

        const formdata = new FormData()
        formdata.append("resume", resumeFile)

        try {
            const result = await axios.post(ServerUrl + "/api/interview/resume", formdata, { withCredentials: true })

            console.log(result.data)

            setRole(result.data.role || "");
            setExperience(result.data.experience || "");
            setProjects(result.data.projects || []);
            setSkills(result.data.skills || []);
            setResumeText(result.data.resumeText || "");
            setAnalysisDone(true);

            setAnalyzing(false);

        } catch (error) {
            console.log(error)
            setAnalyzing(false);
        }
    }

    const handleStart = async () => {
        setLoading(true)
        try {
            const result = await axios.post(ServerUrl + "/api/interview/generate-questions", { role, experience, mode, resumeText, projects, skills }, { withCredentials: true })
            console.log(result.data)
            if (userData) {
                dispatch(setUserData({ ...userData, credits: result.data.creditsLeft }))
            }
            setLoading(false)
            onStart(result.data)

        } catch (error) {
            console.log(error)
            setLoading(false)
        }
    }
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className='relative min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-blue-100 px-4 py-10 overflow-hidden'>

            {/* background blobs */}
            <motion.div
                animate={{ x: [0, 60, 0], y: [0, 40, 0] }}
                transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
                className='pointer-events-none absolute -top-24 -left-24 w-96 h-96 rounded-full bg-blue-400/30 blur-3xl'
            />
            <motion.div
                animate={{ x: [0, -70, 0], y: [0, 60, 0] }}
                transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
                className='pointer-events-none absolute bottom-0 -right-24 w-[26rem] h-[26rem] rounded-full bg-sky-300/40 blur-3xl'
            />

            <div className='relative w-full max-w-6xl bg-white rounded-3xl shadow-2xl shadow-blue-200/60 border border-sky-100 grid md:grid-cols-2 overflow-hidden'>

                {/* LEFT PANEL */}
                <motion.div
                    initial={{ x: -80, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.7 }}
                    className='relative bg-gradient-to-br from-[#1D4ED8] via-[#2563EB] to-sky-500 p-12 flex flex-col justify-center overflow-hidden'>

                    <motion.div
                        animate={{ scale: [1, 1.3, 1], opacity: [0.15, 0.3, 0.15] }}
                        transition={{ duration: 6, repeat: Infinity }}
                        className='pointer-events-none absolute -top-20 -left-20 w-72 h-72 rounded-full bg-white blur-3xl'
                    />
                    <motion.div
                        animate={{ scale: [1.2, 1, 1.2], opacity: [0.1, 0.25, 0.1] }}
                        transition={{ duration: 7, repeat: Infinity }}
                        className='pointer-events-none absolute -bottom-24 -right-16 w-80 h-80 rounded-full bg-sky-200 blur-3xl'
                    />

                    <div className='relative'>
                        <span className='inline-block bg-white/20 backdrop-blur text-white text-xs font-semibold tracking-wider px-4 py-1.5 rounded-full mb-6 border border-white/30'>
                            AI POWERED PRACTICE
                        </span>

                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight tracking-tight">
                            Start Your AI Interview
                        </h2>

                        <p className="text-blue-100 mb-10 leading-relaxed">
                            Practice real interview scenarios powered by AI.
                            Improve communication, technical skills, and confidence.
                        </p>

                        <div className='space-y-4'>

                            {
                                [
                                    {
                                        icon: <FaUserTie className="text-[#2563EB] text-xl" />,
                                        text: "Choose Role & Experience",
                                    },
                                    {
                                        icon: <FaMicrophoneAlt className="text-[#2563EB] text-xl" />,
                                        text: "Smart Voice Interview",
                                    },
                                    {
                                        icon: <FaChartLine className="text-[#2563EB] text-xl" />,
                                        text: "Performance Analytics",
                                    },
                                ].map((item, index) => (
                                    <motion.div key={index}
                                        initial={{ y: 30, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.3 + index * 0.15 }}
                                        whileHover={{ scale: 1.04, x: 6 }}
                                        className='flex items-center space-x-4 bg-white/95 p-4 rounded-2xl shadow-lg shadow-blue-900/20 cursor-pointer'>
                                        <div className='bg-sky-100 w-11 h-11 rounded-xl flex items-center justify-center'>
                                            {item.icon}
                                        </div>
                                        <span className='text-gray-700 font-medium'>{item.text}</span>

                                    </motion.div>
                                ))
                            }
                        </div>
                    </div>

                </motion.div>


                {/* RIGHT PANEL */}
                <motion.div
                    initial={{ x: 80, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.7 }}
                    className="p-8 md:p-12 bg-white">

                    <h2 className='text-3xl font-bold text-gray-800 mb-2 tracking-tight'>
                        Interview{" "}
                        <span className='bg-sky-100 text-[#1D4ED8] px-3 py-1 rounded-full inline-block -rotate-1'>SetUp</span>
                    </h2>
                    <p className='text-gray-500 text-sm mb-8'>Fill in the details or let your resume do it for you.</p>


                    <div className='space-y-6'>

                        <div className='relative'>
                            <FaUserTie className='absolute top-4 left-4 text-[#2563EB]/60' />

                            <input type='text' placeholder='Enter role'
                                className='w-full pl-12 pr-4 py-3 bg-sky-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] focus:bg-white outline-none transition'
                                onChange={(e) => setRole(e.target.value)} value={role} />
                        </div>


                        <div className='relative'>
                            <FaBriefcase className='absolute top-4 left-4 text-[#2563EB]/60' />

                            <input type='text' placeholder='Experience (e.g. 2 years)'
                                className='w-full pl-12 pr-4 py-3 bg-sky-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] focus:bg-white outline-none transition'
                                onChange={(e) => setExperience(e.target.value)} value={experience} />



                        </div>

                        {/* MODE TOGGLE (uses the same mode state) */}
                        <div className='grid grid-cols-2 gap-3 bg-sky-50 p-1.5 rounded-2xl border border-sky-100'>
                            {[
                                { value: "Technical", label: "Technical Interview" },
                                { value: "HR", label: "HR Interview" }
                            ].map((opt) => (
                                <button
                                    key={opt.value}
                                    type='button'
                                    onClick={() => setMode(opt.value)}
                                    className={`py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${mode === opt.value
                                        ? "bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] text-white shadow-md shadow-blue-300/60"
                                        : "text-gray-600 hover:text-[#1D4ED8]"
                                        }`}>
                                    {opt.label}
                                </button>
                            ))}
                        </div>

                        {!analysisDone && (
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                onClick={() => document.getElementById("resumeUpload").click()}
                                className='border-2 border-dashed border-sky-300 bg-sky-50/40 rounded-2xl p-8 text-center cursor-pointer hover:border-[#2563EB] hover:bg-sky-50 transition'>

                                <motion.div
                                    animate={{ y: [0, -6, 0] }}
                                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                                    className='w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-[#2563EB] to-sky-400 flex items-center justify-center shadow-lg shadow-blue-300/60'>
                                    <FaFileUpload className='text-3xl text-white' />
                                </motion.div>

                                <input type="file"
                                    accept="application/pdf"
                                    id="resumeUpload"
                                    className='hidden'
                                    onChange={(e) => setResumeFile(e.target.files[0])} />

                                <p className='text-gray-600 font-medium'>
                                    {resumeFile ? resumeFile.name : "Click to upload resume (Optional)"}
                                </p>

                                {resumeFile && (
                                    <motion.button
                                        whileHover={{ scale: 1.04 }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleUploadResume()
                                        }}

                                        className='mt-4 bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] text-white px-6 py-2 rounded-full shadow-md shadow-blue-300/60 hover:shadow-lg transition'>
                                        {analyzing ? "Analyzing..." : "Analyze Resume"}



                                    </motion.button>)}

                            </motion.div>


                        )}

                        {analysisDone && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className='bg-sky-50/60 border border-sky-200 rounded-2xl p-5 space-y-4'>
                                <h3 className='text-lg font-semibold text-[#1D4ED8]'>
                                    Resume Analysis Result</h3>

                                {projects.length > 0 && (
                                    <div>
                                        <p className='font-medium text-gray-700 mb-1'>
                                            Projects:</p>

                                        <ul className='list-disc list-inside text-gray-600 space-y-1 marker:text-[#2563EB]'>
                                            {projects.map((p, i) => (
                                                <li key={i}>{p}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {skills.length > 0 && (
                                    <div>
                                        <p className='font-medium text-gray-700 mb-1'>
                                            Skills:</p>

                                        <div className='flex flex-wrap gap-2'>
                                            {skills.map((s, i) => (
                                                <span key={i} className='bg-sky-100 text-[#1D4ED8] border border-sky-200 px-3 py-1 rounded-full text-sm font-medium'>{s}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                            </motion.div>
                        )}


                        <motion.button
                            onClick={handleStart}
                            disabled={!role || !experience || loading}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.95 }}
                            className='group relative overflow-hidden w-full disabled:from-gray-400 disabled:to-gray-500 disabled:shadow-none bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] text-white py-3.5 rounded-full text-lg font-semibold transition duration-300 shadow-lg shadow-blue-400/50 hover:shadow-xl hover:shadow-blue-500/60'>
                            <span className='absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/30 to-transparent'></span>
                            <span className='relative'>{loading ? "Starting..." : "Start Interview"}</span>


                        </motion.button>
                    </div>

                </motion.div>
            </div>

        </motion.div>
    )
}

export default Step1SetUp