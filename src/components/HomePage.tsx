"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Moon, Star, Zap } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const floatingElements = [
    { id: 1, size: 200, duration: 8, delay: 0, left: "10%", top: "10%" },
    { id: 2, size: 150, duration: 10, delay: 1, left: "80%", top: "20%" },
    { id: 3, size: 180, duration: 12, delay: 2, left: "20%", top: "70%" },
    { id: 4, size: 120, duration: 9, delay: 1.5, left: "75%", top: "60%" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 text-white overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {floatingElements.map((el) => (
          <motion.div
            key={el.id}
            className="absolute rounded-full bg-purple-500/5 blur-3xl"
            style={{
              width: el.size,
              height: el.size,
              left: el.left,
              top: el.top,
            }}
            animate={{
              y: [0, 30, 0],
              x: [0, 20, 0],
            }}
            transition={{
              duration: el.duration,
              delay: el.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Navigation */}
      <nav
        className={`fixed w-full z-50 transition-all duration-300 ${
          isScrolled ? "bg-slate-950/80 backdrop-blur-md border-b border-purple-500/20" : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <motion.div
            className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent flex items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Star className="w-6 h-6" />
            DivyaDrishti
          </motion.div>
          <Link href="/onboarding">
            <button className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-white font-medium hover:shadow-lg hover:shadow-purple-500/50 transition-all">
              Get Started
            </button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col justify-center items-center px-6 pt-20">
        <motion.div
          className="text-center max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-purple-500/10 rounded-full border border-purple-500/30 mb-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-purple-300 text-sm">Ancient Wisdom Meets Modern Insight</span>
          </motion.div>

          <motion.h1
            className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-purple-200 via-pink-200 to-purple-200 bg-clip-text text-transparent leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Understand Your Timing. Align Your Actions.
          </motion.h1>

          <motion.p
            className="text-xl text-slate-300 mb-8 leading-relaxed max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            DivyaDrishti interprets the cosmos to guide your decisions. Get personalized insights on career, finance, health, and relationships based on your unique birth chart.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Link href="/onboarding">
              <button className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg text-white font-semibold hover:shadow-2xl hover:shadow-purple-500/50 transition-all transform hover:scale-105 flex items-center gap-2 group">
                Create Your Kundali
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
            <button className="px-8 py-4 border border-purple-500/50 rounded-lg text-white font-semibold hover:bg-purple-500/10 transition-all">
              Learn More
            </button>
          </motion.div>

          {/* Feature Cards */}
          <motion.div
            className="grid md:grid-cols-3 gap-6 mt-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            {[
              {
                icon: <Moon className="w-8 h-8" />,
                title: "Personal Kundali",
                desc: "Detailed birth chart analysis with planetary positions and interpretations",
              },
              {
                icon: <Zap className="w-8 h-8" />,
                title: "Real-time Transits",
                desc: "Get notified when celestial events impact your life domains",
              },
              {
                icon: <Sparkles className="w-8 h-8" />,
                title: "AI-Powered Guidance",
                desc: "Chat-based insights tailored to your questions and timeline",
              },
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                className="p-6 bg-white/5 backdrop-blur-sm border border-purple-500/20 rounded-lg hover:border-purple-500/50 transition-all hover:bg-white/10"
                whileHover={{ y: -5 }}
              >
                <div className="text-purple-400 mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-slate-400 text-sm">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-6 h-10 border-2 border-purple-500/50 rounded-full flex justify-center">
            <motion.div
              className="w-1 h-2 bg-purple-400 rounded-full"
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
        </motion.div>
      </section>

      {/* How It Works Section */}
      <section className="relative py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">How It Works</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Three simple steps to unlock cosmic guidance tailored just for you
            </p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-3 gap-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ staggerChildren: 0.2 }}
          >
            {[
              {
                num: 1,
                title: "Share Your Details",
                desc: "Enter your birth date, time, and location for accurate cosmic calculations",
              },
              {
                num: 2,
                title: "Generate Your Chart",
                desc: "We create your detailed Kundali with planetary positions and interpretations",
              },
              {
                num: 3,
                title: "Get Guidance",
                desc: "Receive personalized insights on any life area with real-time cosmic updates",
              },
            ].map((step, idx) => (
              <motion.div
                key={idx}
                className="relative"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-2xl font-bold text-white mx-auto mb-4">
                    {step.num}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                  <p className="text-slate-400">{step.desc}</p>
                </div>
                {idx < 2 && (
                  <div className="hidden md:block absolute top-8 -right-4 w-8 h-0.5 bg-gradient-to-r from-purple-500 to-transparent" />
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl p-12 border border-purple-500/30 backdrop-blur-sm"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Align Your Actions?</h2>
            <p className="text-slate-300 mb-8 max-w-2xl mx-auto">
              Create your Kundali today and start receiving personalized cosmic guidance for all aspects of your life.
            </p>
            <Link href="/onboarding">
              <button className="px-10 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg text-white font-semibold hover:shadow-2xl hover:shadow-purple-500/50 transition-all transform hover:scale-105 inline-flex items-center gap-2">
                Get Started Now
                <ArrowRight className="w-5 h-5" />
              </button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-8 px-6 border-t border-purple-500/20">
        <div className="max-w-6xl mx-auto text-center text-slate-400 text-sm">
          <p>© 2024 DivyaDrishti. Aligning actions with cosmic wisdom.</p>
        </div>
      </footer>
    </div>
  );
}
