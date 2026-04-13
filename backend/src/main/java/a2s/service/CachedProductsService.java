package a2s.service;

import a2s.model.Product;
import a2s.model.ProductListItem;
import a2s.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class CachedProductsService {
    
    private List<ProductListItem> cachedProducts = new ArrayList<>();
    private boolean isLoaded = false;
    
    @Autowired
    private ProductRepository productRepository;
    
    public void loadCache() {
        if (!isLoaded) {
            System.out.println("Loading products into cache...");
            long start = System.currentTimeMillis();
            List<ProductListItem> allProducts = productRepository.findAllListItems();
            cachedProducts = new ArrayList<>(allProducts);
            isLoaded = true;
            long duration = System.currentTimeMillis() - start;
            System.out.println("Cached " + cachedProducts.size() + " products in " + duration + "ms");
        }
    }
    
    public List<ProductListItem> getProductsPage(int page, int size) {
        if (!isLoaded) loadCache();
        
        int start = page * size;
        int end = Math.min(start + size, cachedProducts.size());
        
        if (start >= cachedProducts.size()) {
            return new ArrayList<>();
        }
        
        return cachedProducts.subList(start, end);
    }
    
    public long getTotalCount() {
        if (!isLoaded) loadCache();
        return cachedProducts.size();
    }
}
