import React, { useState } from 'react';
import { X, SlidersHorizontal, IndianRupee, Sparkles, Home, ChevronDown, Check } from 'lucide-react';
import { INITIAL_FILTER_STATE } from '../constants';

const FilterSidebar = ({ filters, setFilters, viewType = 'rooms', counts = { rooms: {}, styles: {} }, sortBy, setSortBy, onClose }) => {
    const [expandedSections, setExpandedSections] = useState({
        sort: true,
        budget: false,
        space: false,
        aesthetic: false
    });

    const toggleSection = (section) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    // Exact lists from landing page reference
    // Exact lists from landing page reference
    const roomTypesList = [
        'Living Room', 'Kitchen', 'Home Office', 'Master Bedroom', 'Guest Bedroom', 'Dining Room', 'Bathroom', 'Balcony', 'Pooja Room', 'Walk-in Wardrobe', 'Entire House'
    ];
    const aestheticsList = ['Minimal', 'Scandinavian', 'Indian Contemporary', 'Mid-Century Modern', 'Luxury', 'Boho', 'Industrial'];
    const furnitureCategoriesList = ['SOFA', 'BED', 'DINING TABLE', 'COFFEE TABLE', 'CHAIR', 'STUDY TABLE', 'WARDROBE', 'DRESSING TABLE', 'LIGHTING', 'WALL DECOR', 'RUG', 'CURTAINS'];

    const toggleRoom = (room) => {
        setFilters(prev => ({
            ...prev,
            roomTypes: prev.roomTypes.includes(room)
                ? prev.roomTypes.filter(r => r !== room)
                : [...prev.roomTypes, room]
        }));
    };

    const toggleStyle = (style) => {
        setFilters(prev => ({
            ...prev,
            styles: prev.styles.includes(style)
                ? prev.styles.filter(s => s !== style)
                : [...prev.styles, style]
        }));
    };

    return (
        <div className="bg-white p-10 rounded-[64px] border border-premium shadow-2xl h-full flex flex-col overflow-hidden animate-fade-in-left transition-all duration-700">
            {/* Header */}
            <div className="flex justify-between items-start mb-12">
                <div className="space-y-1">
                    <span className="text-[10px] font-black text-main uppercase tracking-[0.5em]">Refine</span>
                </div>
                {onClose && (
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-4 rounded-full hover:bg-neutral-100 transition-all duration-500 group"
                    >
                        <X size={24} className="text-neutral-300 group-hover:text-main group-hover:rotate-90 transition-all duration-500" />
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                {/* Sort Section */}
                <div className="border-b border-neutral-50 pb-6 mb-2">
                    <button 
                        onClick={() => toggleSection('sort')}
                        className="flex items-center justify-between w-full group py-4 transition-colors hover:text-accent"
                    >
                        <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-xl transition-all ${expandedSections.sort ? 'bg-accent text-on-accent' : 'bg-neutral-50 text-neutral-400'}`}>
                                <SlidersHorizontal size={14} />
                            </div>
                            <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-main">Sort</h4>
                        </div>
                        <ChevronDown size={18} className={`text-neutral-300 transition-transform duration-500 ${expandedSections.sort ? 'rotate-180 text-accent' : ''}`} />
                    </button>
                    
                    <div className={`grid gap-3 transition-all duration-500 overflow-hidden ${expandedSections.sort ? 'max-h-[500px] mt-4 opacity-100' : 'max-h-0 opacity-0'}`}>
                        {[
                            { value: 'recommended', label: 'Recommended' },
                            { value: 'price-low', label: 'Price: Low → High' },
                            { value: 'price-high', label: 'Price: High → Low' },
                        ].map(opt => {
                            const isActive = sortBy === opt.value;
                            return (
                                <button
                                    key={opt.value}
                                    onClick={() => setSortBy(opt.value)}
                                    className={`flex items-center justify-between px-6 py-5 rounded-2xl border-2 transition-all duration-500 active:scale-[0.98] ${isActive 
                                        ? 'bg-neutral-900 text-white border-neutral-900 shadow-xl' 
                                        : 'bg-white text-main border-neutral-50 hover:border-accent/10 hover:bg-neutral-50/50'}`}
                                >
                                    <span className="text-[10px] font-black uppercase tracking-widest">{opt.label}</span>
                                    {isActive && <Check size={14} className="text-accent animate-scale-in" />}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Budget Range Section */}
                <div className="border-b border-neutral-50 pb-6 mb-2">
                    <button 
                        onClick={() => toggleSection('budget')}
                        className="flex items-center justify-between w-full group py-4 transition-colors hover:text-accent"
                    >
                        <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-xl transition-all ${expandedSections.budget ? 'bg-accent text-on-accent' : 'bg-neutral-50 text-neutral-400'}`}>
                                <IndianRupee size={14} />
                            </div>
                            <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-main">Budget Range</h4>
                        </div>
                        <ChevronDown size={18} className={`text-neutral-300 transition-transform duration-500 ${expandedSections.budget ? 'rotate-180 text-accent' : ''}`} />
                    </button>

                    <div className={`transition-all duration-500 overflow-hidden ${expandedSections.budget ? 'max-h-[500px] mt-6 opacity-100' : 'max-h-0 opacity-0'}`}>
                        <div className="flex justify-between items-center mb-8 px-2">
                            <span className="text-[9px] font-medium text-neutral-300 uppercase tracking-widest italic">Maximum Price</span>
                            <div className="flex items-center gap-1.5 text-accent font-black italic">
                                <IndianRupee size={14} />
                                <span className="text-3xl tracking-tighter">{(filters.maxPrice / 1000).toFixed(0)}k</span>
                            </div>
                        </div>
                        <div className="relative px-2">
                            <input
                                type="range"
                                min="3000"
                                max="500000"
                                step="1000"
                                value={filters.maxPrice}
                                onChange={(e) => setFilters(prev => ({ ...prev, maxPrice: parseInt(e.target.value) }))}
                                className="w-full h-1.5 bg-neutral-100 rounded-full appearance-none cursor-pointer accent-accent hover:accent-accent-shade transition-all"
                            />
                            <div className="flex justify-between mt-6 text-[9px] font-black text-neutral-300 uppercase tracking-[0.3em]">
                                <span>Min 3k</span>
                                <span>Max 500k</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Type/Space Filters Section */}
                <div className="border-b border-neutral-50 pb-6 mb-2">
                    <button 
                        onClick={() => toggleSection('space')}
                        className="flex items-center justify-between w-full group py-4 transition-colors hover:text-accent"
                    >
                        <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-xl transition-all ${expandedSections.space ? 'bg-accent text-on-accent' : 'bg-neutral-50 text-neutral-400'}`}>
                                <Home size={14} />
                            </div>
                            <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-main">{viewType === 'rooms' ? 'Room Types' : 'Item Type'}</h4>
                        </div>
                        <ChevronDown size={18} className={`text-neutral-300 transition-transform duration-500 ${expandedSections.space ? 'rotate-180 text-accent' : ''}`} />
                    </button>

                    <div className={`flex flex-wrap gap-2.5 transition-all duration-500 overflow-hidden ${expandedSections.space ? 'max-h-[500px] mt-6 opacity-100' : 'max-h-0 opacity-0'}`}>
                        {(viewType === 'rooms' ? roomTypesList : furnitureCategoriesList).map(item => {
                            const count = counts.rooms[item] || 0;
                            const isActive = filters.roomTypes.includes(item);
                            return (
                                <button
                                    key={item}
                                    onClick={() => toggleRoom(item)}
                                    className={`group px-4 py-2.5 rounded-xl border-2 transition-all duration-500 flex items-center gap-2 active:scale-95 ${isActive 
                                        ? 'bg-neutral-900 text-white border-neutral-900 shadow-xl shadow-neutral-900/20' 
                                        : 'bg-white text-main border-neutral-50 hover:border-accent/10 hover:bg-neutral-50/50'}`}
                                >
                                    <span className="text-[10px] font-black uppercase tracking-wider">{item}</span>
                                    {count > 0 && (
                                        <span className={`text-[8px] font-black transition-colors ${isActive ? 'text-white/60' : 'text-neutral-300 group-hover:text-accent'}`}>
                                            ({count})
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Aesthetic Filters Section */}
                <div>
                    <button 
                        onClick={() => toggleSection('aesthetic')}
                        className="flex items-center justify-between w-full group py-4 transition-colors hover:text-accent"
                    >
                        <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-xl transition-all ${expandedSections.aesthetic ? 'bg-accent text-on-accent' : 'bg-neutral-50 text-neutral-400'}`}>
                                <Sparkles size={14} />
                            </div>
                            <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-main">Styles</h4>
                        </div>
                        <ChevronDown size={18} className={`text-neutral-300 transition-transform duration-500 ${expandedSections.aesthetic ? 'rotate-180 text-accent' : ''}`} />
                    </button>

                    <div className={`flex flex-wrap gap-2.5 transition-all duration-500 overflow-hidden ${expandedSections.aesthetic ? 'max-h-[500px] mt-6 opacity-100' : 'max-h-0 opacity-0'}`}>
                        {aestheticsList.map(aesthetic => {
                            const count = counts.styles[aesthetic] || 0;
                            const isActive = filters.styles.includes(aesthetic);
                            return (
                                <button
                                    key={aesthetic}
                                    onClick={() => toggleStyle(aesthetic)}
                                    className={`group px-6 py-4 rounded-2xl border-2 transition-all duration-500 flex items-center gap-3 active:scale-95 ${isActive 
                                        ? 'bg-neutral-900 text-white border-neutral-900 shadow-xl shadow-neutral-900/20' 
                                        : 'bg-white text-main border-neutral-50 hover:border-accent/10 hover:bg-neutral-50/50'}`}
                                >
                                    <span className="text-[10px] font-black uppercase tracking-widest">{aesthetic}</span>
                                    {count > 0 && (
                                        <span className={`text-[8px] font-black transition-colors ${isActive ? 'text-white/40' : 'text-neutral-300 group-hover:text-accent'}`}>
                                            ({count})
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Global Actions */}
            <div className="mt-8 pt-8 border-t border-neutral-50">
                <button
                    type="button"
                    onClick={() => { setFilters({ ...INITIAL_FILTER_STATE }); setSortBy('recommended'); }}
                    className="w-full py-5 rounded-[24px] border border-neutral-100 text-[10px] font-black uppercase tracking-[0.4em] text-neutral-400 hover:text-accent hover:border-accent hover:bg-accent/5 transition-all duration-500 group flex items-center justify-center gap-4"
                >
                    <SlidersHorizontal size={14} className="group-hover:rotate-180 transition-transform duration-700" />
                    Reset All
                </button>
            </div>
        </div>
    );
};

export default FilterSidebar;
