import React from 'react';
import { motion } from 'framer-motion';
import { BoxItem } from '../types';

interface BoxContentProps {
  items: BoxItem[];
}

export const BoxContent: React.FC<BoxContentProps> = ({ items }) => {
  return (
    <section className="mt-32 py-24 bg-[#FDFDFD] dark:bg-dark-900 overflow-hidden border-y border-gray-50 dark:border-gray-800">
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="mb-20 text-center">
          <motion.span 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="text-gold text-[10px] font-bold uppercase tracking-[0.5em] mb-4 block"
          >
            Koleksiyonun DNA'sı
          </motion.span>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="font-display text-4xl lg:text-6xl italic text-gray-900 dark:text-white"
          >
            Kutu İçeriği
          </motion.h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-12">
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.8, ease: "easeOut" }}
              viewport={{ once: true }}
              className="group cursor-pointer text-center"
            >
              <div className="relative aspect-square mb-8 bg-white dark:bg-dark-800 rounded-full p-6 shadow-[0_20px_50px_rgba(0,0,0,0.04)] group-hover:shadow-[0_40px_80px_rgba(0,0,0,0.08)] transition-all duration-700 ease-in-out">
                <img 
                  src={item.image} 
                  alt={item.name}
                  className="w-full h-full object-contain transform group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-1000"
                />
              </div>
              <h3 className="font-display text-sm font-bold dark:text-white mb-3 tracking-wide italic">
                {item.name}
              </h3>
              <div className="flex flex-wrap justify-center gap-1.5 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-500">
                {item.tastingNotes.map((note, i) => (
                  <span key={i} className="text-[7px] uppercase font-bold tracking-[0.2em] text-gold border border-gold/20 px-2 py-0.5 rounded-full">
                    {note}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};