import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/router';
import {
  User,
  MapPin,
  Instagram,
  Music,
  Youtube,
  Phone,
  Mail,
  Target,
  Rocket,
  CheckCircle2,
  ArrowRight,
  ChevronLeft,
  X,
  Mic2,
  Zap,
  Globe,
  Award,
  Star,
  ExternalLink
} from 'lucide-react';

type FormData = {
  firstName: string;
  lastName: string;
  stageName: string;
  place: string;
  instagram: string;
  spotify: string;
  youtube: string;
  mobile: string;
  email: string;
  artistIdentity: string;
  trainingDetails: string;
  coreSkills: string;
  strengthsUniqueness: string;
  dailyTime: string;
  mentorName: string;
  songsReleased: string;
  showsPerformed: string;
  currentFans: string;
  currentSetup: string;
  currentlyWorkingOn: string;
  dailyRituals: string;
  learningNeeds: string;
  mentorshipNeeds: string;
  curationNeeds: string;
  fandomNeeds: string;
  aspirationalGoal: string;
  anythingElse: string;
};

const courses = [
  {
    id: 'composition',
    title: 'The heART of Composition',
    mentor: 'Sandesh Shandilya',
    banner: '/assets/the heart of music composition thumbmail 4K.jpg.jpeg',
    url: '/masterclass/sandesh-shandilya',
    keywords: ['imagination', 'emotion', 'expression', 'songwriting', 'composer', 'lyrics', 'writing', 'mainstream']
  },
  {
    id: 'classical',
    title: 'Roots of Hindustani Classical',
    mentor: 'Prasad Khaparde',
    banner: '/assets/The roots of Hindustani Classical Music.png',
    url: '/tscacademy',
    keywords: ['classical', 'riyaaz', 'vocal', 'guruji', 'raag', 'hindustani', 'gharanas', 'singing']
  },
  {
    id: 'production',
    title: 'A to Z of Music Production',
    mentor: 'Luca Petracca',
    banner: '/assets/Academy coming soon!.png',
    url: '/tscacademy',
    keywords: ['daw', 'ableton', 'logic', 'fl studio', 'production', 'mixing', 'mastering', 'tech', 'studio', 'beat', 'orchestration']
  }
];

export default function ArtistPath() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [recommendedCourse, setRecommendedCourse] = useState(courses[0]);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      firstName: '',
      lastName: '',
      stageName: '',
      place: '',
      instagram: '',
      spotify: '',
      youtube: '',
      mobile: '',
      email: '',
      artistIdentity: '',
      trainingDetails: '',
      coreSkills: '',
      strengthsUniqueness: '',
      dailyTime: '',
      mentorName: '',
      songsReleased: '',
      showsPerformed: '',
      currentFans: '',
      currentSetup: '',
      currentlyWorkingOn: '',
      dailyRituals: '',
      learningNeeds: '',
      mentorshipNeeds: '',
      curationNeeds: '',
      fandomNeeds: '',
      aspirationalGoal: '',
      anythingElse: '',
    }
  });

  const getRecommendedCourse = (data: FormData) => {
    const text = `${data.artistIdentity} ${data.trainingDetails} ${data.coreSkills} ${data.mentorshipNeeds} ${data.learningNeeds}`.toLowerCase();
    let scores = { composition: 0, classical: 0, production: 0 };

    courses.forEach(course => {
      course.keywords.forEach(kw => {
        if (text.includes(kw)) scores[course.id as keyof typeof scores]++;
      });
    });

    if (scores.classical > 0 && scores.classical >= scores.production && scores.classical >= scores.composition) return courses[1];
    if (scores.production > scores.composition && scores.production > scores.classical) return courses[2];
    return courses[0];
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/artist-path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (!result.success) {
        setErrorMsg(result.error || 'Failed to submit. Please try again.');
      } else {
        const recommendation = getRecommendedCourse(data);
        setRecommendedCourse(recommendation);
        setIsSuccess(true);
        // Signal _app.tsx to show footer
        router.push({ query: { ...router.query, success: 'true' } }, undefined, { shallow: true });
      }
    } catch (err) {
      setErrorMsg('A network error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const checkBypass = () => {
    const fn = watch('firstName').trim().toLowerCase();
    const ln = watch('lastName').trim().toLowerCase();

    if (fn === 'bypass' && ln === 'raghav') {
      setRecommendedCourse(courses[0]);
      setIsSuccess(true);
      // Signal _app.tsx to show footer
      router.push({ query: { ...router.query, success: 'true' } }, undefined, { shallow: true });
      return true;
    }
    return false;
  };

  const handleNext = () => {
    if (step === 1 && checkBypass()) return;
    nextStep();
  };

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const totalSteps = 5;

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-4 py-32 font-alan-sans">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white p-10 rounded-[2.5rem] shadow-2xl text-center border border-pumpkin/10 mb-12"
        >
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-4xl font-signika font-bold text-charcoal mb-4">Thank You!</h1>
          <p className="text-slate-medium mb-8 text-lg">
            Your artist journey has been recorded. We&apos;ve recommended a course that matches your path.
          </p>
          <button
            onClick={() => window.open('https://chat.whatsapp.com/IaS1GaJT7Gp7ufxHIjDkZu?mode=gi_t', '_blank')}
            className="w-full bg-[#25D366] text-white py-4 rounded-2xl font-bold text-lg hover:bg-[#20BA5A] transition-all shadow-lg flex items-center justify-center gap-2"
          >
            Join the Community <ExternalLink className="w-5 h-5" />
          </button>
        </motion.div>

        {/* Recommended Course Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="max-w-2xl w-full text-center"
        >
          <h2 className="text-2xl font-signika font-bold text-charcoal mb-8 uppercase tracking-widest">Recommended for your growth</h2>

          <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-2xl border border-pumpkin/10 group">
            <div className="aspect-video relative overflow-hidden bg-black/5">
              <img
                src={recommendedCourse.banner}
                alt={recommendedCourse.title}
                className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute top-6 left-6 px-4 py-2 bg-pumpkin text-white text-xs font-black rounded-full uppercase tracking-widest shadow-lg">
                Personalized Recommendation
              </div>
            </div>

            <div className="p-8 sm:p-10">
              <h3 className="text-3xl font-signika font-bold text-charcoal mb-2">{recommendedCourse.title}</h3>
              <p className="text-pumpkin font-bold mb-6 tracking-wide">Mentor: {recommendedCourse.mentor}</p>

              <button
                onClick={() => window.location.href = recommendedCourse.url}
                className="w-full bg-charcoal text-white py-5 rounded-2xl font-bold text-xl hover:bg-pumpkin transition-all shadow-xl flex items-center justify-center gap-3"
              >
                Explore Course Details <ArrowRight className="w-6 h-6" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  const isBypass = watch('firstName').trim().toLowerCase() === 'bypass' && watch('lastName').trim().toLowerCase() === 'raghav';

  return (
    <div className="min-h-screen bg-cream font-alan-sans selection:bg-pumpkin/30 pb-20 overflow-x-hidden">
      <Head>
        <title>Artist Path & Journey | TSC</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>

      <div className="max-w-2xl mx-auto px-5 pt-32 md:pt-40">
        {/* Navigation / Header */}
        <div className="flex items-center justify-between mb-8">
          {step > 1 ? (
            <button
              onClick={prevStep}
              className="flex items-center gap-2 text-slate-medium font-bold text-sm"
            >
              <ChevronLeft className="w-5 h-5" /> Back
            </button>
          ) : (
            <div className="w-10" />
          )}
          <div className="flex flex-col items-center">
            <span className="text-xs font-black tracking-widest text-pumpkin uppercase">
              Step {step} of {totalSteps}
            </span>
          </div>
          <div className="w-10" />
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-600 text-sm font-bold flex items-center gap-2">
            <X className="w-4 h-4" /> {errorMsg}
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* Step 1: Personal Details */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div>
                <h1 className="text-3xl sm:text-4xl font-signika font-bold text-charcoal mb-4">Personal Details</h1>
                <p className="text-slate-medium mb-6">Let’s start with the basics.</p>
                <div className="w-full h-1.5 bg-white/50 rounded-full overflow-hidden mb-6">
                  <motion.div
                    className="h-full bg-pumpkin"
                    initial={{ width: '0%' }}
                    animate={{ width: '20%' }}
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-medium uppercase tracking-wider flex items-center gap-2">
                      <User className="w-3.5 h-3.5" /> First Name *
                    </label>
                    <input
                      {...register('firstName', { required: 'First name is required' })}
                      className="w-full bg-white border-none rounded-2xl py-4 px-5 text-lg font-medium shadow-sm focus:ring-4 focus:ring-pumpkin/20 transition-all"
                      placeholder="e.g. John"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-medium uppercase tracking-wider flex items-center gap-2">
                      <User className="w-3.5 h-3.5" /> Last Name *
                    </label>
                    <input
                      {...register('lastName', { required: 'Last name is required' })}
                      className="w-full bg-white border-none rounded-2xl py-4 px-5 text-lg font-medium shadow-sm focus:ring-4 focus:ring-pumpkin/20 transition-all"
                      placeholder="e.g. Doe"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-medium uppercase tracking-wider flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5" /> Where are you based? *
                  </label>
                  <input
                    {...register('place', { required: !isBypass ? 'Location is required' : false })}
                    className="w-full bg-white border-none rounded-2xl py-4 px-5 text-lg font-medium shadow-sm focus:ring-4 focus:ring-pumpkin/20 transition-all"
                    placeholder="City / Home base"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-medium uppercase tracking-wider flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5" /> Mobile Number *
                  </label>
                  <input
                    {...register('mobile', { required: !isBypass ? 'Mobile number is required' : false })}
                    className="w-full bg-white border-none rounded-2xl py-4 px-5 text-lg font-medium shadow-sm focus:ring-4 focus:ring-pumpkin/20 transition-all"
                    placeholder="+91..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-medium uppercase tracking-wider flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5" /> Email Address *
                  </label>
                  <input
                    {...register('email', {
                      required: !isBypass ? 'Email is required' : false,
                      pattern: !isBypass ? { value: /^\S+@\S+$/i, message: 'Invalid email' } : undefined
                    })}
                    className="w-full bg-white border-none rounded-2xl py-4 px-5 text-lg font-medium shadow-sm focus:ring-4 focus:ring-pumpkin/20 transition-all"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <button
                onClick={handleNext}
                disabled={!watch('firstName') || !watch('lastName') || (!isBypass && (!watch('place') || !watch('mobile') || !watch('email')))}
                className="w-full bg-charcoal text-white py-5 rounded-2xl font-bold text-xl flex items-center justify-center gap-3 hover:bg-pumpkin transition-all shadow-xl disabled:opacity-50"
              >
                {isSubmitting ? 'Bypassing...' : 'Continue'} <ArrowRight className="w-6 h-6" />
              </button>
            </motion.div>
          )}

          {/* Step 2: Digital Identity */}
          {step === 2 && (
            <motion.div
              key="step2-digital"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div>
                <h1 className="text-3xl sm:text-4xl font-signika font-bold text-charcoal mb-4">Digital Identity</h1>
                <p className="text-slate-medium mb-6">Where can we find your work?</p>
                <div className="w-full h-1.5 bg-white/50 rounded-full overflow-hidden mb-6">
                  <motion.div
                    className="h-full bg-pumpkin"
                    initial={{ width: '20%' }}
                    animate={{ width: '40%' }}
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-medium uppercase tracking-wider flex items-center gap-2">
                    <Star className="w-3.5 h-3.5" /> Stage Name / Identity
                  </label>
                  <input
                    {...register('stageName')}
                    className="w-full bg-white border-none rounded-2xl py-4 px-5 text-lg font-medium shadow-sm focus:ring-4 focus:ring-pumpkin/20 transition-all"
                    placeholder="If different from your legal name"
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-black text-slate-medium uppercase tracking-wider">Digital Footprint</label>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="relative">
                      <Instagram className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-light" />
                      <input
                        {...register('instagram')}
                        className="w-full bg-white border-none rounded-2xl py-4 pl-14 pr-5 text-lg font-medium shadow-sm focus:ring-4 focus:ring-pumpkin/20 transition-all"
                        placeholder="Instagram URL"
                      />
                    </div>
                    <div className="relative">
                      <Music className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-light" />
                      <input
                        {...register('spotify')}
                        className="w-full bg-white border-none rounded-2xl py-4 pl-14 pr-5 text-lg font-medium shadow-sm focus:ring-4 focus:ring-pumpkin/20 transition-all"
                        placeholder="Spotify URL"
                      />
                    </div>
                    <div className="relative">
                      <Youtube className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-light" />
                      <input
                        {...register('youtube')}
                        className="w-full bg-white border-none rounded-2xl py-4 pl-14 pr-5 text-lg font-medium shadow-sm focus:ring-4 focus:ring-pumpkin/20 transition-all"
                        placeholder="YouTube URL"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={nextStep}
                className="w-full bg-charcoal text-white py-5 rounded-2xl font-bold text-xl flex items-center justify-center gap-3 hover:bg-pumpkin transition-all shadow-xl"
              >
                Continue <ArrowRight className="w-6 h-6" />
              </button>
            </motion.div>
          )}

          {/* Step 3: Identity & Foundation */}
          {step === 3 && (
            <motion.div
              key="step3-identity"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div>
                <h1 className="text-3xl sm:text-4xl font-signika font-bold text-charcoal mb-4">The "Why" Behind the Music</h1>
                <p className="text-slate-medium mb-6">Tell us about your artist identity and how you built your foundation.</p>
                <div className="w-full h-1.5 bg-white/50 rounded-full overflow-hidden mb-6">
                  <motion.div
                    className="h-full bg-pumpkin"
                    initial={{ width: '40%' }}
                    animate={{ width: '60%' }}
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-medium uppercase tracking-wider">
                    "I am an artist because..." *
                  </label>
                  <textarea
                    {...register('artistIdentity', { required: 'Please complete this sentence' })}
                    rows={3}
                    placeholder="Express your core motivation, message, or calling..."
                    className="w-full bg-white border-none rounded-2xl py-4 px-5 text-lg font-medium shadow-sm focus:ring-4 focus:ring-pumpkin/20 transition-all resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-medium uppercase tracking-wider">
                    The Foundation (Training Backstory) *
                  </label>
                  <textarea
                    {...register('trainingDetails', { required: 'Please provide training details' })}
                    rows={4}
                    placeholder="Formal or informal training, vocal riyaaz, instruments, DAW mastery..."
                    className="w-full bg-white border-none rounded-2xl py-4 px-5 text-lg font-medium shadow-sm focus:ring-4 focus:ring-pumpkin/20 transition-all resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-medium uppercase tracking-wider">
                    Core Skills (Primary Weapon) *
                  </label>
                  <input
                    {...register('coreSkills', { required: 'Please specify core skills' })}
                    placeholder="e.g. Lyric writing, soulful vocals, complex arrangements"
                    className="w-full bg-white border-none rounded-2xl py-4 px-5 text-lg font-medium shadow-sm focus:ring-4 focus:ring-pumpkin/20 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-medium uppercase tracking-wider">
                    Your "X-Factor" *
                  </label>
                  <textarea
                    {...register('strengthsUniqueness', { required: 'Please describe your X-factor' })}
                    rows={3}
                    placeholder="What do you do that nobody else can?"
                    className="w-full bg-white border-none rounded-2xl py-4 px-5 text-lg font-medium shadow-sm focus:ring-4 focus:ring-pumpkin/20 transition-all resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-medium uppercase tracking-wider flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5" /> Daily Dedication *
                  </label>
                  <input
                    {...register('dailyTime', { required: 'Required' })}
                    placeholder="Hours per day"
                    className="w-full bg-white border-none rounded-2xl py-4 px-5 text-lg font-medium shadow-sm focus:ring-4 focus:ring-pumpkin/20 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-medium uppercase tracking-wider flex items-center gap-2">
                    <User className="w-3.5 h-3.5" /> Mentor / Guruji
                  </label>
                  <input
                    {...register('mentorName')}
                    placeholder="Name of mentor"
                    className="w-full bg-white border-none rounded-2xl py-4 px-5 text-lg font-medium shadow-sm focus:ring-4 focus:ring-pumpkin/20 transition-all"
                  />
                </div>
              </div>

              <button
                onClick={nextStep}
                disabled={!watch('artistIdentity') || !watch('trainingDetails') || !watch('coreSkills') || !watch('strengthsUniqueness') || !watch('dailyTime')}
                className="w-full bg-charcoal text-white py-5 rounded-2xl font-bold text-xl flex items-center justify-center gap-3 hover:bg-pumpkin transition-all shadow-xl disabled:opacity-50"
              >
                Continue <ArrowRight className="w-6 h-6" />
              </button>
            </motion.div>
          )}

          {/* Step 4: Current Pulse */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div>
                <h1 className="text-3xl sm:text-4xl font-signika font-bold text-charcoal mb-4">Current Pulse</h1>
                <p className="text-slate-medium mb-6">Let’s look at your track record, gear, and rituals.</p>
                <div className="w-full h-1.5 bg-white/50 rounded-full overflow-hidden mb-6">
                  <motion.div
                    className="h-full bg-pumpkin"
                    initial={{ width: '60%' }}
                    animate={{ width: '80%' }}
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-medium uppercase tracking-wider flex items-center gap-2">
                    <Music className="w-3.5 h-3.5" /> Songs Released *
                  </label>
                  <input
                    type="number"
                    {...register('songsReleased', { required: 'Required' })}
                    className="w-full bg-white border-none rounded-2xl py-4 px-5 text-lg font-medium shadow-sm focus:ring-4 focus:ring-pumpkin/20 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-medium uppercase tracking-wider flex items-center gap-2">
                    <Mic2 className="w-3.5 h-3.5" /> Live Shows *
                  </label>
                  <input
                    type="number"
                    {...register('showsPerformed', { required: 'Required' })}
                    className="w-full bg-white border-none rounded-2xl py-4 px-5 text-lg font-medium shadow-sm focus:ring-4 focus:ring-pumpkin/20 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-medium uppercase tracking-wider flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5" /> Your Tribe (Fanbase) *
                  </label>
                  <textarea
                    {...register('currentFans', { required: 'Please describe your fanbase' })}
                    rows={2}
                    placeholder="Who is listening? (Age, vibe, location)"
                    className="w-full bg-white border-none rounded-2xl py-4 px-5 text-lg font-medium shadow-sm focus:ring-4 focus:ring-pumpkin/20 transition-all resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-medium uppercase tracking-wider flex items-center gap-2">
                    <Rocket className="w-3.5 h-3.5" /> Toolkit & Setup *
                  </label>
                  <textarea
                    {...register('currentSetup', { required: 'Please describe your setup' })}
                    rows={3}
                    placeholder="DAW, gear, awards, studio environment..."
                    className="w-full bg-white border-none rounded-2xl py-4 px-5 text-lg font-medium shadow-sm focus:ring-4 focus:ring-pumpkin/20 transition-all resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-medium uppercase tracking-wider flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5" /> Current Projects *
                  </label>
                  <textarea
                    {...register('currentlyWorkingOn', { required: 'What is cooking?' })}
                    rows={2}
                    placeholder="New singles, music videos, or tour prep..."
                    className="w-full bg-white border-none rounded-2xl py-4 px-5 text-lg font-medium shadow-sm focus:ring-4 focus:ring-pumpkin/20 transition-all resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-medium uppercase tracking-wider flex items-center gap-2">
                    <Award className="w-3.5 h-3.5" /> Daily Rituals (Riyaaz) *
                  </label>
                  <textarea
                    {...register('dailyRituals', { required: 'Required' })}
                    rows={3}
                    placeholder="Practice routine, fitness, meditation..."
                    className="w-full bg-white border-none rounded-2xl py-4 px-5 text-lg font-medium shadow-sm focus:ring-4 focus:ring-pumpkin/20 transition-all resize-none"
                  />
                </div>
              </div>

              <button
                onClick={nextStep}
                disabled={!watch('songsReleased') || !watch('showsPerformed') || !watch('currentFans') || !watch('currentSetup') || !watch('currentlyWorkingOn') || !watch('dailyRituals')}
                className="w-full bg-charcoal text-white py-5 rounded-2xl font-bold text-xl flex items-center justify-center gap-3 hover:bg-pumpkin transition-all shadow-xl disabled:opacity-50"
              >
                Continue <ArrowRight className="w-6 h-6" />
              </button>
            </motion.div>
          )}

          {/* Step 5: Needs & Goals */}
          {step === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div>
                <h1 className="text-3xl sm:text-4xl font-signika font-bold text-charcoal mb-4">Needs & Goals</h1>
                <p className="text-slate-medium mb-6">What would change the game for you?</p>
                <div className="w-full h-1.5 bg-white/50 rounded-full overflow-hidden mb-6">
                  <motion.div
                    className="h-full bg-pumpkin"
                    initial={{ width: '80%' }}
                    animate={{ width: '100%' }}
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-medium uppercase tracking-wider">Skill Gaps (What to learn?) *</label>
                  <textarea
                    {...register('learningNeeds', { required: 'Required' })}
                    rows={2}
                    className="w-full bg-white border-none rounded-2xl py-4 px-5 text-lg font-medium shadow-sm focus:ring-4 focus:ring-pumpkin/20 transition-all resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-medium uppercase tracking-wider">Guidance & Mentorship *</label>
                  <textarea
                    {...register('mentorshipNeeds', { required: 'Required' })}
                    rows={2}
                    className="w-full bg-white border-none rounded-2xl py-4 px-5 text-lg font-medium shadow-sm focus:ring-4 focus:ring-pumpkin/20 transition-all resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-medium uppercase tracking-wider">Curation Needs (Audio/Video/Stage) *</label>
                  <textarea
                    {...register('curationNeeds', { required: 'Required' })}
                    rows={2}
                    className="w-full bg-white border-none rounded-2xl py-4 px-5 text-lg font-medium shadow-sm focus:ring-4 focus:ring-pumpkin/20 transition-all resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-medium uppercase tracking-wider">Fandom Engine (Growth missing?) *</label>
                  <textarea
                    {...register('fandomNeeds', { required: 'Required' })}
                    rows={2}
                    placeholder="Distribution, strategy, collaborations..."
                    className="w-full bg-white border-none rounded-2xl py-4 px-5 text-lg font-medium shadow-sm focus:ring-4 focus:ring-pumpkin/20 transition-all resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-medium uppercase tracking-wider flex items-center gap-2">
                    <Target className="w-4 h-4" /> Your "North Star" (Next 12 Months) *
                  </label>
                  <textarea
                    {...register('aspirationalGoal', { required: 'Think big!' })}
                    rows={3}
                    placeholder="Where do you see yourself a year from now?"
                    className="w-full bg-white border-none rounded-2xl py-4 px-5 text-lg font-medium shadow-sm focus:ring-4 focus:ring-pumpkin/20 transition-all resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-medium uppercase tracking-wider">Anything Else? (Open Mic)</label>
                  <textarea
                    {...register('anythingElse')}
                    rows={3}
                    className="w-full bg-white border-none rounded-2xl py-4 px-5 text-lg font-medium shadow-sm focus:ring-4 focus:ring-pumpkin/20 transition-all resize-none"
                  />
                </div>
              </div>

              <button
                onClick={handleSubmit(onSubmit)}
                disabled={isSubmitting}
                className="w-full bg-pumpkin text-white py-5 rounded-2xl font-bold text-xl flex items-center justify-center gap-3 hover:bg-charcoal transition-all shadow-xl disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Your Journey'} <CheckCircle2 className="w-6 h-6" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
