import { IndianRupee, Sparkles, Eye, Heart } from 'lucide-react';
import { useStore } from '../store/useStore';
import { toggleWatchlist as toggleWatchlistApi } from '../services/api';

const ProductCard = ({ product }) => {
    const cardRef = useRef(null);
    const [tilt, setTilt] = useState({ x: 0, y: 0 });
    
    // Zustand Store Hooks
    const saved = useStore(state => state.savedProducts.includes(product.id));
    const toggleSavedLocal = useStore(state => state.toggleSavedProduct);

    const imageUrl = product.image_url || product.image ||
        'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&q=80&w=400';
    const priceLabel = product.price_value || product.price || 0;
    
    const handleMouseMove = (e) => {
        if (!cardRef.current) return;
        const card = cardRef.current;
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * 12;
        const rotateY = ((centerX - x) / centerX) * 12;
        setTilt({ x: rotateX, y: rotateY });
    };

    const handleMouseLeave = () => {
        setTilt({ x: 0, y: 0 });
    };
    
    const handleSaveClick = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        toggleSavedLocal(product.id);
        
        const token = localStorage.getItem('token');
        if (token) {
            try {
                await toggleWatchlistApi(product.id);
            } catch (err) {
                console.error("Failed to sync watchlist to backend:", err);
            }
        }
    };

    return (
        <div 
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
                transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale3d(1.02, 1.02, 1.02)`,
                transition: tilt.x === 0 && tilt.y === 0 ? 'all 0.5s ease' : 'none'
            }}
            className="flex-shrink-0 w-full md:w-auto md:min-w-[280px] group animate-fade-in-up rounded-[40px] overflow-hidden border border-premium shadow-premium relative cursor-pointer bg-white transition-shadow hover:shadow-2xl"
        >
            <div className="relative h-96 overflow-hidden bg-main">
                <img
                    src={imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-[2s] ease-out group-hover:scale-110"
                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&q=80&w=400'; }}
                />
                
                {/* Floating Meta: Save */}
                <div className="absolute top-6 right-6 flex flex-col gap-3 z-20">
                    <button
                        onClick={handleSaveClick}
                        className={`p-3 rounded-full backdrop-blur-xl border border-white/20 transition-all duration-300 ${saved ? 'bg-red-500 text-white shadow-lg' : 'bg-white/10 text-white hover:bg-white hover:text-red-500'}`}
                        aria-label={saved ? 'Unsave item' : 'Save item'}
                    >
                        <Heart size={16} fill={saved ? 'currentColor' : 'none'} />
                    </button>
                </div>

                {/* Style Badge */}
                <div className="absolute top-6 left-6 z-10">
                    <span className="px-4 py-2 rounded-full bg-accent text-[8px] font-black uppercase tracking-[0.2em] text-on-accent border border-accent shadow-xl shadow-accent/20 flex items-center gap-2">
                        <Sparkles size={10} />
                        {product.style || product.category || 'Minimal'}
                    </span>
                </div>

                {/* Color Swatch */}
                {product.colorHex && (
                    <div className="absolute top-6 right-6 z-10 group-hover:scale-110 transition-transform duration-300">
                        <div 
                            className="w-8 h-8 rounded-full border-2 border-white shadow-lg"
                            style={{ backgroundColor: product.colorHex }}
                            title={product.color}
                        />
                    </div>
                )}

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-700" />

                {/* Info Layer */}
                <div className="absolute bottom-8 left-8 right-8 transition-transform duration-500 group-hover:-translate-y-4">
                    <p className="text-[9px] text-accent uppercase tracking-[0.4em] mb-2 font-black italic">{product.brand}</p>
                    <h4 className="font-serif text-xl font-bold text-white mb-4 line-clamp-2 leading-tight drop-shadow-lg">{product.name}</h4>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center text-lg font-black text-white">
                            <IndianRupee size={16} className="text-accent" />
                            <span>{priceLabel.toLocaleString('en-IN')}</span>
                        </div>
                        <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">{product.vendor}</span>
                    </div>
                </div>

                {/* Reveal Specifications Layer */}
                <div className="absolute inset-x-0 bottom-0 py-10 flex flex-col items-center justify-center translate-y-full group-hover:translate-y-0 transition-transform duration-[0.8s] ease-premium bg-surface/95 backdrop-blur-xl border-t border-premium">
                    <p className="text-[10px] font-black text-muted uppercase tracking-[0.5em] mb-6">Explore Piece</p>
                    <div className="flex items-center gap-4 text-main">
                         <span className="w-10 h-px bg-accent/30" />
                         <div className="w-12 h-12 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                            <Eye size={20} />
                         </div>
                         <span className="w-10 h-px bg-accent/30" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
