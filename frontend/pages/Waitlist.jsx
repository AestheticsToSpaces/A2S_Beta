import React, { useState, useEffect } from 'react';
import { 
    Users, ScanLine, Camera, Sparkles, Box, ShoppingBag, 
    ArrowRight, Share2, Copy, Check, Zap, Info, Compass
} from 'lucide-react';
import { getWaitlistStatus, joinPhase2Waitlist } from '../services/api';
import { useStore } from '../store/useStore';

const Waitlist = () => {
    const user = useStore(state => state.user);
    const setWaitlist = useStore(state => state.setWaitlist);
    const [status, setStatus] = useState({ joined: false, rank: '...', progress: 0, inviteCode: '...' });
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        fetchStatus();
    }, []);

    const fetchStatus = async () => {
        try {
            const data = await getWaitlistStatus();
            setStatus(data);
            // Sync with global store
            setWaitlist(data.joined, data.rank);
        } catch (error) {
            console.error('Waitlist status error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleJoin = async () => {
        setJoining(true);
        try {
            await joinPhase2Waitlist();
            await fetchStatus();
        } catch (error) {
            console.error('Join waitlist error:', error);
        } finally {
            setJoining(false);
        }
    };

    const copyInvite = () => {
        navigator.clipboard.writeText(status.inviteCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const phase2Features = [
        { icon: <Users size={24} />, title: "Artisan Cloud", desc: "Compare retail furniture to custom artisan fabrication in real time." },
        { icon: <ScanLine size={24} />, title: "Video-to-3D", desc: "Record a room walkthrough and navigate a fully reconstructed 3D model." },
        { icon: <Camera size={24} />, title: "AR Pro Live View", desc: "See real catalog products placed in your actual space — live and accurate." },
        { icon: <ShoppingBag size={24} />, title: "Smart Sourcing Engine", desc: "Auto-scan 50+ verified vendors for price, lead time, and quality." },
        { icon: <Box size={24} />, title: "3D Real-time Staging", desc: "Drag and drop real furniture into photorealistic spatial models." },
        { icon: <Sparkles size={24} />, title: "AI Architectural Advisory", desc: "Deep design consultations merging Vastu wisdom with modern physics." }
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-main flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-accent" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-main pt-32 pb-20 px-6 relative overflow-hidden">
            {/* Background Orbs */}
            <div className="absolute top-0 right-[-10%] w-[500px] h-[500px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-accent/3 rounded-full blur-[100px] pointer-events-none" />

            <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-start">
                
                {/* Left: Info & Features */}
                <div className="animate-fade-in-up">
                    <span className="section-tag mb-6 inline-block">Phase 2 Early Access</span>
                    <h1 className="font-serif text-5xl md:text-7xl font-black text-main leading-tight italic mb-8">
                        The Future of <br />
                        <span className="text-gradient-gold not-italic">Interior Intelligence</span>
                    </h1>
                    <p className="text-lg text-muted font-light leading-relaxed mb-12 max-w-xl">
                        A2S Phase 2 marks the arrival of our most powerful tools. From video scanning to artisan marketplaces, we're building the first complete spatial ecosystem.
                    </p>

                    <div className="grid sm:grid-cols-2 gap-6">
                        {phase2Features.map((feat, i) => (
                            <div key={i} className="p-6 rounded-[32px] bg-surface border border-premium hover:border-accent/30 transition-all group">
                                <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent mb-4 group-hover:scale-110 transition-transform">
                                    {feat.icon}
                                </div>
                                <h3 className="font-serif text-lg font-black text-main italic mb-2">{feat.title}</h3>
                                <p className="text-[10px] text-muted leading-relaxed uppercase tracking-wider">{feat.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Waitlist Card */}
                <div className="sticky top-32 animate-fade-in-up stagger-1">
                    <div className="glass-premium p-10 rounded-[48px] border border-premium shadow-premium relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 h-full w-1/2 bg-gradient-to-l from-accent/5 to-transparent pointer-events-none" />
                        
                        {!status.joined ? (
                            <div className="text-center">
                                <div className="w-20 h-20 rounded-[32px] bg-accent/10 flex items-center justify-center text-accent mx-auto mb-8 shadow-xl shadow-accent/5">
                                    <Zap size={40} className="animate-pulse" />
                                </div>
                                <h2 className="font-serif text-3xl font-black text-main italic mb-4">Secure Your Spot</h2>
                                <p className="text-muted mb-10 font-light">
                                    Join {status.rank} other early adopters. Since you're already a member, one click is all it takes.
                                </p>
                                
                                <button 
                                    onClick={handleJoin}
                                    disabled={joining}
                                    className="w-full btn-premium btn-premium-gold py-6 flex items-center justify-center gap-3 text-lg"
                                >
                                    {joining ? 'Adding You...' : 'Join Waitlist Now'}
                                    {!joining && <ArrowRight size={20} />}
                                </button>
                                
                                <p className="text-[10px] text-muted mt-6 uppercase tracking-[0.2em] font-black">
                                    Linked to: {user?.email}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-10">
                                <div>
                                    <div className="flex justify-between items-center mb-6">
                                        <h2 className="font-serif text-3xl font-black text-main italic">You're In.</h2>
                                        <span className="px-4 py-2 rounded-full bg-green-500/10 text-green-500 text-[10px] font-black uppercase tracking-widest border border-green-500/20">Active</span>
                                    </div>
                                    <div className="flex justify-between items-end mb-4">
                                        <div className="space-y-1">
                                            <p className="text-[10px] text-muted uppercase tracking-[0.3em] font-black">Your Position</p>
                                            <p className="font-serif text-5xl font-black text-main italic">{status.rank}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] text-muted uppercase tracking-[0.3em] font-black">Progress</p>
                                            <p className="text-3xl font-black text-accent">{status.progress}%</p>
                                        </div>
                                    </div>
                                    <div className="h-2 w-full bg-main/10 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-accent animate-gradient-shift transition-all duration-1000" 
                                            style={{ width: `${status.progress}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="p-8 rounded-[32px] bg-main/50 border border-premium">
                                    <p className="text-[10px] text-muted uppercase tracking-[0.3em] font-black mb-4 flex items-center gap-2">
                                        <Share2 size={12} className="text-accent" />
                                        Referral System
                                    </p>
                                    <div className="flex gap-4 items-center">
                                        <div className="flex-1 px-6 py-4 rounded-2xl bg-surface border border-premium font-mono text-sm tracking-wider text-main overflow-hidden truncate">
                                            {status.inviteCode}
                                        </div>
                                        <button 
                                            onClick={copyInvite}
                                            className="w-14 h-14 rounded-2xl border border-premium flex items-center justify-center text-muted hover:text-accent hover:border-accent/40 transition-all bg-surface"
                                        >
                                            {copied ? <Check size={20} className="text-green-500" /> : <Copy size={20} />}
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-muted mt-4 italic font-medium">
                                        Share your code to climb the waitlist and earn platform credits.
                                    </p>
                                </div>

                                <div className="p-6 rounded-[24px] bg-accent/5 border border-accent/20 flex gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent flex-shrink-0">
                                        <Info size={18} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-main uppercase tracking-wider mb-1">Credit System Reminder</p>
                                        <p className="text-[10px] text-muted leading-relaxed">
                                            Referral credits can be used to renew your <span className="text-main font-bold">AI Consultant</span> sessions. 
                                            Note: <span className="text-main font-bold">Vastu Audit</span> limits are fixed and cannot be increased via referrals.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-8 flex items-center justify-center gap-8 text-muted/30">
                        <Users size={24} />
                        <Compass size={24} />
                        <Box size={24} />
                        <Camera size={24} />
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Waitlist;
