import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import ParcelUnboxIntro from '../../components/landing/ParcelUnboxIntro';
import LandingNav from '../../components/landing/LandingNav';
import HeroScene from '../../components/landing/HeroScene';
import HowItWorks from '../../components/landing/HowItWorks';
import WhyAndLife from '../../components/landing/WhyAndLife';
import RolesSection from '../../components/landing/RolesSection';
import SecuritySection from '../../components/landing/SecuritySection';
import DemoAccess from '../../components/landing/DemoAccess';
import LandingFooter from '../../components/landing/LandingFooter';

export default function Landing() {
  const [showIntro, setShowIntro] = useState(false);

  return (
    <div className="min-h-screen bg-surface text-navy overflow-x-hidden">
      {showIntro && <ParcelUnboxIntro onComplete={() => setShowIntro(false)} onSkip={() => setShowIntro(false)} />}
      <LandingNav onReplayIntro={() => setShowIntro(true)} />

      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pt-12 pb-20 lg:pt-20 grid lg:grid-cols-2 gap-14 items-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <p className="inline-flex px-3 py-1 rounded-full bg-teal-50 text-teal-700 text-xs font-bold uppercase tracking-wider border border-teal-200">
            Hostel parcel reception &amp; secure handover
          </p>
          <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.08]">
            Your Parcels. Your Hostel. <span className="text-primary-600">Handled.</span>
          </h1>
          <p className="mt-5 text-lg text-slate-600 max-w-xl leading-relaxed">
            Never miss a delivery while you&apos;re in class. ParcelTrack helps hostel students securely authorize, receive, and collect their parcels with complete transparency.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/register" className="inline-flex items-center gap-2 h-12 px-6 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold shadow-soft transition-colors">
              Get Started <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
            <a href="#how-it-works" className="inline-flex items-center h-12 px-6 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 font-semibold transition-colors">
              Explore How It Works
            </a>
          </div>
        </motion.div>
        <HeroScene />
      </section>

      <HowItWorks />
      <WhyAndLife />
      <RolesSection />
      <SecuritySection />
      <DemoAccess />
      <LandingFooter />
    </div>
  );
}
