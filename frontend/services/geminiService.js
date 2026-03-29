/**
 * GeminiService - Connects the AI Consultant frontend to the backend pipeline.
 * 
 * Flow: Frontend → Spring Boot (port 8080, proxied by Vite) → Python Flask LLM (port 5001)
 *
 * The Vite dev server proxies /api/* to http://localhost:8080.
 * The Spring Boot backend proxies /api/chat/* to http://localhost:5001.
 */

class GeminiService {

    isAvailable() {
        return true;
    }

    async getDesignAdvice(userQuery, context) {
        try {
            const response = await fetch('/api/chat/consultant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userQuery, context })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Server error ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            return this._normalizeResponse(data);
        } catch (error) {
            console.error('Error fetching design advice:', error);
            throw error;
        }
    }

    async performVastuAudit(roomType, layoutDescription) {
        try {
            const response = await fetch('/api/chat/vastu', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roomType, description: layoutDescription })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Server error ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            return this._normalizeResponse(data);
        } catch (error) {
            console.error('Error performing Vastu audit:', error);
            throw error;
        }
    }

    /**
     * Normalize the response from the Python LLM service to ensure
     * the frontend always receives a consistent structure.
     */
    _normalizeResponse(data) {
        return {
            response_text: data.response_text || data.text || 'No response received.',
            products: Array.isArray(data.products) ? data.products : null,
            vastu: data.vastu || null,
            filters: data.filters || {},
            error: data.error || null,
        };
    }
}

export const geminiService = new GeminiService();
