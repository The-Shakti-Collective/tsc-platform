import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import {
  Calendar,
  Clock,
  User,
  Phone,
  CheckCircle2,
  ArrowRight,
  ChevronLeft,
  Headphones,
  Music,
  Mic2,
  X
} from 'lucide-react';

type FormData = {
  name: string;
  countryCode: string;
  phone: string;
  email: string;
  course: string;
  date: string;
  time: string;
};

const courses = [
  {
    id: 'composition',
    title: 'The heART of Composition',
    mentor: 'Sandesh Shandilya',
    icon: Music,
    color: 'bg-orange/10 text-orange',
    about: 'A comprehensive 6-month journey into mainstream mastery. Learn the art of imagination, converting emotion into timeless expression, and mastering the subconscious mind for effortless creation.',
    for: 'Aspiring and intermediate composers, songwriters, and musicians who want to move beyond basic theory and create music that connects with the masses.',
    expect: '200+ mins of deep-dive content, 3 live interactive sessions, '
  },
  {
    id: 'classical',
    title: 'Roots of Hindustani Classical',
    mentor: 'Prasad Khaparde',
    icon: Mic2,
    color: 'bg-[#1e3a8a]/10 text-[#1e3a8a]',
    about: 'Master the sacred nuances of classical singing under the Rampur Sahaswan Gharana tradition. Learn directly from the legacy of Padma Bhushan Ustad Rashid Khan Sahab.',
    for: 'Vocalists of all levels—from beginners wanting a strong foundation to seasoned singers looking to refine their raag interpretation and vocal discipline.',
    expect: '3 live group sessions, masterclass in breath control (Kanth Saadhna), and official certification recognized in the classical music community.'
  },
  {
    id: 'production',
    title: 'A to Z of Music Production',
    mentor: 'Luca Petracca',
    icon: Headphones,
    color: 'bg-blue-500/10 text-blue-500',
    isComingSoon: true,
    about: 'A technical and creative roadmap for singer-songwriters to produce professional-grade music from home. From DAW mastery to modern orchestration.',
    for: 'Singer-songwriters who want to bridge the gap between their songs and a polished, radio-ready sound without relying on external producers.',
    expect: 'Step-by-step DAW training, arrangement techniques, and essential mixing/mastering secrets for pop and film music.'
  }
];

const countryCodes = [
  { code: '+91', country: 'India', timezone: 'Asia/Kolkata' },
  { code: '+1', country: 'USA', timezone: 'America/New_York' },
  { code: '+44', country: 'UK', timezone: 'Europe/London' },
  { code: '+971', country: 'UAE', timezone: 'Asia/Dubai' },
  { code: '+61', country: 'Australia', timezone: 'Australia/Sydney' },
  { code: '+65', country: 'Singapore', timezone: 'Asia/Singapore' },
  { code: '+49', country: 'Germany', timezone: 'Europe/Berlin' },
  { code: '+33', country: 'France', timezone: 'Europe/Paris' }
];

const timeSlots = [
  '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM',
  '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
  '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM',
  '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM'
];

const isTimePassed = (dateStr: string, timeStr: string, countryCode: string = '+91') => {
  if (!dateStr) return false;
  try {
    const country = countryCodes.find(c => c.code === countryCode) || countryCodes[0];
    
    // We create a formatter to find the current offset of the target timezone
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: country.timezone,
      year: 'numeric', month: 'numeric', day: 'numeric',
      hour: 'numeric', minute: 'numeric', second: 'numeric',
      hour12: false
    });
    
    // Calculate the difference between local "now" and target "now" to get the offset
    const parts = formatter.formatToParts(now);
    const getPart = (type: string) => parts.find(p => p.type === type)?.value;
    const targetNowStr = `${getPart('year')}-${getPart('month')}-${getPart('day')} ${getPart('hour')}:${getPart('minute')}:${getPart('second')}`;
    const targetNow = new Date(targetNowStr);
    
    // The slot time as entered
    const slotDate = new Date(`${dateStr} ${timeStr}`);
    
    // Comparison in the same relative "local" timeline
    const diffMs = slotDate.getTime() - targetNow.getTime();
    const bufferTime = 90 * 60 * 1000; // 1.5 hours
    
    return diffMs < bufferTime;
  } catch (e) {
    return false;
  }
};

export default function BookACall() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      course: courses[0].title,
      countryCode: '+91'
    }
  });

  const selectedCourse = watch('course');
  const selectedDate = watch('date');
  const selectedTime = watch('time');

  const onSubmit = async (data: FormData) => {
    if (isTimePassed(data.date, data.time, data.countryCode)) {
      alert('This slot is no longer available in your timezone. Please select a later time.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Calculate IST equivalent for the sheet/reminders
      const country = countryCodes.find(c => c.code === data.countryCode) || countryCodes[0];
      
      // We use the browser's ability to format to a specific timezone to calculate the IST offset
      const localSlot = new Date(`${data.date} ${data.time}`);
      
      // We need to send the country timezone to the API so it can recalibrate to IST
      const response = await fetch('/api/book-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          timezone: country.timezone,
          phone: `${data.countryCode}${data.phone.replace(/\s/g, '')}`,
          email: data.email,
          whatsapp: `${data.countryCode}${data.phone.replace(/\s/g, '')}`,
          referral: 'Direct Booking'
        }),
      });

      if (response.ok) {
        setIsSuccess(true);
      } else {
        alert('Something went wrong. Please try again.');
      }
    } catch (error) {
      alert('Failed to book call. Check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-4 font-alan-sans">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white p-10 rounded-[2.5rem] shadow-2xl text-center border border-pumpkin/10"
        >
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-4xl font-signika font-bold text-charcoal mb-4">You&apos;re all set!</h1>
          <p className="text-slate-medium mb-8 text-lg">
            We&apos;ve received your request. Expect a WhatsApp message from us shortly to confirm the details.
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="w-full bg-charcoal text-white py-4 rounded-2xl font-bold text-lg hover:bg-pumpkin transition-all shadow-lg"
          >
            Back to TSC Home
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream font-alan-sans selection:bg-pumpkin/30 pb-20 overflow-x-hidden">
      <Head>
        <title>Book a Call | TSC Academy</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>

      <div className="max-w-xl mx-auto px-5 pt-32 md:pt-40">
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
              Step {step} of 3
            </span>
          </div>
          <div className="w-10" />
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Course Selection */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h1 className="text-3xl sm:text-4xl font-signika font-bold text-charcoal mb-4">Which course are you interested in?</h1>

                {/* Progress Bar below question */}
                <div className="w-full h-1.5 bg-white/50 rounded-full overflow-hidden mb-6">
                  <motion.div
                    className="h-full bg-pumpkin"
                    initial={{ width: '0%' }}
                    animate={{ width: '33.33%' }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {courses.map((course) => (
                  <div
                    key={course.id}
                    className={`
                      relative rounded-[2rem] border-2 transition-all overflow-hidden
                      ${selectedCourse === course.title
                        ? 'border-pumpkin bg-white shadow-xl'
                        : 'border-white bg-white/50 hover:border-pumpkin/30'}
                    `}
                  >
                    {/* Main Card Content (Clickable to Select) */}
                    <button
                      type="button"
                      onClick={() => {
                        setValue('course', course.title);
                        nextStep();
                      }}
                      className="w-full flex items-center gap-4 p-6 text-left"
                    >
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${course.color}`}>
                        <course.icon className="w-7 h-7" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-charcoal leading-tight truncate">{course.title}</h3>
                          {course.isComingSoon && (
                            <span className="text-[9px] font-black uppercase tracking-widest bg-pumpkin/10 text-pumpkin px-2 py-0.5 rounded-full shrink-0">
                              Soon
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-medium">Mentor: {course.mentor}</p>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${selectedCourse === course.title ? 'bg-pumpkin border-pumpkin' : 'border-slate-lighter'}`}>
                        {selectedCourse === course.title && <CheckCircle2 className="w-4 h-4 text-white" />}
                      </div>
                    </button>

                    {/* About the Course Dropdown (Inside Card) */}
                    <div className="px-6 pb-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedCourse(expandedCourse === course.id ? null : course.id);
                        }}
                        className="text-[11px] font-black uppercase tracking-widest text-pumpkin flex items-center gap-1.5 hover:opacity-70 transition-all"
                      >
                        {expandedCourse === course.id ? 'Hide Details' : 'About this course'}
                        <ChevronLeft className={`w-3.5 h-3.5 transition-transform ${expandedCourse === course.id ? 'rotate-90' : '-rotate-90'}`} />
                      </button>

                      <AnimatePresence>
                        {expandedCourse === course.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="pt-5 pb-2 space-y-5 border-t border-slate-100 mt-4">
                              <div className="space-y-4">
                                <div>
                                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-medium mb-2">The Program</h4>
                                  <p className="text-sm text-charcoal leading-relaxed">{course.about}</p>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                  <div className="p-4 bg-slate-50 rounded-2xl">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-medium mb-2">Ideal For</h4>
                                    <p className="text-xs text-slate-medium leading-relaxed font-medium">{course.for}</p>
                                  </div>
                                  <div className="p-4 bg-pumpkin/5 rounded-2xl">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-pumpkin mb-2">What you get</h4>
                                    <p className="text-xs text-slate-medium leading-relaxed font-medium">{course.expect}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 2: Personal Details */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div>
                <h1 className="text-3xl sm:text-4xl font-signika font-bold text-charcoal mb-4">Tell us about yourself</h1>

                {/* Progress Bar below question */}
                <div className="w-full h-1.5 bg-white/50 rounded-full overflow-hidden mb-6">
                  <motion.div
                    className="h-full bg-pumpkin"
                    initial={{ width: '33.33%' }}
                    animate={{ width: '66.66%' }}
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-medium uppercase tracking-wider flex items-center gap-2">
                    <User className="w-4 h-4" /> What&apos;s your name?
                  </label>
                  <input
                    {...register('name', { required: 'Name is required' })}
                    autoFocus
                    placeholder="Enter your full name"
                    className="w-full bg-white border-none rounded-2xl py-5 px-6 text-xl font-medium shadow-sm focus:ring-4 focus:ring-pumpkin/20 transition-all"
                  />
                  {errors.name && <p className="text-xs text-red-500 font-bold">{errors.name.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-medium uppercase tracking-wider flex items-center gap-2">
                    <Phone className="w-4 h-4" /> Phone / WhatsApp Number
                  </label>
                  <div className="flex gap-3">
                    <select
                      {...register('countryCode')}
                      className="bg-white border-none rounded-2xl py-5 px-4 text-lg font-bold shadow-sm focus:ring-4 focus:ring-pumpkin/20 transition-all appearance-none cursor-pointer min-w-[100px] text-center"
                    >
                      {countryCodes.map(c => (
                        <option key={c.code} value={c.code}>{c.code} ({c.country})</option>
                      ))}
                    </select>
                    <input
                      {...register('phone', { required: 'Phone is required' })}
                      type="tel"
                      placeholder="98765 43210"
                      className="flex-1 bg-white border-none rounded-2xl py-5 px-6 text-xl font-medium shadow-sm focus:ring-4 focus:ring-pumpkin/20 transition-all"
                    />
                  </div>
                  {errors.phone && <p className="text-xs text-red-500 font-bold">{errors.phone.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-medium uppercase tracking-wider flex items-center gap-2">
                    <User className="w-4 h-4" /> Email Address
                  </label>
                  <input
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^\S+@\S+$/i,
                        message: 'Invalid email format'
                      }
                    })}
                    type="email"
                    placeholder="john@example.com"
                    className="w-full bg-white border-none rounded-2xl py-5 px-6 text-xl font-medium shadow-sm focus:ring-4 focus:ring-pumpkin/20 transition-all"
                  />
                  {errors.email && <p className="text-xs text-red-500 font-bold">{errors.email.message}</p>}
                </div>
              </div>

              <button
                onClick={nextStep}
                disabled={!watch('name') || !watch('phone') || !watch('email')}
                className="w-full bg-charcoal text-white py-5 rounded-2xl font-bold text-xl flex items-center justify-center gap-3 hover:bg-pumpkin transition-all shadow-xl disabled:opacity-50"
              >
                Continue <ArrowRight className="w-6 h-6" />
              </button>
            </motion.div>
          )}

          {/* Step 3: Date & Time */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div>
                <h1 className="text-3xl sm:text-4xl font-signika font-bold text-charcoal mb-4">When should we call?</h1>

                {/* Progress Bar below question */}
                <div className="w-full h-1.5 bg-white/50 rounded-full overflow-hidden mb-6">
                  <motion.div
                    className="h-full bg-pumpkin"
                    initial={{ width: '66.66%' }}
                    animate={{ width: '100%' }}
                  />
                </div>
              </div>

              <div className="space-y-6">
                {/* Date Selection Trigger */}
                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-medium uppercase tracking-wider flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Pick a Date
                  </label>
                  <button
                    onClick={() => setShowDatePicker(true)}
                    className="w-full bg-white border-none rounded-2xl py-5 px-6 text-xl font-medium shadow-sm text-left flex justify-between items-center"
                  >
                    <span className={selectedDate ? 'text-charcoal' : 'text-slate-light'}>
                      {selectedDate ? new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : 'Select Date'}
                    </span>
                    <ChevronLeft className="w-6 h-6 rotate-180 text-pumpkin" />
                  </button>
                </div>

                {/* Time Selection Trigger */}
                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-medium uppercase tracking-wider flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Pick a Time
                  </label>
                  <button
                    onClick={() => setShowTimePicker(true)}
                    className="w-full bg-white border-none rounded-2xl py-5 px-6 text-xl font-medium shadow-sm text-left flex justify-between items-center"
                  >
                    <span className={selectedTime ? 'text-charcoal' : 'text-slate-light'}>
                      {selectedTime || 'Select Time'}
                    </span>
                    <ChevronLeft className="w-6 h-6 rotate-180 text-pumpkin" />
                  </button>
                </div>
              </div>

              <button
                onClick={handleSubmit(onSubmit)}
                disabled={isSubmitting || !selectedDate || !selectedTime || isTimePassed(selectedDate, selectedTime, watch('countryCode'))}
                className={`
                  w-full py-5 rounded-2xl font-bold text-xl flex items-center justify-center gap-3 transition-all shadow-xl
                  ${isTimePassed(selectedDate, selectedTime, watch('countryCode')) 
                    ? 'bg-red-50 border-2 border-red-500 text-red-500 cursor-not-allowed opacity-100' 
                    : 'bg-pumpkin text-white hover:bg-charcoal disabled:opacity-50'}
                `}
              >
                {isSubmitting ? 'Booking...' : isTimePassed(selectedDate, selectedTime, watch('countryCode')) ? 'Slot Expired' : 'Confirm My Call'} 
                {isTimePassed(selectedDate, selectedTime, watch('countryCode')) ? <X className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
              </button>
              {isTimePassed(selectedDate, selectedTime, watch('countryCode')) && (
                <p className="text-center text-red-500 text-xs font-bold mt-2">
                  Please pick a time at least 1.5 hours in the future for your timezone.
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Date Picker Pop-up */}
      <AnimatePresence>
        {showDatePicker && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowDatePicker(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-signika font-bold text-charcoal">Select Date</h2>
                <button onClick={() => setShowDatePicker(false)} className="p-2 hover:bg-cream rounded-full">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="relative w-full overflow-hidden bg-slate-50 rounded-2xl border-2 border-transparent focus-within:border-pumpkin transition-all">
                <div className="flex items-center gap-4 py-6 px-6 pointer-events-none">
                  <Calendar className="w-6 h-6 text-pumpkin" />
                  <span className={`text-xl font-bold ${selectedDate ? 'text-charcoal' : 'text-slate-light'}`}>
                    {selectedDate ? new Date(selectedDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'Pick Date'}
                  </span>
                </div>
                <input
                  type="date"
                  style={{ colorScheme: 'light' }}
                  onChange={(e) => {
                    setValue('date', e.target.value);
                  }}
                  onClick={(e) => {
                    try { (e.target as any).showPicker(); } catch (err) { }
                  }}
                  min={new Date().toISOString().split('T')[0]}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                />
              </div>
              <div className="mt-8">
                <button
                  onClick={() => setShowDatePicker(false)}
                  className="w-full bg-charcoal text-white py-4 rounded-xl font-bold"
                >
                  Confirm Date
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Time Picker Pop-up */}
      <AnimatePresence>
        {showTimePicker && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowTimePicker(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-8 shadow-2xl max-h-[85vh] flex flex-col"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-signika font-bold text-charcoal">Select Time Slot</h2>
                <button onClick={() => setShowTimePicker(false)} className="p-2 hover:bg-cream rounded-full">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 overflow-y-auto pr-2 pb-4 scrollbar-hide">
                {timeSlots.map(slot => {
                  const isPassed = isTimePassed(selectedDate, slot, watch('countryCode'));
                  return (
                    <button
                      key={slot}
                      type="button"
                      disabled={isPassed}
                      onClick={() => {
                        if (isPassed) return;
                        setValue('time', slot);
                        setTimeout(() => setShowTimePicker(false), 300);
                      }}
                      className={`
                        py-4 px-4 rounded-xl border-2 font-bold transition-all
                        ${isPassed
                          ? 'bg-red-50 text-red-300 border-red-200 cursor-not-allowed opacity-60'
                          : selectedTime === slot
                            ? 'border-pumpkin bg-pumpkin/10 text-pumpkin scale-[1.02]'
                            : 'border-cream bg-cream/50 text-slate-medium hover:border-pumpkin/30'}
                      `}
                    >
                      {slot}
                      {isPassed && <span className="block text-[8px] text-red-400">Unavailable</span>}
                    </button>
                  );
                })}
              </div>

              <div className="mt-6">
                <button
                  onClick={() => setShowTimePicker(false)}
                  className="w-full bg-charcoal text-white py-4 rounded-xl font-bold"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        /* Hide scrollbar for Chrome, Safari and Opera */
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }

        /* Hide scrollbar for IE, Edge and Firefox */
        .scrollbar-hide {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
      `}</style>
    </div>
  );
}
