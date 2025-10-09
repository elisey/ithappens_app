# Working with Large Dataset

This document describes how to work with the full dataset (13,000+ stories, ~26 MB) in the ithappens application.

## Quick Start

### 1. Download and Place the Data File

1. Download the full `stories.json` file (26 MB)
2. Place it in the `public/` directory:
   ```
   public/stories.json
   ```

### 2. Validate the Data

Run the validation script to ensure the data is correctly formatted:

```bash
node scripts/validate-data.js
```

Or use the npm script:

```bash
npm run validate-data
```

This will check:

- ✅ Valid JSON format
- ✅ Correct data structure
- ✅ Required fields present (id, text)
- ✅ No duplicate IDs
- ✅ ID sequence integrity
- ⚠️ Data quality warnings

### 3. Development vs Production

**Development Mode** (uses sample data):

```bash
npm run dev
```

- Uses `public/sample_stories.json` (10 stories)
- Fast reload and iteration
- Enabled via `MODE=development` in `.env`

**Production Mode** (uses full dataset):

```bash
npm run build
npm run preview
```

- Uses `public/stories.json` (13,000+ stories)
- Full production experience
- Enabled via `MODE=production` in `.env`

## Performance Optimizations

The application uses several optimizations to handle the large dataset efficiently:

### 1. Streaming Data Loader

Located in `src/services/dataLoader.ts`

- **Chunked loading**: Processes data in manageable chunks
- **Non-blocking**: Uses `requestIdleCallback` to avoid blocking UI
- **Progress tracking**: Provides real-time loading feedback
- **Early ID indexing**: Builds ID index while parsing for fast lookups

### 2. SessionStorage Caching

Located in `src/services/storageCache.ts`

- **First visit**: Loads from network, caches in sessionStorage
- **Repeat visits**: Instant load from cache (< 500ms)
- **TTL management**: Cache expires after 24 hours
- **Automatic invalidation**: Clears on version change

### 3. Performance Monitoring

Located in `src/hooks/usePerformanceMonitor.ts`

- **Real-time metrics**: Tracks FPS, memory, render time
- **Health scoring**: Automatically detects performance issues
- **DevPanel integration**: Visual monitoring during development

### 4. Memory Management

- **Lazy rendering**: Only renders visible story
- **Efficient indexing**: ID map for O(1) lookups
- **No duplication**: Single source of truth for story data
- **Cleanup**: Proper disposal of observers and timers

## Performance Targets

| Metric                | Target      | Notes                          |
| --------------------- | ----------- | ------------------------------ |
| Initial load time     | < 3 seconds | Cold start with full dataset   |
| Cache load time       | < 500ms     | Warm start from sessionStorage |
| Navigation latency    | < 50ms      | Story switching                |
| Memory usage          | < 100 MB    | After full load                |
| FPS during navigation | > 55        | Smooth animations              |

## File Structure

```
public/
├── stories.json              # Full dataset (production)
└── sample_stories.json       # Sample data (development)

src/
├── services/
│   ├── dataLoader.ts         # Streaming loader
│   ├── storageCache.ts       # SessionStorage cache
│   └── storyService.ts       # Main service
├── hooks/
│   ├── useStoryService.ts    # Service integration hook
│   └── usePerformanceMonitor.ts # Performance monitoring
└── utils/
    └── dataValidator.ts      # Runtime validation

scripts/
└── validate-data.js          # Data validation script

tests/
└── e2e/
    └── fullDataset.test.tsx  # Integration tests
```

## Troubleshooting

### Problem: App loads slowly

**Symptoms**: Takes > 5 seconds to load stories

**Solutions**:

1. Check if caching is working:
   ```javascript
   // Open DevTools Console
   sessionStorage.getItem('stories_cache')
   ```
2. Clear cache and reload:
   ```javascript
   sessionStorage.clear()
   location.reload()
   ```
3. Check network tab for failed requests
4. Verify file size is ~26 MB

### Problem: Out of memory errors

**Symptoms**: Browser crashes or shows memory errors

**Solutions**:

1. Check memory usage in DevPanel (development mode)
2. Ensure you're using latest Chrome/Firefox
3. Close other tabs to free memory
4. Check for memory leaks:
   ```bash
   npm run test:e2e
   ```

### Problem: Navigation is slow

**Symptoms**: Delay when switching stories

**Solutions**:

1. Check FPS in DevPanel
2. Disable browser extensions
3. Check for long render times in React DevTools
4. Verify ID indexing completed:
   ```javascript
   // Should be instant
   console.time('lookup')
   storyService.getById(5000)
   console.timeEnd('lookup')
   ```

### Problem: Cache not working

**Symptoms**: Always loads from network

**Solutions**:

1. Check cache configuration in `src/config/app.config.ts`
2. Verify sessionStorage is not disabled:
   ```javascript
   typeof sessionStorage !== 'undefined'
   ```
3. Check cache key matches:
   ```javascript
   // Should match storiesUrl in config
   sessionStorage.getItem('stories_cache')
   ```
4. Clear and rebuild:
   ```bash
   npm run clean
   npm run build
   ```

### Problem: Validation script fails

**Symptoms**: `npm run validate-data` shows errors

**Solutions**:

1. Check file exists: `ls -lh public/stories.json`
2. Verify file is valid JSON:
   ```bash
   cat public/stories.json | jq . > /dev/null
   ```
3. Check for duplicate IDs:
   ```bash
   cat public/stories.json | jq '[.[].id] | group_by(.) | map(select(length > 1))'
   ```
4. Re-download stories.json from source

## Testing

### Unit Tests

Test individual components:

```bash
npm run test
```

### Integration Tests

Test with full dataset:

```bash
npm run test:e2e
```

### Performance Tests

Run performance benchmarks:

```bash
npm run test:performance
```

### Manual Testing Checklist

Before deploying to production:

- [ ] Load app in Chrome (cold start) - should complete in < 3s
- [ ] Reload page (warm start) - should complete in < 500ms
- [ ] Navigate forward 10 stories - should feel instant
- [ ] Navigate backward 10 stories - should feel instant
- [ ] Jump to story 6500 - should work immediately
- [ ] Open DevPanel - metrics should show healthy
- [ ] Check memory in DevTools - should be < 100 MB
- [ ] Test on slow 3G - should show loading progress
- [ ] Interrupt loading - should retry gracefully
- [ ] Test on mobile device - should work smoothly

## Data Format

The `stories.json` file must follow this format:

```typescript
interface Story {
  id: number // Unique story ID (positive integer)
  text: string // Story content (can be empty but must exist)
}

// File structure
type StoriesData = Story[]
```

### Example

```json
[
  {
    "id": 1,
    "text": "This is the first story."
  },
  {
    "id": 2,
    "text": "This is the second story."
  }
]
```

### Validation Rules

1. **Format**: Valid JSON array
2. **Structure**: Array of objects
3. **Required fields**: Each story must have `id` and `text`
4. **ID type**: Positive integer
5. **ID uniqueness**: No duplicate IDs allowed
6. **Text type**: String (can be empty)

### Recommended Practices

- **Sequential IDs**: Prefer continuous ID sequences (1, 2, 3, ...)
- **No gaps**: Avoid missing IDs in sequence
- **Consistent format**: Use same structure for all stories
- **Validation**: Run `npm run validate-data` before committing

## CI/CD Integration

The project includes automated performance testing in CI:

```bash
# GitHub Actions workflow
.github/workflows/performance.yml
```

This workflow:

1. Generates test dataset
2. Runs performance tests
3. Checks memory usage
4. Reports results as PR comment

## Configuration

Edit `src/config/app.config.ts` to customize:

```typescript
export const APP_CONFIG = {
  // Data source
  storiesUrl: {
    development: '/sample_stories.json', // Small dataset
    production: '/stories.json', // Full dataset
  },

  // Performance
  maxLoadingTime: 10000, // 10s timeout
  enableCaching: true, // Enable sessionStorage
  cacheTTL: 24 * 60 * 60 * 1000, // 24 hours

  // Monitoring
  enablePerformanceLogging: true, // Log metrics
  performanceMonitoring: {
    fpsThreshold: 55, // Min acceptable FPS
    memoryThreshold: 100 * 1024 * 1024, // Max memory (100 MB)
  },
}
```

## Production Deployment

### Pre-deployment Checklist

- [ ] Run `npm run validate-data` - should pass
- [ ] Run `npm run test` - all tests passing
- [ ] Run `npm run test:e2e` - integration tests passing
- [ ] Run `npm run build` - build succeeds
- [ ] Test production build locally with `npm run preview`
- [ ] Check bundle size - should be reasonable
- [ ] Verify `stories.json` is in `public/` directory
- [ ] Set `MODE=production` in environment
- [ ] Clear any development caches

### Deployment Steps

1. **Build**:

   ```bash
   npm run build
   ```

2. **Verify build**:

   ```bash
   npm run preview
   ```

3. **Deploy** (example with Netlify):
   ```bash
   netlify deploy --prod
   ```

### Post-deployment Verification

- [ ] Visit production URL
- [ ] Check loading time with DevTools Network tab
- [ ] Test navigation on actual devices
- [ ] Verify caching works (reload page)
- [ ] Check error handling (disconnect network)
- [ ] Monitor performance with real users

## Support

For issues or questions:

1. Check this documentation
2. Review troubleshooting section
3. Check existing issues on GitHub
4. Open new issue with details:
   - Browser version
   - Dataset size
   - Error messages
   - Steps to reproduce
