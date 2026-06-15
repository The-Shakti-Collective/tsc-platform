import React, { useState } from 'react';
import Head from 'next/head';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/router';
import {
  User,
  Building2,
  Mail,
  Phone,
  Star,
  Mic2,
  FileText,
  MapPin,
  Maximize,
  Truck,
  Eye,
  CheckCircle2,
  ArrowRight,
  ChevronLeft,
  X
} from 'lucide-react';

type FormData = {
  name: string;
  company: string;
  email: string;
  phone: string;
  collabType: string;
  artist: string;
  nature: string;
  locationTime: string;
  scale: string;
  logisticsSupport: string;
  additionalVision: string;
};

export default function ArtistQuery() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (!result.success) {
        setErrorMsg(result.error || 'Submission failed. Please try again.');
      } else {
        setIsSuccess(true);
        router.push({ query: { ...router.query, success: 'true' } }, undefined, { shallow: true });
      }
    } catch (err) {
      setErrorMsg('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const totalSteps = 3;

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-4 py-32 font-alan-sans">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white p-10 rounded-[2.5rem] shadow-2xl text-center border border-pumpkin/10"
        >
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-4xl font-signika font-bold text-charcoal mb-4">Query Received</h1>
          <p className="text-slate-medium mb-8 text-lg">
            Our team will review your collaboration vision and get back to you soon.
          </p>
          <button
            onClick={() => router.push('/')}
            className="w-full bg-charcoal text-white py-4 rounded-2xl font-bold text-lg hover:bg-pumpkin transition-all shadow-lg flex items-center justify-center gap-2"
          >
            Back to Home
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream font-alan-sans selection:bg-pumpkin/30 pb-20 overflow-x-hidden">
      <Head>
        <title>Artist Enquiry | TSC</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>

      <div className="max-w-2xl mx-auto px-5 pt-32 md:pt-40">
        <div className="flex items-center justify-between mb-8">
          {step > 1 ? (
            <button onClick={prevStep} className="flex items-center gap-2 text-slate-medium font-bold text-sm">
              <ChevronLeft className="w-5 h-5" /> Back
            </button>
          ) : (
            <div className="w-10" />
          )}
          <div className="flex flex-col items-center">
            <span className="text-xs font-black tracking-widest text-pumpkin uppercase">Step {step} of {totalSteps}</span>
          </div>
          <div className="w-10" />
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-600 text-sm font-bold flex items-center gap-2">
            <X className="w-4 h-4" /> {errorMsg}
          </div>
        )}

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div>
                <h1 className="text-3xl sm:text-4xl font-signika font-bold text-charcoal mb-4">The Essentials</h1>
                <p className="text-slate-medium mb-6">Who is initiating this collaboration?</p>
                <div className="w-full h-1.5 bg-white/50 rounded-full overflow-hidden mb-6">
                  <motion.div className="h-full bg-pumpkin" initial={{ width: '0%' }} animate={{ width: '33%' }} />
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-medium uppercase tracking-wider flex items-center gap-2"><User className="w-3.5 h-3.5" /> Full Name *</label>
                  <input {...register('name', { required: true })} className="w-full bg-white border-none rounded-2xl py-4 px-5 text-lg font-medium shadow-sm focus:ring-4 focus:ring-pumpkin/20 transition-all" placeholder="Enter your name" />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-medium uppercase tracking-wider flex items-center gap-2"><Building2 className="w-3.5 h-3.5" /> Organization *</label>
                  <input {...register('company', { required: true })} className="w-full bg-white border-none rounded-2xl py-4 px-5 text-lg font-medium shadow-sm focus:ring-4 focus:ring-pumpkin/20 transition-all" placeholder="Company or Entity name" />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-medium uppercase tracking-wider flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5" /> Email Address *
                    {errors.email && <span className="text-red-500 normal-case font-bold ml-auto text-[10px]">Invalid Email</span>}
                  </label>
                  <input 
                    {...register('email', { 
                      required: true, 
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Invalid email"
                      }
                    })} 
                    className={`w-full bg-white border-none rounded-2xl py-4 px-5 text-lg font-medium shadow-sm focus:ring-4 transition-all ${errors.email ? 'ring-2 ring-red-500' : 'focus:ring-pumpkin/20'}`} 
                    placeholder="email@example.com" 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-medium uppercase tracking-wider flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5" /> Contact Number (with +91) *
                    {errors.phone && <span className="text-red-500 normal-case font-bold ml-auto text-[10px]">Example: +91 9876543210</span>}
                  </label>
                  <input 
                    {...register('phone', { 
                      required: true,
                      pattern: {
                        value: /^\+91[6-9]\d{9}$/,
                        message: "Invalid India Phone (+91 required)"
                      }
                    })} 
                    className={`w-full bg-white border-none rounded-2xl py-4 px-5 text-lg font-medium shadow-sm focus:ring-4 transition-all ${errors.phone ? 'ring-2 ring-red-500' : 'focus:ring-pumpkin/20'}`} 
                    placeholder="+91 9876543210" 
                    defaultValue="+91"
                  />
                </div>
              </div>

              <button onClick={nextStep} disabled={!watch('name') || !watch('company') || !watch('email') || !watch('phone')} className="w-full bg-charcoal text-white py-5 rounded-2xl font-bold text-xl flex items-center justify-center gap-3 hover:bg-pumpkin transition-all shadow-xl disabled:opacity-50">
                Next: Collaboration <ArrowRight className="w-6 h-6" />
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div>
                <h1 className="text-3xl sm:text-4xl font-signika font-bold text-charcoal mb-4">The Collaboration</h1>
                <p className="text-slate-medium mb-6">Let’s define the project scope.</p>
                <div className="w-full h-1.5 bg-white/50 rounded-full overflow-hidden mb-6">
                  <motion.div className="h-full bg-pumpkin" initial={{ width: '33%' }} animate={{ width: '66%' }} />
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-medium uppercase tracking-wider flex items-center gap-2"><Star className="w-3.5 h-3.5" /> Kind of Engagement? *</label>
                  <select {...register('collabType', { required: true })} className="w-full bg-white border-none rounded-2xl py-4 px-5 text-lg font-medium shadow-sm focus:ring-4 focus:ring-pumpkin/20 transition-all appearance-none cursor-pointer">
                    <option value="">Select Option</option>
                    <option value="Live Performance">Live Performance</option>
                    <option value="Brand Collaboration">Brand Collaboration</option>
                    <option value="Social Media Content">Social Media Content</option>
                    <option value="Music Production / Feature">Music Production / Feature</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-medium uppercase tracking-wider flex items-center gap-2"><Mic2 className="w-3.5 h-3.5" /> Which Artist / Talent? *</label>
                  <select {...register('artist', { required: true })} className="w-full bg-white border-none rounded-2xl py-4 px-5 text-lg font-medium shadow-sm focus:ring-4 focus:ring-pumpkin/20 transition-all appearance-none cursor-pointer">
                    <option value="">Select Talent</option>
                    <option value="Harshad and Duhita Golesar">Harshad and Duhita Golesar</option>
                    <option value="YUGM">YUGM</option>
                    <option value="Mohit Shankar">Mohit Shankar</option>
                    <option value="Open to Recommendations">Open to Recommendations</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-medium uppercase tracking-wider flex items-center gap-2"><FileText className="w-3.5 h-3.5" /> Nature of Project? *</label>
                  <textarea 
                    {...register('nature', { required: true })} 
                    className="w-full bg-white border-none rounded-2xl py-4 px-5 text-lg font-medium shadow-sm focus:ring-4 focus:ring-pumpkin/20 transition-all resize-none" 
                    placeholder="Briefly describe the project goals..."
                    rows={3}
                  />
                </div>
              </div>

              <button onClick={nextStep} disabled={!watch('collabType') || !watch('artist') || !watch('nature')} className="w-full bg-charcoal text-white py-5 rounded-2xl font-bold text-xl flex items-center justify-center gap-3 hover:bg-pumpkin transition-all shadow-xl disabled:opacity-50">
                Next: Logistics <ArrowRight className="w-6 h-6" />
              </button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div>
                <h1 className="text-3xl sm:text-4xl font-signika font-bold text-charcoal mb-4">Logistics & Reach</h1>
                <p className="text-slate-medium mb-6">Final details to finalize the vision.</p>
                <div className="w-full h-1.5 bg-white/50 rounded-full overflow-hidden mb-6">
                  <motion.div className="h-full bg-pumpkin" initial={{ width: '66%' }} animate={{ width: '100%' }} />
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-medium uppercase tracking-wider flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /> When and Where? *</label>
                  <input {...register('locationTime', { required: true })} className="w-full bg-white border-none rounded-2xl py-4 px-5 text-lg font-medium shadow-sm focus:ring-4 focus:ring-pumpkin/20 transition-all" placeholder="Date & Location (City/Venue)" />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-medium uppercase tracking-wider flex items-center gap-2"><Maximize className="w-3.5 h-3.5" /> Expected Scale / Reach *</label>
                  <input {...register('scale', { required: true })} className="w-full bg-white border-none rounded-2xl py-4 px-5 text-lg font-medium shadow-sm focus:ring-4 focus:ring-pumpkin/20 transition-all" placeholder="Audience size or digital reach..." />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-medium uppercase tracking-wider flex items-center gap-2"><Truck className="w-3.5 h-3.5" /> Logistics Provided? *</label>
                  <select {...register('logisticsSupport', { required: true })} className="w-full bg-white border-none rounded-2xl py-4 px-5 text-lg font-medium shadow-sm focus:ring-4 focus:ring-pumpkin/20 transition-all appearance-none cursor-pointer">
                    <option value="">Select Option</option>
                    <option value="Yes - Full Travel & Stay">Yes - Full Travel & Stay</option>
                    <option value="Partially Provided">Partially Provided</option>
                    <option value="To be Negotiated">To be Negotiated</option>
                    <option value="Not Provided">Not Provided</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-medium uppercase tracking-wider flex items-center gap-2"><Eye className="w-3.5 h-3.5" /> Additional Vision / Details</label>
                  <textarea 
                    {...register('additionalVision')} 
                    className="w-full bg-white border-none rounded-2xl py-4 px-5 text-lg font-medium shadow-sm focus:ring-4 focus:ring-pumpkin/20 transition-all resize-none" 
                    placeholder="Anything else we should know?"
                    rows={3}
                  />
                </div>
              </div>

              <button onClick={handleSubmit(onSubmit)} disabled={isSubmitting} className="w-full bg-pumpkin text-white py-5 rounded-2xl font-bold text-xl flex items-center justify-center gap-3 hover:bg-charcoal transition-all shadow-xl disabled:opacity-50">
                {isSubmitting ? 'Sending Enquiry...' : 'Submit Enquiry'} <CheckCircle2 className="w-6 h-6" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
