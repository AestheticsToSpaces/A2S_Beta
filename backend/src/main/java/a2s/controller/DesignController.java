package a2s.controller;

import a2s.model.Design;
import a2s.repository.DesignRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/gallery")
public class DesignController {

    @Autowired
    DesignRepository designRepository;

    @GetMapping
    public List<Design> getAllDesigns() {
        return designRepository.findAll();
    }

    @GetMapping("/{id}")
    @SuppressWarnings("null")
    public ResponseEntity<Design> getDesignById(@PathVariable String id) {
        Optional<Design> design = designRepository.findById(id);
        return design.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    @SuppressWarnings("null")
    public Design createDesign(@RequestBody Design design) {
        return designRepository.save(design);
    }

    @GetMapping("/room/{roomType}")
    public List<Design> getDesignsByRoomType(@PathVariable String roomType) {
        return designRepository.findByRoomType(roomType);
    }

    @GetMapping("/style/{style}")
    public List<Design> getDesignsByStyle(@PathVariable String style) {
        return designRepository.findByStyle(style);
    }
}
