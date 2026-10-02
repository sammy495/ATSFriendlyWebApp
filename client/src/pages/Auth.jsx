import React from 'react'
import { BsRobot, BsMic, BsBarChart, BsShieldCheck } from "react-icons/bs";
import { IoSparkles } from "react-icons/io5";
import { motion } from "motion/react"
import { FcGoogle } from "react-icons/fc";
import { signInWithPopup } from 'firebase/auth';
import { auth, provider } from '../utils/firebase';
import axios from 'axios';
import { ServerUrl } from '../App';
import { useDispatch } from 'react-redux';
import { setUserData } from '../redux/userSlice';

function Auth({ isModel = false }) {
    const dispatch = useDispatch()

    const handleGoogleAuth = async () => {
        try {
            const response = await signInWithPopup(auth, provider)
            let User = response.user
            let name = User.displayName
            let email = User.email
            const result = await axios.post(ServerUrl + "/api/auth/google", { name, email }, { withCredentials: true })
            dispatch(setUserData(result.data))

        } catch (error) {
            console.log(error)
            dispatch(setUserData(null))
        }
    }

    return (
        <div className={`
      relative w-full overflow-hidden
      ${isModel ? "py-4" : "min-h-screen bg-gradient-to-b from-white via-sky-50 to-[#f3f3f3] flex items-center justify-center px-6 py-20"}
    `}>

            {/* BACKGROUND DECORATION (full page only) */}
            {!isModel && (
                <>
                    <div
                        className='pointer-events-none absolute inset-0 opacity-60'
                        style={{
                            backgroundImage: "radial-gradient(#bfdbfe 1.2px, transparent 1.2px)",
                            backgroundSize: "28px 28px",
                            maskImage: "linear-gradient(to bottom, black 0%, transparent 70%)",
                            WebkitMaskImage: "linear-gradient(to bottom, black 0%, transparent 70%)"
                        }}
                    />
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
                </>
            )}

            <motion.div
                initial={{ opacity: 0, y: -40, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={`
        relative w-full overflow-hidden
        ${isModel ? "max-w-md p-8 rounded-3xl" : "max-w-lg p-12 rounded-[32px]"}
        bg-white/90 backdrop-blur shadow-2xl shadow-blue-200/60 border border-sky-100
      `}>

                {/* top gradient accent line */}
                <div className='absolute top-0 left-0 right-0  h-1.5 bg-gradient-to-r from-[#2563EB] via-sky-400 to-[#1D4ED8]'></div>

                {/* corner glow */}
                <div className='z-50pointer-events-none absolute -top-20 -right-20 w-48 h-48 rounded-full bg-sky-200/60 blur-3xl'></div>

                {/* LOGO */}
                <div className='relative flex items-center justify-center gap-3 mb-6'>
                    <motion.div
                        animate={{ rotate: [0, -8, 8, 0] }}
                        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                        className='bg-gradient-to-br from-[#2563EB] to-sky-400 text-white p-2.5 rounded-xl shadow-lg shadow-blue-300/70'>
                        <BsRobot size={18} />
                    </motion.div>
                    <h2 className='font-bold text-lg tracking-tight'>HireSense.AI</h2>
                </div>

                {/* HEADING */}
                <h1 className='relative text-2xl md:text-3xl font-bold text-center leading-snug mb-4 tracking-tight'>
                    Continue with{" "}
                    <span className='bg-sky-100 text-[#1D4ED8] px-3 py-1 rounded-full inline-flex items-center gap-2 -rotate-1 mt-1'>
                        <motion.span
                            animate={{ rotate: [0, 20, -20, 0], scale: [1, 1.25, 1] }}
                            transition={{ duration: 3, repeat: Infinity }}
                            className='inline-flex'>
                            <IoSparkles size={16} className='text-[#2563EB]' />
                        </motion.span>
                        AI Smart Interview
                    </span>
                </h1>

                <p className='relative text-gray-500 text-center text-sm md:text-base leading-relaxed mb-8'>
                    Sign in to start AI-powered mock interviews,
                    track your progress, and unlock detailed performance insights.
                </p>

                {/* MINI FEATURE CHIPS */}
                <div className='relative flex flex-wrap justify-center gap-2 mb-8'>
                    {[
                        { icon: <BsMic size={12} />, label: "Voice Interviews" },
                        { icon: <BsBarChart size={12} />, label: "Instant Scores" },
                        { icon: <BsShieldCheck size={12} />, label: "Secure Login" }
                    ].map((chip, i) => (
                        <motion.span
                            key={chip.label}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 + i * 0.12 }}
                            className='flex items-center gap-1.5 bg-sky-50 border border-sky-100 text-[#1D4ED8] text-xs font-medium px-3 py-1.5 rounded-full'>
                            {chip.icon}
                            {chip.label}
                        </motion.span>
                    ))}
                </div>

                {/* GOOGLE BUTTON */}
                <motion.button
                    onClick={handleGoogleAuth}
                    whileHover={{ scale: 1.04, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    className='group relative overflow-hidden w-full flex items-center justify-center gap-3 py-3.5 bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] text-white font-medium rounded-full shadow-lg shadow-blue-400/50 hover:shadow-xl hover:shadow-blue-500/60 transition-shadow'>
                    {/* shimmer */}
                    <span className='absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/30 to-transparent'></span>
                    <span className='relative bg-white rounded-full p-1 flex items-center justify-center'>
                        <FcGoogle size={18} />
                    </span>
                    <span className='relative'>Continue with Google</span>
                </motion.button>

                <p className='relative text-center text-xs text-gray-400 mt-5'>
                    By continuing, you agree to practice smarter and land your dream job.
                </p>
            </motion.div>

        </div>
    )
}

export default Auth