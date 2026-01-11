import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Footer } from '../components/Footer';

// Hook for scroll-triggered animations
const useScrollReveal = (threshold = 0.1) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isVisible };
};

export const Story: React.FC = () => {
  const { language } = useLanguage();
  const [storyData, setStoryData] = useState<any>(null);
  const [scrollY, setScrollY] = useState(0);

  // Parallax scroll effect
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Load story CMS data
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'cms', 'story'), (doc) => {
      if (doc.exists()) {
        setStoryData(doc.data());
      }
    });
    return () => unsubscribe();
  }, []);

  const heroReveal = useScrollReveal(0.1);

  // CMS Data with defaults
  const heroTitle = storyData?.[language]?.hero_title || 'Sade\'nin Hikayesi';
  const heroSubtitle = storyData?.[language]?.hero_subtitle || 'Bir Tutkunun Yolculuğu';
  const heroDescription = storyData?.[language]?.hero_description || '2016 yılında başlayan bu yolculuk, çikolata sanatına duyulan tutkuyla büyüdü.';

  const sections = storyData?.[language]?.sections || [];

  return (
    <div className="min-h-screen bg-cream-50 dark:bg-dark-900">
      {/* Hero Section */}
      <section className="relative pt-32 pb-24 lg:pt-40 lg:pb-32 overflow-hidden">
        {/* Background decorative elements */}
        <div
          className="absolute top-20 right-0 w-[500px] h-[500px] rounded-full bg-gold/5 blur-[100px]"
          style={{ transform: `translateY(${scrollY * 0.1}px)` }}
        />
        <div
          className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-mocha-200/10 blur-[80px]"
          style={{ transform: `translateY(${scrollY * -0.05}px)` }}
        />

        <div className="relative w-full max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-12">
          <div
            ref={heroReveal.ref}
            className="text-center max-w-4xl mx-auto"
          >
            {/* Hero Title */}
            <h1
              className={`
                font-display text-5xl sm:text-6xl lg:text-7xl xl:text-8xl text-mocha-900 dark:text-cream-50
                mb-6 leading-[0.95] tracking-tight
                transition-all duration-1000
                ${heroReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}
              `}
            >
              {heroTitle}
            </h1>

            {/* Hero Subtitle */}
            <p
              className={`
                font-santana text-2xl lg:text-3xl text-gold mb-8
                transition-all duration-1000 delay-200
                ${heroReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
              `}
            >
              {heroSubtitle}
            </p>

            {/* Hero Description */}
            <p
              className={`
                text-lg lg:text-xl text-mocha-400 dark:text-mocha-200 leading-relaxed max-w-3xl mx-auto
                transition-all duration-1000 delay-400
                ${heroReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
              `}
            >
              {heroDescription}
            </p>
          </div>
        </div>
      </section>

      {/* Story Content Section */}
      <section className="relative py-24 lg:py-32">
        <div className="w-full max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-12">
          <div className="max-w-4xl mx-auto space-y-20">
            {/* Dynamic Sections */}
            {sections.map((section: any, index: number) => {
              const sectionReveal = useScrollReveal(0.1);

              return (
                <div
                  key={index}
                  ref={sectionReveal.ref}
                  className={`
                    transition-all duration-1000
                    ${sectionReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}
                  `}
                >
                  <h2 className="font-display text-3xl lg:text-4xl text-mocha-900 dark:text-cream-50 mb-6">
                    {section.title}
                  </h2>

                  {/* Section Image */}
                  {section.image && (
                    <div className="mb-8 rounded-2xl overflow-hidden shadow-xl">
                      <img
                        src={section.image}
                        alt={section.title}
                        className="w-full h-auto object-cover"
                      />
                    </div>
                  )}

                  {/* Section Content - Split by paragraphs */}
                  <div className="prose prose-lg dark:prose-invert max-w-none space-y-4">
                    {section.content.split('\n\n').map((paragraph: string, pIndex: number) => (
                      paragraph.trim() && (
                        <p key={pIndex} className="text-mocha-400 dark:text-mocha-200 leading-relaxed">
                          {paragraph.split('\n').map((line: string, lIndex: number) => (
                            <React.Fragment key={lIndex}>
                              {line}
                              {lIndex < paragraph.split('\n').length - 1 && <br />}
                            </React.Fragment>
                          ))}
                        </p>
                      )
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Empty State */}
            {sections.length === 0 && (
              <div className="text-center py-20 text-mocha-400 dark:text-mocha-200">
                <span className="material-icons-outlined text-6xl mb-4 opacity-20">auto_stories</span>
                <p className="text-lg">Hikaye henüz yazılmadı...</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};
