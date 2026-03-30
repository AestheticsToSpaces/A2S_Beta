package a2s.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import a2s.model.User;
import a2s.repository.UserRepository;
import java.util.Optional;
import java.util.HashMap;
import java.util.Map;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/waitlist")
public class WaitlistController {

    @Autowired
    UserRepository userRepository;

    @GetMapping("/status")
    @SuppressWarnings("null")
    public ResponseEntity<?> getWaitlistStatus() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getName())) {
            return ResponseEntity.status(401).body(Map.of("message", "Please log in to view waitlist status"));
        }
        String email = authentication.getName();
        
        Optional<User> userOpt = userRepository.findByEmail(email);
        boolean joined = userOpt.map(User::getJoinedPhase2Waitlist).orElse(false);

        Map<String, Object> response = new HashMap<>();
        
        if (joined && userOpt.isPresent()) {
            User user = userOpt.get();
            if (user.getWaitlistJoinedAt() == null) {
                user.setWaitlistJoinedAt(LocalDateTime.now().minusDays(1)); // Default for legacy
                userRepository.save(user);
            }
            
            long countBefore = userRepository.countByJoinedPhase2WaitlistTrueAndWaitlistJoinedAtBefore(user.getWaitlistJoinedAt());
            long totalWaitlist = userRepository.countByJoinedPhase2WaitlistTrue();
            long rank = countBefore + 1;
            
            // Progress is calculated relative to a goal (e.g. 2000)
            int progress = (int) Math.min(95, 75 + (totalWaitlist * 20 / 2000));
            
            response.put("joined", true);
            response.put("rank", "#" + String.format("%,d", rank));
            response.put("progress", progress);
            response.put("inviteCode", "A2S-PHASE2-" + (1000 + (Math.abs(user.getId().hashCode()) % 9000)));
        } else {
            response.put("joined", false);
            response.put("rank", "-");
            response.put("progress", 0);
            response.put("inviteCode", null);
        }
        
        return ResponseEntity.ok(response);
    }

    @PostMapping("/join")
    @SuppressWarnings("null")
    public ResponseEntity<?> joinWaitlist() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getName())) {
            return ResponseEntity.status(401).body(Map.of("message", "Please log in to join the waitlist"));
        }
        String email = authentication.getName();
        
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (!Boolean.TRUE.equals(user.getJoinedPhase2Waitlist())) {
                user.setJoinedPhase2Waitlist(true);
                user.setWaitlistJoinedAt(LocalDateTime.now());
                userRepository.save(user);
            }
            return ResponseEntity.ok(Map.of("message", "Successfully joined Phase 2 waitlist"));
        }
        
        return ResponseEntity.badRequest().body(Map.of("message", "User not found. Please log in again."));
    }
}
