/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { AppProvider, useApp } from "./context/AppContext";
import { Header } from "./components/Header";
import { BusinessOwnerPortal } from "./components/BusinessOwnerPortal";
import { AgentPortal } from "./components/AgentPortal";
import { AdminPortal } from "./components/AdminPortal";
import { PublicLandingPage } from "./components/PublicLandingPage";
import {
  Shield,
  Briefcase,
  Users2,
  Terminal,
  Activity,
  ArrowRight,
  Sparkles,
  Info,
  CheckCircle,
  Clock
} from "lucide-react";

function AppContent() {
  const {
    currentRole,
    currentUser,
    activeBusiness,
    activeAgent,
    referralLinks,
    campaigns,
    clicks,
    leads,
    conversions,
    payoutRequests
  } = useApp();

  // Code to simulate customer clicking
  const [simulatedReferralCode, setSimulatedReferralCode] = useState<string | null>(null);

  // Quick system notification triggers for logs and logs stack
  const systemLogs = [
    { time: "05:41:19", text: "M-Pesa API Webhook gateway initialized securely on port 3000." },
    { time: "05:41:19", text: "Subscription verification service pulled Growth subscription billing rules." },
    ...(conversions.length > 0
      ? conversions.map(c => ({
          time: new Date(c.timestamp).toLocaleTimeString(),
          text: `Conversion synced: KES ${c.amount.toLocaleString()} sale. Status: ${c.status}.`
        }))
      : []),
    ...(leads.map(l => ({
      time: new Date(l.timestamp).toLocaleTimeString(),
      text: `Lead capturing hooks registered. Contact name: ${l.customerName} (${l.status}).`
    }))),
    ...(payoutRequests.map(p => ({
      time: new Date(p.timestamp).toLocaleTimeString(),
      text: `Withdrawal request queued. KES ${p.amount.toLocaleString()} to +${p.mpesaNumber} (${p.status}).`
    })))
  ].slice(0, 5); // Limit to top 5 logs to prevent overcrowding

  return (
    <div className="min-h-screen bg-zinc-50/50 flex flex-col justify-between select-none">
      
      {/* Top Level Simulation Frame Navigation */}
      <Header />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-6">
        
        {/* If Customer Simulator view is active */}
        {simulatedReferralCode ? (
          <div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-mono font-bold text-zinc-400">REFERRAIOS INTEGRATED WEB IFRAME SANDBOX HUD</span>
            </div>
            <PublicLandingPage
              activeReferralCode={simulatedReferralCode}
              onClose={() => setSimulatedReferralCode(null)}
            />
          </div>
        ) : (
          /* Normal Dashboard Views depending on simulated role chosen from Header */
          <div>
            {currentRole === "BUSINESS_OWNER" && <BusinessOwnerPortal />}
            {currentRole === "AGENT" && (
              <AgentPortal
                onSimulateLink={(code) => setSimulatedReferralCode(code)}
              />
            )}
            {currentRole === "ADMIN" && <AdminPortal />}
          </div>
        )}

      </main>

      {/* Persistent System Simulation Control Center Footer Panel */}
      {!simulatedReferralCode && (
        <div className="bg-white border-t border-zinc-150 py-6 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              
              {/* Quick Jump Sandbox Tool */}
              <div className="md:col-span-4 space-y-2.5">
                <span className="text-[10px] font-mono font-bold text-zinc-450 uppercase tracking-widest block flex items-center gap-1">
                  <Terminal className="h-3.5 w-3.5 text-emerald-600" /> Interactive Quick-Jump Hub
                </span>
                <p className="text-xs text-zinc-500 font-sans">
                  Quickly jump into any simulated referral link landing page to test lead flows and commissions calculations.
                </p>
                
                <div className="space-y-1.5 font-sans">
                  <select
                    id="quick-referral-simulator-select"
                    className="w-full text-xs font-mono font-medium border border-zinc-200 bg-zinc-50 rounded-lg p-2 outline-none text-zinc-700 focus:border-emerald-600"
                    onChange={(e) => {
                      if (e.target.value) {
                        setSimulatedReferralCode(e.target.value);
                        e.target.value = "";
                      }
                    }}
                  >
                    <option value="">-- Choose active link to simulate --</option>
                    {referralLinks.map((link) => {
                      const campaign = campaigns.find(c => c.id === link.campaignId);
                      return (
                        <option key={link.id} value={link.uniqueCode}>
                          Code: {link.uniqueCode} ({campaign ? campaign.title.slice(0, 18) : "Campaign"}...)
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* Real-time server Webhook ticker simulation stream */}
              <div className="md:col-span-5 space-y-2">
                <span className="text-[10px] font-mono font-bold text-zinc-450 uppercase tracking-widest block flex items-center gap-1">
                  <Activity className="h-3.5 w-3.5 text-emerald-600 animate-pulse" /> Live M-Pesa Webhook & API Audits
                </span>
                
                <div className="bg-zinc-900 rounded-xl p-3 border border-zinc-850 font-mono text-[10px] text-zinc-300 space-y-1.5 shadow-inner">
                  {systemLogs.map((log, index) => (
                    <div key={index} className="flex space-x-2 border-b border-zinc-800/60 pb-1.5 last:border-0 last:pb-0 font-mono truncate">
                      <span className="text-emerald-500">[{log.time}]</span>
                      <span className="text-zinc-400">INFO</span>
                      <span className="text-zinc-200 text-ellipsis overflow-hidden">{log.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Explanatory Sandbox guidelines */}
              <div className="md:col-span-3 bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 space-y-2 text-xs">
                <h4 className="font-semibold text-emerald-950 flex items-center gap-1">
                  <Sparkles className="h-4 w-4 text-emerald-600" /> End-to-End Test Journey
                </h4>
                <ol className="list-decimal list-inside space-y-1 text-zinc-700 marker:font-bold">
                  <li>Choose <strong>"Sales Agent"</strong> & copy their tracking code.</li>
                  <li>Open the simulator link to submit a <strong>Customer sign-up</strong>.</li>
                  <li>Choose <strong>"Business Owner"</strong> and click <strong>"Record Sale"</strong> to convert.</li>
                  <li>Click <strong>"Approve Payout"</strong> on the invoice to pay the commission!</li>
                </ol>
              </div>

            </div>

            {/* Platform legal disclaimer */}
            <div className="text-center text-[10px] text-zinc-400 border-t border-zinc-150 pt-4 mt-6">
              © 2026 ReferraIOS Group Holdings East Africa. Automated M-Pesa Daraja & Flutterwave SDK triggers active. Built securely with TypeScript and modern Vite React frameworks.
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
