/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { useApp } from "../context/AppContext";
import { Shield, Briefcase, Users2, Smartphone, Settings, RefreshCw, Layers } from "lucide-react";

export const Header: React.FC = () => {
  const {
    currentRole,
    setCurrentRole,
    currentUser,
    setCurrentUser,
    users,
    businesses,
    activeBusiness,
    setActiveBusiness,
    agents,
    activeAgent,
    setActiveAgent,
    resetAllData
  } = useApp();

  const handleUserChange = (userId: string) => {
    const selected = users.find(u => u.id === userId);
    if (!selected) return;
    
    setCurrentUser(selected);
    setCurrentRole(selected.role);
    
    if (selected.role === "BUSINESS_OWNER") {
      const biz = businesses.find(b => b.id === (userId === "user_owner_pesapos" ? "biz_pesapos" : "biz_solarspark"));
      setActiveBusiness(biz || null);
      setActiveAgent(null);
    } else if (selected.role === "AGENT") {
      const ag = agents.find(a => a.userId === selected.id);
      setActiveAgent(ag || null);
      setActiveBusiness(null);
    } else {
      setActiveBusiness(null);
      setActiveAgent(null);
    }
  };

  return (
    <header id="referraios-header" className="bg-white border-b border-zinc-100 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="bg-emerald-600 text-white p-2 rounded-xl flex items-center justify-center shadow-sm shadow-emerald-500/20">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xl font-bold text-zinc-900 tracking-tight font-sans">
                Referra<span className="text-emerald-600">IOS</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] uppercase tracking-widest text-emerald-800 font-mono font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                v1.0 MVP
              </span>
            </div>
          </div>

          {/* Persona Swapping Sandbox Controller */}
          <div className="flex items-center space-x-2 sm:space-x-3 bg-zinc-50 border border-zinc-200/60 p-1.5 rounded-xl">
            {/* Quick selector labels */}
            <span className="hidden md:inline-block text-xs font-mono text-zinc-500 font-bold px-2">
              SIMULATED ROLE:
            </span>

            {/* Role Buttons */}
            <div className="flex space-x-1">
              <button
                id="role-btn-business"
                onClick={() => handleUserChange("user_owner_pesapos")}
                className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  currentRole === "BUSINESS_OWNER"
                    ? "bg-white text-emerald-700 shadow-sm border border-zinc-200"
                    : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                <Briefcase className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Business Owner</span>
                <span className="sm:hidden">Biz</span>
              </button>

              <button
                id="role-btn-agent"
                onClick={() => handleUserChange("user_agent_otieno")}
                className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  currentRole === "AGENT"
                    ? "bg-white text-emerald-700 shadow-sm border border-zinc-200"
                    : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                <Users2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sales Agent</span>
                <span className="sm:hidden">Agent</span>
              </button>

              <button
                id="role-btn-admin"
                onClick={() => handleUserChange("user_admin")}
                className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  currentRole === "ADMIN"
                    ? "bg-white text-emerald-700 shadow-sm border border-zinc-200"
                    : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                <Shield className="h-3.5 w-3.5" />
                <span>Admin</span>
              </button>
            </div>

            {/* Separator */}
            <div className="h-4 w-px bg-zinc-200 hidden sm:block"></div>

            {/* Persona details toggle */}
            <div className="hidden lg:flex items-center space-x-2">
              <select
                id="persona-selector"
                value={currentUser.id}
                onChange={(e) => handleUserChange(e.target.value)}
                className="text-xs bg-white text-zinc-700 border border-zinc-200 rounded-lg px-2 py-1 outline-none font-medium text-ellipsis overflow-hidden"
              >
                <optgroup label="Platform Admin">
                  <option value="user_admin">Amina Patel (Admin)</option>
                </optgroup>
                <optgroup label="Business Owners">
                  <option value="user_owner_pesapos">Kamau Wafula (PesaPOS)</option>
                  <option value="user_owner_solar">Nekesa Simiyu (SolarSpark)</option>
                </optgroup>
                <optgroup label="Sales Agents">
                  <option value="user_agent_otieno">Otieno Onyango (Agent)</option>
                  <option value="user_agent_fatuma">Fatuma Ali (Agent)</option>
                </optgroup>
              </select>
            </div>
          </div>

          {/* Secondary Actions */}
          <div className="flex items-center space-x-2">
            <button
              id="reset-simulation-btn"
              onClick={() => {
                if (confirm("Reset simulation data to default startup seed? All customized logs will be wiped.")) {
                  resetAllData();
                }
              }}
              className="p-2 text-zinc-500 hover:text-emerald-600 focus:outline-none hover:bg-zinc-50 rounded-xl transition-all"
              title="Reset Simulated Data"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
