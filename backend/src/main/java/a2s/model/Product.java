package a2s.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import jakarta.persistence.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "products")
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", columnDefinition = "VARCHAR(36)")
    private String id;

    private String name;
    private String brand;
    private String category;
    private String aestheticStyle; // Minimal, Contemporary, Luxury, Boho, Industrial, Scandinavian, etc.
    private String roomType; // Living Room, Bedroom, Kitchen, Dining Room, Study, Pooja Room, etc.
    private Double price;
    private String dimensions;
    private String color;
    private String colorHex;
    private String material;
    private String vendor;

    @Embedded
    private AlternativeVendor alternativeVendor;

    @Column(length = 2000)
    private String description;

    private String affiliateLink;
    private String image;
    
    @JsonIgnore
    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "product_gallery", joinColumns = @JoinColumn(name = "product_id", columnDefinition = "VARCHAR(36)"))
    @Column(name = "image_url", columnDefinition = "VARCHAR(255)")
    private java.util.List<String> gallery = new java.util.ArrayList<>();

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Embeddable
    public static class AlternativeVendor {
        @Column(name = "alt_vendor_name")
        private String name;
        @Column(name = "alt_vendor_price")
        private Double price;
    }

    @PostLoad
    @PrePersist
    @PreUpdate
    private void normalizeBrand() {
        if (brand == null || brand.isBlank() || "Unknown".equalsIgnoreCase(brand.trim())) {
            brand = (vendor != null && !vendor.isBlank()) ? vendor.trim() : "Marketplace";
        }
    }
}
