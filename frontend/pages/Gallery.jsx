import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
    Sparkles, Search, X, IndianRupee, Eye, ArrowUp, SlidersHorizontal,
    ArrowUpRight, Home, Sofa, ChevronDown, Grid3X3, Rows3, TrendingUp, Layout,
    Compass, Layers, Award, Box
} from 'lucide-react';
import DesignCard from '../components/DesignCard';
import ProductCard from '../components/ProductCard';
import RelatedProducts from '../components/RelatedProducts';
import ImageGallery from '../components/ImageGallery';
import FilterSidebar from '../components/FilterSidebar';
import SkeletonCard from '../components/SkeletonCard';
import ProductDetailModal from '../components/ProductDetailModal';
import { INITIAL_FILTER_STATE } from '../constants';
import { getInitialFiltersFromOnboarding } from '../utils/storage';
import { getDesigns, getProducts, getDesignsCached, getProductsCached } from '../services/api';
import { openProductInNewTab } from '../utils/productLinks';

// Animated counter hook
function useCountUp(target, duration = 1200) {
    const [count, setCount] = useState(0);
    useEffect(() => {
        if (!target) return;
        let start = 0;
        const increment = target / (duration / 16);
        const timer = setInterval(() => {
            start += increment;
            if (start >= target) { setCount(target); clearInterval(timer); }
            else setCount(Math.floor(start));
        }, 16);
        return () => clearInterval(timer);
    }, [target, duration]);
    return count;
}

const Gallery = () => {
    const [filters, setFilters] = useState(() => getInitialFiltersFromOnboarding());
    const [designs, setDesigns] = useState([]);
    const [standaloneProducts, setStandaloneProducts] = useState([]);
    const [sortBy, setSortBy] = useState('recommended');
    const [searchQuery, setSearchQuery] = useState('');
    const [viewType, setViewType] = useState('furniture');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [previewItem, setPreviewItem] = useState(null);
    const [showBackToTop, setShowBackToTop] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState('all');
    const [isSortOpen, setIsSortOpen] = useState(false);
    const heroRef = useRef(null);
    const [heroScrolled, setHeroScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setShowBackToTop(window.scrollY > 400);
            if (heroRef.current) {
                setHeroScrolled(window.scrollY > heroRef.current.offsetHeight * 0.5);
            }
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = useCallback(() => window.scrollTo({ top: 0, behavior: 'smooth' }), []);

    const fetchData = useCallback(async () => {
        try {
            const cachedDesigns = getDesignsCached();
            const cachedProducts = getProductsCached();
            const hasCache = cachedDesigns?.length > 0 || cachedProducts?.length > 0;

            if (hasCache) {
                setDesigns(cachedDesigns || []);
                setStandaloneProducts(cachedProducts || []);
                setIsLoading(false);
            } else {
                setIsLoading(true);
            }
            setError(null);

            const [designsData, productsData] = await Promise.all([getDesigns(), getProducts()]);
            setDesigns(designsData);
            setStandaloneProducts(productsData);
        } catch (err) {
            console.error('Failed to fetch gallery data:', err);
            if (!designs.length && !standaloneProducts.length) {
                setError('Unable to load items. Please check your connection.');
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const furnitureItems = useMemo(() => {
        const products = [...standaloneProducts];
        const seenIds = new Set(standaloneProducts.map(p => p.id));
        designs.forEach(design => {
            (design.products || []).forEach(product => {
                if (!seenIds.has(product.id)) { seenIds.add(product.id); products.push(product); }
            });
        });
        return products;
    }, [designs, standaloneProducts]);

    // Dynamic Categories derived from data
    const dynamicCategories = useMemo(() => {
        const cats = [
            { id: 'all', label: 'All Items', icon: Grid3X3, filter: '' }
        ];

        if (viewType === 'rooms') {
            const roomTypes = [...new Set(designs.map(d => d.roomType).filter(Boolean))];
            roomTypes.forEach(rt => {
                let Icon = Layout;
                if (rt.toLowerCase().includes('living')) Icon = Sofa;
                if (rt.toLowerCase().includes('bed')) Icon = Home;
                if (rt.toLowerCase().includes('kitchen')) Icon = Sparkles;
                if (rt.toLowerCase().includes('dining')) Icon = Rows3;
                if (rt.toLowerCase().includes('office')) Icon = TrendingUp;

                cats.push({ id: rt.toLowerCase().replace(/\s+/g, '-'), label: rt, icon: Icon, filter: rt });
            });
        } else {
            const productCats = [...new Set(furnitureItems.map(p => p.category).filter(Boolean))];
            productCats.forEach(pc => {
                cats.push({ id: pc.toLowerCase().replace(/\s+/g, '-'), label: pc, icon: Box, filter: pc });
            });
        }
        return cats;
    }, [designs, furnitureItems, viewType]);

    const filteredItems = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (viewType === 'rooms') {
            const results = designs.filter(design => {
                const matchesPrice = design.totalCost >= (filters.minPrice || 0) && design.totalCost <= (filters.maxPrice || 1000000);
                const matchesStyle = !filters.styles?.length || filters.styles.some(s => (design.style?.toLowerCase() || '').includes(s.toLowerCase()));
                const matchesRoom = !filters.roomTypes?.length || filters.roomTypes.some(r => (design.roomType?.toLowerCase() || '').includes(r.toLowerCase()) || (design.title?.toLowerCase() || '').includes(r.toLowerCase()));
                const matchesSearch = !query || (design.title || '').toLowerCase().includes(query) || (design.style || '').toLowerCase().includes(query) || (design.roomType || '').toLowerCase().includes(query);
                const targetCategory = dynamicCategories.find(c => c.id === activeCategory);
                const matchesCategory = activeCategory === 'all' || (design.roomType?.toLowerCase().includes(targetCategory?.filter?.toLowerCase() || '') || design.category?.toLowerCase().includes(targetCategory?.filter?.toLowerCase() || ''));
                return matchesPrice && matchesStyle && matchesRoom && matchesSearch && matchesCategory;
            });
            return [...results].sort((a, b) => sortBy === 'price-low' ? a.totalCost - b.totalCost : sortBy === 'price-high' ? b.totalCost - a.totalCost : 0);
        } else {
            const results = furnitureItems.filter(product => {
                const matchesPrice = product.price >= (filters.minPrice || 0) && product.price <= (filters.maxPrice || 1000000);
                const targetCategory = dynamicCategories.find(c => c.id === activeCategory);
                const matchesCategory = activeCategory === 'all' || (product.category?.toLowerCase().includes(targetCategory?.filter?.toLowerCase() || ''));
                const matchesFilterRoom = !filters.roomTypes?.length || filters.roomTypes.some(cat => (product.category || '').toLowerCase().includes(cat.toLowerCase()) || (product.name || '').toLowerCase().includes(cat.toLowerCase()));
                const matchesSearch = !query || (product.name || '').toLowerCase().includes(query) || (product.brand || '').toLowerCase().includes(query);
                return matchesPrice && matchesCategory && matchesSearch && matchesFilterRoom;
            });
            return [...results].sort((a, b) => sortBy === 'price-low' ? a.price - b.price : sortBy === 'price-high' ? b.price - a.price : 0);
        }
    }, [designs, furnitureItems, filters, sortBy, searchQuery, viewType, activeCategory, dynamicCategories]);

    const filterCounts = useMemo(() => {
        const counts = { rooms: {}, styles: {} };
        designs.forEach(d => {
            const room = d.roomType;
            const style = d.style;
            if (room) counts.rooms[room] = (counts.rooms[room] || 0) + 1;
            if (style) counts.styles[style] = (counts.styles[style] || 0) + 1;
        });
        furnitureItems.forEach(p => {
            const cat = p.category;
            if (cat) counts.rooms[cat] = (counts.rooms[cat] || 0) + 1;
        });
        return counts;
    }, [designs, furnitureItems]);

    const styleCount = useMemo(() => new Set(designs.map(d => d.style).filter(Boolean)).size, [designs]);

    const designCountNum = useCountUp(designs.length);
    const productCountNum = useCountUp(standaloneProducts.length);
    const styleCountNum = useCountUp(styleCount);

    const activeFilterCount = (filters.roomTypes?.length || 0) + (filters.styles?.length || 0) + (filters.maxPrice < 200000 ? 1 : 0);

    const trendingSearches = useMemo(() => {
        const tags = designs.flatMap(d => d.tags || []);
        const styles = designs.map(d => d.style).filter(Boolean);
        return [...new Set([...styles, ...tags])].slice(0, 5);
    }, [designs]);

    // Lock scroll when modal is open
    useEffect(() => {
        if (previewItem) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = 'auto';
        return () => { document.body.style.overflow = 'auto'; };
    }, [previewItem]);

    return (
        <div className="min-h-screen bg-main pb-24 transition-all duration-1000 relative overflow-hidden">
            {/* Ambient Background Orbs */}
            <div className="ambient-orb ambient-orb-1 opacity-60" />
            <div className="ambient-orb ambient-orb-2 opacity-60" />

            {/* ── IMMERSIVE 3D ROOM HERO ─────────────────────────────────── */}
            <header ref={heroRef} className="relative overflow-hidden min-h-[85vh] flex items-end group">
                {/* Full-bleed 3D Room Background */}
                <div className="absolute inset-0">
                    <img
                        src="/gallery.png"
                        alt="Immersive Living Space"
                        className="w-full h-full object-cover"
                        loading="eager"
                    />
                    <div className="absolute inset-0 shadow-[inset_0_0_150px_40px_rgba(0,0,0,0.3)]" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-[var(--color-main)] via-[var(--color-main)]/60 to-transparent" />
                    <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/20 to-transparent" />
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-8 pb-24 w-full">
                    <div className="max-w-4xl lg:max-w-none">
                        <div className="flex items-center gap-4 mb-8 animate-fade-in-up">
                            <div className="w-16 h-px bg-accent shadow-[0_0_20px_rgba(212,175,55,0.8)]" />
                            <span className="text-[11px] font-black text-accent uppercase tracking-[0.7em] drop-shadow-2xl">The Unspoken</span>
                        </div>

                        <h1 className="font-serif text-6xl md:text-8xl font-black text-white leading-[0.95] tracking-tighter mb-10 animate-fade-in-up drop-shadow-[0_10px_40px_rgba(0,0,0,0.8)]" style={{ animationDelay: '0.15s' }}>
                            <span className="font-light italic opacity-90">Where </span>
                            <span className="font-bold">Light</span>
                            <br />
                            <span className="text-gradient-gold not-italic drop-shadow-[0_2px_30px_rgba(212,175,55,0.5)] tracking-wide">Meets Silence...</span>
                        </h1>

                        <p className="text-base md:text-lg text-white/80 font-light leading-relaxed max-w-md italic animate-fade-in-up drop-shadow-[0_4px_20px_rgba(0,0,0,0.6)]" style={{ animationDelay: '0.35s' }}>
                            A collection of narratives that breathe within the walls, waiting for a story that has not yet been told...
                        </p>
                    </div>
                </div>
            </header>

            <div className="max-w-[1500px] mx-auto px-8 pt-12 relative z-20">
                <div className="flex flex-col lg:flex-row items-center gap-5 mb-8 animate-fade-in-up">
                    <div className="relative flex-1 group w-full">
                        <Search size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-accent transition-all" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={`Search`}
                            className="w-full pl-16 pr-14 py-5 rounded-full bg-white border border-neutral-200 text-[13px] font-bold text-neutral-800 tracking-wider focus:outline-none focus:border-accent/50 focus:shadow-xl shadow-sm transition-all placeholder:text-neutral-400 placeholder:italic"
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} className="absolute right-5 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-neutral-100 text-neutral-400">
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-3 w-full lg:w-auto">
                        <button
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className={`flex items-center gap-3 px-8 py-5 rounded-full border text-[11px] font-black uppercase tracking-[0.2em] shadow-lg transition-all active:scale-95 ${isFilterOpen ? 'bg-neutral-900 text-white border-neutral-900' : 'bg-white border-neutral-200 text-neutral-800 hover:border-accent/40 hover:shadow-xl'}`}
                        >
                            <SlidersHorizontal size={16} className={`${isFilterOpen ? 'rotate-180' : ''} transition-transform duration-500`} />
                            Filters & Sort
                            {!isFilterOpen && (activeFilterCount > 0 || sortBy !== 'recommended') && (
                                <span className="w-6 h-6 rounded-full bg-accent text-on-accent text-[10px] flex items-center justify-center font-black animate-scale-in">
                                    {(activeFilterCount || 0) + (sortBy !== 'recommended' ? 1 : 0)}
                                </span>
                            )}
                        </button>

                        <div className="px-5 py-4 rounded-full text-[10px] font-black uppercase tracking-widest text-muted italic whitespace-nowrap">
                            <span className="text-accent">{filteredItems.length}</span> found
                        </div>
                    </div>
                </div>

                {isFilterOpen && (
                    <div className="fixed inset-0 z-[70] animate-fade-in">
                        <div className="absolute inset-0 bg-main/50 backdrop-blur-xl" onClick={() => setIsFilterOpen(false)} />
                        <aside className="absolute left-8 top-32 bottom-32 w-[440px] z-10 animate-fade-in-left">
                            <FilterSidebar
                                filters={filters}
                                setFilters={setFilters}
                                viewType={viewType}
                                counts={filterCounts}
                                sortBy={sortBy}
                                setSortBy={setSortBy}
                                onClose={() => setIsFilterOpen(false)}
                            />
                        </aside>
                    </div>
                )}

                {isLoading ? (
                    <div className={`grid gap-10 ${viewType === 'rooms' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} style={{ animationDelay: `${i * 0.1}s` }} className="animate-fade-in-up">
                                <SkeletonCard type={viewType === 'rooms' ? 'room' : 'product'} />
                            </div>
                        ))}
                    </div>
                ) : error ? (
                    <div className="py-48 text-center glass-premium rounded-[64px] border-2 border-dashed border-red-100 max-w-4xl mx-auto shadow-2xl">
                        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-8 text-red-500 border border-red-100">
                            <X size={40} />
                        </div>
                        <h2 className="font-serif text-4xl font-black text-red-400 italic mb-4">Connection Lost</h2>
                        <p className="text-neutral-400 mb-10 max-w-sm mx-auto">{error}</p>
                        <button onClick={() => fetchData()} className="btn-premium btn-premium-gold px-12 py-5 shadow-lg">Try Again</button>
                    </div>
                ) : filteredItems.length > 0 ? (
                    <div className={`grid gap-10 ${viewType === 'rooms' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
                        {filteredItems.map((item, index) =>
                            viewType === 'rooms'
                                ? <div key={item.id} style={{ animationDelay: `${index * 0.05}s` }} className="animate-fade-in-up"><DesignCard design={item} onQuickPreview={setPreviewItem} /></div>
                                : <div key={item.id} style={{ animationDelay: `${index * 0.04}s` }} className="animate-fade-in-up" onClick={() => setPreviewItem(item)}><ProductCard product={item} /></div>
                        )}
                    </div>
                ) : (
                    <div className="py-48 text-center glass-premium rounded-[64px] border-2 border-dashed border-neutral-100 max-w-4xl mx-auto">
                        <div className="w-24 h-24 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-8 text-neutral-300 border border-neutral-100 animate-pulse">
                            <Search size={48} />
                        </div>
                        <h2 className="font-serif text-4xl font-black text-neutral-300 italic mb-4">No Matches Found</h2>
                        <p className="text-neutral-400 text-sm mb-10 max-w-sm mx-auto">Our gallery currently has no matches for your specific selection. Try resetting filters.</p>
                        <button onClick={() => { setFilters({ ...INITIAL_FILTER_STATE }); setSearchQuery(''); setActiveCategory('all'); }} className="btn-premium btn-premium-outline px-12 py-5 shadow-lg">Reset All</button>
                    </div>
                )}

                {viewType === 'furniture' && previewItem && (
                    <ProductDetailModal
                        product={previewItem}
                        onClose={() => setPreviewItem(null)}
                    />
                )}
            </div>

            {viewType === 'rooms' && previewItem && (
                <div className="fixed top-[63px] md:top-[71px] inset-x-0 bottom-0 z-50 flex flex-col md:flex-row bg-white animate-fade-in overflow-hidden" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setPreviewItem(null)} className="absolute top-10 right-10 z-[60] p-4 bg-main/5 hover:bg-main/10 rounded-full text-main transition-transform hover:rotate-90">
                        <X size={24} />
                    </button>

                    <div className="flex-1 min-h-[400px] relative bg-neutral-50 flex items-center justify-center p-12 overflow-hidden">
                        <ImageGallery mainImage={previewItem.image} gallery={previewItem.gallery} title={previewItem.title} />
                    </div>

                    <div className="w-full lg:w-[480px] shrink-0 flex flex-col bg-white overflow-y-auto">
                        <div className="p-12 pb-20">
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="font-serif text-[44px] font-black text-main leading-[0.95] mb-4 tracking-tighter italic">
                                    {previewItem.title}
                                </h2>
                            </div>

                            <p className="text-lg text-neutral-500 font-light leading-relaxed mb-12">
                                {previewItem.description || "A beautiful space designed for you. Every piece is chosen to look and feel right in your home."}
                            </p>

                            <div className="grid grid-cols-2 gap-8 p-10 bg-surface rounded-[40px] border border-premium mb-12 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-bl-full translate-x-8 -translate-y-8" />
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Award size={14} className="text-accent" />
                                        <span className="text-[10px] font-black text-neutral-300 uppercase tracking-widest">Style</span>
                                    </div>
                                    <span className="text-sm font-black text-main uppercase tracking-widest">{previewItem.style}</span>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Home size={14} className="text-accent" />
                                        <span className="text-[10px] font-black text-neutral-300 uppercase tracking-widest">Room Type</span>
                                    </div>
                                    <span className="text-sm font-black text-main uppercase tracking-widest">{previewItem.roomType}</span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2 mb-12">
                                <span className="text-[11px] font-black text-neutral-300 uppercase tracking-[0.4em]">Total Price</span>
                                <div className="flex items-center gap-3 text-main font-black">
                                    <IndianRupee size={32} className="text-accent" />
                                    <span className="text-6xl tracking-tighter">
                                        {previewItem.totalCost?.toLocaleString('en-IN')}
                                    </span>
                                </div>
                            </div>

                            <Link to={`/design/${previewItem.id}`} className="btn-premium btn-premium-gold w-full py-6 rounded-3xl flex items-center justify-center gap-4 text-lg shadow-gold/20 shadow-2xl group">
                                View Full Design
                                <ArrowUpRight size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {showBackToTop && (
                <button
                    onClick={scrollToTop}
                    className="fixed right-8 bottom-8 z-50 p-6 rounded-full bg-main text-white shadow-2xl hover:bg-accent transition-all duration-500 hover:scale-110 animate-fade-in-up"
                >
                    <ArrowUp size={24} />
                </button>
            )}

            {isSortOpen && <div className="fixed inset-0 z-20" onClick={() => setIsSortOpen(false)} />}
        </div>
    );
};

export default Gallery;
