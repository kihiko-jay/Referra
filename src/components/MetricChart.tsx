/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { motion } from "motion/react";

interface MetricChartProps {
  label: string;
  data: { date: string; value: number }[];
  color: string;
}

export const MetricChart: React.FC<MetricChartProps> = ({ label, data, color }) => {
  const maxValue = Math.max(...data.map(d => d.value), 1);
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div id={`chart-${label.toLowerCase().replace(/\s+/g, "-")}`} className="bg-white p-5 rounded-2xl border border-zinc-100 flex flex-col h-full justify-between">
      <div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{label}</span>
          <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
            Total: {total.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="mt-6 flex items-end justify-between h-28 space-x-2">
        {data.map((item, idx) => {
          const pct = (item.value / maxValue) * 100;
          return (
            <div key={idx} className="flex flex-col items-center flex-1 h-full justify-end group cursor-pointer">
              <div className="w-full relative flex flex-col justify-end items-center h-full group-hover:bg-zinc-50/50 rounded-t-lg transition-all pt-4">
                {/* Tooltip */}
                <span className="opacity-0 group-hover:opacity-100 absolute -top-1 bg-zinc-950 text-white text-[10px] font-mono font-bold px-1.5 py-0.5 rounded shadow-md transform -translate-y-1/2 transition-all duration-150 z-20 whitespace-nowrap">
                  {item.value}
                </span>
                
                {/* Bar */}
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(pct, 8)}%` }}
                  transition={{ duration: 0.6, delay: idx * 0.05, ease: "easeOut" }}
                  className={`w-full max-w-[24px] rounded-t-md ${color} opacity-85 group-hover:opacity-100 transition-all`}
                />
              </div>
              <span className="text-[10px] text-zinc-400 font-medium tracking-tight mt-1.5 rotate-[-25deg] origin-top-left transform translate-y-1 translate-x-1 whitespace-nowrap">
                {item.date}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
