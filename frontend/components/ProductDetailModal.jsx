import React, { useEffect } from 'react';
import { 
    X, ShoppingBag, Info, IndianRupee, Ruler, Palette, 
    Layers, Store, Award, ChevronRight, Share2, Heart,
    ArrowUpRight, BarChart3, LayoutGrid, ArrowLeft
} from 'lucide-react';
import ImageGallery from './ImageGallery';
import { toggleWatchlist, getUserProfile } from '../services/api';
import { useToast } from '../hooks/useToast';
import ToastContainer from './ToastContainer';
import { getProductShopUrl } from '../utils/productLinks';

const ProductDetailModal = ({ product, onClose }) => {
    const { toasts, removeToast, toast } = useToast();
    
    const [isSaved, setIsSaved] = React.useState(false);
    const [isSaving, setIsSaving] = React.useState(false);

    useEffect(() => {
        if (!product) return;
        const checkSavedStatus = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;
                
                const profile = await getUserProfile();
                if (profile.watchlist && profile.watchlist.includes(product.id)) {
                    setIsSaved(true);
                }
            } catch (err) {
                console.error("Error checking saved status:", err);
            }
        };
        checkSavedStatus();
    }, [product?.id]);

    useEffect(() => {
        if (!product) return;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [product]);

    if (!product) return null;

    const imageUrl = product.image_url || product.image || 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&q=80&w=800';
    const gallery = product.gallery || [imageUrl];
    const linkUrl = getProductShopUrl(product);

    const handleToggleSave = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                toast.error('Please login to save items');
                return;
            }

            setIsSaving(true);
            await toggleWatchlist(product.id);
            setIsSaved(!isSaved);
            window.dispatchEvent(new CustomEvent('a2s-saved-update'));
            toast.success(isSaved ? 'Removed from saved list' : 'Saved to list');
        } catch (err) {
            console.error("Error toggling save:", err);
            toast.error('Failed to update saved list');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed top-16 md:top-[72px] inset-x-0 bottom-0 z-50 flex flex-col bg-white animate-fade-in overflow-hidden">
            {/* Immersive Full-Screen Header Actions */}
            <div className="absolute top-0 left-0 right-0 z-[210] p-8 flex justify-between items-center bg-gradient-to-b from-black/5 to-transparent pointer-events-none">
                <button 
                    onClick={onClose}
                    className="flex items-center gap-4 px-6 py-3 rounded-full bg-white/80 hover:bg-main backdrop-blur-md text-main hover:text-white transition-all border border-main/10 shadow-2xl shadow-main/20 group pointer-events-auto"
                >
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em]">Back to Items</span>
                </button>

                <div className="flex items-center gap-3 pointer-events-auto">
                    <button 
                        onClick={handleToggleSave}
                        disabled={isSaving}
                        className={`p-4 rounded-full backdrop-blur-md transition-all border group ${isSaved ? 'bg-accent text-on-accent border-accent' : 'bg-black/5 hover:bg-black/10 text-main border-black/5'}`}
                    >
                        <Heart size={20} className={`${isSaved ? 'fill-current scale-110' : 'group-hover:scale-110'} transition-transform`} />
                    </button>
                    <button 
                        onClick={() => {
                            navigator.clipboard.writeText(window.location.href);
                            toast.success('Link copied to clipboard!');
                        }}
                        className="p-4 rounded-full bg-black/5 hover:bg-black/10 backdrop-blur-md text-main transition-all border border-black/5 group"
                    >
                        <Share2 size={20} className="group-hover:scale-110 transition-transform" />
                    </button>
                </div>
            </div>

            <div className="flex-1 flex flex-col md:flex-row w-full h-full overflow-hidden">
                {/* Left: Immersive Visual Section (Contain style for full product visibility) */}
                <div className="w-full md:w-[60%] h-[50vh] md:h-full bg-[#f8f8f8] overflow-hidden relative group flex items-center justify-center p-12 lg:p-24">
                    <div className="w-full h-full flex items-center justify-center">
                        <ImageGallery mainImage={imageUrl} gallery={gallery} title={product.name} />
                    </div>
                        {/* Style Label Badge - Removed as requested */}
                    </div>

                    {/* Right: Technical detail section */}
                    <div className="flex-1 overflow-y-auto p-12 md:p-16 custom-scrollbar bg-white">
                        {/* Breadcrumb / Category */}
                        <div className="flex items-center gap-3 mb-10">
                            <span className="text-[10px] font-black text-accent uppercase tracking-[0.3em]">{product.brand || 'Premium Selection'}</span>
                            <div className="w-6 h-px bg-neutral-100" />
                            <span className="text-[10px] font-black text-neutral-300 uppercase tracking-[0.3em]">{product.category || 'Item'}</span>
                        </div>

                        {/* Heading */}
                        <div className="mb-14">
                            <h2 className="font-serif text-[42px] md:text-[56px] font-black text-main leading-[1.05] italic tracking-tighter mb-6">
                                {product.name}
                            </h2>
                            <p className="text-sm text-neutral-400 font-medium leading-relaxed max-w-md">
                                {product.description || 'High-quality furniture carefully selected to match your home style. Every piece is built with premium materials and designed for both comfort and beauty.'}
                            </p>
                        </div>

                        {/* Specs & Intelligence Grid */}
                        <div className="grid grid-cols-2 gap-8 mb-14">
                            <div className="space-y-10">
                                <div className="flex flex-col gap-3">
                                    <span className="text-[9px] font-black text-neutral-300 uppercase tracking-widest flex items-center gap-2">
                                        <IndianRupee size={12} /> Price
                                    </span>
                                    <div className="text-4xl font-black text-main tracking-tighter">
                                        ₹{product.price.toLocaleString('en-IN')}
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1.5 border-l-2 border-accent/20 pl-6">
                                    <span className="text-[9px] font-black text-neutral-300 uppercase tracking-widest">Availability</span>
                                    <span className="text-xs font-black text-main uppercase tracking-widest flex items-center gap-2">
                                        <Store size={14} className="text-accent" />
                                        Sold by {product.vendor || 'Merchant'}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-6 p-8 rounded-[32px] bg-neutral-50/50 border border-neutral-100">
                                <div className="flex items-center gap-4">
                                    <Palette size={16} className="text-accent" />
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black text-neutral-300 uppercase tracking-widest">Finish</span>
                                        <span className="text-[11px] font-black text-main uppercase tracking-widest">{product.color || 'Custom'}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <Layers size={16} className="text-accent" />
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black text-neutral-300 uppercase tracking-widest">Material</span>
                                        <span className="text-[11px] font-black text-main uppercase tracking-widest">{product.material || 'Premium Finish'}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <Ruler size={16} className="text-accent" />
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black text-neutral-300 uppercase tracking-widest">Dimensions</span>
                                        <span className="text-[11px] font-black text-main uppercase tracking-widest">{product.dimensions || 'Hand-measured'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Platform Price Sync - COMING SOON */}
                        <div className="mb-14 p-10 rounded-[40px] bg-neutral-50 border-2 border-dashed border-neutral-100 relative group overflow-hidden">
                            <div className="absolute top-0 right-0 p-5">
                                <span className="px-4 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-[11px] font-black uppercase tracking-widest flex items-center gap-2">
                                    <BarChart3 size={11} /> Coming Soon
                                </span>
                            </div>
                            <div className="space-y-6 opacity-30 grayscale blur-[1px]">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400">Price on other sites</h4>
                                <div className="flex items-center gap-8">
                                    <div className="w-12 h-12 rounded-xl bg-neutral-200" />
                                    <div className="flex-1 h-2 bg-neutral-100 rounded-full" />
                                    <div className="w-24 h-6 bg-neutral-200 rounded-lg" />
                                </div>
                                <div className="flex items-center gap-8">
                                    <div className="w-12 h-12 rounded-xl bg-neutral-200" />
                                    <div className="flex-1 h-2 bg-neutral-100 rounded-full" />
                                    <div className="w-24 h-6 bg-neutral-200 rounded-lg" />
                                </div>
                            </div>
                        </div>

                        {/* CTA Section */}
                        <div className="flex flex-col gap-4 mb-14">
                                <a 
                                    href={linkUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn-premium btn-premium-gold w-full flex items-center justify-center gap-4 py-6 shadow-2xl shadow-accent/20 text-[13px] font-black uppercase tracking-[0.4em] group"
                                >
                                    <span>Go to Merchant</span>
                                    <ArrowUpRight size={22} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                </a>
                                <p className="text-[9px] text-center font-bold text-neutral-300 uppercase tracking-widest">Check availability on merchant website</p>
                        </div>

                        {/* Similar Concepts - COMING SOON */}
                        <div className="pt-10 border-t border-neutral-50 overflow-hidden">
                            <div className="flex justify-between items-center mb-8">
                                <div className="flex items-center gap-3">
                                    <LayoutGrid size={16} className="text-neutral-300" />
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400">Similar Items</h4>
                                </div>
                                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-accent/60">Coming Soon</span>
                            </div>
                            <div className="flex gap-6 opacity-25 grayscale saturate-50 pointer-events-none blur-[2px]">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="flex-shrink-0 w-40 h-40 rounded-[32px] bg-neutral-100 border border-neutral-200 shadow-inner" />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </div>
    );
};

export default ProductDetailModal;
