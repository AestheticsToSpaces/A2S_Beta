package a2s.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import a2s.model.User;
import a2s.repository.UserRepository;
import java.util.Optional;
import java.util.HashMap;
import java.util.Map;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.core.io.ByteArrayResource;

@RestController
@RequestMapping("/api/chat")
@CrossOrigin(origins = "*", maxAge = 3600)
public class ChatController {

    @Autowired
    private UserRepository userRepository;

    private final RestTemplate restTemplate = new RestTemplate();

    @PostMapping
    @SuppressWarnings("null")
    public ResponseEntity<?> chat(@RequestBody Map<String, Object> request) {
        // Main chat endpoint (used by AIStylistWidget for general queries)
        // Check credits for general chat as well
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !auth.getPrincipal().equals("anonymousUser")) {
            String email = auth.getName();
            Optional<User> userOpt = userRepository.findByEmail(email);
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                if (user.getConsultantCredits() <= 0) {
                    Map<String, Object> errorBody = new HashMap<>();
                    errorBody.put("error", true);
                    errorBody.put("message", "You have exhausted your AI Consultant credits. Refer friends to earn more!");
                    errorBody.put("status", 403);
                    return ResponseEntity.status(403).body(errorBody);
                }
                user.setConsultantCredits(user.getConsultantCredits() - 1);
                userRepository.save(user);
            }
        }

        String llmBaseUrl = System.getenv("LLM_SERVICE_URL");
        if (llmBaseUrl == null || llmBaseUrl.isEmpty()) {
            llmBaseUrl = "http://localhost:5001";
        }
        String url = llmBaseUrl + "/api/chat";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(response.getBody());
        } catch (Exception e) {
            Map<String, Object> errorBody = new HashMap<>();
            errorBody.put("error", true);
            errorBody.put("message", "AI Architectural Consultant is currently unavailable. Please try again later.");
            errorBody.put("status", 503);
            return ResponseEntity.status(503).body(errorBody);
        }
    }

    @PostMapping("/consultant")
    @SuppressWarnings("null")
    public ResponseEntity<?> chatWithConsultant(@Valid @RequestBody ConsultantRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !auth.getPrincipal().equals("anonymousUser")) {
            String email = auth.getName();
            Optional<User> userOpt = userRepository.findByEmail(email);
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                if (user.getConsultantCredits() <= 0) {
                    Map<String, Object> errorBody = new HashMap<>();
                    errorBody.put("error", true);
                    errorBody.put("message", "You have exhausted your AI Consultant credits. Refer friends to earn more!");
                    errorBody.put("status", 403);
                    return ResponseEntity.status(403).body(errorBody);
                }
                user.setConsultantCredits(user.getConsultantCredits() - 1);
                userRepository.save(user);
            }
        }

        String llmBaseUrl = System.getenv("LLM_SERVICE_URL");
        if (llmBaseUrl == null || llmBaseUrl.isEmpty()) {
            llmBaseUrl = "http://localhost:5001";
        }
        String url = llmBaseUrl + "/api/chat";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, String> requestBody = new HashMap<>();
        requestBody.put("message", request.getMessage());

        HttpEntity<Map<String, String>> entity = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(response.getBody());
        } catch (Exception e) {
            Map<String, Object> errorBody = new HashMap<>();
            errorBody.put("error", true);
            errorBody.put("message", "AI service is currently unavailable. Please try again later.");
            errorBody.put("status", 503);
            return ResponseEntity.status(503).body(errorBody);
        }
    }

    @PostMapping(value = "/vastu", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @SuppressWarnings("null")
    public ResponseEntity<?> auditVastu(
            @RequestParam("roomType") String roomType,
            @RequestParam("description") String description,
            @RequestParam(value = "image", required = false) MultipartFile image) {
        
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !auth.getPrincipal().equals("anonymousUser")) {
            String email = auth.getName();
            Optional<User> userOpt = userRepository.findByEmail(email);
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                if (user.getVastuCredits() <= 0) {
                    Map<String, Object> errorBody = new HashMap<>();
                    errorBody.put("error", true);
                    errorBody.put("message", "You have exhausted your Vastu Audit credits. These are fixed per member.");
                    errorBody.put("status", 403);
                    return ResponseEntity.status(403).body(errorBody);
                }
                user.setVastuCredits(user.getVastuCredits() - 1);
                userRepository.save(user);
            }
        }

        String llmBaseUrl = System.getenv("LLM_SERVICE_URL");
        if (llmBaseUrl == null || llmBaseUrl.isEmpty()) {
            llmBaseUrl = "http://localhost:5001";
        }
        String url = llmBaseUrl + "/api/vastu";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("roomType", roomType);
        body.add("description", description);

        if (image != null && !image.isEmpty()) {
            System.out.println("[VASTU] Received image: " + image.getOriginalFilename() + " (" + image.getSize() + " bytes)");
            try {
                ByteArrayResource imageResource = new ByteArrayResource(image.getBytes()) {
                    @Override
                    public String getFilename() {
                        return image.getOriginalFilename();
                    }
                };
                body.add("image", imageResource);
            } catch (Exception e) {
                // log error
            }
        }

        HttpEntity<MultiValueMap<String, Object>> entity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(response.getBody());
        } catch (Exception e) {
            Map<String, Object> errorBody = new HashMap<>();
            errorBody.put("error", true);
            errorBody.put("message", "Vastu audit service is currently unavailable. Please try again later. " + e.getMessage());
            errorBody.put("status", 503);
            return ResponseEntity.status(503).body(errorBody);
        }
    }

    // DTOs with validation
    public static class ConsultantRequest {
        @NotBlank(message = "Message cannot be empty")
        private String message;

        public String getMessage() {
            return message;
        }

        public void setMessage(String message) {
            this.message = message;
        }
    }

    public static class VastuRequest {
        private String roomType;

        @NotBlank(message = "Layout description cannot be empty")
        private String description;

        public String getRoomType() {
            return roomType;
        }

        public void setRoomType(String roomType) {
            this.roomType = roomType;
        }

        public String getDescription() {
            return description;
        }

        public void setDescription(String description) {
            this.description = description;
        }
    }
}
