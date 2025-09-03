# Monitorly: Scalable Architecture Strategy

## Background

This architecture strategy is inspired by Flare's approach to handling DDoS attacks through server separation and CloudFlare Workers, as detailed in their blog post: [How We Stopped a DDoS Attack While at a Conference](https://flareapp.io/blog/how-we-stopped-a-ddos-attack-while-at-a-conference?utm_campaign=freekdev-newsletter-175&utm_medium=email&utm_source=newsletter).

Flare's key insight was to separate their web servers from their API servers and use CloudFlare Workers to validate incoming requests at the edge before they reach the infrastructure. This approach is particularly relevant for Monitorly given our high-frequency probe data ingestion requirements and tiered subscription model.

## Current Architecture Challenges

Based on our specs, Monitorly faces several scaling challenges:

- **High-frequency data ingestion**: Go probes sending metrics every 1-15 minutes for hundreds of servers
- **Tiered rate limiting**: Free (60min), Pro (15min), Business (1min) intervals need enforcement
- **Mixed traffic patterns**: User dashboard requests vs. automated probe data
- **Cost scaling**: Infrastructure costs jump significantly with server count and frequency

## Proposed Architecture

### Server Separation Strategy

**Web Servers** (Laravel + ReactJS):
- User dashboard and authentication
- Team/server management interfaces
- **Mobile app API endpoints** (user auth, dashboard data, alerts)
- Billing and subscription management
- Internal API for CloudFlare Worker configuration

**API Servers** (Laravel API only):
- **Pure data ingestion from Go probes**
- Real-time metrics processing and storage
- Alert generation and processing
- Optimized for high-throughput, low-latency operations

### Traffic Routing

```
Go Probes → CloudFlare Worker → API Servers (metrics ingestion only)
Web App → Web Servers (user dashboard)
Mobile App → Web Servers (authenticated user APIs)
```

## CloudFlare Worker Implementation

The CloudFlare Worker acts as an intelligent gateway that:

1. **Authenticates probe requests** using the `probeApiKey`
2. **Enforces subscription-based rate limits** at the edge
3. **Caches server configurations** to minimize main server load
4. **Blocks malicious traffic** before it reaches our infrastructure

### Worker Code Structure

```javascript
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Only intercept probe ingestion endpoints
    if (!url.pathname.startsWith('/api/v1/metrics')) {
      return fetch(request);
    }

    const apiKey = request.headers.get('X-API-Key');
    if (!apiKey) {
      return new Response('API Key required', { status: 401 });
    }

    // Get server config with rate limits (cached for 24h)
    const serverConfig = await getServerConfig(apiKey, env);
    if (!serverConfig) {
      return new Response('Invalid API Key', { status: 403 });
    }

    // Apply subscription-based rate limiting
    const isAllowed = await checkRateLimit(apiKey, serverConfig.dailyLimit, env);
    if (!isAllowed) {
      return new Response('Rate limit exceeded', { status: 429 });
    }

    // Forward to API servers
    return fetch(`https://api.monitorly.com${url.pathname}${url.search}`, request);
  }
}
```

### Dynamic Configuration System

The worker fetches server configurations from the main app and caches them for 24 hours:

```javascript
async function getServerConfig(apiKey, env) {
  const cacheKey = `server_config:${apiKey}`;

  // Try cache first (24h TTL)
  let config = await env.SERVER_CONFIGS.get(cacheKey, 'json');

  if (!config) {
    // Fetch from main app internal API
    const response = await fetch(`https://app.monitorly.com/api/internal/server-config/${apiKey}`, {
      headers: {
        'Authorization': `Bearer ${env.INTERNAL_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) return null;

    config = await response.json();

    // Cache for 24 hours
    await env.SERVER_CONFIGS.put(cacheKey, JSON.stringify(config), {
      expirationTtl: 86400
    });
  }

  return config;
}
```

## Implementation Steps

### Phase 1: Infrastructure Separation

1. **Set up separate domains:**
   - `app.monitorly.com` → Web servers (user-facing)
   - `api.monitorly.com` → API servers (probe ingestion)

2. **Create dedicated API servers:**
   - Deploy Laravel API-only application
   - Remove web UI components
   - Optimize for high-throughput data processing

3. **Update Go probes configuration:**
   - Point to new `api.monitorly.com` endpoint
   - Ensure `probeApiKey` is included in request headers

### Phase 2: CloudFlare Worker Deployment

4. **Create CloudFlare Worker:**
   - Deploy worker code to intercept `/api/v1/metrics` requests
   - Configure KV namespaces for caching (`SERVER_CONFIGS`, `RATE_LIMITS`)
   - Set up environment variables (`INTERNAL_API_TOKEN`)

5. **Implement internal API endpoint:**
   ```php
   // routes/api.php
   Route::middleware('internal.api')->group(function () {
       Route::get('/internal/server-config/{apiKey}', [InternalApiController::class, 'getServerConfig']);
   });
   ```

6. **Configure DNS routing:**
   - Route `api.monitorly.com` through CloudFlare Worker
   - Keep `app.monitorly.com` direct to web servers

### Phase 3: Rate Limiting Implementation

7. **Define subscription tiers in Laravel:**
   ```php
   class InternalApiController extends Controller
   {
       public function getServerConfig($apiKey)
       {
           $server = Server::where('probeApiKey', $apiKey)->with('team')->first();

           $limits = [
               'free' => 24,      // 60min intervals
               'pro' => 96,       // 15min intervals
               'business' => 1440 // 1min intervals
           ];

           return response()->json([
               'serverId' => $server->id,
               'teamId' => $server->team_id,
               'tier' => $server->team->subscription_tier ?? 'free',
               'dailyLimit' => $limits[$server->team->subscription_tier ?? 'free']
           ]);
       }
   }
   ```

8. **Implement rate limiting in worker:**
   - Track daily request counts per API key
   - Reset counters every 24 hours
   - Return 429 status when limits exceeded

### Phase 4: Mobile App Migration

9. **Keep mobile APIs on web servers:**
   - User authentication endpoints
   - Dashboard data APIs
   - Alert management APIs
   - Leverage existing Laravel authentication

10. **Update mobile app configuration:**
    - Point mobile APIs to `app.monitorly.com`
    - Keep probe data separate on `api.monitorly.com`

### Phase 5: Monitoring and Optimization

11. **Implement monitoring:**
    - CloudFlare analytics for worker performance
    - Monitor cache hit rates and API server load
    - Track rate limiting effectiveness

12. **Optimize performance:**
    - Fine-tune cache TTLs based on usage patterns
    - Implement worker error handling and fallbacks
    - Monitor API server resource usage

## Expected Benefits

### Immediate Benefits

- **DDoS Protection**: CloudFlare handles traffic surges before reaching servers
- **Cost Reduction**: Reduced load on main infrastructure
- **Subscription Enforcement**: Automatic rate limiting at the edge
- **Geographic Performance**: CloudFlare's edge network reduces latency

### Scaling Benefits

- **Independent Scaling**: Scale web and API servers based on different usage patterns
- **Resource Optimization**: API servers optimized for data ingestion, web servers for user interaction
- **Development Efficiency**: Teams can work on different components independently

### Cost Impact

Based on our cost estimations, this architecture should:

- **Reduce API server requirements** by 30-50% due to traffic filtering
- **Lower database load** through effective rate limiting
- **Minimize bandwidth costs** by blocking invalid requests at the edge
- **Improve cache efficiency** on remaining valid requests

## Security Considerations

- **Internal API Protection**: Use dedicated tokens for worker-to-app communication
- **API Key Validation**: Centralized validation with distributed caching
- **Rate Limit Bypass Prevention**: Multiple layers of validation
- **Monitoring**: Track suspicious patterns and automated attacks

## Next Steps

1. **Prototype Testing**: Set up development environment with separated servers
2. **Performance Benchmarking**: Test worker performance and cache effectiveness
3. **Gradual Migration**: Implement in stages with rollback capabilities
4. **Load Testing**: Validate architecture under expected traffic loads

This architecture positions Monitorly for scalable growth while maintaining cost efficiency and providing robust protection against traffic-based attacks.