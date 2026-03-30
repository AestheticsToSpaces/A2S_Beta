package a2s.repository;

import a2s.model.Design;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DesignRepository extends JpaRepository<Design, String> {

    @EntityGraph(attributePaths = {"products", "gallery", "tags"})
    List<Design> findAllBy();

    List<Design> findByRoomType(String roomType);

    List<Design> findByStyle(String style);
}
