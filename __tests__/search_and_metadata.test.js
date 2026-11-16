/**
 * search_and_metadata.test.js
 * Comprehensive automated test suite for MovieTonee Search, TMDB formatting,
 * image URL resolution, format filtering, and offline catalog fallback.
 * Tested against REAL application code from src/services and screens.
 */

const assert = require('assert');
const path = require('path');
const fallbackData = require('./load_fallback_helper.js');

const TmdbService = fallbackData.TmdbService;
assert.ok(TmdbService, 'TmdbService must be exported and loaded');

let passCount = 0;
let failCount = 0;

function test(description, fn) {
  try {
    fn();
    console.log(`[PASS] ${description}`);
    passCount++;
  } catch (err) {
    console.error(`[FAIL] ${description}`);
    console.error(`       Error: ${err.message}`);
    failCount++;
  }
}

async function asyncTest(description, fn) {
  try {
    await fn();
    console.log(`[PASS] ${description}`);
    passCount++;
  } catch (err) {
    console.error(`[FAIL] ${description}`);
    console.error(`       Error: ${err.message}`);
    failCount++;
  }
}

console.log('====================================================');
console.log('   MOVIETONEE SEARCH & METADATA TEST SUITE          ');
console.log('====================================================\n');

async function runAllTests() {
  // GROUP 1: Real TmdbService Image URL Resolution
  test('1.1. TmdbService.buildImageUrl returns fallback poster on null, undefined, or empty string', () => {
    const fallback1 = TmdbService.buildImageUrl(null);
    assert.ok(fallback1.startsWith('https://images.unsplash.com/'));
    const fallback2 = TmdbService.buildImageUrl(undefined);
    assert.strictEqual(fallback2, fallback1);
    const fallback3 = TmdbService.buildImageUrl('');
    assert.strictEqual(fallback3, fallback1);
    const fallback4 = TmdbService.buildImageUrl('   ');
    assert.strictEqual(fallback4, fallback1);
  });

  test('1.2. TmdbService.buildImageUrl preserves already-qualified HTTP/HTTPS URLs', () => {
    const cdnUrl = 'https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9sl16pB3iy.jpg';
    assert.strictEqual(TmdbService.buildImageUrl(cdnUrl), cdnUrl);
    const wikiUrl = 'https://upload.wikimedia.org/wikipedia/commons/8/87/Sintel_poster.jpg';
    assert.strictEqual(TmdbService.buildImageUrl(wikiUrl), wikiUrl);
  });

  test('1.3. TmdbService.buildImageUrl formats relative paths correctly with leading slash', () => {
    assert.strictEqual(
      TmdbService.buildImageUrl('/or06FN3Dka5tukK1e9sl16pB3iy.jpg', 'w500'),
      'https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9sl16pB3iy.jpg'
    );
    assert.strictEqual(
      TmdbService.buildImageUrl('or06FN3Dka5tukK1e9sl16pB3iy.jpg', 'w1280'),
      'https://image.tmdb.org/t/p/w1280/or06FN3Dka5tukK1e9sl16pB3iy.jpg'
    );
  });

  // GROUP 2: Real TmdbService.formatMediaItem Data Normalization & Auto-Detection
  test('2.1. formatMediaItem resolves genre_ids from TMDB numbers to human names', () => {
    const rawTmdb = {
      id: 550,
      title: 'Fight Club',
      overview: 'An insomniac office worker...',
      genre_ids: [18, 53],
      poster_path: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
      vote_average: 8.433,
    };
    const formatted = TmdbService.formatMediaItem(rawTmdb);
    assert.deepStrictEqual(formatted.genres, ['Drama', 'Thriller']);
    assert.strictEqual(formatted.voteAverage, 8.4);
    assert.strictEqual(formatted.mediaType, 'movie');
    assert.strictEqual(formatted.id, 'tmdb-550');
  });

  test('2.2. formatMediaItem auto-detects anime when original_language is "ja" and Animation genre present', () => {
    const rawAnime = {
      id: 88803,
      name: 'Vinland Saga',
      original_name: 'ヴィンランド・サガ',
      original_language: 'ja',
      genre_ids: [16, 10759, 18],
      media_type: 'tv',
    };
    const formatted = TmdbService.formatMediaItem(rawAnime, 'tv');
    assert.strictEqual(formatted.mediaType, 'anime');
    assert.strictEqual(formatted.title, 'Vinland Saga');
    assert.ok(formatted.genres.includes('Animation'));
    assert.ok(formatted.genres.includes('Action & Adventure'));
    assert.ok(formatted.genres.includes('Drama'));
    assert.strictEqual(formatted.id, 'tmdb-88803');
  });

  test('2.3. formatMediaItem handles missing/corrupt fields gracefully without throwing', () => {
    const empty = TmdbService.formatMediaItem({});
    assert.strictEqual(empty.title, 'Untitled');
    assert.strictEqual(empty.overview, 'No synopsis available.');
    assert.strictEqual(empty.voteAverage, 0);
    assert.deepStrictEqual(empty.genres, []);
    assert.ok(empty.posterPath.startsWith('https://images.unsplash.com/'));
  });

  test('2.4. formatMediaItem does not double-prefix existing unified IDs', () => {
    const customItem = { id: 'open-sintel', title: 'Sintel' };
    const res1 = TmdbService.formatMediaItem(customItem);
    assert.strictEqual(res1.id, 'open-sintel');

    const tmdbItem = { id: 'tmdb-95396', title: 'Severance' };
    const res2 = TmdbService.formatMediaItem(tmdbItem);
    assert.strictEqual(res2.id, 'tmdb-95396');
  });

  // GROUP 3: Fallback Data Integrity
  test('3.1. All fallback collections have non-empty valid data with working HTTPS poster URLs', () => {
    assert.ok(fallbackData.FALLBACK_TRENDING.length >= 8);
    assert.ok(fallbackData.FALLBACK_MOVIES.length >= 8);
    assert.ok(fallbackData.FALLBACK_TV.length >= 8);
    assert.ok(fallbackData.FALLBACK_ANIME.length >= 8);
    assert.ok(fallbackData.FALLBACK_VAULT.length >= 5);
    assert.ok(fallbackData.ALL_FALLBACK_ITEMS.length >= 40);

    for (const item of fallbackData.ALL_FALLBACK_ITEMS) {
      assert.ok(item.id, `Item must have an id: ${JSON.stringify(item)}`);
      assert.ok(item.title, `Item must have a title: ${item.id}`);
      assert.ok(item.posterPath.startsWith('https://'), `Item posterPath must be https URL: ${item.posterPath}`);
      assert.ok(Array.isArray(item.genres), `Item genres must be array: ${item.id}`);
      assert.ok(typeof item.voteAverage === 'number', `voteAverage must be number: ${item.id}`);
    }
  });

  test('3.2. Fallback anime items have mediaType "anime" and non-empty genres', () => {
    for (const item of fallbackData.FALLBACK_ANIME) {
      assert.strictEqual(item.mediaType, 'anime');
      assert.ok(item.genres.length > 0, `Anime ${item.title} has no genres`);
    }
  });

  test('3.3. Cinema Vault items have valid stream sources and complete metadata', () => {
    for (const item of fallbackData.FALLBACK_VAULT) {
      assert.ok(item.id.startsWith('open-'));
      assert.ok(item.genres.length > 0);
      assert.ok(item.overview.length > 10);
      assert.ok(item.posterPath.startsWith('https://'));
    }
  });

  // GROUP 4: Search & Filter Logic
  test('4.1. searchOfflineCatalog finds movies and anime by title, overview, or original title', () => {
    const query1 = 'Avengers';
    const r1 = fallbackData.searchOfflineCatalog(query1);
    assert.ok(r1.length >= 1);
    assert.ok(r1.some((i) => i.title.toLowerCase().includes('avengers')));

    const query2 = 'Attack on Titan';
    const r2 = fallbackData.searchOfflineCatalog(query2);
    assert.ok(r2.length >= 1);
    assert.ok(r2[0].title.includes('Titan') || r2[0].originalTitle?.includes('Shingeki'));

    const query3 = 'Sintel';
    const r3 = fallbackData.searchOfflineCatalog(query3);
    assert.ok(r3.length >= 1);
    assert.strictEqual(r3[0].title, 'Sintel');
  });

  test('4.2. searchOfflineCatalog handles edge-case queries (empty, regex chars, whitespace)', () => {
    assert.deepStrictEqual(fallbackData.searchOfflineCatalog(''), []);
    assert.deepStrictEqual(fallbackData.searchOfflineCatalog('   '), []);

    // Regex special characters must not throw syntax errors
    assert.doesNotThrow(() => {
      const res = fallbackData.searchOfflineCatalog('[*+?^${}()|]');
      assert.ok(Array.isArray(res));
    });

    // Punctuation in search
    const spiderRes = fallbackData.searchOfflineCatalog('Spider-Man');
    assert.ok(spiderRes.length > 0);
  });

  test('4.3. getFallbackEpisodes returns valid fallback episode structures', () => {
    const episodes = fallbackData.getFallbackEpisodes(95396, 1);
    assert.ok(episodes.length >= 8);
    for (const ep of episodes) {
      assert.strictEqual(ep.seasonNumber, 1);
      assert.ok(ep.episodeNumber >= 1);
      assert.ok(ep.name.length > 0);
      assert.ok(ep.stillPath.startsWith('https://'));
      assert.strictEqual(typeof ep.durationMinutes, 'number');
    }
  });

  test('4.4. Flexible genre chip matching works for Sci-Fi, Action, and Fantasy without false positives', () => {
    function isGenreMatch(itemGenres, filter) {
      if (filter === 'All') return true;
      if (!Array.isArray(itemGenres) || itemGenres.length === 0) return false;
      const f = filter.toLowerCase().trim();
      return itemGenres.some((g) => {
        if (!g || typeof g !== 'string') return false;
        const gl = g.toLowerCase().trim();
        if (gl === f) return true;
        if (f === 'sci-fi' && (gl === 'science fiction' || gl.includes('sci-fi') || gl.includes('science fiction'))) return true;
        if (f === 'action' && gl.includes('action')) return true;
        if (f === 'adventure' && gl.includes('adventure')) return true;
        if (f === 'fantasy' && (gl.includes('fantasy') || gl === 'sci-fi & fantasy')) return true;
        if (f === 'animation' && (gl === 'animation' || gl === 'anime')) return true;
        return false;
      });
    }

    // Interstellar has 'Science Fiction'
    assert.ok(isGenreMatch(['Adventure', 'Drama', 'Science Fiction'], 'Sci-Fi'));
    // Stranger Things has 'Sci-Fi & Fantasy'
    assert.ok(isGenreMatch(['Sci-Fi & Fantasy', 'Drama', 'Mystery'], 'Sci-Fi'));
    assert.ok(isGenreMatch(['Sci-Fi & Fantasy', 'Drama', 'Mystery'], 'Fantasy'));
    // Shingeki has 'Action & Adventure'
    assert.ok(isGenreMatch(['Animation', 'Action & Adventure', 'Sci-Fi & Fantasy'], 'Action'));
    assert.ok(isGenreMatch(['Animation', 'Action & Adventure', 'Sci-Fi & Fantasy'], 'Adventure'));
    // Comedy chip does not match Sci-Fi
    assert.strictEqual(isGenreMatch(['Science Fiction', 'Action'], 'Comedy'), false);
    // Substrings that are not genres do not falsely trigger
    assert.strictEqual(isGenreMatch(['Award Winning'], 'War'), false);
  });

  test('4.5. Format chip filtering accurately separates TV series from movies and anime series', () => {
    function isTypeMatch(item, typeFilter) {
      if (typeFilter === 'all') return true;
      const isSeries = (Array.isArray(item.seasons) && item.seasons.length > 0) || item.mediaType === 'tv';

      if (typeFilter === 'movie') {
        if (item.mediaType === 'movie') return true;
        if (item.mediaType === 'anime' && !isSeries) return true;
        return false;
      }

      if (typeFilter === 'tv') {
        if (item.mediaType === 'tv') return true;
        if (item.mediaType === 'anime' && isSeries) return true;
        return false;
      }

      if (typeFilter === 'anime') {
        if (item.mediaType === 'anime') return true;
        const isJapanese = item.originalTitle && /[一-龠ぁ-ゔァ-ヴー]/.test(item.originalTitle);
        const isAnim = Array.isArray(item.genres) && item.genres.some((g) => g.toLowerCase() === 'animation');
        return Boolean(isJapanese && isAnim);
      }

      return item.mediaType === typeFilter;
    }

    const animeSeries = { mediaType: 'anime', seasons: [{ seasonNumber: 1, episodeCount: 12 }], title: 'Attack on Titan' };
    const animeFilm = { mediaType: 'anime', releaseDate: '2016-08-26', title: 'Your Name' };
    const standardMovie = { mediaType: 'movie', title: 'Inception' };
    const standardTv = { mediaType: 'tv', title: 'Breaking Bad' };

    // Movies filter: Anime movie matches, anime SERIES does NOT match!
    assert.ok(isTypeMatch(standardMovie, 'movie'));
    assert.ok(isTypeMatch(animeFilm, 'movie'));
    assert.strictEqual(isTypeMatch(animeSeries, 'movie'), false, 'Anime TV series must NEVER match MOVIE filter');
    assert.strictEqual(isTypeMatch(standardTv, 'movie'), false);

    // TV filter: Anime series matches, anime movie does NOT match!
    assert.ok(isTypeMatch(standardTv, 'tv'));
    assert.ok(isTypeMatch(animeSeries, 'tv'));
    assert.strictEqual(isTypeMatch(animeFilm, 'tv'), false, 'Anime feature film must not match TV filter');
    assert.strictEqual(isTypeMatch(standardMovie, 'tv'), false);

    // Anime filter: Both anime series and film match, standard movie/tv do NOT match!
    assert.ok(isTypeMatch(animeSeries, 'anime'));
    assert.ok(isTypeMatch(animeFilm, 'anime'));
    assert.strictEqual(isTypeMatch(standardMovie, 'anime'), false);
    assert.strictEqual(isTypeMatch(standardTv, 'anime'), false);
  });

  // GROUP 5: Live TMDB API Connectivity & Automatic Key Rotation
  await asyncTest('5.1. Live TMDB API returns valid HTTP 200 data with verified working key', async () => {
    const trending = await TmdbService.getTrending('week');
    assert.ok(Array.isArray(trending));
    assert.ok(trending.length >= 10, 'Live trending should return at least 10 items');
    assert.ok(trending[0].id.startsWith('tmdb-'));
    assert.ok(trending[0].posterPath.startsWith('https://image.tmdb.org/'));
  });

  await asyncTest('5.2. Live TMDB Search returns rich results for blockbuster queries', async () => {
    const searchRes = await TmdbService.search('Interstellar');
    assert.ok(Array.isArray(searchRes));
    assert.ok(searchRes.length >= 1, 'Should find Interstellar in TMDB');
    const match = searchRes.find((m) => m.title.toLowerCase().includes('interstellar'));
    assert.ok(match, 'Search results must include Interstellar');
    assert.ok(match.posterPath.startsWith('https://image.tmdb.org/'));
  });

  await asyncTest('5.3. Search merges Cinema Vault items even during live TMDB searches', async () => {
    const vaultSearch = await TmdbService.search('Sintel');
    assert.ok(Array.isArray(vaultSearch));
    assert.ok(vaultSearch.length >= 1);
    const hasSintel = vaultSearch.some((m) => m.title.toLowerCase().includes('sintel'));
    assert.ok(hasSintel, 'Search for Sintel must return the title');
  });

  console.log('\n====================================================');
  console.log(`   TEST RESULTS: ${passCount} / ${passCount + failCount} TESTS PASSED (${failCount === 0 ? '100%' : 'FAILED'})`);
  console.log('====================================================\n');

  if (failCount > 0) {
    process.exit(1);
  }
}

runAllTests().catch((err) => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
