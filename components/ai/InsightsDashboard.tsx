'use client';

import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  Calendar, 
  Smile, 
  Target, 
  BrainCircuit, 
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Sparkles
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { useEntries } from '@/lib/store/use-diary-store';

const MOOD_COLORS: Record<string, string> = {
  happy: '#FACC15',
  sad: '#60A5FA',
  angry: '#F87171',
  anxious: '#A78BFA',
  calm: '#34D399',
  neutral: '#94A3B8',
};

export const InsightsDashboard = () => {
  const entries = useEntries();

  // 1. Mood Trends Data
  const moodData = useMemo(() => {
    const counts: Record<string, number> = {
      happy: 0,
      sad: 0,
      angry: 0,
      anxious: 0,
      calm: 0,
      neutral: 0,
    };

    entries.forEach((entry) => {
      const mood = entry.mood?.toLowerCase() || 'neutral';
      if (counts[mood] !== undefined) {
        counts[mood]++;
      } else {
        counts.neutral++;
      }
    });

    return Object.entries(counts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      color: MOOD_COLORS[name] || MOOD_COLORS.neutral,
    })).filter(d => d.value > 0);
  }, [entries]);

  // 2. Writing Frequency Data (Last 7 days)
  const frequencyData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    const counts: Record<string, number> = {};
    last7Days.forEach(date => counts[date] = 0);

    entries.forEach(entry => {
      const date = new Date(entry.created_at).toISOString().split('T')[0];
      if (counts[date] !== undefined) {
        counts[date]++;
      }
    });

    return last7Days.map(date => ({
      date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
      count: counts[date],
    }));
  }, [entries]);

  // 3. Emotional Intensity / Mood Flow (Last 10 entries)
  const moodFlowData = useMemo(() => {
    const moodValues: Record<string, number> = {
      happy: 5,
      calm: 4,
      neutral: 3,
      anxious: 2,
      sad: 1,
      angry: 0,
    };

    return entries.slice(0, 10).reverse().map(entry => ({
      date: new Date(entry.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: moodValues[entry.mood?.toLowerCase() || 'neutral'] || 3,
      mood: entry.mood || 'Neutral'
    }));
  }, [entries]);

  // 4. Growth Summary Stats
  const stats = useMemo(() => {
    const totalEntries = entries.length;
    const thisMonth = entries.filter(e => {
      const d = new Date(e.created_at);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    
    const lastMonth = entries.filter(e => {
      const d = new Date(e.created_at);
      const now = new Date();
      now.setMonth(now.getMonth() - 1);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;

    const growth = lastMonth === 0 ? 100 : Math.round(((thisMonth - lastMonth) / lastMonth) * 100);

    return {
      totalEntries,
      thisMonth,
      growth,
      streak: 3, // Mock streak for now
    };
  }, [entries]);

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
            AI Insights Dashboard
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Understanding your journey through data and empathy.
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800/30">
          <BrainCircuit className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
            WinDear Soul Analysis
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Entries', value: stats.totalEntries, icon: <Calendar className="w-5 h-5" />, color: 'blue' },
          { label: 'This Month', value: stats.thisMonth, icon: <Activity className="w-5 h-5" />, color: 'purple' },
          { 
            label: 'Writing Growth', 
            value: `${stats.growth > 0 ? '+' : ''}${stats.growth}%`, 
            icon: <TrendingUp className="w-5 h-5" />, 
            color: stats.growth >= 0 ? 'emerald' : 'red',
            trend: stats.growth >= 0 ? 'up' : 'down'
          },
          { label: 'Current Streak', value: `${stats.streak} Days`, icon: <Target className="w-5 h-5" />, color: 'orange' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white dark:bg-[#1A1A1A] p-6 rounded-[2rem] border border-gray-100 dark:border-[#2E2E2E] shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-2xl bg-${stat.color}-50 dark:bg-${stat.color}-900/20 text-${stat.color}-600 dark:text-${stat.color}-400`}>
                {stat.icon}
              </div>
              {stat.trend && (
                <div className={`flex items-center gap-1 text-xs font-bold ${stat.trend === 'up' ? 'text-emerald-500' : 'text-red-500'}`}>
                  {stat.trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {stat.trend === 'up' ? 'Up' : 'Down'}
                </div>
              )}
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mood Distribution */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-[#1A1A1A] p-8 rounded-[2.5rem] border border-gray-100 dark:border-[#2E2E2E] shadow-sm"
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl">
                <Smile className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white">Mood Distribution</h3>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={moodData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {moodData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                    borderRadius: '16px', 
                    border: 'none',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4">
            {moodData.map((mood) => (
              <div key={mood.name} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: mood.color }} />
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{mood.name}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Writing Frequency */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-[#1A1A1A] p-8 rounded-[2.5rem] border border-gray-100 dark:border-[#2E2E2E] shadow-sm"
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
                <Activity className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white">Writing Frequency</h3>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={frequencyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 600, fill: '#94A3B8' }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 600, fill: '#94A3B8' }}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }}
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                    borderRadius: '16px', 
                    border: 'none',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar dataKey="count" fill="#6366F1" radius={[8, 8, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Mood Flow (Line Chart) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-white dark:bg-[#1A1A1A] p-8 rounded-[2.5rem] border border-gray-100 dark:border-[#2E2E2E] shadow-sm"
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white">Emotional Journey</h3>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={moodFlowData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 600, fill: '#94A3B8' }}
                />
                <YAxis 
                  domain={[0, 5]} 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 600, fill: '#94A3B8' }}
                  ticks={[0, 1, 2, 3, 4, 5]}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                    borderRadius: '16px', 
                    border: 'none',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#8B5CF6" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between mt-4 px-4">
            <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Angry</span>
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Sad</span>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Neutral</span>
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Calm</span>
            <span className="text-[10px] font-bold text-yellow-400 uppercase tracking-widest">Happy</span>
          </div>
        </motion.div>
      </div>

      {/* AI Personal Growth Pattern */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gradient-to-br from-indigo-600 to-purple-700 p-8 rounded-[3rem] text-white shadow-xl shadow-indigo-200 dark:shadow-none overflow-hidden relative"
      >
        <div className="absolute top-0 right-0 p-12 opacity-10">
          <BrainCircuit className="w-64 h-64" />
        </div>
        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 backdrop-blur-md rounded-xl">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-bold">Personal Growth Patterns</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <p className="text-indigo-100 leading-relaxed">
                Based on your recent entries, WinDear Soul has identified a positive shift in your emotional resilience. You are expressing gratitude 40% more often than last month.
              </p>
              <div className="flex flex-wrap gap-2">
                {['Resilience', 'Self-Awareness', 'Gratitude', 'Consistency'].map(tag => (
                  <span key={tag} className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-widest">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-6 rounded-[2rem] border border-white/10">
              <h4 className="text-sm font-bold mb-3 uppercase tracking-widest opacity-80">Soul Reflection</h4>
              <p className="text-sm italic leading-relaxed">
                &quot;You have been consistently showing up for yourself. Even on days when words were few, the act of reflection is building a stronger foundation for your future self.&quot;
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
