import React from 'react'
import maleVideo from "../assets/videos/male-ai.mp4"
import femaleVideo from "../assets/videos/female-ai.mp4"
import Timer from './Timer'
import { motion } from "motion/react"
import { FaMicrophone, FaMicrophoneSlash, FaUndo } from "react-icons/fa";
import { useState } from 'react'
import { useRef } from 'react'
import { useEffect } from 'react'
import axios from "axios"
import { ServerUrl } from '../App'
import { BsArrowRight, BsRobot, BsMic, BsBarChart, BsShieldCheck } from 'react-icons/bs'

/* ---------------- TUNING ---------------- */
const BARS = 36;                    // number of waveform bars
const NOISE_GATE = 45;              // raise (60) if bars move on background noise, lower (30) if they barely react
const SPEECH_LANG = "en-US";        // try "en-IN" (Indian English) or "en-GB" if your accent is misheard
const SPEECH_RATE = 1;              // AI speaking speed (1 = normal)
const USE_LIVE_WAVEFORM = true;     // set to false to test if the extra mic stream affects recognition
const MAX_RETRIES = 5;              // "Clear & Try Again" attempts allowed per question

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

  // retry feature
  const [retriesLeft, setRetriesLeft] = useState(MAX_RETRIES);

  // voice recognition state/refs
  const [isListening, setIsListening] = useState(false);
  const [isHearing, setIsHearing] = useState(false);     // true while the mic hears speech
  const [micError, setMicError] = useState("");          // serious problem (red)
  const [micNotice, setMicNotice] = useState("");        // soft hint, e.g. no speech yet (amber)
  const [interimText, setInterimText] = useState("");    // live words while speaking
  const interimRef = useRef("");
  const isListeningRef = useRef(false);
  const startingSinceRef = useRef(0);                    // time start() was called (0 = not starting)
  const shouldListenRef = useRef(false);
  const isMicOnRef = useRef(true);
  const isAIPlayingRef = useRef(false);

  // AI speech state/refs
  const [isAskingQuestion, setIsAskingQuestion] = useState(false);
  const [speakIndex, setSpeakIndex] = useState(null);    // character position being spoken
  const utteranceRef = useRef(null);                     // keeps the utterance from being garbage collected
  const speakIdRef = useRef(0);
  const voiceChosenRef = useRef(false);
  const aliveRef = useRef(true);

  // waveform refs (real mic volume)
  const barRefs = useRef([]);
  const audioCtxRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);

  const answerBoxRef = useRef(null);
  const videoRef = useRef(null);

  const currentQuestion = questions[currentIndex];


  /* ---------------- LOAD AI VOICE ---------------- */
  useEffect(() => {
    const loadVoices = () => {
      if (voiceChosenRef.current) return;     // choose only once (prevents the intro restarting)
      const voices = window.speechSynthesis.getVoices();
      if (!voices.length) return;
      voiceChosenRef.current = true;

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


  /* ---------------- SAFE MIC START ----------------
     Never starts while: the mic is off, the AI is speaking, a session is already
     running, or another start() was issued less than 3 seconds ago. */
  const safeStart = (r, tries = 0) => {
    if (!r || !shouldListenRef.current || !isMicOnRef.current) return;
    if (isListeningRef.current || isAIPlayingRef.current) return;
    if (startingSinceRef.current && Date.now() - startingSinceRef.current < 3000) return;

    try {
      startingSinceRef.current = Date.now();
      r.start();
    } catch {
      startingSinceRef.current = 0;
      // the browser is probably still closing the previous session, so try again shortly
      if (tries < 6) setTimeout(() => safeStart(r, tries + 1), 150);
    }
  };


  /* ---------------- SPEECH RECOGNITION (user's voice -> text) ---------------- */
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMicError("Speech recognition is not supported in this browser. Please use Chrome or Edge, or type your answer.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = SPEECH_LANG;
    recognition.continuous = true;         // keeps listening across sentences (restarted automatically in onend)
    recognition.interimResults = true;     // words appear live while speaking

    recognition.onstart = () => {
      isListeningRef.current = true;
      startingSinceRef.current = 0;
    };

    recognition.onaudiostart = () => setIsListening(true);   // audio really is being captured

    recognition.onspeechstart = () => {
      setIsHearing(true);
      setMicNotice("");
    };
    recognition.onspeechend = () => setIsHearing(false);

    recognition.onresult = (event) => {
      if (isAIPlayingRef.current) return;   // never transcribe the AI's own voice

      // recognition is clearly working, so clear any old error/hint
      setMicError("");
      setMicNotice("");
      setIsListening(true);

      let liveInterim = "";
      let accumulatedFinal = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          accumulatedFinal += transcript + " ";
        } else {
          liveInterim += transcript;
        }
      }

      if (accumulatedFinal.trim()) {
        setAnswer((prev) => (prev ? prev.trim() + " " : "") + accumulatedFinal.trim());
      }
      interimRef.current = liveInterim;
      setInterimText(liveInterim);
    };

    recognition.onerror = (event) => {
      console.warn("Speech recognition error:", event.error);
      startingSinceRef.current = 0;

      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        shouldListenRef.current = false;
        setMicError("Microphone permission denied. Click the lock icon in the address bar and allow the microphone.");
      } else if (event.error === "audio-capture") {
        shouldListenRef.current = false;
        setMicError("No microphone found. Please connect one.");
      } else if (event.error === "network") {
        shouldListenRef.current = false;
        setMicError("Network error during speech recognition. Check your internet connection (voice recognition doesn't work in Brave).");
      } else if (event.error === "no-speech") {
        setMicNotice("No speech detected yet. Speak a little louder or check your microphone. Still listening...");
      }
      // "aborted" is normal (we abort on purpose), so it is ignored
    };

    recognition.onend = () => {
      isListeningRef.current = false;
      startingSinceRef.current = 0;
      setIsListening(false);
      setIsHearing(false);

      // commit any half-recognised words so nothing is lost
      const leftover = interimRef.current.trim();
      if (leftover) {
        setAnswer((prev) => (prev ? prev.trim() + " " : "") + leftover);
      }
      interimRef.current = "";
      setInterimText("");

      // restart if the mic should stay on and the AI is not speaking
      if (shouldListenRef.current && !isAIPlayingRef.current && isMicOnRef.current) {
        setTimeout(() => safeStart(recognition), 80);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      shouldListenRef.current = false;
      recognition.onend = null;
      try { recognition.abort(); } catch { }
    };
  }, []);


  /* ---------------- WATCHDOG: heals a lost restart so the mic can never stay dead ---------------- */
  useEffect(() => {
    const id = setInterval(() => {
      if (
        shouldListenRef.current &&
        isMicOnRef.current &&
        !isAIPlayingRef.current &&
        !isListeningRef.current
      ) {
        safeStart(recognitionRef.current);
      }
    }, 2000);
    return () => clearInterval(id);
  }, []);


  /* ---------------- LIVE WAVEFORM (reacts to real voice volume) ----------------
     Uses its own audio stream with explicit constraints. The stream is fully released
     whenever the mic is turned off or the page is left. */
  useEffect(() => {
    if (!USE_LIVE_WAVEFORM) return;

    if (!isMicOn) {
      barRefs.current.forEach((el) => { if (el) el.style.height = "6px"; });
      return;
    }

    let cancelled = false;

    const setup = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) return;

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
        });
        if (cancelled) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        streamRef.current = stream;

        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioCtx();
        audioCtxRef.current = ctx;
        if (ctx.state === "suspended") ctx.resume();

        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.6;
        source.connect(analyser);       // analysis only: nothing is routed to the speakers

        const data = new Uint8Array(analyser.frequencyBinCount);
        const smooth = new Array(BARS).fill(0);
        const mid = (BARS - 1) / 2;

        const tick = () => {
          const active = isMicOnRef.current && !isAIPlayingRef.current;
          if (active) analyser.getByteFrequencyData(data);

          for (let i = 0; i < BARS; i++) {
            const el = barRefs.current[i];
            if (!el) continue;

            // centre bars use the strongest voice frequencies, outer bars the higher ones
            const d = Math.abs(i - mid) / mid;
            const idx = 1 + Math.floor(d * 30);
            let v = active ? data[idx] : 0;
            v = v < NOISE_GATE ? 0 : (v - NOISE_GATE) / (255 - NOISE_GATE);

            smooth[i] += (v - smooth[i]) * 0.35;
            el.style.height = (6 + smooth[i] * 90) + "px";
          }
          rafRef.current = requestAnimationFrame(tick);
        };
        tick();
      } catch (err) {
        console.log("Waveform mic error:", err);
      }
    };

    setup();

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
      try { audioCtxRef.current?.close(); } catch { }
      audioCtxRef.current = null;
    };
  }, [isMicOn]);


  const startMic = () => {
    const r = recognitionRef.current;
    if (!r || isAIPlayingRef.current || !isMicOnRef.current) return;
    shouldListenRef.current = true;
    safeStart(r);
  };

  const stopMic = (abort = false) => {
    shouldListenRef.current = false;
    try {
      if (abort) recognitionRef.current?.abort();
      else recognitionRef.current?.stop();
    } catch { }
  };

  const toggleMic = () => {
    if (isMicOn) {
      isMicOnRef.current = false;
      stopMic(true);              // abort cleanly; onend keeps any half-heard words
    } else {
      isMicOnRef.current = true;
      startMic();                 // if the old session is still closing, onend restarts it
    }
    setIsMicOn(!isMicOn);
  };

  // used by the "Reconnect microphone" button after an error
  const reconnectMic = () => {
    setMicError("");
    setMicNotice("");
    isMicOnRef.current = true;
    setIsMicOn(true);
    startMic();
  };


  /* ---------------- CLEAR & TRY AGAIN (max 5 attempts per question) ---------------- */
  const handleRetry = () => {
    if (retriesLeft <= 0 || isSubmitting || feedback || isIntroPhase) return;

    // wipe the current answer first, so nothing gets re-added when the mic session closes
    interimRef.current = "";
    setInterimText("");
    setAnswer("");
    setRetriesLeft((prev) => prev - 1);

    if (isMicOnRef.current && !isAIPlayingRef.current) {
      shouldListenRef.current = true;
      if (isListeningRef.current) {
        // abort throws away the audio heard so far, then onend restarts the mic cleanly
        try { recognitionRef.current?.abort(); } catch { }
      } else {
        safeStart(recognitionRef.current);
      }
    } else {
      try { recognitionRef.current?.abort(); } catch { }
    }
  };

  // every new question gets a fresh set of attempts
  useEffect(() => {
    setRetriesLeft(MAX_RETRIES);
  }, [currentIndex]);


  /* ---------------- SPEAK FUNCTION ---------------- */
  // options: isQuestion -> highlight words in the question card, resumeMic -> turn the mic on when finished
  const speakText = (text, { isQuestion = false, resumeMic = true } = {}) => {
    return new Promise((resolve) => {
      const synth = window.speechSynthesis;
      if (!aliveRef.current || !synth || !selectedVoice) {
        resolve();
        return;
      }

      const myId = ++speakIdRef.current;
      synth.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utteranceRef.current = utterance;     // prevents Chrome from dropping the "end" event

      utterance.voice = selectedVoice;
      utterance.rate = SPEECH_RATE;
      utterance.pitch = 1.05;
      utterance.volume = 1;

      let finished = false;
      let keepAlive = null;
      let fallback = null;

      const finish = () => {
        if (finished) return;
        finished = true;
        clearInterval(keepAlive);
        clearTimeout(fallback);

        // a newer sentence has already taken over, so don't touch the shared state
        if (myId !== speakIdRef.current) {
          resolve();
          return;
        }

        videoRef.current?.pause();
        if (videoRef.current) videoRef.current.currentTime = 0;
        isAIPlayingRef.current = false;
        setIsAIPlaying(false);
        setIsAskingQuestion(false);
        setSpeakIndex(null);

        if (resumeMic && isMicOnRef.current) {
          startMic();
        }
        setTimeout(() => {
          setSubtitle("");
          resolve();
        }, 100);
      };

      utterance.onstart = () => {
        isAIPlayingRef.current = true;
        setIsAIPlaying(true);
        setMicNotice("");
        if (isQuestion) setIsAskingQuestion(true);
        stopMic(true);
        videoRef.current?.play()?.catch(() => { });
      };

      // moves the highlight along the question while the AI says it
      utterance.onboundary = (e) => {
        if (isQuestion && typeof e.charIndex === "number") setSpeakIndex(e.charIndex);
      };

      utterance.onend = finish;
      utterance.onerror = finish;

      setSubtitle(text);

      // Chrome silently stops long speech after ~15s, so nudge it every 10s
      keepAlive = setInterval(() => {
        if (synth.speaking) {
          synth.pause();
          synth.resume();
        }
      }, 10000);

      // safety net: if the browser never fires "end", carry on anyway
      const wordCount = text.trim().split(/\s+/).length;
      const estimateMs = (wordCount / 2.3) * 1000;
      fallback = setTimeout(() => {
        synth.cancel();
        finish();
      }, estimateMs * 1.6 + 4000);

      setTimeout(() => synth.speak(utterance), 60);
    });
  };


  useEffect(() => {
    if (!selectedVoice) {
      return;
    }
    const runIntro = async () => {
      if (isIntroPhase) {
        await speakText(
          `Hi ${userName}, it's great to meet you today. I hope you're feeling confident and ready.`,
          { resumeMic: false }
        );

        await speakText(
          "I'll ask you a few questions. Just answer naturally, and take your time. Let's begin.",
          { resumeMic: false }
        );

        setIsIntroPhase(false)
      } else if (currentQuestion) {
        await new Promise(r => setTimeout(r, 500));

        // If last question (hard level)
        if (currentIndex === questions.length - 1) {
          await speakText("Alright, this one might be a bit more challenging.", { resumeMic: false });
        }

        // the mic turns on automatically as soon as the AI finishes the question
        await speakText(currentQuestion.question, { isQuestion: true });
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


  // keep the newest words visible in the answer box
  useEffect(() => {
    const el = answerBoxRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [answer, interimText]);


  const submitAnswer = async () => {
    if (isSubmitting) return;
    stopMic()
    setIsSubmitting(true)

    // include words that were still being recognised when the button was pressed
    const finalAnswer = (answer + " " + interimRef.current).trim();
    interimRef.current = "";
    setInterimText("");

    try {
      const result = await axios.post(ServerUrl + "/api/interview/submit-answer", {
        interviewId,
        questionIndex: currentIndex,
        answer: finalAnswer,
        timeTaken:
          currentQuestion.timeLimit - timeLeft,
      }, { withCredentials: true })

      setFeedback(result.data.feedback)
      speakText(result.data.feedback, { resumeMic: false })
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

    await speakText("Alright, let's move to the next question.", { resumeMic: false });

    setCurrentIndex(currentIndex + 1);
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

  // cleanup when leaving the page: stop talking and make sure the mic is off
  useEffect(() => {
    aliveRef.current = true;
    isMicOnRef.current = true;
    return () => {
      aliveRef.current = false;
      speakIdRef.current++;
      isMicOnRef.current = false;
      shouldListenRef.current = false;
      window.speechSynthesis.cancel();
    };
  }, []);


  /* ---------------- DESIGN-ONLY HELPERS ---------------- */
  const totalTime = currentQuestion?.timeLimit || 60;
  const elapsed = Math.max(0, totalTime - timeLeft);
  const progressPercent = isIntroPhase
    ? 0
    : Math.round(((currentIndex + 1) / questions.length) * 100);
  const isRecording = isListening && !isAIPlaying && !isIntroPhase && !feedback;
  const position = interviewData?.role || "Interview Candidate";

  // answer box shows confirmed words + the words being heard right now
  const liveAnswer = interimText
    ? (answer ? answer.trim() + " " : "") + interimText
    : answer;

  const canRetry = retriesLeft > 0 && !isSubmitting && !isIntroPhase && liveAnswer.trim().length > 0;

  // question text, with spoken words highlighted while the AI is asking it
  const questionText = currentQuestion?.question || "";
  let questionNode = questionText;
  if (isAskingQuestion && speakIndex !== null) {
    let pos = 0;
    questionNode = questionText.split(/(\s+)/).map((part, i) => {
      const start = pos;
      pos += part.length;
      return (
        <span
          key={i}
          className={`transition-colors duration-200 ${start <= speakIndex ? "text-gray-900" : "text-gray-300"}`}>
          {part}
        </span>
      );
    });
  }


  return (
    <div className='relative min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-100 flex items-center justify-center p-4 sm:p-6 overflow-hidden'>

      {/* background blobs (static, so the page stays fast) */}
      <div className='pointer-events-none absolute -top-24 -left-24 w-96 h-96 rounded-full bg-blue-400/30 blur-3xl' />
      <div className='pointer-events-none absolute bottom-0 -right-24 w-[26rem] h-[26rem] rounded-full bg-sky-300/40 blur-3xl' />

      <div className='relative w-full max-w-[1400px] min-h-[80vh] bg-white rounded-[2rem] shadow-2xl shadow-blue-200/60 border border-sky-100 flex flex-col overflow-hidden'>

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

            {/* subtitle (what the AI is saying right now) */}
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


            {/* QUESTION CARD: visible while the AI is asking it */}
            {isIntroPhase ? (
              <div className='mb-6 bg-sky-50/60 p-4 sm:p-6 rounded-2xl border-2 border-dashed border-sky-200'>
                <p className='text-sm font-semibold text-[#1D4ED8] mb-1'>Your interviewer is introducing the session...</p>
                <p className='text-sm text-gray-500'>Your first question will appear here as soon as it is asked.</p>
              </div>
            ) : (
              <div className='relative mb-6 bg-gradient-to-br from-sky-50 to-white p-4 sm:p-6 rounded-2xl border border-sky-200 shadow-md shadow-blue-100 overflow-hidden'>
                <div className='absolute top-0 left-0 h-full w-1.5 bg-gradient-to-b from-[#2563EB] to-sky-400'></div>

                <div className='flex items-center justify-between pl-3 mb-2'>
                  <p className='text-xs sm:text-sm text-[#2563EB] font-semibold'>
                    Question {currentIndex + 1} of {questions.length}
                  </p>
                  {isAskingQuestion && (
                    <span className='flex items-center gap-2 text-xs font-semibold text-[#1D4ED8] bg-sky-100 px-3 py-1 rounded-full'>
                      <span className='relative flex h-2 w-2'>
                        <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2563EB] opacity-60'></span>
                        <span className='relative inline-flex rounded-full h-2 w-2 bg-[#2563EB]'></span>
                      </span>
                      AI is asking...
                    </span>
                  )}
                </div>

                <div className='pl-3 text-base sm:text-lg font-semibold text-gray-800 leading-relaxed'>{questionNode}</div>
              </div>
            )}

            {/* PRIMARY: speak (waveform + mic) */}
            <div className='bg-gradient-to-br from-sky-50 via-white to-sky-50 border border-sky-200 rounded-2xl p-5 sm:p-6 shadow-md shadow-blue-100'>
              <p className='text-sm font-semibold text-[#1D4ED8] mb-4 text-center'>
                Answer by speaking or typing
              </p>

              {/* waveform: bar heights are driven by the real microphone volume */}
              <div className='flex items-center justify-center gap-[3px] h-24'>
                {Array.from({ length: BARS }).map((_, i) => (
                  <div
                    key={i}
                    ref={(el) => (barRefs.current[i] = el)}
                    className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${isRecording
                      ? "bg-gradient-to-t from-[#2563EB] to-sky-400"
                      : "bg-sky-200"
                      }`}
                  />
                ))}
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
                      <span className={`w-2 h-2 rounded-full ${isHearing ? "bg-red-500 animate-pulse" : "bg-sky-400"}`}></span>
                      {isHearing ? "Hearing you..." : `Listening... ${elapsed}s`}
                    </span>
                  ) : isAIPlaying ? (
                    <span className='font-semibold text-[#1D4ED8]'>AI is speaking...</span>
                  ) : (
                    <span className='font-medium text-gray-500'>
                      {feedback ? "Answer submitted" : isMicOn ? "Starting microphone..." : "Mic is off"}
                    </span>
                  )}
                </div>
              </div>

              {/* serious problem: red message + reconnect */}
              {micError && (
                <div className='mt-3 text-center'>
                  <p className='text-xs text-red-500'>{micError}</p>
                  {recognitionRef.current && (
                    <button
                      type='button'
                      onClick={reconnectMic}
                      className='mt-2 text-xs font-semibold text-[#1D4ED8] bg-sky-100 hover:bg-sky-200 px-3 py-1.5 rounded-full transition'>
                      Reconnect microphone
                    </button>
                  )}
                </div>
              )}

              {/* soft hint (e.g. no speech detected yet), clears itself as soon as you speak */}
              {!micError && micNotice && (
                <p className='text-xs text-amber-600 text-center mt-3'>{micNotice}</p>
              )}
            </div>

            {/* ANSWER BOX + CLEAR & TRY AGAIN */}
            <div className='flex items-center justify-between gap-3 mt-5 mb-2'>
              <p className='text-xs font-semibold text-gray-400 uppercase tracking-wider'>
                Your answer (spoken words appear here live)
              </p>

              {!feedback && (
                <button
                  type='button'
                  onClick={handleRetry}
                  disabled={!canRetry}
                  className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full border transition ${canRetry
                    ? "border-[#2563EB]/40 bg-sky-50 text-[#1D4ED8] hover:bg-sky-100 hover:border-[#2563EB] cursor-pointer"
                    : "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
                    }`}>
                  <FaUndo size={11} />
                  Clear &amp; Try Again ({retriesLeft} {retriesLeft === 1 ? "attempt" : "attempts"} left)
                </button>
              )}
            </div>
            <textarea
              ref={answerBoxRef}
              placeholder="Type your answer here..."
              onChange={(e) => {
                interimRef.current = "";
                setInterimText("");
                setAnswer(e.target.value);
              }}
              value={liveAnswer}
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