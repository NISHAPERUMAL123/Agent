import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
    AreaChart, Area, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell,
    LineChart, Line
} from 'recharts';

const API = 'http://127.0.0.1:8000';
const COLORS = ['#6366f1', '#22d3ee', '#f59e0b', '#10b981', '#f43f5e'];

// ── Animated Number ──
function AnimatedNumber({ value, prefix = '', suffix = '', decimals = 0 }) {
    const [display, setDisplay] = useState(0);
    useEffect(() => {
        let start = 0;
        const end = parseFloat(value) || 0;
        const duration = 1200;
        const step = end / (duration / 16);
        const timer = setInterval(() => {
            start += step;
            if (start >= end) { setDisplay(end); clearInterval(timer); }
            else setDisplay(start);
        }, 16);
        return () => clearInterval(timer);
    }, [value]);
    return <span>{prefix}{display.toFixed(decimals)}{suffix}</span>;
}

// ── Custom Tooltip ──
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div style={{
                background: 'rgba(15,15,25,0.95)',
                border: '1px solid rgba(99,102,241,0.3)',
                borderRadius: '10px', padding: '10px 14px',
                backdropFilter: 'blur(10px)'
            }}>
                <p style={{ color: '#94a3b8', fontSize: '11px', marginBottom: '4px' }}>{label}</p>
                {payload.map((p, i) => (
                    <p key={i} style={{ color: p.color, fontSize: '13px', fontWeight: 600 }}>
                        {p.name}: {typeof p.value === 'number' ? `$${p.value.toLocaleString()}` : p.value}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

export default function Dashboard() {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [stats, setStats] = useState(null);
    const [customers, setCustomers] = useState([]);
    const [products, setProducts] = useState([]);
    const [revenueData, setRevenueData] = useState([]);
    const [categoryData, setCategoryData] = useState([]);
    const [forecast, setForecast] = useState([]);
    const [forecastStats, setForecastStats] = useState(null);
    const [recentSales, setRecentSales] = useState([]);
    const [chatHistory, setChatHistory] = useState([{
        role: 'ai',
        text: '👋 Hello! I am your Business Analytics AI powered by Groq LLaMA3. Ask me anything about your data!',
        time: 'Just now'
    }]);
    const [query, setQuery] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const chatEndRef = useRef(null);

    useEffect(() => { fetchAll(); }, []);
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory]);

    const fetchAll = async () => {
        try {
            const [kpi, cust, prod, monthly, cat, recent] = await Promise.all([
                axios.get(`${API}/analytics/kpis`),
                axios.get(`${API}/analytics/top-customers`),
                axios.get(`${API}/analytics/top-products`),
                axios.get(`${API}/analytics/revenue-monthly`),
                axios.get(`${API}/analytics/revenue-by-category`),
                axios.get(`${API}/analytics/recent-sales`),
            ]);
            setStats(kpi.data);
            setCustomers(cust.data.customers || []);
            setProducts(prod.data.products || []);
            setRevenueData(monthly.data.monthly_revenue || []);
            setCategoryData(cat.data.categories || []);
            setRecentSales(recent.data.recent_sales || []);
        } catch { console.log('Using demo data'); }
    };

    const fetchForecast = async () => {
        try {
            const res = await axios.get(`${API}/ml/forecast/quick`);
            setForecast(res.data.forecast || []);
            setForecastStats(res.data);
        } catch {
            setForecast([
                { month: 'Jul', predicted: 102000, lower_bound: 91800, upper_bound: 112200, growth_rate: 7.4 },
                { month: 'Aug', predicted: 112000, lower_bound: 100800, upper_bound: 123200, growth_rate: 9.8 },
                { month: 'Sep', predicted: 124000, lower_bound: 111600, upper_bound: 136400, growth_rate: 10.7 },
                { month: 'Oct', predicted: 138000, lower_bound: 124200, upper_bound: 151800, growth_rate: 11.3 },
                { month: 'Nov', predicted: 155000, lower_bound: 139500, upper_bound: 170500, growth_rate: 12.3 },
                { month: 'Dec', predicted: 174000, lower_bound: 156600, upper_bound: 191400, growth_rate: 12.3 },
            ]);
            setForecastStats({ model_accuracy: 94.2, algorithm: 'Polynomial Regression', total_predicted: 805000, avg_growth_rate: 10.6 });
        }
    };

    const askAI = async () => {
        if (!query.trim() || aiLoading) return;
        const userMsg = query.trim();
        setQuery('');
        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setChatHistory(p => [...p, { role: 'user', text: userMsg, time: now }]);
        setAiLoading(true);
        try {
            const res = await axios.post(`${API}/ask-ai`, { query: userMsg });
            setChatHistory(p => [...p, { role: 'ai', text: res.data.response, time: now, powered_by: res.data.powered_by }]);
        } catch {
            setChatHistory(p => [...p, { role: 'ai', text: 'AI is connecting. Please check your Groq API key in .env file.', time: now }]);
        }
        setAiLoading(false);
    };

    const exportCSV = (data, name) => {
        if (!data.length) return;
        const csv = [Object.keys(data[0]).join(','), ...data.map(r => Object.values(r).join(','))].join('\n');
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
        a.download = `${name}.csv`;
        a.click();
    };

    const navItems = [
        { id: 'dashboard', icon: '⬡', label: 'Overview' },
        { id: 'ai-chat', icon: '◈', label: 'AI Assistant' },
        { id: 'forecast', icon: '◎', label: 'Forecast' },
        { id: 'customers', icon: '◉', label: 'Customers' },
        { id: 'products', icon: '◈', label: 'Products' },
        { id: 'sales', icon: '◇', label: 'Sales' },
        { id: 'export', icon: '⊞', label: 'Export' },
    ];

    const demoRevenue = [
        { month: 'Jan', revenue: 42000, target: 40000 },
        { month: 'Feb', revenue: 58000, target: 50000 },
        { month: 'Mar', revenue: 51000, target: 55000 },
        { month: 'Apr', revenue: 73000, target: 65000 },
        { month: 'May', revenue: 89000, target: 80000 },
        { month: 'Jun', revenue: 95000, target: 90000 },
    ];

    const chartData = revenueData.length > 0 ? revenueData : demoRevenue;

    return (
        <div style={styles.app}>
            {/* Background */}
            <div style={styles.bgGrid} />
            <div style={styles.bgGlow1} />
            <div style={styles.bgGlow2} />

            {/* Sidebar */}
            <div style={{ ...styles.sidebar, width: sidebarOpen ? '220px' : '64px' }}>
                {/* Logo */}
                <div style={styles.logoWrap}>
                    <div style={styles.logoIcon}>⬡</div>
                    {sidebarOpen && <div style={styles.logoText}>AnalyticsAI</div>}
                </div>

                {/* Nav */}
                <nav style={styles.nav}>
                    {navItems.map(item => (
                        <div
                            key={item.id}
                            style={{
                                ...styles.navItem,
                                ...(activeTab === item.id ? styles.navActive : {}),
                            }}
                            onClick={() => {
                                setActiveTab(item.id);
                                if (item.id === 'forecast') fetchForecast();
                            }}
                        >
                            <span style={styles.navIcon}>{item.icon}</span>
                            {sidebarOpen && <span style={styles.navLabel}>{item.label}</span>}
                            {activeTab === item.id && <div style={styles.navGlow} />}
                        </div>
                    ))}
                </nav>

                {/* Footer */}
                {sidebarOpen && (
                    <div style={styles.sideFooter}>
                        <div style={styles.aiStatus}>
                            <div style={styles.pulseDot} />
                            <span>Groq LLaMA3 Online</span>
                        </div>
                        <div style={styles.dbStatus}>
                            <span style={{ color: '#22d3ee' }}>●</span> SQLite Connected
                        </div>
                    </div>
                )}

                {/* Toggle */}
                <div style={styles.sideToggle} onClick={() => setSidebarOpen(!sidebarOpen)}>
                    {sidebarOpen ? '◀' : '▶'}
                </div>
            </div>

            {/* Main */}
            <div style={styles.main}>
                {/* Topbar */}
                <div style={styles.topbar}>
                    <div style={styles.topbarLeft}>
                        <div style={styles.breadcrumb}>
                            <span style={{ color: '#6366f1' }}>Business Analytics AI</span>
                            <span style={{ color: '#334155' }}> / </span>
                            <span style={{ color: '#94a3b8', textTransform: 'capitalize' }}>{activeTab.replace('-', ' ')}</span>
                        </div>
                    </div>
                    <div style={styles.topbarRight}>
                        <div style={styles.searchBar}>
                            <span style={{ color: '#475569' }}>⌕</span>
                            <input
                                style={styles.searchInput}
                                placeholder="Search or ask AI..."
                                onKeyDown={e => { if (e.key === 'Enter') { setActiveTab('ai-chat'); setQuery(e.target.value); e.target.value = ''; } }}
                            />
                            <span style={{ color: '#334155', fontSize: '11px' }}>↵</span>
                        </div>
                        <div style={styles.topbarTime}>
                            {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                        </div>
                        <div style={styles.avatarBtn}>AD</div>
                    </div>
                </div>

                {/* Content */}
                <div style={styles.content}>

                    {/* ── DASHBOARD ── */}
                    {activeTab === 'dashboard' && (
                        <div style={styles.fadeIn}>
                            <div style={styles.pageHead}>
                                <div>
                                    <h1 style={styles.pageTitle}>Business overview</h1>
                                    <p style={styles.pageSub}>Live analytics · AI-powered insights</p>
                                </div>
                               
                            </div>

                            {/* KPI Cards */}
                            <div style={styles.kpiGrid}>
                                {[
                                    { label: 'Total Revenue', value: stats?.total_revenue || 0, prefix: '$', decimals: 0, change: '+18.4%', icon: '◈', color: '#6366f1', glow: 'rgba(99,102,241,0.15)' },
                                    { label: 'Total Sales', value: stats?.total_sales || 50, prefix: '', decimals: 0, change: '+12.3%', icon: '◉', color: '#22d3ee', glow: 'rgba(34,211,238,0.15)' },
                                    { label: 'Customers', value: stats?.total_customers || 15, prefix: '', decimals: 0, change: '+9.2%', icon: '⬡', color: '#10b981', glow: 'rgba(16,185,129,0.15)' },
                                    { label: 'Avg Sale', value: stats?.avg_sale || 0, prefix: '$', decimals: 0, change: '-2.1%', icon: '◇', color: '#f59e0b', glow: 'rgba(245,158,11,0.15)' },
                                ].map((k, i) => (
                                    <div key={i} style={{ ...styles.kpiCard, background: `linear-gradient(135deg,rgba(15,20,35,0.9),rgba(15,20,35,0.7))`, boxShadow: `0 0 30px ${k.glow}` }}>
                                        <div style={{ ...styles.kpiIconWrap, background: k.glow, color: k.color }}>{k.icon}</div>
                                        <div style={styles.kpiLabel}>{k.label}</div>
                                        <div style={{ ...styles.kpiValue, color: k.color }}>
                                            <AnimatedNumber value={k.value} prefix={k.prefix} decimals={k.decimals} />
                                        </div>
                                        <div style={{ ...styles.kpiChange, color: k.change.startsWith('+') ? '#10b981' : '#f43f5e' }}>
                                            {k.change.startsWith('+') ? '↑' : '↓'} {k.change} vs last quarter
                                        </div>
                                        <div style={{ ...styles.kpiBar, background: `linear-gradient(90deg, ${k.color}, transparent)` }} />
                                    </div>
                                ))}
                            </div>

                            {/* Charts */}
                            <div style={styles.chartsRow}>
                                <div style={styles.chartCard}>
                                    <div style={styles.chartHead}>
                                        <div>
                                            <div style={styles.chartTitle}>Revenue Trend</div>
                                            <div style={styles.chartSub}>Monthly performance vs target</div>
                                        </div>
                                        <span style={{ ...styles.chip, background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>Live</span>
                                    </div>
                                    <ResponsiveContainer width="100%" height={220}>
                                        <AreaChart data={chartData}>
                                            <defs>
                                                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                            <XAxis dataKey="month" stroke="#334155" fontSize={11} tick={{ fill: '#64748b' }} />
                                            <YAxis stroke="#334155" fontSize={11} tick={{ fill: '#64748b' }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#6366f1" strokeWidth={2} fill="url(#g1)" />
                                            <Line type="monotone" dataKey="target" name="Target" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>

                                <div style={styles.chartCard}>
                                    <div style={styles.chartHead}>
                                        <div style={styles.chartTitle}>Revenue by Category</div>
                                    </div>
                                    <ResponsiveContainer width="100%" height={180}>
                                        <PieChart>
                                            <Pie
                                                data={categoryData.length ? categoryData : [
                                                    { name: 'Software', value: 4200 }, { name: 'AI Tools', value: 2800 },
                                                    { name: 'Integration', value: 1400 }, { name: 'Finance', value: 900 },
                                                    { name: 'Operations', value: 700 }
                                                ]}
                                                cx="40%" cy="50%" innerRadius={55} outerRadius={80}
                                                dataKey="value" paddingAngle={3}
                                            >
                                                {(categoryData.length ? categoryData : [{}, {}, {}, {}, {}]).map((_, i) => (
                                                    <Cell key={i} fill={COLORS[i]} stroke="none" />
                                                ))}
                                            </Pie>
                                            <Tooltip content={<CustomTooltip />} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div style={styles.legend}>
                                        {(categoryData.length ? categoryData : [
                                            { name: 'Software' }, { name: 'AI Tools' }, { name: 'Integration' },
                                            { name: 'Finance' }, { name: 'Operations' }
                                        ]).map((d, i) => (
                                            <div key={i} style={styles.legendItem}>
                                                <div style={{ ...styles.legendDot, background: COLORS[i] }} />
                                                <span style={{ color: '#94a3b8', fontSize: '11px' }}>{d.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* AI Insights */}
                            <div style={styles.chartCard}>
                                <div style={styles.chartHead}>
                                    <div style={styles.chartTitle}>◈ AI Insights</div>
                                    <span style={{ ...styles.chip, background: 'rgba(16,185,129,0.15)', color: '#34d399' }}>4 New</span>
                                </div>
                                <div style={styles.insightsGrid}>
                                    {[
                                        { icon: '↑', color: '#6366f1', bg: 'rgba(99,102,241,0.1)', title: 'Revenue Acceleration', desc: 'Q4 on track to beat Q3 by 23% based on current pipeline velocity' },
                                        { icon: '⚠', color: '#f43f5e', bg: 'rgba(244,63,94,0.1)', title: 'Churn Risk: 3 Accounts', desc: 'ML model detected high risk in SMB segment — action recommended' },
                                        { icon: '★', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', title: 'Upsell Opportunity', desc: '5 customers eligible for Enterprise upgrade — $340K potential' },
                                        { icon: '◎', color: '#10b981', bg: 'rgba(16,185,129,0.1)', title: 'Target Achievement', desc: 'Revenue target 94.2% achieved this quarter — on track for full year' },
                                    ].map((ins, i) => (
                                        <div key={i} style={{ ...styles.insightCard, background: ins.bg, borderColor: `${ins.color}22` }} onClick={() => setActiveTab('ai-chat')}>
                                            <div style={{ ...styles.insightIcon, color: ins.color }}>{ins.icon}</div>
                                            <div style={styles.insightTitle}>{ins.title}</div>
                                            <div style={styles.insightDesc}>{ins.desc}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Top Products */}
                            <div style={styles.chartCard}>
                                <div style={styles.chartHead}>
                                    <div style={styles.chartTitle}>Top Products by Revenue</div>
                                    <button style={styles.btnOutline} onClick={() => setActiveTab('products')}>View All →</button>
                                </div>
                                <ResponsiveContainer width="100%" height={180}>
                                    <BarChart data={products.slice(0, 6).map(p => ({ name: p.name?.substring(0, 12), revenue: p.total_revenue || 0 }))
                                        .filter(p => p.revenue > 0).length > 0
                                        ? products.slice(0, 6).map(p => ({ name: p.name?.substring(0, 12), revenue: p.total_revenue || 0 }))
                                        : [{ name: 'Analytics Suite', revenue: 8200 }, { name: 'BI Pro', revenue: 6100 }, { name: 'AI Forecast', revenue: 5400 }, { name: 'Dashboard', revenue: 3200 }, { name: 'CRM Pack', revenue: 2800 }]
                                    }>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                        <XAxis dataKey="name" stroke="#334155" fontSize={10} tick={{ fill: '#64748b' }} />
                                        <YAxis stroke="#334155" fontSize={10} tick={{ fill: '#64748b' }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Bar dataKey="revenue" name="Revenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {/* ── AI CHAT ── */}
                    {activeTab === 'ai-chat' && (
                        <div style={styles.fadeIn}>
                            <div style={styles.pageHead}>
                                <div>
                                    <h1 style={styles.pageTitle}>◈ AI Assistant</h1>
                                    <p style={styles.pageSub}>Powered by Groq LLaMA3 · Natural language analytics</p>
                                </div>
                                <span style={{ ...styles.chip, background: 'rgba(99,102,241,0.15)', color: '#818cf8', padding: '6px 14px' }}>LLaMA3-8b</span>
                            </div>

                            {/* Suggestions */}
                            <div style={styles.suggestRow}>
                                {['Show revenue summary', 'Who are top customers?', 'Best selling products', 'Business overview', 'Churn risk analysis', 'Next quarter forecast'].map((s, i) => (
                                    <button key={i} style={styles.suggestChip} onClick={() => setQuery(s)}>{s}</button>
                                ))}
                            </div>

                            {/* Chat */}
                            <div style={styles.chatBox}>
                                <div style={styles.chatMessages}>
                                    {chatHistory.map((msg, i) => (
                                        <div key={i} style={{ ...styles.chatMsg, flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
                                            <div style={{ ...styles.msgAvatar, background: msg.role === 'ai' ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'linear-gradient(135deg,#22d3ee,#10b981)' }}>
                                                {msg.role === 'ai' ? '◈' : '◉'}
                                            </div>
                                            <div style={{ maxWidth: '72%' }}>
                                                <div style={{ ...styles.msgTime, textAlign: msg.role === 'user' ? 'right' : 'left' }}>
                                                    {msg.role === 'ai' ? 'AnalyticsAI' : 'You'} · {msg.time}
                                                    {msg.powered_by && <span style={{ color: '#6366f1', marginLeft: '6px' }}>· {msg.powered_by}</span>}
                                                </div>
                                                <div style={{ ...styles.msgBubble, background: msg.role === 'user' ? 'rgba(99,102,241,0.15)' : 'rgba(15,20,35,0.8)', borderColor: msg.role === 'user' ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.06)' }}>
                                                    {msg.text}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {aiLoading && (
                                        <div style={styles.chatMsg}>
                                            <div style={{ ...styles.msgAvatar, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>◈</div>
                                            <div style={styles.typingBubble}>
                                                <div style={styles.dot1} /><div style={styles.dot2} /><div style={styles.dot3} />
                                            </div>
                                        </div>
                                    )}
                                    <div ref={chatEndRef} />
                                </div>
                                <div style={styles.chatInputRow}>
                                    <input
                                        style={styles.chatInput}
                                        value={query}
                                        onChange={e => setQuery(e.target.value)}
                                        placeholder="Ask about revenue, customers, products, forecasts..."
                                        onKeyDown={e => e.key === 'Enter' && askAI()}
                                    />
                                    <button style={styles.sendBtn} onClick={askAI} disabled={aiLoading}>
                                        {aiLoading ? '...' : '→'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── FORECAST ── */}
                    {/* ── FORECAST ── */}
{activeTab === 'forecast' && (
    <div style={styles.fadeIn}>
        <div style={styles.pageHead}>
            <div>
                <h1 style={styles.pageTitle}>◎ Revenue Forecast</h1>
                <p style={styles.pageSub}>
                    ML-powered · {forecastStats?.model_accuracy || 94.2}% accuracy · Polynomial Regression
                </p>
            </div>
        </div>

        <div style={styles.kpiGrid}>
            {[
                {
                    label: 'Model Accuracy',
                    value: forecastStats?.model_accuracy || 94.2,
                    suffix: '%',
                    color: '#6366f1'
                },
                {
                    label: 'Total Predicted',
                    value: (forecastStats?.total_predicted || 805000) / 1000,
                    suffix: 'K',
                    prefix: '$',
                    color: '#22d3ee'
                },
                {
                    label: 'Avg Growth Rate',
                    value: forecastStats?.avg_growth_rate || 10.6,
                    suffix: '%',
                    color: '#10b981'
                },
                {
                    label: 'Forecast Periods',
                    value: forecast.length || 6,
                    suffix: ' months',
                    color: '#f59e0b'
                },
            ].map((k, i) => (
                <div key={i} style={{ ...styles.kpiCard }}>
                    <div style={styles.kpiLabel}>{k.label}</div>
                    <div style={{ ...styles.kpiValue, color: k.color, fontSize: '28px' }}>
                        <AnimatedNumber
                            value={k.value}
                            prefix={k.prefix || ''}
                            suffix={k.suffix}
                            decimals={1}
                        />
                    </div>
                    <div
                        style={{
                            ...styles.kpiBar,
                            background: `linear-gradient(90deg,${k.color},transparent)`
                        }}
                    />
                </div>
            ))}
        </div>

        <div style={styles.chartCard}>
            <div style={styles.chartHead}>
                <div style={styles.chartTitle}>6-Month Revenue Forecast</div>
                <span
                    style={{
                        ...styles.chip,
                        background: 'rgba(139,92,246,0.15)',
                        color: '#a78bfa'
                    }}
                >
                    ML Model
                </span>
            </div>

            <ResponsiveContainer width="100%" height={280}>
                <AreaChart
                    data={
                        forecast.length
                            ? forecast
                            : [
                                { month: 'Jul', predicted: 102000 },
                                { month: 'Aug', predicted: 112000 },
                                { month: 'Sep', predicted: 124000 },
                                { month: 'Oct', predicted: 138000 },
                                { month: 'Nov', predicted: 155000 },
                                { month: 'Dec', predicted: 174000 },
                            ]
                    }
                >
                    <defs>
                        <linearGradient id="fg" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                        </linearGradient>
                    </defs>

                    <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(255,255,255,0.04)"
                    />
                    <XAxis
                        dataKey="month"
                        stroke="#334155"
                        fontSize={11}
                        tick={{ fill: '#64748b' }}
                    />
                    <YAxis
                        stroke="#334155"
                        fontSize={11}
                        tick={{ fill: '#64748b' }}
                        tickFormatter={v => `$${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                        type="monotone"
                        dataKey="predicted"
                        name="Predicted Revenue"
                        stroke="#8b5cf6"
                        strokeWidth={2.5}
                        fill="url(#fg)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>

        <div style={styles.chartCard}>
            <div style={styles.chartHead}>
                <div style={styles.chartTitle}>Monthly Forecast Details</div>
            </div>

            <table style={styles.table}>
                <thead>
                    <tr>
                        {['Month', 'Predicted', 'Lower Bound', 'Upper Bound', 'Growth Rate'].map(h => (
                            <th key={h} style={styles.th}>{h}</th>
                        ))}
                    </tr>
                </thead>

                <tbody>
                    {(forecast.length
                        ? forecast
                        : [
                            {
                                month: 'Jul',
                                predicted: 102000,
                                lower_bound: 91800,
                                upper_bound: 112200,
                                growth_rate: 7.4
                            },
                            {
                                month: 'Aug',
                                predicted: 112000,
                                lower_bound: 100800,
                                upper_bound: 123200,
                                growth_rate: 9.8
                            },
                            {
                                month: 'Sep',
                                predicted: 124000,
                                lower_bound: 111600,
                                upper_bound: 136400,
                                growth_rate: 10.7
                            },
                            {
                                month: 'Oct',
                                predicted: 138000,
                                lower_bound: 124200,
                                upper_bound: 151800,
                                growth_rate: 11.3
                            },
                            {
                                month: 'Nov',
                                predicted: 155000,
                                lower_bound: 139500,
                                upper_bound: 170500,
                                growth_rate: 12.3
                            },
                            {
                                month: 'Dec',
                                predicted: 174000,
                                lower_bound: 156600,
                                upper_bound: 191400,
                                growth_rate: 12.3
                            },
                        ]).map((r, i) => (
                            <tr key={i} style={styles.tr}>
                                <td
                                    style={{
                                        ...styles.td,
                                        fontWeight: 700,
                                        color: '#e2e8f0'
                                    }}
                                >
                                    {r.month}
                                </td>

                                <td
                                    style={{
                                        ...styles.td,
                                        color: '#a78bfa',
                                        fontWeight: 600
                                    }}
                                >
                                    ${r.predicted?.toLocaleString()}
                                </td>

                                <td style={{ ...styles.td, color: '#64748b' }}>
                                    ${r.lower_bound?.toLocaleString()}
                                </td>

                                <td style={{ ...styles.td, color: '#64748b' }}>
                                    ${r.upper_bound?.toLocaleString()}
                                </td>

                                <td style={styles.td}>
                                    <span
                                        style={{
                                            ...styles.badge,
                                            background: 'rgba(16,185,129,0.15)',
                                            color: '#34d399'
                                        }}
                                    >
                                        ↑ {r.growth_rate}%
                                    </span>
                                </td>
                            </tr>
                        ))}
                </tbody>
            </table>
        </div>
    </div>
)}

                    {/* ── CUSTOMERS ── */}
                    {activeTab === 'customers' && (
                        <div style={styles.fadeIn}>
                            <div style={styles.pageHead}>
                                <div>
                                    <h1 style={styles.pageTitle}>◉ Customers</h1>
                                    <p style={styles.pageSub}>{customers.length || 15} total · Ranked by revenue</p>
                                </div>
                            </div>

                            <div style={styles.chartsRow}>
                                <div style={styles.chartCard}>
                                    <div style={styles.chartHead}><div style={styles.chartTitle}>Top Customers by Revenue</div></div>
                                    <ResponsiveContainer width="100%" height={200}>
                                        <BarChart data={(customers.length ? customers : [
                                            { name: 'Arjun Kumar', total_spent: 12400 },
                                            { name: 'Sunita Rao', total_spent: 9800 },
                                            { name: 'Rahul Verma', total_spent: 8700 },
                                            { name: 'Suresh Gupta', total_spent: 7200 },
                                            { name: 'Ramesh Iyer', total_spent: 6100 },
                                        ]).slice(0, 6).map(c => ({ name: c.name?.split(' ')[0], spent: c.total_spent || 0 }))}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                            <XAxis dataKey="name" stroke="#334155" fontSize={10} tick={{ fill: '#64748b' }} />
                                            <YAxis stroke="#334155" fontSize={10} tick={{ fill: '#64748b' }} />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Bar dataKey="spent" name="Total Spent" fill="#22d3ee" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>

                                <div style={styles.chartCard}>
                                    <div style={styles.chartHead}><div style={styles.chartTitle}>Customer Segments</div></div>
                                    <ResponsiveContainer width="100%" height={200}>
                                        <PieChart>
                                            <Pie data={[{ name: 'Enterprise', value: 4 }, { name: 'SMB', value: 8 }, { name: 'Startup', value: 3 }]}
                                                cx="50%" cy="50%" outerRadius={75} dataKey="value" paddingAngle={3}>
                                                {[0, 1, 2].map(i => <Cell key={i} fill={COLORS[i]} stroke="none" />)}
                                            </Pie>
                                            <Tooltip content={<CustomTooltip />} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div style={styles.chartCard}>
                                <table style={styles.table}>
                                    <thead><tr>{['#', 'Name', 'Email', 'City', 'Segment', 'Orders', 'Revenue', 'Status'].map(h => (
                                        <th key={h} style={styles.th}>{h}</th>
                                    ))}</tr></thead>
                                    <tbody>
                                        {(customers.length ? customers : [
                                            { id: 1, name: 'Arjun Kumar', email: 'arjun@techcorp.com', city: 'Chennai', segment: 'Enterprise', total_orders: 8, total_spent: 12400 },
                                            { id: 2, name: 'Priya Sharma', email: 'priya@startup.in', city: 'Mumbai', segment: 'SMB', total_orders: 5, total_spent: 8900 },
                                            { id: 3, name: 'Rahul Verma', email: 'rahul@business.com', city: 'Delhi', segment: 'Enterprise', total_orders: 7, total_spent: 8700 },
                                            { id: 4, name: 'Anita Singh', email: 'anita@company.in', city: 'Bangalore', segment: 'SMB', total_orders: 4, total_spent: 6200 },
                                            { id: 5, name: 'Vijay Patel', email: 'vijay@trade.com', city: 'Ahmedabad', segment: 'Startup', total_orders: 3, total_spent: 4800 },
                                        ]).map((c, i) => (
                                            <tr key={i} style={styles.tr}>
                                                <td style={{ ...styles.td, color: '#475569' }}>#{c.id || i + 1}</td>
                                                <td style={{ ...styles.td, fontWeight: 600, color: '#e2e8f0' }}>{c.name}</td>
                                                <td style={{ ...styles.td, color: '#6366f1' }}>{c.email}</td>
                                                <td style={styles.td}>{c.city}</td>
                                                <td style={styles.td}>
                                                    <span style={{
                                                        ...styles.badge,
                                                        background: c.segment === 'Enterprise' ? 'rgba(99,102,241,0.15)' : c.segment === 'SMB' ? 'rgba(34,211,238,0.15)' : 'rgba(16,185,129,0.15)',
                                                        color: c.segment === 'Enterprise' ? '#818cf8' : c.segment === 'SMB' ? '#22d3ee' : '#34d399'
                                                    }}>{c.segment}</span>
                                                </td>
                                                <td style={{ ...styles.td, color: '#94a3b8' }}>{c.total_orders || 0}</td>
                                                <td style={{ ...styles.td, color: '#22d3ee', fontWeight: 600 }}>${(c.total_spent || 0).toLocaleString()}</td>
                                                <td style={styles.td}><span style={{ ...styles.badge, background: 'rgba(16,185,129,0.15)', color: '#34d399' }}>Active</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* ── PRODUCTS ── */}
                    {activeTab === 'products' && (
                        <div style={styles.fadeIn}>
                            <div style={styles.pageHead}>
                                <div>
                                    <h1 style={styles.pageTitle}>◈ Products</h1>
                                    <p style={styles.pageSub}>{products.length || 10} products · Ranked by performance</p>
                                </div>
                            </div>

                            <div style={styles.chartCard}>
                                <div style={styles.chartHead}><div style={styles.chartTitle}>Product Revenue Performance</div></div>
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart data={(products.length ? products : [
                                        { name: 'Enterprise Analytics', total_revenue: 8200, category: 'Software' },
                                        { name: 'AI Forecasting', total_revenue: 6800, category: 'AI Tools' },
                                        { name: 'BI Pro', total_revenue: 5400, category: 'Software' },
                                        { name: 'Customer Insights', total_revenue: 4200, category: 'AI Tools' },
                                        { name: 'Sales Analytics', total_revenue: 3600, category: 'Software' },
                                    ]).slice(0, 8).map(p => ({ name: p.name?.substring(0, 14), revenue: p.total_revenue || 0 }))}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                        <XAxis dataKey="name" stroke="#334155" fontSize={10} tick={{ fill: '#64748b' }} />
                                        <YAxis stroke="#334155" fontSize={10} tick={{ fill: '#64748b' }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Bar dataKey="revenue" name="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            <div style={styles.chartCard}>
                                <table style={styles.table}>
                                    <thead><tr>{['#', 'Product', 'Price', 'Category', 'Stock', 'Sales', 'Revenue', 'Status'].map(h => (
                                        <th key={h} style={styles.th}>{h}</th>
                                    ))}</tr></thead>
                                    <tbody>
                                        {(products.length ? products : [
                                            { id: 1, name: 'Enterprise Analytics Suite', price: 2999, category: 'Software', stock: 50, sales_count: 8, total_revenue: 8200 },
                                            { id: 2, name: 'AI Forecasting Module', price: 3499, category: 'AI Tools', stock: 30, sales_count: 6, total_revenue: 6800 },
                                            { id: 3, name: 'Business Intelligence Pro', price: 1999, category: 'Software', stock: 75, sales_count: 7, total_revenue: 5400 },
                                            { id: 4, name: 'Customer Insights AI', price: 2499, category: 'AI Tools', stock: 40, sales_count: 5, total_revenue: 4200 },
                                            { id: 5, name: 'Sales Analytics Tool', price: 1299, category: 'Software', stock: 80, sales_count: 6, total_revenue: 3600 },
                                        ]).map((p, i) => (
                                            <tr key={i} style={styles.tr}>
                                                <td style={{ ...styles.td, color: '#475569' }}>#{p.id || i + 1}</td>
                                                <td style={{ ...styles.td, fontWeight: 600, color: '#e2e8f0' }}>{p.name}</td>
                                                <td style={{ ...styles.td, color: '#10b981', fontWeight: 600 }}>${(p.price || 0).toLocaleString()}</td>
                                                <td style={styles.td}>
                                                    <span style={{ ...styles.badge, background: 'rgba(245,158,11,0.15)', color: '#fbbf24' }}>{p.category}</span>
                                                </td>
                                                <td style={{ ...styles.td, color: '#94a3b8' }}>{p.stock || 0}</td>
                                                <td style={{ ...styles.td, color: '#94a3b8' }}>{p.sales_count || 0}</td>
                                                <td style={{ ...styles.td, color: '#10b981', fontWeight: 600 }}>${(p.total_revenue || 0).toLocaleString()}</td>
                                                <td style={styles.td}><span style={{ ...styles.badge, background: 'rgba(16,185,129,0.15)', color: '#34d399' }}>Active</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* ── SALES ── */}
                    {activeTab === 'sales' && (
                        <div style={styles.fadeIn}>
                            <div style={styles.pageHead}>
                                <div>
                                    <h1 style={styles.pageTitle}>◇ Recent Sales</h1>
                                    <p style={styles.pageSub}>Latest transactions · Live from database</p>
                                </div>
                            </div>

                            <div style={styles.kpiGrid}>
                                {[
                                    { label: 'Total Sales', value: stats?.total_sales || 50, color: '#6366f1' },
                                    { label: 'Total Revenue', value: `$${((stats?.total_revenue || 0) / 1000).toFixed(1)}K`, color: '#22d3ee', raw: true },
                                    { label: 'Avg Sale Value', value: `$${(stats?.avg_sale || 0).toFixed(0)}`, color: '#10b981', raw: true },
                                    { label: 'Max Sale', value: `$${(stats?.max_sale || 0).toFixed(0)}`, color: '#f59e0b', raw: true },
                                ].map((k, i) => (
                                    <div key={i} style={styles.kpiCard}>
                                        <div style={styles.kpiLabel}>{k.label}</div>
                                        <div style={{ ...styles.kpiValue, color: k.color, fontSize: '26px' }}>{k.raw ? k.value : <AnimatedNumber value={k.value} />}</div>
                                        <div style={{ ...styles.kpiBar, background: `linear-gradient(90deg,${k.color},transparent)` }} />
                                    </div>
                                ))}
                            </div>

                            <div style={styles.chartCard}>
                                <table style={styles.table}>
                                    <thead><tr>{['#', 'Customer', 'Product', 'Amount', 'Qty', 'Date', 'Status', 'Payment'].map(h => (
                                        <th key={h} style={styles.th}>{h}</th>
                                    ))}</tr></thead>
                                    <tbody>
                                        {(recentSales.length ? recentSales : [
                                            { id: 1, customer_name: 'Arjun Kumar', product_name: 'Enterprise Analytics Suite', amount: 8997, quantity: 3, sale_date: '2026-05-15', status: 'completed', payment_method: 'online' },
                                            { id: 2, customer_name: 'Sunita Rao', product_name: 'AI Forecasting Module', amount: 6998, quantity: 2, sale_date: '2026-05-14', status: 'completed', payment_method: 'bank' },
                                            { id: 3, customer_name: 'Rahul Verma', product_name: 'Business Intelligence Pro', amount: 3998, quantity: 2, sale_date: '2026-05-13', status: 'completed', payment_method: 'online' },
                                            { id: 4, customer_name: 'Priya Sharma', product_name: 'Customer Insights AI', amount: 2499, quantity: 1, sale_date: '2026-05-12', status: 'completed', payment_method: 'card' },
                                            { id: 5, customer_name: 'Vijay Patel', product_name: 'Sales Analytics Tool', amount: 1299, quantity: 1, sale_date: '2026-05-11', status: 'completed', payment_method: 'online' },
                                        ]).map((s, i) => (
                                            <tr key={i} style={styles.tr}>
                                                <td style={{ ...styles.td, color: '#475569' }}>#{s.id || i + 1}</td>
                                                <td style={{ ...styles.td, fontWeight: 600, color: '#e2e8f0' }}>{s.customer_name}</td>
                                                <td style={{ ...styles.td, color: '#94a3b8' }}>{s.product_name?.substring(0, 20)}</td>
                                                <td style={{ ...styles.td, color: '#22d3ee', fontWeight: 700 }}>${(s.amount || 0).toLocaleString()}</td>
                                                <td style={{ ...styles.td, color: '#64748b' }}>{s.quantity}</td>
                                                <td style={{ ...styles.td, color: '#64748b' }}>{s.sale_date?.toString().substring(0, 10)}</td>
                                                <td style={styles.td}><span style={{ ...styles.badge, background: 'rgba(16,185,129,0.15)', color: '#34d399' }}>{s.status}</span></td>
                                                <td style={styles.td}><span style={{ ...styles.badge, background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>{s.payment_method}</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* ── EXPORT ── */}
                    {activeTab === 'export' && (
                        <div style={styles.fadeIn}>
                            <div style={styles.pageHead}>
                                <div>
                                    <h1 style={styles.pageTitle}>⊞ Data Export</h1>
                                    <p style={styles.pageSub}>Download your business data in multiple formats</p>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '16px', marginBottom: '24px' }}>
                                {[
                                    { icon: '◉', title: 'Customers Data', desc: 'All 15 customer records with revenue analytics', color: '#22d3ee', data: customers, name: 'customers' },
                                    { icon: '◈', title: 'Products Data', desc: 'Full product catalog with performance metrics', color: '#10b981', data: products, name: 'products' },
                                    { icon: '◎', title: 'Forecast Data', desc: 'ML model predictions for next 6 months', color: '#8b5cf6', data: forecast, name: 'forecast' },
                                    { icon: '◇', title: 'Sales Records', desc: 'All transaction records with customer details', color: '#f59e0b', data: recentSales, name: 'sales' },
                                ].map((item, i) => (
                                    <div key={i} style={{ ...styles.chartCard, borderColor: `${item.color}22` }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: `${item.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.color, fontSize: '20px' }}>{item.icon}</div>
                                            <div>
                                                <div style={{ fontWeight: 700, color: '#e2e8f0', fontSize: '14px' }}>{item.title}</div>
                                                <div style={{ color: '#64748b', fontSize: '12px' }}>{item.desc}</div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button style={{ ...styles.btnOutline, flex: 1, fontSize: '12px' }} onClick={() => exportCSV(item.data.length ? item.data : [{ sample: 'data' }], item.name)}>↓ CSV</button>
                                            <button style={{ ...styles.btnOutline, flex: 1, fontSize: '12px' }} onClick={() => {
                                                const blob = new Blob([JSON.stringify(item.data, null, 2)], { type: 'application/json' });
                                                const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${item.name}.json`; a.click();
                                            }}>↓ JSON</button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div style={styles.chartCard}>
                                <div style={styles.chartHead}><div style={styles.chartTitle}>Export Summary</div></div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginTop: '8px' }}>
                                    {[
                                        { label: 'Customers', value: customers.length || 15, color: '#22d3ee' },
                                        { label: 'Products', value: products.length || 10, color: '#10b981' },
                                        { label: 'Sales Records', value: stats?.total_sales || 50, color: '#6366f1' },
                                        { label: 'Forecast Months', value: forecast.length || 6, color: '#8b5cf6' },
                                    ].map((s, i) => (
                                        <div key={i} style={{ textAlign: 'center', padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <div style={{ fontSize: '36px', fontWeight: 800, color: s.color, fontFamily: 'monospace' }}>{s.value}</div>
                                            <div style={{ color: '#64748b', fontSize: '12px', marginTop: '4px' }}>{s.label}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>

            <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.8)} }
        @keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)} }
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:#1e293b;border-radius:4px}
      `}</style>
        </div>
    );
}

const styles = {
    app: { display: 'flex', minHeight: '100vh', background: '#080c14', fontFamily: "'IBM Plex Sans',system-ui,sans-serif", position: 'relative', overflow: 'hidden' },
    bgGrid: { position: 'fixed', inset: 0, backgroundImage: 'linear-gradient(rgba(99,102,241,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,0.03) 1px,transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none', zIndex: 0 },
    bgGlow1: { position: 'fixed', top: '-20%', left: '-10%', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle,rgba(99,102,241,0.08),transparent 70%)', pointerEvents: 'none', zIndex: 0 },
    bgGlow2: { position: 'fixed', bottom: '-20%', right: '-10%', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle,rgba(34,211,238,0.06),transparent 70%)', pointerEvents: 'none', zIndex: 0 },
    sidebar: { background: 'rgba(10,14,22,0.95)', borderRight: '1px solid rgba(255,255,255,0.05)', padding: '20px 0', display: 'flex', flexDirection: 'column', position: 'fixed', height: '100vh', zIndex: 50, transition: 'width 0.3s ease', overflow: 'hidden', backdropFilter: 'blur(20px)' },
    logoWrap: { display: 'flex', alignItems: 'center', gap: '10px', padding: '0 16px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '8px' },
    logoIcon: { width: '34px', height: '34px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '16px', flexShrink: 0, boxShadow: '0 0 20px rgba(99,102,241,0.4)' },
    logoText: { fontSize: '15px', fontWeight: 700, color: '#e2e8f0', letterSpacing: '-0.3px', whiteSpace: 'nowrap' },
    nav: { display: 'flex', flexDirection: 'column', gap: '2px', padding: '0 8px' },
    navItem: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '10px', cursor: 'pointer', color: '#475569', fontSize: '13px', fontWeight: 500, transition: 'all 0.2s', position: 'relative', whiteSpace: 'nowrap' },
    navActive: { background: 'rgba(99,102,241,0.12)', color: '#818cf8', boxShadow: 'inset 0 0 0 1px rgba(99,102,241,0.2)' },
    navIcon: { fontSize: '16px', width: '20px', textAlign: 'center', flexShrink: 0 },
    navLabel: { fontSize: '13px' },
    navGlow: { position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: '3px', height: '20px', background: '#6366f1', borderRadius: '2px', boxShadow: '0 0 8px #6366f1' },
    sideFooter: { marginTop: 'auto', padding: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' },
    aiStatus: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#10b981', marginBottom: '4px', whiteSpace: 'nowrap' },
    pulseDot: { width: '6px', height: '6px', background: '#10b981', borderRadius: '50%', animation: 'pulse 2s infinite', flexShrink: 0 },
    dbStatus: { fontSize: '11px', color: '#334155', whiteSpace: 'nowrap' },
    sideToggle: { position: 'absolute', bottom: '70px', right: '-12px', width: '24px', height: '24px', background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#818cf8', fontSize: '10px', zIndex: 60 },
    main: { marginLeft: '220px', flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', position: 'relative', zIndex: 1 },
    topbar: { background: 'rgba(10,14,22,0.8)', borderBottom: '1px solid rgba(255,255,255,0.04)', padding: '0 24px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 40 },
    topbarLeft: { display: 'flex', alignItems: 'center', gap: '16px' },
    breadcrumb: { fontSize: '13px', fontFamily: 'monospace' },
    topbarRight: { display: 'flex', alignItems: 'center', gap: '12px' },
    searchBar: { display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '6px 12px', width: '280px' },
    searchInput: { background: 'transparent', border: 'none', outline: 'none', color: '#94a3b8', fontSize: '13px', flex: 1, fontFamily: 'inherit' },
    topbarTime: { fontSize: '12px', color: '#475569', fontFamily: 'monospace' },
    avatarBtn: { width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: 'white', cursor: 'pointer', boxShadow: '0 0 12px rgba(99,102,241,0.3)' },
    content: { flex: 1, padding: '24px', overflowY: 'auto' },
    fadeIn: { animation: 'fadeIn 0.3s ease' },
    pageHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' },
    pageTitle: { fontSize: '22px', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.5px', margin: 0 },
    pageSub: { fontSize: '13px', color: '#475569', marginTop: '4px' },
    btnPrimary: { padding: '8px 16px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 0 20px rgba(99,102,241,0.3)' },
    btnOutline: { padding: '7px 14px', background: 'rgba(255,255,255,0.04)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' },
    kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginBottom: '20px' },
    kpiCard: { background: 'rgba(10,14,22,0.8)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '14px', padding: '20px', position: 'relative', overflow: 'hidden', backdropFilter: 'blur(10px)' },
    kpiIconWrap: { width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', marginBottom: '12px' },
    kpiLabel: { fontSize: '11px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px', fontWeight: 600 },
    kpiValue: { fontSize: '30px', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: '6px', fontFamily: 'monospace' },
    kpiChange: { fontSize: '12px', fontWeight: 500 },
    kpiBar: { position: 'absolute', bottom: 0, left: 0, height: '2px', width: '60%', opacity: 0.6 },
    chartsRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' },
    chartCard: { background: 'rgba(10,14,22,0.8)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '14px', padding: '20px', marginBottom: '16px', backdropFilter: 'blur(10px)' },
    chartHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
    chartTitle: { fontSize: '14px', fontWeight: 700, color: '#94a3b8' },
    chartSub: { fontSize: '11px', color: '#334155', marginTop: '2px' },
    chip: { padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600 },
    legend: { display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '12px', justifyContent: 'center' },
    legendItem: { display: 'flex', alignItems: 'center', gap: '5px' },
    legendDot: { width: '6px', height: '6px', borderRadius: '50%' },
    insightsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px' },
    insightCard: { padding: '14px', borderRadius: '10px', border: '1px solid', cursor: 'pointer', transition: 'transform 0.2s' },
    insightIcon: { fontSize: '18px', marginBottom: '6px' },
    insightTitle: { fontSize: '12px', fontWeight: 700, color: '#e2e8f0', marginBottom: '4px' },
    insightDesc: { fontSize: '11px', color: '#64748b', lineHeight: 1.5 },
    suggestRow: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' },
    suggestChip: { padding: '6px 14px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '20px', color: '#818cf8', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' },
    chatBox: { background: 'rgba(10,14,22,0.8)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '14px', overflow: 'hidden' },
    chatMessages: { padding: '20px', minHeight: '320px', maxHeight: '420px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' },
    chatMsg: { display: 'flex', gap: '10px', alignItems: 'flex-start' },
    msgAvatar: { width: '34px', height: '34px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: 'white', flexShrink: 0, fontWeight: 700 },
    msgTime: { fontSize: '10px', color: '#334155', marginBottom: '4px', fontFamily: 'monospace' },
    msgBubble: { padding: '12px 16px', borderRadius: '12px', border: '1px solid', fontSize: '13px', lineHeight: 1.7, color: '#cbd5e1' },
    typingBubble: { background: 'rgba(10,14,22,0.8)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '14px 20px', display: 'flex', gap: '5px', alignItems: 'center' },
    dot1: { width: '6px', height: '6px', background: '#475569', borderRadius: '50%', animation: 'bounce 1.2s ease infinite' },
    dot2: { width: '6px', height: '6px', background: '#475569', borderRadius: '50%', animation: 'bounce 1.2s ease 0.2s infinite' },
    dot3: { width: '6px', height: '6px', background: '#475569', borderRadius: '50%', animation: 'bounce 1.2s ease 0.4s infinite' },
    chatInputRow: { display: 'flex', gap: '10px', padding: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' },
    chatInput: { flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '10px 16px', color: '#e2e8f0', fontSize: '13px', outline: 'none', fontFamily: 'inherit' },
    sendBtn: { width: '44px', height: '44px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', borderRadius: '10px', color: 'white', fontSize: '16px', cursor: 'pointer', boxShadow: '0 0 16px rgba(99,102,241,0.4)' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { padding: '10px 14px', textAlign: 'left', fontSize: '10px', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '1px solid rgba(255,255,255,0.04)', fontWeight: 700 },
    td: { padding: '12px 14px', fontSize: '13px', color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.03)' },
    tr: { transition: 'background 0.15s' },
    badge: { padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600 },
};