package a2s.config;

import a2s.service.CachedProductsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;

@Configuration
@EnableAsync
public class CacheInitializationConfig {
    
    @Autowired
    private CachedProductsService cachedProductsService;
    
    @Bean
    public ApplicationRunner cacheInitializer() {
        return args -> {
            System.out.println("[CACHE] Starting product cache initialization...");
            long start = System.currentTimeMillis();
            cachedProductsService.loadCache();
            long duration = System.currentTimeMillis() - start;
            System.out.println("[CACHE] Product cache initialized in " + duration + "ms");
        };
    }
}
