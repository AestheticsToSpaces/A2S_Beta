import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    ArrowRight, 
    ArrowLeft, 
    Check, 
    Sparkles, 
    Layout, 
    Home, 
    Zap, 
    Fingerprint, 
    Dna,
    Palette,
    Gem,
    Landmark,
    Leaf,
    Hammer,
    Sun,
    Maximize,
    Minimize
} from 'lucide-react';
import { updateUserProfile } from '../services/api';
import { useStore } from '../store/useStore';

const STYLES = [
    { id: 'Minimal', label: 'Minimalist', icon: Minimize, color: '#F3F4F6', desc: 'Sleek lines and purposeful simplicity.' },
    { id: 'Scandinavian', label: 'Nordic', icon: Home, color: '#E5E7EB', desc: 'Warm wood tones and cozy functionalism.' },
    { id: 'Indian Contemporary', label: 'Modern India', icon: Landmark, color: '#FEF3C7', desc: 'Heritage motifs meeting global standards.' },
    { id: 'Mid-Century Modern', label: 'Mid-Century', icon: Palette, color: '#FDE68A', desc: 'Organic shapes and functional teak.' },
    { id: 'Luxury', label: 'Luxury', icon: Gem, color: '#FDF2F2', desc: 'Opulent textures and high-gloss finishes.' },
    { id: 'Boho', label: 'Bohemian', icon: Sun, color: '#ECFDF5', desc: 'Artisanal layers and spirited patterns.' },
    { id: 'Industrial', label: 'Industrial', icon: Hammer, color: '#F3F4F6', desc: 'Raw materials and architectural honesty.' },
];

const ROOMS = [
    { id: 'living', label: 'Living Room' },
    { id: 'bedroom', label: 'Main Bedroom' },
    { id: 'kitchen', label: 'Gourmet Kitchen' },
    { id: 'dining', label: 'Dining Area' },
    { id: 'office', label: 'Private Office' },
    { id: 'home-office', label: 'Lounge Space' },
];

// Curated high-quality Unsplash IDs for each combination (Room x Style)
const STYLE_DATA = {
    'living': {
        'Minimal': '1618221195710-dd6b41faaea6',
        'Scandinavian': '1554995207-c18c20360bcb',
        'Indian Contemporary': '1617103908321-4d1a4441712a',
        'Mid-Century Modern': '1586023492125-27b2c045efd7',
        'Luxury': '1616486338812-3dadae4b4f9d',
        'Boho': '1583847268964-b28dc2f51ac9',
        'Industrial': '1556912177-c54038c35add'
    },
    'bedroom': {
        'Minimal': '1566665797739-1674de7a421a',
        'Scandinavian': '1505691938895-1758d7eaa511',
        'Indian Contemporary': '1631679706909-1844bbd07221',
        'Mid-Century Modern': '1598928506311-c55ded91a20c',
        'Luxury': '1595526114035-0d45ed16cfbf',
        'Boho': '1522771739844-6a9f6d5f14af',
        'Industrial': '1536376074432-bf715905548d'
    },
    'kitchen': {
        'Minimal': '1556911220-e15b29be8c8f',
        'Scandinavian': '1484154218962-a197022b5858',
        'Indian Contemporary': '1539139102642-27613009bc23',
        'Mid-Century Modern': '1556185731-da3092523298',
        'Luxury': '1556909114-97e73c671320',
        'Boho': '1591825729269-caeb9c1259a2',
        'Industrial': '1543781552-47d3c0fe496c'
    },
    'dining': {
        'Minimal': '1617806118233-18e1de247200',
        'Scandinavian': '1538944513123-f365022f716b',
        'Indian Contemporary': '1615529182904-14819c355ad8',
        'Mid-Century Modern': '1519643381401-22c77e6e52b9',
        'Luxury': '1590650516494-0c8e4a4dd67e',
        'Boho': '1515516089376-88db1e26e9c0',
        'Industrial': '1590059005315-7b830d1720d2'
    },
    'office': {
        'Minimal': '1524758631624-e2822e304c36',
        'Scandinavian': '1493934558415-9d19f0b29447',
        'Indian Contemporary': '1504439468489-c8920d796a29',
        'Mid-Century Modern': '1517502884482-5c4ef3d75572',
        'Luxury': '1497362744606-c8959d077b90',
        'Boho': '1598425237614-47a300366667',
        'Industrial': '1504384308022-be303a8f8b94'
    },
    'home-office': {
        'Minimal': '1593642314172-8a9d300cc9e8',
        'Scandinavian': '1540325983803-5356ec3900dc',
        'Indian Contemporary': '1616486029377-5264f699119c',
        'Mid-Century Modern': '1585412726913-39e22496d03f',
        'Luxury': '1631680327733-dc4370c69464',
        'Boho': '1594242735140-6f022137996c',
        'Industrial': '1516062423063-de924314081c'
    }
};

const getImageUrl = (room, style) => {
    const id = STYLE_DATA[room]?.[style] || '1618221195710-dd6b41faaea6';
    return `https://images.unsplash.com/photo-${id}?q=80&w=800&auto=format&fit=crop`;
};

const Onboarding = () => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(0); 
    const [selections, setSelections] = useState([]);
    const [result, setResult] = useState(null);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const setProfile = useStore(state => state.setProfile);

    const handleSelect = (styleId) => {
        if (isTransitioning) return;
        
        const newSelections = [...selections, styleId];
        setSelections(newSelections);

        if (currentStep < ROOMS.length - 1) {
            setIsTransitioning(true);
            setTimeout(() => {
                setCurrentStep(currentStep + 1);
                setIsTransitioning(false);
            }, 500);
        } else {
            calculateResult(newSelections);
        }
    };

    const calculateResult = (finalSelections) => {
        const counts = {};
        finalSelections.forEach(s => counts[s] = (counts[s] || 0) + 1);
        
        let maxCount = 0;
        let dominantStyle = null;
        let isMixed = false;

        Object.entries(counts).forEach(([style, count]) => {
            if (count > maxCount) {
                maxCount = count;
                dominantStyle = style;
                isMixed = false;
            } else if (count === maxCount) {
                isMixed = true;
            }
        });

        const finalResult = isMixed ? 'Diverse' : dominantStyle;
        setResult(finalResult);
        setCurrentStep(ROOMS.length);

        // Save result and sync with store
        setProfile({ styleDNA: finalResult });

        // Sync with backend if logged in
        if (localStorage.getItem('token')) {
            updateUserProfile({
                styleDNA: finalResult,
                styleSelections: finalSelections
            }).catch(err => console.error("Failed to sync design DNA:", err));
        }
    };

    const currentRoom = ROOMS[currentStep];

    return (
        <div className="min-h-screen bg-main text-main flex flex-col items-center justify-center p-4 pt-24 pb-16 relative overflow-hidden transition-all duration-1000">
            {/* Ambient Background */}
            <div className="ambient-orb ambient-orb-1 opacity-20 blur-[120px]" />
            <div className="ambient-orb ambient-orb-2 opacity-20 blur-[120px]" />

            <div className="w-full max-w-[1400px] relative z-10">
                {currentStep < ROOMS.length ? (
                    <div className={`transition-all duration-500 ${isTransitioning ? 'opacity-0 scale-98 translate-y-4' : 'opacity-100 scale-100 translate-y-0'}`}>
                        {/* Progress Header */}
                        <div className="text-center mb-16">
                            <span className="section-tag mb-4">Aesthetic Onboarding</span>
                            <h2 className="font-serif text-5xl md:text-7xl font-black text-main leading-tight mb-6">
                                The <span className="text-gradient-gold italic">{currentRoom.label}</span>
                            </h2>
                            <p className="text-muted text-xl font-light mb-10 max-w-2xl mx-auto">
                                Select the design that resonates most with your personal philosophy.
                            </p>
                            
                            <div className="flex gap-3 justify-center mt-8">
                                {ROOMS.map((_, i) => (
                                    <div 
                                        key={i} 
                                        className={`h-1.5 rounded-full transition-all duration-700 ${i <= currentStep ? 'w-16 bg-accent' : 'w-4 bg-premium'}`} 
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Style Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 px-4">
                            {STYLES.map((style, idx) => (
                                <button
                                    key={style.id}
                                    onClick={() => handleSelect(style.id)}
                                    className="group relative aspect-[4/5] rounded-[48px] overflow-hidden border border-premium hover:border-accent transition-all duration-1000 hover-tilt shadow-premium hover:shadow-accent/20"
                                >
                                    <img 
                                        src={getImageUrl(currentRoom.id, style.id)} 
                                        alt={style.label}
                                        className="w-full h-full object-cover transition-transform duration-[4s] group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent group-hover:from-accent/90 transition-all duration-1000" />
                                    
                                    <div className="absolute inset-0 flex flex-col items-center justify-end p-10 translate-y-4 group-hover:translate-y-0 transition-transform duration-1000">
                                        <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-3xl border border-white/20 mb-6 group-hover:bg-white/20 flex items-center justify-center transition-all">
                                            <style.icon size={24} className="text-white group-hover:scale-110 transition-transform" />
                                        </div>
                                        <h4 className="font-serif text-3xl font-black text-white italic text-center">{style.label}</h4>
                                        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/60 mt-4 opacity-0 group-hover:opacity-100 transition-opacity text-center leading-relaxed">
                                            {style.desc}
                                        </p>
                                    </div>
                                    
                                    {/* Scanline Effect */}
                                    <div className="absolute left-0 right-0 h-px bg-white/40 shadow-glow-white animate-scan-fast opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    /* Result Screen */
                    <div className="max-w-4xl mx-auto text-center animate-scale-in">
                        <div className="relative mb-16 h-32 w-32 mx-auto">
                            <div className="absolute inset-0 bg-accent/20 rounded-full blur-2xl animate-pulse" />
                            <div className="relative w-32 h-32 rounded-full glass-premium flex items-center justify-center border-2 border-accent shadow-glow-accent">
                                <Fingerprint size={64} className="text-accent animate-float" />
                            </div>
                        </div>
                        
                        <span className="section-tag mb-4">Identity Unlocked</span>
                        <h2 className="font-serif text-6xl md:text-9xl font-black text-main leading-[0.9] tracking-tighter mb-10">
                            You are <br />
                            <span className="text-gradient-gold italic">
                                {result === 'Diverse' ? 'Multilayered' : result}
                            </span> <br />
                        </h2>
                        
                        <p className="text-muted text-2xl font-light mb-20 max-w-2xl mx-auto leading-relaxed italic">
                            {result === 'Diverse' 
                                ? "Your taste transcends boundaries. You find beauty in the unexpected fusion of cultures, eras, and textures. An architect of complexity."
                                : `You embody the pure essence of ${result}. Your space is a reflection of ${result.toLowerCase()} principles, curated with intention and architectural clarity.`
                            }
                        </p>
                        
                        <div className="flex flex-col sm:flex-row gap-8 justify-center">
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="btn-premium btn-premium-gold px-12 py-5 group"
                            >
                                <Dna size={20} />
                                <span>Enter Dashboard</span>
                                <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
                            </button>
                            <button
                                onClick={() => window.location.reload()}
                                className="btn-premium btn-premium-outline px-12 py-5"
                            >
                                Restart Journey
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Onboarding;
