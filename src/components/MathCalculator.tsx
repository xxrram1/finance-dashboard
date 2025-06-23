// src/components/MathCalculator.tsx

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from 'framer-motion';
import { Pi, Sigma, Triangle } from 'lucide-react';

// Import the new and completed calculator components
// FIX: Reverted to the most standard relative import paths,
// explicitly including the .tsx file extension. This is usually the most robust
// way to ensure module resolution in various build environments.
import GeometryCalculator from './calculators/GeometryCalculator.tsx';
import TrigonometryCalculator from './calculators/TrigonometryCalculator.tsx';
import AlgebraCalculator from './calculators/AlgebraCalculator.tsx';

/**
 * MathCalculator Component
 * This component acts as a central hub for various mathematical calculators,
 * including Geometry, Trigonometry, and Algebra. It uses a tabbed interface
 * to switch between different calculator functionalities and incorporates
 * modern UI animations with Framer Motion for a smoother user experience.
 */
const MathCalculator = () => {
  // State to manage the active tab, defaulting to 'geometry'
  const [activeTab, setActiveTab] = useState('geometry');

  /**
   * Renders the content of the currently active calculator tab.
   * This function dynamically returns the appropriate calculator component
   * based on the `activeTab` state.
   * @returns {JSX.Element | null} The JSX element for the active calculator, or null if no tab is active.
   */
  const renderContent = () => {
      switch (activeTab) {
          case 'geometry':
            return <GeometryCalculator />;
          case 'trigonometry':
            return <TrigonometryCalculator />;
          case 'algebra':
            return <AlgebraCalculator />;
          default:
            return null;
      }
  }

  return (
    // Main container with a gradient background for visual appeal
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-slate-950">
      {/* Centered content area with maximum width */}
      <div className="container mx-auto max-w-7xl px-4 py-8 space-y-8">
        {/* Header section with Framer Motion for animation */}
        <motion.div
          initial={{ opacity: 0, y: -20 }} // Initial animation state (invisible, slightly above)
          animate={{ opacity: 1, y: 0 }}   // Animation to final state (visible, original position)
          transition={{ duration: 0.5 }}   // Animation duration
        >
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
            เครื่องมือคำนวณคณิตศาสตร์
          </h1>
          <p className="text-muted-foreground mt-1 text-base">
            ชุดเครื่องมือสำหรับช่วยแก้ปัญหาคณิตศาสตร์ที่ซับซ้อน
          </p>
        </motion.div>

        {/* Tabs component for navigation between calculators */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* List of tabs with responsive grid layout */}
            <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 mb-6 h-auto p-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl">
                {/* Geometry tab trigger */}
                <TabsTrigger value="geometry" className="py-2.5 text-base gap-2">
                  <Pi/> เรขาคณิต
                </TabsTrigger>
                {/* Trigonometry tab trigger */}
                <TabsTrigger value="trigonometry" className="py-2.5 text-base gap-2">
                  <Triangle/> ตรีโกณมิติ
                </TabsTrigger>
                {/* Algebra tab trigger */}
                <TabsTrigger value="algebra" className="py-2.5 text-base gap-2">
                  <Sigma/> พีชคณิต
                </TabsTrigger>
            </TabsList>

            {/* Content area for active tab with exit/enter animations */}
            <AnimatePresence mode="wait"> {/* 'wait' mode ensures one animation finishes before the next starts */}
                <motion.div
                    key={activeTab} // Key changes when activeTab changes, triggering animation
                    initial={{ opacity: 0, y: 20 }} // Initial state for entering content
                    animate={{ opacity: 1, y: 0 }}   // Animation for entering content
                    exit={{ opacity: 0, y: -20}}     // Animation for exiting content
                    transition={{ duration: 0.3, ease: 'easeInOut' }} // Animation duration and easing
                    className="md:min-h-[1100px]"
                >
                   {renderContent()} {/* Render the active calculator component */}
                </motion.div>
            </AnimatePresence>
        </Tabs>
      </div>
    </div>
  );
};

export default MathCalculator;