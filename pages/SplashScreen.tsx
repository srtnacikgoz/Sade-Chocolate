import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const SplashScreen: React.FC = () => {
  const navigate = useNavigate();
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(true);
    const timer = setTimeout(() => {
      navigate('/home');
    }, 3000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="bg-white dark:bg-dark-900 min-h-screen flex flex-col items-center justify-center relative overflow-hidden transition-colors duration-300">
        <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-gray-50 dark:bg-dark-800 rounded-full blur-3xl opacity-60 pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-80 h-80 bg-gray-50 dark:bg-dark-800 rounded-full blur-3xl opacity-60 pointer-events-none"></div>
        
        <main className={`flex flex-col items-center justify-center z-10 w-full max-w-md px-6 text-center transition-all duration-1000 transform ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="mb-2">
                <h1 className="font-display text-5xl md:text-6xl text-black dark:text-white tracking-tight leading-tight">
                    <span className="italic font-normal">Sade</span><br/>
                    <span className="font-bold tracking-wide text-4xl md:text-5xl uppercase mt-2 block">Chocolate</span>
                </h1>
            </div>
            <div className={`h-1 w-12 bg-black dark:bg-white my-6 rounded-full opacity-20 transition-all duration-1000 delay-300 ${show ? 'opacity-20' : 'opacity-0'}`}></div>
            <div className={`transition-all duration-1000 delay-500 ${show ? 'opacity-100' : 'opacity-0'}`}>
                <p className="font-sans text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400 font-medium">
                    Powered by Sade Patisserie
                </p>
            </div>
        </main>
        
        <div className={`absolute bottom-12 left-0 right-0 flex justify-center transition-all duration-1000 delay-700 ${show ? 'opacity-100' : 'opacity-0'}`}>
            <div className="flex space-x-2">
                <div className="w-1.5 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
                <div className="w-1.5 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-1.5 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>
        </div>
    </div>
  );
};
