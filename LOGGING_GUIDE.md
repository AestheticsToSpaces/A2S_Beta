# Logging Quick Reference Guide

## Accessing Logs

### Real-time Backend Logs
```bash
docker logs -f a2s-backend
```

### Last N log lines
```bash
docker logs --tail 100 a2s-backend
```

### Search for specific events
```bash
# Find all Vastu analysis events
docker logs a2s-backend 2>&1 | grep "VASTU_"

# Find all errors
docker logs a2s-backend 2>&1 | grep -i "ERROR"

# Find slow requests (>5s)
docker logs a2s-backend 2>&1 | grep "SLOW_REQUEST"
```

### Inside Container (if needed)
```bash
docker exec -it a2s-backend sh
# View log files
tail -f /app/logs/app.log
tail -f /app/logs/error.log
```

---

## Log Format

Each log entry follows this pattern:
```
[TIMESTAMP] [THREAD] [LEVEL] [LOGGER] - [MESSAGE]

Example:
2026-04-02 17:19:47.038 [http-nio-8080-exec-1] INFO a2s.filter.RequestLoggingFilter - [REQUEST] POST /api/vastu/analyse | ID: e3363852
```

---

## Key Log Events & Meanings

### Request Start
```
[REQUEST] POST /api/vastu/analyse | ID: 83cd088a
```
- **What**: HTTP request received
- **ID**: Unique request identifier for tracing
- **Action**: Look for corresponding [RESPONSE] entry

### Image Processing
```
[VASTU_IMAGE_ACCEPTED] index=0, size_kb=4.6, type=image/jpeg
```
- **What**: Image passed validation
- **size_kb**: File size (should be < 10240)
- **type**: MIME type (image/jpeg, image/png, etc.)

### Cache Hit (Fast Path)
```
[VASTU_CACHE_HIT] cache_key=f8ad2ff3d85c3a9106f23f04fc9d8c93, user_id=13cca3b4...
[VASTU_ANALYSE_COMPLETE] cache_hit=true, duration_ms=222
```
- **What**: Identical request found in cache
- **Duration**: Should be < 500ms
- **Action**: No new LLM call needed

### LLM Call (Fresh Analysis)
```
[VASTU_LLM_CALL_START] url=http://a2s-llm:5001/api/vastu/analyse
[VASTU_LLM_CALL_SUCCESS] status=200 OK, duration_ms=350
[VASTU_ANALYSE_COMPLETE] cache_hit=false, score=70, duration_ms=550
```
- **What**: Fresh analysis request sent to LLM service
- **duration_ms**: LLM processing time
- **score**: Vastu analysis score (0-100)
- **Expected**: 2-4 seconds for fresh analysis

### Errors
```
[VASTU_FILE_TOO_LARGE] index=0, size_mb=15.5
[VASTU_INVALID_IMAGE_TYPE] index=0, content_type=application/pdf
[VASTU_RATE_LIMIT_EXCEEDED] user_id=13cca3b4..., used=3, limit=3
```
- **What**: Request failed validation
- **Action**: Check user input and rate limits

### LLM Errors
```
[VASTU_LLM_CALL_FAILED] status=400, duration_ms=245, error=org.springframework.web.client.HttpClientErrorException
[VASTU_LLM_ERROR_BODY] {"error_code":"LOW_DIRECTION_CONFIDENCE",...}
```
- **What**: LLM service returned error
- **Action**: Check error_code field, check LLM service health

### Exceptions
```
[VASTU_ANALYSE_ERROR] duration_ms=145, exception=Unable to access lob stream
org.springframework.orm.jpa.JpaSystemException: Unable to access lob stream
        at org.springframework.orm.jpa.vendor.HibernateJpaDialect.convertHibernateAccessException
```
- **What**: Unexpected error occurred
- **Action**: Check exception type and stack trace

### Response Completion
```
[RESPONSE] POST /api/vastu/analyse | Status: 200 | Duration: 500ms | ID: e3363852
```
- **Status**: HTTP status code
  - **200**: Success ✅
  - **400**: Bad request (validation failed)
  - **401**: Unauthorized (auth failed)
  - **429**: Rate limited
  - **503**: Server error
- **Duration**: Total request time

---

## Common Troubleshooting Patterns

### Issue: Request Takes > 10 seconds
**Log Pattern**:
```
[REQUEST] ... | ID: abc123
[VASTU_ANALYSE_START] ...
[VASTU_LLM_CALL_START] ...
[VASTU_LLM_CALL_SUCCESS] ... duration_ms=8000
```
**Cause**: LLM service is slow  
**Action**: Check LLM container: `docker logs a2s-llm`

### Issue: File Upload Rejected
**Log Pattern**:
```
[VASTU_FILE_TOO_LARGE] index=0, size_mb=15.5
```
**Cause**: File > 10MB  
**Action**: User must compress/resize image

### Issue: Unknown Error
**Log Pattern**:
```
[VASTU_ANALYSE_ERROR] exception=Unable to access lob stream
```
**Cause**: Database transaction issue  
**Action**: Check database logs: `docker logs a2s-postgres`

### Issue: Cache Only Working Sometimes
**Log Pattern**:
```
[VASTU_ANALYSE_COMPLETE] cache_hit=false  (always)
```
**Cause**: Different room_type/direction/floor combinations  
**Action**: Cache key = hash(room_type + facing_direction + floor + image_bytes)

---

## Performance Benchmarks

| Scenario | Expected Duration | Log Indicator |
|----------|------------------|---------------|
| Cache Hit (200) | 200-500ms | `cache_hit=true, duration_ms=XXX` |
| Fresh Analysis (200) | 2-4s | `cache_hit=false, duration_ms=XXXX` |
| Image Validation Error (400) | <100ms | `[VASTU_FILE_TOO_LARGE]` |
| Rate Limit Hit (429) | <10ms | `[VASTU_RATE_LIMIT_EXCEEDED]` |
| LLM Timeout (503) | 30s+ | `[VASTU_LLM_CALL_FAILED]` |

---

## Health Check Monitoring

### Check Health Endpoint
```bash
curl http://localhost:8080/api/health | jq
```

### Expected Response
```json
{
  "status": "UP",
  "components": {
    "vastuEndpointHealthIndicator": {
      "status": "UP",
      "details": {
        "timestamp": "2026-04-02T17:22:15.042+00:00",
        "endpoint": "/api/vastu/analyse",
        "llm_service": "a2s-llm:5001",
        "llm_status": "UP",
        "llm_response_time_ms": 45,
        "multipart_processing": "ENABLED",
        "max_file_size": "50MB",
        "status": "Ready to accept Vastu analysis requests"
      }
    }
  }
}
```

### What to Check
- ✅ `status`: Should be "UP"
- ✅ `vastuEndpointHealthIndicator.llm_status`: Should be "UP"
- ⚠️ `llm_response_time_ms`: Should be < 100ms
- ❌ If ANYTHING is "DOWN": Service is degraded

---

## Log Files Location

### Inside Container
```
/app/logs/app.log      - All application logs
/app/logs/error.log    - Error/Warning level only
/app/logs/app.*.log    - Rolled over daily
```

### Retention Policy
- Max file size: 10MB
- Keep files for: 14 days
- Total size cap: 1GB for app.log, 500MB for error.log

---

## Integration with Monitoring Tools

### For ELK Stack (Elasticsearch-Logstash-Kibana)
```bash
# Mount log directory for collection
docker run -v a2s-backend:/app/logs:ro logstash-container
```

### For Prometheus
```bash
# Metrics available at:
curl http://localhost:8080/actuator/prometheus
```

### For DataDog/Splunk
```bash
# Forward logs via:
docker logs a2s-backend | tee /var/log/a2s-backend.log
```

---

## Creating Custom Alerts

### Example Alert Rules

**Alert: High Error Rate**
```
CONDITION: Count of "[VASTU_ANALYSE_ERROR]" > 5 in last 5min
ACTION: Page on-call engineer
```

**Alert: Slow Requests**
```
CONDITION: Count of "Duration: 5000ms" in logs > 3 in last 5min
ACTION: Notify DevOps, check LLM service
```

**Alert: LLM Unavailable**
```
CONDITION: Count of "[VASTU_LLM_CALL_FAILED]" > 2 in last 2min
ACTION: Restart LLM container, page on-call
```

**Alert: High Rate Limiting**
```
CONDITION: Count of "[VASTU_RATE_LIMIT_EXCEEDED]" > 10 in last 5min
ACTION: Notify product team, may need to increase quota
```

---

## Questions?

Check the main [DEPLOYMENT_LOG.md](./DEPLOYMENT_LOG.md) for detailed documentation.
