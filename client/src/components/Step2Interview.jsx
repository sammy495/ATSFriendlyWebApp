import React from 'react'
import maleVideo from "../assets/videos/male-ai.mp4"
import femaleVideo from "../assets/videos/female-ai.mp4"
import Timer from './Timer'
import { motion } from "motion/react"
import { FaMicrophone, FaMicrophoneSlash } from "react-icons/fa";
import { useState } from 'react'
import { useRef } from 'react'
import { useEffect } from 'react'
import axios from "axios"
import { ServerUrl } from '../App'
import { BsArrowRight, BsRobot, BsMic, BsBarChart, BsShieldCheck } from 'react-icons/bs'

function Step2Interview({ interviewData, onFinish }) {
  const { interviewId, questions, userName } = interviewData;
  const [isIntroPhase, setIsIntroPhase] = useState(true);

  const [isMicOn, setIsMicOn] = useState(true);
  const recognitionRef = useRef(null);
  const [isAIPlaying, setIsAIPlaying] = useState(false);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [timeLeft, setTimeLeft] = useState(
    questions[0]?.timeLimit || 60
  );
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [voiceGender, setVoiceGender] = useState("female");
  const [subtitle, setSubtitle] = useState("");

  // voice fix state/refs
  const [isListening, setIsListening] = useState(false);
  const [micError, setMicError] = useState("");
  const isListeningRef = useRef(false);
  const shouldListenRef = useRef(false);
  const isMicOnRef = useRef(true);
  const isAIPlayingRef = useRef(false);


  const videoRef = useRef(null);

  const currentQuestion = questions[currentIndex];


  /* ---------------- LOAD AI VOICE ---------------- */
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (!voices.length) return;

      // Try known female voices first
      const femaleVoice =
        voices.find(v =>
          v.name.toLowerCase().includes("zira") ||
          v.name.toLowerCase().includes("samantha") ||
          v.name.toLowerCase().includes("female")
        );

      if (femaleVoice) {
        setSelectedVoice(femaleVoice);
        setVoiceGender("female");
        return;
      }

      // Try known male voices
      const maleVoice =
        voices.find(v =>
          v.name.toLowerCase().includes("david") ||
          v.name.toLowerCase().includes("mark") ||
          v.name.toLowerCase().includes("male")
        );

      if (maleVoice) {
        setSelectedVoice(maleVoice);
        setVoiceGender("male");
        return;
      }

      // Fallback: first voice (assume female)
      setSelectedVoice(voices[0]);
      setVoiceGender("female");
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

  }, [])

  const videoSource = voiceGender === "male" ? maleVideo : femaleVideo;


  /* ---------------- SPEECH RECOGNITION (user's voice -> text) ---------------- */
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMicError("Voice input isn't supported in this browser. Use Chrome or Edge, or type your answer.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onstart = () => {
      isListeningRef.current = true;
      setIsListening(true);
      setMicError("");
    };

    recognition.onresult = (event) => {
      let finalText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) finalText += event.results[i][0].transcript + " ";
      }
      if (finalText.trim()) {
        setAnswer((prev) => (prev ? prev.trim() + " " : "") + finalText.trim());
      }
    };

    recognition.onerror = (e) => {
      console.log("Speech error:", e.error);
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        shouldListenRef.current = false;
        setMicError("Microphone is blocked. Click the lock icon in the address bar and allow the microphone.");
      } else if (e.error === "audio-capture") {
        shouldListenRef.current = false;
        setMicError("No microphone found. Please connect one.");
      } else if (e.error === "network") {
        shouldListenRef.current = false;
        setMicError("Voice recognition needs internet and doesn't work in Brave. Try Chrome or Edge.");
      }
      // "no-speech" and "aborted" are normal, ignore them
    };

    recognition.onend = () => {
      isListeningRef.current = false;
      setIsListening(false);
      // auto-restart if we are still supposed to be listening
      if (shouldListenRef.current) {
        setTimeout(() => {
          try { recognition.start(); } catch { }
        }, 300);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      shouldListenRef.current = false;
      recognition.onend = null;
      try { recognition.abort(); } catch { }
    };
  }, []);


  const startMic = () => {
    const r = recognitionRef.current;
    if (!r || isAIPlayingRef.current || !isMicOnRef.current) return;
    shouldListenRef.current = true;
    if (isListeningRef.current) return;
    try { r.start(); } catch { }
  };

  const stopMic = () => {
    shouldListenRef.current = false;
    try { recognitionRef.current?.stop(); } catch { }
  };

  const toggleMic = () => {
    if (isMicOn) {
      isMicOnRef.current = false;
      stopMic();
    } else {
      isMicOnRef.current = true;
      startMic();
    }
    setIsMicOn(!isMicOn);
  };


  /* ---------------- SPEAK FUNCTION ---------------- */
  const speakText = (text) => {
    return new Promise((resolve) => {
      if (!window.speechSynthesis || !selectedVoice) {
        resolve();
        return;
      }

      window.speechSynthesis.cancel();

      // Add natural pauses after commas and periods
      const humanText = text
        .replace(/,/g, ", ... ")
        .replace(/\./g, ". ... ");

      const utterance = new SpeechSynthesisUtterance(humanText);

      utterance.voice = selectedVoice;

      // Human-like pacing
      utterance.rate = 0.92;     // slightly slower than normal
      utterance.pitch = 1.05;    // small warmth
      utterance.volume = 1;

      utterance.onstart = () => {
        isAIPlayingRef.current = true;
        setIsAIPlaying(true);
        stopMic()
        videoRef.current?.play();
      };


      utterance.onend = () => {
        videoRef.current?.pause();
        if (videoRef.current) videoRef.current.currentTime = 0;
        isAIPlayingRef.current = false;
        setIsAIPlaying(false);

        if (isMicOnRef.current) {
          startMic();
        }
        setTimeout(() => {
          setSubtitle("");
          resolve();
        }, 300);
      };


      setSubtitle(text);

      window.speechSynthesis.speak(utterance);
    });
  };


  useEffect(() => {
    if (!selectedVoice) {
      return;
    }
    const runIntro = async () => {
      if (isIntroPhase) {
        await speakText(
          `Hi ${userName}, it's great to meet you today. I hope you're feeling confident and ready.`
        );

        await speakText(
          "I'll ask you a few questions. Just answer naturally, and take your time. Let's begin."
        );

        setIsIntroPhase(false)
      } else if (currentQuestion) {
        await new Promise(r => setTimeout(r, 800));

        // If last question (hard level)
        if (currentIndex === questions.length - 1) {
          await speakText("Alright, this one might be a bit more challenging.");
        }

        await speakText(currentQuestion.question);

        if (isMicOnRef.current) {
          startMic();
        }
      }

    }

    runIntro()


  }, [selectedVoice, isIntroPhase, currentIndex])



  useEffect(() => {
    if (isIntroPhase) return;
    if (!currentQuestion) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0;
        }
        return prev - 1

      })
    }, 1000);

    return () => clearInterval(timer)

  }, [isIntroPhase, currentIndex])

  useEffect(() => {
    if (!isIntroPhase && currentQuestion) {
      setTimeLeft(currentQuestion.timeLimit || 60);
    }
  }, [currentIndex]);


  const submitAnswer = async () => {
    if (isSubmitting) return;
    stopMic()
    setIsSubmitting(true)

    try {
      const result = await axios.post(ServerUrl + "/api/interview/submit-answer", {
        interviewId,
        questionIndex: currentIndex,
        answer,
        timeTaken:
          currentQuestion.timeLimit - timeLeft,
      }, { withCredentials: true })

      setFeedback(result.data.feedback)
      speakText(result.data.feedback)
      setIsSubmitting(false)
    } catch (error) {
      console.log(error)
      setIsSubmitting(false)
    }
  }

  const handleNext = async () => {
    setAnswer("");
    setFeedback("");

    if (currentIndex + 1 >= questions.length) {
      finishInterview();
      return;
    }

    await speakText("Alright, let's move to the next question.");

    setCurrentIndex(currentIndex + 1);
    setTimeout(() => {
      if (isMicOnRef.current) startMic();
    }, 500);


  }

  const finishInterview = async () => {
    stopMic()
    isMicOnRef.current = false;
    setIsMicOn(false)
    try {
      const result = await axios.post(ServerUrl + "/api/interview/finish", { interviewId }, { withCredentials: true })

      console.log(result.data)
      onFinish(result.data)
    } catch (error) {
      console.log(error)
    }
  }


  useEffect(() => {
    if (isIntroPhase) return;
    if (!currentQuestion) return;

    if (timeLeft === 0 && !isSubmitting && !feedback) {
      submitAnswer()
    }
  }, [timeLeft]);

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);


  /* ---------------- DESIGN-ONLY HELPERS (no logic changes) ---------------- */
  const totalTime = currentQuestion?.timeLimit || 60;
  const elapsed = Math.max(0, totalTime - timeLeft);
  const progressPercent = isIntroPhase
    ? 0
    : Math.round(((currentIndex + 1) / questions.length) * 100);
  const isRecording = isListening && !isAIPlaying && !isIntroPhase;
  const position = interviewData?.role || "Interview Candidate";
  const BARS = 36;


  return (
    <div className='relative min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-100 flex items-center justify-center p-4 sm:p-6 overflow-hidden'>

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

      <div className='relative w-full max-w-[1400px] min-h-[80vh] bg-white/95 backdrop-blur rounded-[2rem] shadow-2xl shadow-blue-200/60 border border-sky-100 flex flex-col overflow-hidden'>

        {/* top gradient accent line */}
        <div className='absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#2563EB] via-sky-400 to-[#1D4ED8]'></div>

        {/* BRAND HEADER (top-left logo) */}
        <div className='flex items-center justify-between px-6 sm:px-8 pt-6 pb-4 border-b border-sky-100'>
          <div className='flex items-center gap-3'>
            <motion.div
              animate={{ rotate: [0, -8, 8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className='bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] text-white p-2.5 rounded-xl shadow-lg shadow-blue-300/70'>
              <BsRobot size={20} />
            </motion.div>
            <span className='font-bold text-lg tracking-tight text-gray-900'>HireSense.AI</span>
          </div>

          <span className='bg-sky-100 text-[#1D4ED8] text-xs font-semibold px-3 py-1.5 rounded-full'>
            {isIntroPhase ? "Warming up" : `Question ${currentIndex + 1} / ${questions.length}`}
          </span>
        </div>

        <div className='flex-1 flex flex-col lg:flex-row'>

          {/* ================= LEFT SIDEBAR ================= */}
          <div className='w-full lg:w-[35%] bg-gradient-to-b from-sky-50 to-white flex flex-col items-center p-6 space-y-5 border-r border-sky-100'>

            {/* video with speaking glow */}
            <div className={`w-full max-w-md rounded-2xl overflow-hidden shadow-xl transition-all duration-500 ${isAIPlaying
              ? "ring-4 ring-[#2563EB]/60 shadow-blue-400/60"
              : "ring-2 ring-sky-100 shadow-blue-100"
              }`}>
              <video
                src={videoSource}
                key={videoSource}
                ref={videoRef}
                muted
                playsInline
                preload="auto"
                className="w-full h-auto object-cover"
              />
            </div>

            {/* candidate info */}
            <div className='w-full max-w-md bg-white border border-sky-100 rounded-2xl px-5 py-3 shadow-sm'>
              <p className='text-sm text-gray-500'>Candidate: <span className='font-semibold text-gray-800'>{userName}</span></p>
              <p className='text-sm text-gray-500'>Position: <span className='font-semibold text-[#1D4ED8]'>{position}</span></p>
            </div>

            {/* subtitle */}
            {subtitle && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className='w-full max-w-md bg-white border border-sky-200 rounded-xl p-4 shadow-md shadow-blue-100'>
                <p className='text-gray-700 text-sm sm:text-base font-medium text-center leading-relaxed'>{subtitle}</p>
              </motion.div>
            )}


            {/* question status + timer */}
            <div className='w-full max-w-md bg-white border border-sky-100 rounded-2xl shadow-lg shadow-blue-100 p-6 space-y-4'>
              <div className='flex justify-between items-center'>
                <span className='text-sm text-gray-500'>
                  Interview Status
                </span>
                {isAIPlaying && <span className='flex items-center gap-2 text-sm font-semibold text-[#1D4ED8] bg-sky-100 px-3 py-1 rounded-full'>
                  <span className='relative flex h-2 w-2'>
                    <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2563EB] opacity-60'></span>
                    <span className='relative inline-flex rounded-full h-2 w-2 bg-[#2563EB]'></span>
                  </span>
                  AI Speaking
                </span>}
              </div>

              <div className="h-px bg-sky-100"></div>

              {/* large question counter */}
              <p className='text-center text-3xl font-extrabold text-[#1D4ED8] tracking-tight'>
                Question {currentIndex + 1} <span className='text-gray-300'>/</span> {questions.length}
              </p>

              <div className='flex justify-center'>
                <Timer timeLeft={timeLeft} totalTime={currentQuestion?.timeLimit} />
              </div>

              <p className='text-center text-sm text-gray-500'>
                Time Limit for this Question: <span className='font-semibold text-gray-800'>{totalTime}s</span>
              </p>
            </div>

            {/* feature chips */}
            <div className='w-full max-w-md bg-white border border-sky-100 rounded-2xl shadow-md shadow-blue-100 p-5'>
              <p className='text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3'>
                Interview Tools &amp; AI Features
              </p>
              <div className='space-y-2.5'>
                {[
                  { icon: <BsMic size={14} />, label: "Voice Interviews" },
                  { icon: <BsBarChart size={14} />, label: "Instant Scores" },
                  { icon: <BsShieldCheck size={14} />, label: "Secure Session" }
                ].map((chip) => (
                  <div key={chip.label}
                    className='flex items-center justify-between bg-sky-50 border border-sky-100 rounded-xl px-3 py-2'>
                    <span className='flex items-center gap-2 text-[#1D4ED8] text-sm font-medium'>
                      {chip.icon}
                      {chip.label}
                    </span>
                    <span className='flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full'>
                      <span className='w-1.5 h-1.5 rounded-full bg-emerald-500'></span>
                      ACTIVE
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* progress */}
            <div className='w-full max-w-md'>
              <div className='flex justify-between text-sm mb-2'>
                <span className='text-gray-500'>Interview progress</span>
                <span className='font-semibold text-[#1D4ED8]'>{progressPercent}% Complete</span>
              </div>
              <div className='w-full h-2 bg-sky-100 rounded-full overflow-hidden'>
                <motion.div
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.6 }}
                  className='h-full bg-gradient-to-r from-[#2563EB] to-sky-400 rounded-full'
                />
              </div>
            </div>
          </div>

          {/* ================= RIGHT SIDEBAR ================= */}
          <div className='flex-1 flex flex-col p-4 sm:p-6 md:p-8 relative'>

            <h2 className='text-xl sm:text-2xl text-gray-800 mb-6 tracking-tight'>
              <span className='font-extrabold text-[#1D4ED8]'>HireSense.AI</span>
              <span className='font-semibold'> - Smart Interview</span>
            </h2>


            {!isIntroPhase && (<div className='relative mb-6 bg-gradient-to-br from-sky-50 to-white p-4 sm:p-6 rounded-2xl border border-sky-200 shadow-md shadow-blue-100 overflow-hidden'>
              <div className='absolute top-0 left-0 h-full w-1.5 bg-gradient-to-b from-[#2563EB] to-sky-400'></div>
              <p className='text-xs sm:text-sm text-[#2563EB] font-semibold mb-2 pl-3'>
                Question {currentIndex + 1} of {questions.length}
              </p>

              <div className='pl-3 text-base sm:text-lg font-semibold text-gray-800 leading-relaxed '>{currentQuestion?.question}</div>
            </div>)
            }

            {/* PRIMARY: speak (waveform + mic) */}
            <div className='bg-gradient-to-br from-sky-50 via-white to-sky-50 border border-sky-200 rounded-2xl p-5 sm:p-6 shadow-md shadow-blue-100'>
              <p className='text-sm font-semibold text-[#1D4ED8] mb-4 text-center'>
                Answer by speaking or typing
              </p>

              <div className='flex items-center justify-center gap-[3px] h-24'>
                {Array.from({ length: BARS }).map((_, i) => {
                  const peak = 22 + ((i * 37) % 62);
                  return (
                    <motion.div
                      key={i}
                      animate={isRecording
                        ? { height: [8, peak, 12, peak * 0.6, 8] }
                        : { height: 6 }}
                      transition={isRecording
                        ? { duration: 0.9 + (i % 6) * 0.12, repeat: Infinity, ease: "easeInOut", delay: (i % 8) * 0.05 }
                        : { duration: 0.3 }}
                      className={`w-1.5 rounded-full ${isRecording
                        ? "bg-gradient-to-t from-[#2563EB] to-sky-400"
                        : "bg-sky-200"
                        }`}
                    />
                  )
                })}
              </div>

              {/* mic + status */}
              <div className='flex items-center justify-center gap-4 mt-4'>
                <motion.button
                  onClick={toggleMic}
                  whileTap={{ scale: 0.9 }}
                  whileHover={{ scale: 1.08 }}
                  className={`relative w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center rounded-full text-white shadow-lg transition-colors ${isMicOn
                    ? "bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] shadow-blue-400/60"
                    : "bg-gray-700 shadow-gray-400/50"
                    }`}>
                  {isRecording && (
                    <span className='absolute inset-0 rounded-full bg-[#2563EB] opacity-30 animate-ping'></span>
                  )}
                  <span className='relative'>
                    {isMicOn ? <FaMicrophone size={22} /> : <FaMicrophoneSlash size={22} />}
                  </span>
                </motion.button>

                <div className='text-sm'>
                  {isRecording ? (
                    <span className='flex items-center gap-2 font-semibold text-[#1D4ED8]'>
                      <span className='w-2 h-2 rounded-full bg-red-500 animate-pulse'></span>
                      Recording... {elapsed}s
                    </span>
                  ) : isAIPlaying ? (
                    <span className='font-semibold text-[#1D4ED8]'>AI is speaking...</span>
                  ) : (
                    <span className='font-medium text-gray-500'>
                      {isMicOn ? "Waiting for microphone..." : "Mic is off"}
                    </span>
                  )}
                </div>
              </div>

              {/* shows why the mic isn't working */}
              {micError && (
                <p className='text-xs text-red-500 text-center mt-3'>{micError}</p>
              )}
            </div>

            {/* SECONDARY: type */}
            <p className='text-xs font-semibold text-gray-400 uppercase tracking-wider mt-5 mb-2'>
              Secondary: Type your answer
            </p>
            <textarea
              placeholder="Type your answer here..."
              onChange={(e) => setAnswer(e.target.value)}
              value={answer}
              className="flex-1 min-h-[120px] bg-sky-50/50 p-4 sm:p-5 rounded-2xl resize-none outline-none border border-sky-100 focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/50 transition text-gray-800" />


            {/* ================= BOTTOM ACTION BAR ================= */}
            {!feedback ? (<div className='mt-6'>
              <p className='text-center text-xs sm:text-sm text-gray-500 mb-3'>
                By submitting, you unlock AI progress analysis.
              </p>

              <motion.button
                onClick={submitAnswer}
                disabled={isSubmitting}
                whileTap={{ scale: 0.97 }}
                whileHover={{ scale: 1.03, y: -2 }}
                className='group relative overflow-hidden w-full flex items-center justify-center gap-2 py-3.5 sm:py-4 bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] text-white font-semibold rounded-full shadow-lg shadow-blue-400/50 hover:shadow-xl hover:shadow-blue-500/60 transition-shadow disabled:from-gray-400 disabled:to-gray-500 disabled:shadow-none'>
                <span className='absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/30 to-transparent'></span>
                <span className='relative'>
                  {isSubmitting ? "Submitting..." : "Submit & Continue to Next Question"}
                </span>
                {!isSubmitting && <BsArrowRight className='relative group-hover:translate-x-1 transition-transform' size={18} />}
              </motion.button>

            </div>) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className='mt-6 bg-gradient-to-br from-sky-50 to-blue-50 border border-sky-200 p-5 rounded-2xl shadow-md shadow-blue-100'>
                <p className='text-[#1D4ED8] font-semibold text-sm mb-1'>AI Feedback</p>
                <p className='text-gray-700 font-medium mb-4 leading-relaxed'>{feedback}</p>

                <button
                  onClick={handleNext}

                  className='w-full bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] text-white py-3 rounded-full shadow-md shadow-blue-300/60 hover:shadow-lg hover:opacity-95 transition flex items-center justify-center gap-1'>
                  Next Question <BsArrowRight size={18} />
                </button>

              </motion.div>
            )}
          </div>
        </div>
      </div>

    </div>
  )
}

export default Step2Interview