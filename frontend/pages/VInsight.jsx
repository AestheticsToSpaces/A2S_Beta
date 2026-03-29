import React, { useState, useEffect, useRef } from 'react';

import { performVastuAudit, getUserProfile } from '../services/api';
import { useToast } from '../hooks/useToast';
import ToastContainer from '../components/ToastContainer';
import { useStore } from '../store/useStore';
import { 
    Monitor, 
    RotateCcw, 
    Upload, 
    Sparkles, 
    Layout, 
    ChevronDown, 
    Layers, 
    CheckCircle2, 
    AlertCircle, 
    ArrowRight, 
    Eye, 
    Download, 
    Zap 
} from 'lucide-react';

const DAILY_CHECK_LIMIT = 3;

/* ─── Interactive 3D Tilt Card ────────────────────────────────────── */
const TiltCard = ({ children, className = '', intensity = 15 }) => {
    const cardRef = useRef(null);

    const handleMouseMove = (e) => {
        const card = cardRef.current;
        if (!card) return;
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -intensity;
        const rotateY = ((x - centerX) / centerX) * intensity;
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    };

    const handleMouseLeave = () => {
        const card = cardRef.current;
        if (!card) return;
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    };

    return (
        <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className={className}
            style={{ transition: 'transform 0.4s cubic-bezier(0.03, 0.98, 0.52, 0.99)', transformStyle: 'preserve-3d' }}
        >
            {children}
        </div>
    );
};

/* ─── Animated Vastu Compass ─────────────────────────────────────── */
const VastuCompass = () => {
    const [rotation, setRotation] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setRotation(prev => prev + 0.3);
        }, 50);
        return () => clearInterval(interval);
    }, []);

    return (
        <svg viewBox="0 0 200 200" className="w-full h-full" style={{ filter: 'drop-shadow(0 0 20px rgba(212, 175, 55, 0.3))' }}>
            <defs>
                <linearGradient id="compass-gold" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.2" />
                </linearGradient>
                <radialGradient id="compass-center" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
                </radialGradient>
            </defs>

            {/* Outer rings */}
            <circle cx="100" cy="100" r="95" fill="none" stroke="url(#compass-gold)" strokeWidth="0.5" strokeDasharray="4 4" style={{ transform: `rotate(${rotation}deg)`, transformOrigin: 'center' }} />
            <circle cx="100" cy="100" r="85" fill="none" stroke="url(#compass-gold)" strokeWidth="0.3" />
            <circle cx="100" cy="100" r="70" fill="none" stroke="url(#compass-gold)" strokeWidth="0.5" strokeDasharray="2 8" style={{ transform: `rotate(${-rotation * 1.5}deg)`, transformOrigin: 'center' }} />

            {/* Inner Mandala diamond */}
            <g style={{ transform: `rotate(${rotation * 0.5}deg)`, transformOrigin: 'center' }}>
                <path d="M100 30 L170 100 L100 170 L30 100 Z" fill="none" stroke="url(#compass-gold)" strokeWidth="1" />
                <path d="M100 50 L150 100 L100 150 L50 100 Z" fill="none" stroke="url(#compass-gold)" strokeWidth="0.5" />
            </g>

            {/* Cross lines */}
            <line x1="100" y1="10" x2="100" y2="190" stroke="url(#compass-gold)" strokeWidth="0.3" />
            <line x1="10" y1="100" x2="190" y2="100" stroke="url(#compass-gold)" strokeWidth="0.3" />
            <line x1="30" y1="30" x2="170" y2="170" stroke="url(#compass-gold)" strokeWidth="0.2" />
            <line x1="170" y1="30" x2="30" y2="170" stroke="url(#compass-gold)" strokeWidth="0.2" />

            {/* Center glow */}
            <circle cx="100" cy="100" r="35" fill="url(#compass-center)" />
            <circle cx="100" cy="100" r="6" fill="var(--accent)" opacity="0.8" />
            <circle cx="100" cy="100" r="3" fill="var(--bg-main)" />

            {/* Cardinal directions */}
            <text x="96" y="22" style={{ fill: 'var(--accent)', fontSize: '9px', fontWeight: '900', letterSpacing: '0.15em', fontFamily: 'Outfit' }}>N</text>
            <text x="96" y="195" style={{ fill: 'var(--accent)', fontSize: '9px', fontWeight: '900', letterSpacing: '0.15em', fontFamily: 'Outfit' }}>S</text>
            <text x="183" y="104" style={{ fill: 'var(--accent)', fontSize: '9px', fontWeight: '900', letterSpacing: '0.15em', fontFamily: 'Outfit' }}>E</text>
            <text x="5" y="104" style={{ fill: 'var(--accent)', fontSize: '9px', fontWeight: '900', letterSpacing: '0.15em', fontFamily: 'Outfit' }}>W</text>

            {/* Intercardinal */}
            <text x="155" y="38" style={{ fill: 'var(--accent)', fontSize: '6px', fontWeight: '700', opacity: 0.5, fontFamily: 'Outfit' }}>NE</text>
            <text x="155" y="170" style={{ fill: 'var(--accent)', fontSize: '6px', fontWeight: '700', opacity: 0.5, fontFamily: 'Outfit' }}>SE</text>
            <text x="28" y="38" style={{ fill: 'var(--accent)', fontSize: '6px', fontWeight: '700', opacity: 0.5, fontFamily: 'Outfit' }}>NW</text>
            <text x="28" y="170" style={{ fill: 'var(--accent)', fontSize: '6px', fontWeight: '700', opacity: 0.5, fontFamily: 'Outfit' }}>SW</text>
        </svg>
    );
};

/* ─── Miniature Score Ring ─────────────────────────────────────────── */
const ScoreRingMini = ({ score = 82 }) => (
    <div className="relative w-12 h-12 flex items-center justify-center">
        <svg viewBox="0 0 40 40" className="w-full h-full -rotate-90">
            <circle cx="20" cy="20" r="16" fill="transparent" stroke="currentColor" strokeWidth="2" className="text-white/5" />
            <circle cx="20" cy="20" r="16" fill="transparent" stroke="var(--accent)" strokeWidth="2" strokeDasharray="100.5" strokeDashoffset={100.5 - (100.5 * score) / 100} className="transition-all duration-1000" />
        </svg>
        <span className="absolute text-[8px] font-black text-main">{score}</span>
    </div>
);

/* ─── Animated Score Ring ─────────────────────────────────────────── */
const ScoreRing = ({ score = 82 }) => {
    const [animatedOffset, setAnimatedOffset] = useState(452);
    const targetOffset = 452 - (452 * score) / 100;

    useEffect(() => {
        const timer = setTimeout(() => setAnimatedOffset(targetOffset), 300);
        return () => clearTimeout(timer);
    }, [targetOffset]);

    return (
        <div className="relative w-48 h-48 flex items-center justify-center group/score">
            <svg className="w-full h-full -rotate-90" style={{ filter: 'drop-shadow(0 0 15px rgba(212,175,55,0.3))' }}>
                <circle cx="96" cy="96" r="72" fill="transparent" stroke="currentColor" strokeWidth="8" className="text-white/5" />
                <circle cx="96" cy="96" r="72" fill="transparent" stroke="var(--accent)" strokeWidth="8" strokeDasharray="452" strokeDashoffset={animatedOffset} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 2s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                {/* Outer decorative ring */}
                <circle cx="96" cy="96" r="84" fill="transparent" stroke="var(--accent)" strokeWidth="0.5" strokeDasharray="3 6" opacity="0.3" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center group-hover/score:scale-110 transition-transform duration-700">
                <span className="text-6xl font-serif font-black text-main italic tracking-tighter">{score}</span>
                <span className="text-xs text-accent font-black mt-1 animate-pulse-glow tracking-widest">/100</span>
                <span className="text-[8px] font-black text-muted uppercase tracking-[0.3em] mt-2 opacity-50">Balance</span>
            </div>
        </div>
    );
};

/* ─── Step Component ─────────────────────────────────────── */
const Step = ({ number, title, description, icon: Icon, delay }) => {
    return (
        <TiltCard className={`group relative p-10 rounded-[48px] border border-premium bg-gradient-to-br from-white/40 to-white/5 backdrop-blur-xl transition-all duration-1000 animate-fade-in-up ${delay} hover:border-accent/30 overflow-hidden shadow-2xl`} intensity={6}>
            <div className="absolute -bottom-10 -right-10 w-48 h-48 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-1000 rotate-12 pointer-events-none">
                <svg viewBox="0 0 100 100" fill="currentColor" className="w-full h-full text-accent">
                    <rect x="10" y="10" width="80" height="80" stroke="currentColor" strokeWidth="0.5" fill="none" />
                    <circle cx="50" cy="50" r="35" stroke="currentColor" strokeWidth="0.5" fill="none" />
                    <path d="M10 10 L90 90 M90 10 L10 90" stroke="currentColor" strokeWidth="0.5" />
                    <rect x="25" y="25" width="50" height="50" stroke="currentColor" strokeWidth="0.5" fill="none" />
                </svg>
            </div>

            <div className="relative z-10">
                <div className="flex items-start justify-between mb-10">
                    <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent group-hover:scale-110 group-hover:bg-accent group-hover:text-white group-hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] transition-all duration-700">
                        <Icon size={24} strokeWidth={1.5} />
                    </div>
                    <div className="text-right">
                        <span className="text-[9px] font-black text-accent uppercase tracking-[0.5em] block mb-1">Step</span>
                        <span className="text-[24px] font-serif font-black text-main/10 group-hover:text-accent/20 transition-colors duration-700 italic leading-none">{number}</span>
                    </div>
                </div>

                <h3 className="font-serif text-3xl font-black text-main italic mb-5 leading-tight tracking-tight group-hover:translate-x-1 transition-transform duration-700">
                    {title}
                </h3>
                <div className="w-10 h-0.5 bg-accent/30 mb-6 group-hover:w-20 transition-all duration-700" />
                <p className="text-muted text-sm leading-relaxed font-light tracking-wide">
                    {description}
                </p>
            </div>

            <div className="absolute -top-20 -left-20 w-40 h-40 bg-accent/5 rounded-full blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />
        </TiltCard>
    );
};

/* ─── Floating Particle Effect ───────────────────────────────────── */
const FloatingParticles = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
            <div
                key={i}
                className="absolute w-1 h-1 rounded-full bg-accent/30"
                style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animation: `float ${4 + Math.random() * 6}s ease-in-out infinite`,
                    animationDelay: `${Math.random() * 5}s`,
                }}
            />
        ))}
    </div>
);

/* ─── Hero Slideshow Component (Background Mode) ────────────────── */
const HeroSlideshow = () => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const slides = [
        { url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2070&auto=format&fit=crop', caption: 'Room Harmony', sub: 'North-East Alignment' },
        { url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=2070&auto=format&fit=crop', caption: 'Natural Balance', sub: 'South-East Zone' },
        { url: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=2000&auto=format&fit=crop', caption: 'Vastu Geometry', sub: 'Room Center' },
        { url: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?q=80&w=2070&auto=format&fit=crop', caption: 'Energy Flow', sub: 'North-West Flow' }
    ];

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 6000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="absolute inset-x-0 bottom-0 top-0">
            {slides.map((slide, i) => (
                <div key={i} className={`absolute inset-0 w-full h-full transition-all duration-[3000ms] ease-in-out ${i === currentSlide ? 'opacity-100' : 'opacity-0'}`}>
                    <img
                        src={slide.url}
                        alt={slide.caption}
                        className={`absolute inset-0 w-full h-full object-cover transition-transform duration-[6000ms] ease-out ${i === currentSlide ? 'scale-105' : 'scale-110'}`}
                    />

                    <div className="absolute top-12 right-10 z-30 text-right">
                        <h3 className="font-serif text-3xl font-black text-white italic tracking-tight drop-shadow-lg">
                            {slide.caption}
                        </h3>
                        <p className="text-[10px] font-bold text-accent uppercase tracking-[0.3em] mt-1">{slide.sub}</p>
                    </div>
                </div>
            ))}
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent animate-spatial-scan z-[5]" />
        </div>
    );
};

/* ═══════════════════════════════════════════════════════════════════ */
/*  Main VInsight Component                                          */
/* ═══════════════════════════════════════════════════════════════════ */
const VInsight = () => {
    const { toasts, removeToast, toast } = useToast();
    const fileInputRef = useRef(null);
    const [selectedImage, setSelectedImage] = useState(null);
    const [userDirection, setUserDirection] = useState('');
    const [spatialDescription, setSpatialDescription] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [showResult, setShowResult] = useState(false);
    const [auditResult, setAuditResult] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);

    // Zustand Store
    const vastuCredits = useStore(state => state.vastuCredits);
    const updateCredits = useStore(state => state.updateCredits);
    
    // Limits
    const MAX_AUDITS_PER_DAY = 3; 

    useEffect(() => {
        // Initial sync of profile (if not already synced) to get latest credits
        getUserProfile().catch(() => {});
    }, []);

    const handleImageChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedImage(URL.createObjectURL(e.target.files[0]));
            setShowResult(false);
            setAuditResult(null);
            setUploadProgress(0);
        }
    };

    const handleAudit = async () => {
        if (vastuCredits <= 0) {
            toast.error('No Vastu Audit credits remaining!');
            return;
        }

        if (!spatialDescription) {
            toast.error('Please add a room description');
            return;
        }

        setIsUploading(true);
        setUploadProgress(10);

        try {
            const formData = new FormData();
            formData.append('roomType', userDirection || 'General'); // Use userDirection as roomType if needed or fix labels
            formData.append('description', spatialDescription);
            
            if (fileInputRef.current?.files[0]) {
                formData.append('image', fileInputRef.current.files[0]);
            }

            setUploadProgress(30);
            
            const result = await performVastuAudit(formData);
            setUploadProgress(100);
            
            setTimeout(() => {
                setAuditResult(result);
                setIsUploading(false);
                setShowResult(true);
                
                // Update credits in store (decrement locally for immediate feedback)
                updateCredits('vastu', vastuCredits - 1);
                
                // Re-fetch profile to ensure backend sync
                getUserProfile().catch(err => console.error("Sync failed:", err));
                
                toast.success('Audit complete!');
            }, 800);

        } catch (err) {
            console.error('Audit failed:', err);
            toast.error(err || 'Failed to perform Vastu audit');
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    return (
        <div className="min-h-screen bg-main relative overflow-hidden">
            <ToastContainer toasts={toasts} removeToast={removeToast} />
            <FloatingParticles />
            <div className="absolute top-0 right-0 w-[900px] h-[900px] bg-accent/8 rounded-full blur-[200px] pointer-events-none animate-float" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[150px] pointer-events-none" />

            <div className="relative w-full overflow-hidden" style={{ minHeight: '85vh' }}>
                <HeroSlideshow />
                <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-transparent z-10" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 z-10" />

                <div className="absolute inset-0 z-20 flex items-center">
                    <div className="max-w-7xl mx-auto px-10 w-full">
                        <div className="max-w-xl">
                            <div className="flex items-center gap-4 mb-10 animate-fade-in-up">
                                <div className="w-12 h-px bg-accent" />
                                <span className="text-[9px] font-black text-accent uppercase tracking-[0.5em]">Vastu Check</span>
                            </div>

                            <h1 className="font-serif text-7xl md:text-[7rem] font-black text-white leading-[0.82] italic mb-6 tracking-tighter animate-fade-in-up stagger-1 drop-shadow-2xl">
                                <span className="text-accent">V</span>Insight
                            </h1>
                            <div className="flex items-center gap-5 mb-14 animate-fade-in-up stagger-2">
                                <div className="h-px w-24 bg-accent/40" />
                                <span className="text-[10px] font-light text-white/50 uppercase tracking-[0.4em]" style={{ fontFamily: 'Outfit' }}>Spatial Equilibrium Engine</span>
                            </div>

                            <p className="text-white/80 text-xl md:text-2xl font-light leading-relaxed italic max-w-lg mb-16 animate-fade-in-up stagger-3 border-l-2 border-accent/40 pl-6">
                                Where the earth breathes, the walls listen, and light knows its place.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="absolute bottom-10 right-10 w-28 h-28 z-20 opacity-50 hover:opacity-100 transition-opacity duration-700">
                    <VastuCompass />
                </div>
            </div>

            <div className="max-w-7xl mx-auto relative z-10 px-6 pb-24">
                <div className="space-y-12 mb-32">
                    <section className="animate-fade-in-up stagger-1">
                        <TiltCard className="group relative p-12 rounded-[64px] border border-premium bg-gradient-to-br from-white/40 to-white/5 backdrop-blur-xl hover:border-accent/20 shadow-2xl transition-all duration-1000 overflow-hidden" intensity={2}>
                            <div className="absolute inset-0 opacity-[0.03] pointer-events-none group-hover:opacity-[0.06] transition-opacity duration-1000">
                                <div className="absolute inset-0 grid grid-cols-12 grid-rows-12">
                                    {Array.from({ length: 144 }).map((_, i) => (
                                        <div key={i} className="border-[0.5px] border-accent" />
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center justify-between mb-12 relative z-10">
                                <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-accent text-white shadow-[0_10px_30px_rgba(212,175,55,0.2)]">
                                    <Monitor size={14} fill="currentColor" />
                                    <span className="text-[9px] font-black uppercase tracking-[0.4em]">Analysis</span>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="text-right">
                                        <p className="text-[9px] font-black text-accent uppercase tracking-[0.4em] mb-1">Daily Checks</p>
                                        <div className="flex items-center gap-2 justify-end">
                                            <div className="flex gap-1">
                                                {[1, 2, 3].map(i => (
                                                    <div key={i} className={`w-5 h-1 rounded-full transition-all duration-1000 ${i <= vastuCredits ? 'bg-accent shadow-[0_0_8px_rgba(212,175,55,0.4)]' : 'bg-main/10'}`} />
                                                ))}
                                            </div>
                                            <span className="text-[11px] font-serif font-black text-main italic ml-1">
                                                {vastuCredits}<span className="text-[9px] text-muted font-light not-italic opacity-40">/{MAX_AUDITS_PER_DAY}</span>
                                            </span>
                                        </div>
                                    </div>
                                    <div className="w-px h-10 bg-premium/40 hidden md:block" />
                                    <div className="hidden md:flex flex-col items-end">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <div className={`w-1.5 h-1.5 rounded-full ${vastuCredits <= 0 ? 'bg-red-400' : 'bg-emerald-500 animate-pulse'}`} />
                                            <span className="text-[8px] font-black text-main/40 uppercase tracking-[0.2em]">System Status</span>
                                        </div>
                                        <span className={`text-[8px] font-bold uppercase tracking-widest ${vastuCredits <= 0 ? 'text-red-400' : 'text-emerald-500'}`}>
                                            {vastuCredits > 0 ? 'Ready' : 'Locked'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
                                <div className="space-y-8">
                                    <header>
                                        <h3 className="font-serif text-4xl font-black text-main italic mb-3 tracking-tight leading-none capitalize">
                                            Upload <span className="text-accent/60">Photo</span>
                                        </h3>
                                        <p className="text-muted text-xs font-light tracking-wide uppercase opacity-60">Main Analysis Engine</p>
                                    </header>

                                    <div className={`relative aspect-square md:aspect-[1.2/1] rounded-[48px] border-2 border-dashed transition-all duration-1000 overflow-hidden group/port shadow-inner ${selectedImage ? 'border-accent/40 bg-transparent' : 'border-premium bg-white/5 hover:border-accent/50'} h-[450px]`}>
                                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />

                                        {selectedImage ? (
                                            <div className="relative w-full h-full group/preview">
                                                <img src={selectedImage} alt="Room Preview" className="w-full h-full object-cover rounded-[46px] group-hover/preview:scale-105 transition-transform duration-[2000ms]" />

                                                <div className="absolute inset-0 pointer-events-none p-8 opacity-20">
                                                    <div className="w-full h-full border border-accent/40 grid grid-cols-3 grid-rows-3" />
                                                    <div className="absolute top-1/2 left-0 right-0 h-px bg-accent/60 animate-spatial-scan" />
                                                </div>

                                                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-center justify-center duration-500">
                                                    <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-3 px-8 py-4 bg-white text-main text-[11px] font-black uppercase tracking-widest rounded-full hover:bg-accent hover:text-white transition-all shadow-xl hover:scale-105 active:scale-95 duration-300">
                                                        <RotateCcw size={16} />
                                                        Replace Image
                                                    </button>
                                                </div>

                                                {isUploading && (
                                                    <div className="absolute inset-0 bg-main/98 backdrop-blur-3xl flex flex-col items-center justify-center z-30 rounded-[46px] p-10">
                                                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-accent to-transparent animate-spatial-scan z-40 shadow-[0_0_20px_rgba(212,175,55,0.8)]" />
                                                        <div className="text-accent text-5xl font-serif font-black italic mb-8 reveal-progress">
                                                            {Math.min(Math.round(uploadProgress), 100)}%
                                                        </div>
                                                        <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden mb-4">
                                                            <div className="h-full bg-accent transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                                                        </div>
                                                        <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.5em] animate-pulse">Analyzing Room...</p>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                                <div className="w-24 h-24 bg-accent/5 rounded-[40px] flex items-center justify-center mb-8 border border-accent/10 transition-all duration-700 group-hover/port:rotate-12 group-hover/port:bg-accent group-hover/port:text-white">
                                                    <Upload size={40} strokeWidth={1} />
                                                </div>
                                                <h4 className="font-serif text-2xl font-black text-main italic mb-3 tracking-widest uppercase">Upload Image</h4>
                                                <p className="text-[10px] font-bold text-muted uppercase tracking-[0.4em] opacity-50">Choose a photo of your room</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="h-full flex flex-col justify-center">
                                    {!showResult ? (
                                        <div className="space-y-10 animate-fade-in-right">
                                            <header>
                                                <span className="text-[9px] font-black text-accent uppercase tracking-[0.6em] block mb-3">Room Details</span>
                                                <h4 className="font-serif text-3xl font-black text-main italic mb-4">Add Your <span className="opacity-40">Room Info</span></h4>
                                                <p className="text-sm text-muted font-light leading-relaxed max-w-sm">
                                                    Provide some details about your room. Knowing the direction helps us give you a better Vastu check.
                                                </p>
                                            </header>

                                            <div className="space-y-6">
                                            <div className="group/input">
                                                <label className="text-[9px] font-black text-main/40 uppercase tracking-[0.4em] block mb-3 group-focus-within/input:text-accent transition-colors">Select Room Type</label>
                                                <div className="relative">
                                                    <Layout className="absolute left-6 top-1/2 -translate-y-1/2 text-accent/30 group-focus-within/input:text-accent transition-colors" size={20} />
                                                    <select
                                                        value={userDirection} // Reusing userDirection state for simplicity in this pass, or I can add a new one
                                                        onChange={(e) => setUserDirection(e.target.value)}
                                                        className="w-full bg-white/5 border border-premium py-5 pl-16 pr-8 rounded-3xl text-sm font-medium focus:outline-none focus:border-accent/40 focus:bg-white/10 transition-all tracking-wide appearance-none cursor-pointer"
                                                    >
                                                        <option value="" className="bg-main">Choose Room...</option>
                                                        <option value="Living Room" className="bg-main">Living Room</option>
                                                        <option value="Bedroom" className="bg-main">Bedroom</option>
                                                        <option value="Kitchen" className="bg-main">Kitchen</option>
                                                        <option value="Dining Room" className="bg-main">Dining Room</option>
                                                        <option value="Office" className="bg-main">Office</option>
                                                        <option value="Bathroom" className="bg-main">Bathroom</option>
                                                        <option value="General" className="bg-main">Other Space</option>
                                                    </select>
                                                    <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-accent/30 pointer-events-none" size={16} />
                                                </div>
                                            </div>
                                                <div className="group/input">
                                                    <label className="text-[9px] font-black text-main/40 uppercase tracking-[0.4em] block mb-3 group-focus-within/input:text-accent transition-colors">Room Description</label>
                                                    <div className="relative">
                                                        <Layers className="absolute left-6 top-6 text-accent/30 group-focus-within/input:text-accent transition-colors" size={20} />
                                                        <textarea
                                                            value={spatialDescription}
                                                            onChange={(e) => setSpatialDescription(e.target.value)}
                                                            placeholder="e.g., Bedroom with a sliding window on the east wall..."
                                                            rows="4"
                                                            className="w-full bg-white/5 border border-premium p-6 pl-16 rounded-[32px] text-sm font-medium focus:outline-none focus:border-accent/40 focus:bg-white/10 transition-all tracking-wide resize-none"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <button
                                                onClick={handleAudit}
                                                disabled={!selectedImage || isUploading || vastuCredits <= 0}
                                                className={`w-full py-6 rounded-[32px] text-[11px] font-black uppercase tracking-[0.6em] transition-all duration-700 flex items-center justify-center gap-4 relative overflow-hidden ${!selectedImage || vastuCredits <= 0 ? 'bg-main/20 border border-premium text-muted/40 cursor-not-allowed' : 'bg-accent text-white shadow-[0_20px_40px_rgba(212,175,55,0.2)] hover:scale-[1.02] active:scale-95'}`}
                                            >
                                                {selectedImage && vastuCredits > 0 && (
                                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full hover:animate-shimmer" />
                                                )}
                                                <Sparkles size={18} />
                                                <span>{vastuCredits <= 0 ? 'Credits Exhausted' : 'Check Vastu'}</span>
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-10 animate-fade-in-up">
                                            <header>
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                                    <span className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.6em]">Room Analysis Ready</span>
                                                </div>
                                                <h3 className="font-serif text-4xl font-black text-main italic mb-4 capitalize">Vastu <span className="text-accent">Summary</span></h3>
                                            </header>

                                            <div className="relative p-8 rounded-[40px] bg-white/5 border border-premium overflow-hidden group/text">
                                                <div className="absolute top-0 right-0 p-6 opacity-10">
                                                    <Eye size={60} strokeWidth={1} className="text-accent" />
                                                </div>
                                                <p className="text-base text-main font-light leading-[1.8] italic relative z-10 transition-all duration-700 group-hover/text:translate-x-1">
                                                    {auditResult?.summary || "Analysis complete. View the details below."}
                                                </p>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                                                    <span className="text-[8px] font-black uppercase tracking-[0.3em]">Overall Score</span>
                                                </div>
                                                <ScoreRingMini score={auditResult?.score || 0} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </TiltCard>
                    </section>

                    {showResult && (
                        <div className="space-y-12 animate-fade-in-up">
                            <section className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                <TiltCard className="p-10 rounded-[56px] bg-emerald-500/[0.03] border border-emerald-500/10 shadow-xl relative overflow-hidden" intensity={3}>
                                    <div className="flex items-center gap-3 mb-10">
                                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                            <CheckCircle2 size={24} />
                                        </div>
                                        <div>
                                            <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.5em] mb-1">Good Vastu Points</h4>
                                            <p className="text-[9px] font-bold text-main/30 uppercase tracking-[0.3em]">Positive Energy Flow</p>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        {auditResult?.pros?.map((item, i) => (
                                            <div key={i} className="flex items-center gap-4 p-5 rounded-3xl bg-white/5 border border-transparent hover:border-emerald-500/10 transition-all duration-500">
                                                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 text-xs">{item.icon}</div>
                                                <span className="flex-1 text-sm text-main/80 font-light">{item.text}</span>
                                                <span className="text-[11px] font-black text-emerald-500">{item.score}</span>
                                            </div>
                                        )) || <p className="text-xs text-muted/40">No major positive points detected.</p>}
                                    </div>
                                </TiltCard>

                                <TiltCard className="p-10 rounded-[56px] bg-red-500/[0.03] border border-red-500/10 shadow-xl relative overflow-hidden" intensity={3}>
                                    <div className="flex items-center gap-3 mb-10">
                                        <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500">
                                            <AlertCircle size={24} />
                                        </div>
                                        <div>
                                            <h4 className="text-[10px] font-black text-red-500 uppercase tracking-[0.5em] mb-1">Areas to Improve</h4>
                                            <p className="text-[9px] font-bold text-main/30 uppercase tracking-[0.3em]">Possible Issues</p>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        {auditResult?.cons?.map((item, i) => (
                                            <div key={i} className="flex items-center gap-4 p-5 rounded-3xl bg-red-500/5 border border-red-500/10 hover:bg-red-500/8 transition-all duration-500">
                                                <div className="w-8 h-8 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500 text-xs">{item.icon}</div>
                                                <span className="flex-1 text-sm text-main/80 font-light">{item.text}</span>
                                                <span className="text-[11px] font-black text-red-500">{item.score}</span>
                                            </div>
                                        )) || <p className="text-xs text-muted/40">No major issues detected.</p>}
                                    </div>
                                </TiltCard>
                            </section>

                            <section className="animate-fade-in-up delay-300">
                                <TiltCard className="p-12 rounded-[64px] bg-gradient-to-br from-accent/5 via-white/5 to-transparent border border-accent/10 relative overflow-hidden shadow-2xl" intensity={1}>
                                    <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
                                        <Sparkles size={200} className="text-accent" />
                                    </div>

                                    <div className="flex flex-col md:flex-row items-center gap-12 relative z-10">
                                        <div className="w-24 h-24 rounded-[32px] bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shadow-xl shrink-0 group-hover:rotate-12 transition-transform duration-1000">
                                            <ArrowRight size={32} />
                                        </div>

                                        <div className="flex-1 text-center md:text-left space-y-6">
                                            <header>
                                                <span className="text-[9px] font-black text-accent uppercase tracking-[0.6em] block mb-3">Final Recommendations</span>
                                                <h3 className="font-serif text-4xl font-black text-main italic tracking-tight">Vastu <span className="opacity-40">Fixes</span></h3>
                                            </header>

                                            <p className="text-lg text-main font-light leading-[1.8] italic max-w-4xl opacity-80 whitespace-pre-wrap">
                                                {auditResult?.recommendations || "Follow the rules listed above to harmonize your space."}
                                            </p>

                                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-4">
                                                <div className="px-6 py-3 rounded-full bg-main border border-premium text-[9px] font-black text-muted uppercase tracking-[0.3em] flex items-center gap-3 hover:border-accent transition-colors">
                                                    <Download size={14} className="text-accent" />
                                                    Get Full Report PDF
                                                </div>
                                                <div className="px-6 py-3 rounded-full bg-accent text-white text-[9px] font-black uppercase tracking-[0.3em] shadow-lg hover:scale-105 transition-all">
                                                    Consult Specialist
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </TiltCard>
                            </section>
                        </div>
                    )}
                </div>

                <div className="mt-40 mb-32 relative">
                    <div className="text-center mb-20 relative">
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] font-black text-accent uppercase tracking-[0.8em] mb-4">How it Works</span>
                            <h2 className="font-serif text-5xl md:text-6xl font-black text-main italic leading-tight tracking-tighter">
                                How it <span className="text-accent">Works</span>
                            </h2>
                            <div className="mt-8 flex items-center gap-4">
                                <div className="w-12 h-px bg-premium" />
                                <Layers size={16} className="text-accent/30" />
                                <div className="w-12 h-px bg-premium" />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                        <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/15 to-transparent -translate-y-1/2 pointer-events-none hidden md:block" />

                        <Step
                            number="01"
                            title="Upload Photo"
                            description="Upload a photo of your room. We can use any room photo to check its Vastu energy."
                            icon={Upload}
                            delay="stagger-1"
                        />
                        <Step
                            number="02"
                            title="Smart Analysis"
                            description="Our AI maps the Vastu grid over your floorplan, checking directions and the balance of elements."
                            icon={Sparkles}
                            delay="stagger-2"
                        />
                        <Step
                            number="03"
                            title="Get Results"
                            description="Receive a simple list of what's good and what can be improved with easy tips."
                            icon={Zap}
                            delay="stagger-3"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VInsight;
