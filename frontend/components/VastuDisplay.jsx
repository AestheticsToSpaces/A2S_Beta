import React from 'react';
import { Compass, Sparkles, AlertCircle } from 'lucide-react';

const VastuDisplay = ({ vastu }) => {
    if (!vastu) return null;

    return (
        <div className="w-full max-w-lg card-luxury bg-surface/80 backdrop-blur rounded-[2rem] p-8 border border-accent/20 animate-fade-in-up mt-6 mb-8 relative overflow-hidden">
            {/* Geometric accent */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-accent/5 rounded-full border border-accent/10 pointer-events-none" />
            
            <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-full border flex items-center justify-center bg-main text-accent border-accent/30 shadow-inner">
                    <Compass size={24} className="animate-float" />
                </div>
                <div>
                    <h4 className="font-serif text-2xl font-black text-main m-0 leading-tight">Vastu Guide</h4>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-accent mt-1">Vastu Score: {vastu.vastu_score}/100</p>
                </div>
            </div>

            <p className="text-sm leading-relaxed mb-6 font-medium text-main/90 border-l-2 border-accent/30 pl-4">{vastu.vastu_summary}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#2E8B57]">
                        <Sparkles size={12} /> Good Points
                    </div>
                    <ul className="space-y-2">
                        {vastu.vastu_pros?.map((pro, i) => (
                            <li key={i} className="text-xs flex items-start gap-2 leading-relaxed opacity-80">
                                <span className="text-accent mt-0.5">•</span> {pro}
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#CD5C5C]">
                        <AlertCircle size={12} /> Better to Fix
                    </div>
                    <ul className="space-y-2">
                        {vastu.vastu_cons?.map((con, i) => (
                            <li key={i} className="text-xs flex items-start gap-2 leading-relaxed opacity-80">
                                <span className="text-[#CD5C5C] mt-0.5">•</span> {con}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default VastuDisplay;
