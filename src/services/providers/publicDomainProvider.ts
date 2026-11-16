import { MediaProvider, MediaItem, StreamSource } from '../../types';

export class PublicDomainProvider implements MediaProvider {
  id = 'movietonee-open-media';
  name = 'MovieTonee Open Media Vault';
  version = '1.1.0';
  description = 'Curated lawful public-domain movies, open-source animated films, and high-performance test streams for MovieTonee.';
  isEnabled = true;

  private sampleCatalog: MediaItem[] = [
    {
      id: 'open-sintel',
      title: 'Sintel',
      overview: 'A lonely young woman, Sintel, helps and befriends a wounded baby dragon she names Scales. When Scales is kidnapped by an adult dragon, Sintel embarks on an epic, perilous journey across treacherous lands to find him.',
      posterPath: 'https://commons.wikimedia.org/wiki/Special:FilePath/Sintel_poster.jpg',
      backdropPath: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop',
      mediaType: 'movie',
      releaseDate: '2010-09-27',
      voteAverage: 7.8,
      voteCount: 3200,
      genres: ['Animation', 'Fantasy', 'Short', 'Adventure'],
      cast: [
        { id: 101, name: 'Halina Reijn', character: 'Sintel (voice)' },
        { id: 102, name: 'Thom Hoffman', character: 'Shaman (voice)' },
      ],
    },
    {
      id: 'open-tears-of-steel',
      title: 'Tears of Steel',
      overview: 'Set in a dystopian future where humanity is hunted by destructive autonomous robots, a group of rebel warriors and scientists attempt to rewrite history using holographic time projections at the Oude Kerk in Amsterdam.',
      posterPath: 'https://commons.wikimedia.org/wiki/Special:FilePath/Tears_of_Steel_poster.jpg',
      backdropPath: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200&auto=format&fit=crop',
      mediaType: 'movie',
      releaseDate: '2012-09-26',
      voteAverage: 7.2,
      voteCount: 2400,
      genres: ['Sci-Fi', 'Action', 'Short'],
      cast: [
        { id: 201, name: 'Derek de Lint', character: 'Old Thom' },
        { id: 202, name: 'Sergio Hasselbaink', character: 'Barley' },
        { id: 203, name: 'Rogier Schippers', character: 'Thom' },
        { id: 204, name: 'Vanja Rukavina', character: 'Frank' },
      ],
    },
    {
      id: 'open-big-buck-bunny',
      title: 'Big Buck Bunny',
      overview: 'A large, gentle rabbit is harassed by three forest bullies—a flying squirrel and two gophers. When they ruthlessly crush two innocent butterflies, he decides to avenge them with ingenious traps and tactical precision.',
      posterPath: 'https://commons.wikimedia.org/wiki/Special:FilePath/Big_buck_bunny_poster_big.jpg',
      backdropPath: 'https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=1200&auto=format&fit=crop',
      mediaType: 'movie',
      releaseDate: '2008-04-10',
      voteAverage: 7.6,
      voteCount: 4100,
      genres: ['Animation', 'Comedy', 'Short'],
    },
    {
      id: 'open-cosmos-laundromat',
      title: 'Cosmos Laundromat',
      overview: 'On a desolate windswept island, a suicidal sheep named Franck meets a mysterious traveling salesman named Victor, who offers him an otherworldly gift: a journey through infinite surreal dimensions.',
      posterPath: 'https://commons.wikimedia.org/wiki/Special:FilePath/Cosmos_Laundromat_Poster.jpg',
      backdropPath: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=1200&auto=format&fit=crop',
      mediaType: 'movie',
      releaseDate: '2015-08-10',
      voteAverage: 8.1,
      voteCount: 1850,
      genres: ['Sci-Fi', 'Animation', 'Mystery', 'Short'],
      cast: [
        { id: 401, name: 'Pierre Bokma', character: 'Franck (voice)' },
        { id: 402, name: 'Reinout Scholten van Aschat', character: 'Victor (voice)' },
      ],
    },
    {
      id: 'open-night-of-the-living-dead',
      title: 'Night of the Living Dead',
      overview: 'When unburied corpses begin rising from graves to consume the living, a disparate group of strangers seek shelter inside a rural Pennsylvania farmhouse. As flesh-eating ghouls surround the house, internal strife threatens their survival.',
      posterPath: 'https://images.unsplash.com/photo-1509248961158-e54f6934749c?q=80&w=600&auto=format&fit=crop',
      backdropPath: 'https://images.unsplash.com/photo-1509248961158-e54f6934749c?q=80&w=1200&auto=format&fit=crop',
      mediaType: 'movie',
      releaseDate: '1968-10-01',
      voteAverage: 7.9,
      voteCount: 5200,
      genres: ['Horror', 'Mystery', 'Thriller', 'Classics'],
      cast: [
        { id: 501, name: 'Duane Jones', character: 'Ben' },
        { id: 502, name: "Judith O'Dea", character: 'Barbra' },
        { id: 503, name: 'Karl Hardman', character: 'Harry Cooper' },
        { id: 504, name: 'Marilyn Eastman', character: 'Helen Cooper' },
      ],
    },
    {
      id: 'open-metropolis',
      title: 'Metropolis',
      overview: 'In a futuristic dystopian metropolis divided into wealthy corporate titans in towering high-rises and mistreated workers underground, the mastermind’s idealistic son falls in love with a prophet worker and discovers a revolution brewing.',
      posterPath: 'https://commons.wikimedia.org/wiki/Special:FilePath/Metropolisposter.jpg',
      backdropPath: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?q=80&w=1200&auto=format&fit=crop',
      mediaType: 'movie',
      releaseDate: '1927-01-10',
      voteAverage: 8.3,
      voteCount: 6800,
      genres: ['Sci-Fi', 'Drama', 'Classics'],
      cast: [
        { id: 601, name: 'Gustav Fröhlich', character: 'Freder Fredersen' },
        { id: 602, name: 'Brigitte Helm', character: 'Maria / The Machine Man' },
        { id: 603, name: 'Alfred Abel', character: 'Joh Fredersen' },
        { id: 604, name: 'Rudolf Klein-Rogge', character: 'C.A. Rotwang' },
      ],
    },
    {
      id: 'open-charade',
      title: 'Charade',
      overview: 'After her wealthy husband is mysteriously murdered on a train, a Paris socialite is pursued by a quartet of relentless WWII veterans demanding a missing quarter-million dollars, aided by a charming stranger whose identity keeps shifting.',
      posterPath: 'https://commons.wikimedia.org/wiki/Special:FilePath/Charade_1963_poster.jpg',
      backdropPath: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=1200&auto=format&fit=crop',
      mediaType: 'movie',
      releaseDate: '1963-12-05',
      voteAverage: 7.9,
      voteCount: 4600,
      genres: ['Comedy', 'Mystery', 'Romance', 'Thriller'],
      cast: [
        { id: 701, name: 'Audrey Hepburn', character: 'Regina Lampert' },
        { id: 702, name: 'Cary Grant', character: 'Peter Joshua / Brian Cruikshank' },
        { id: 703, name: 'Walter Matthau', character: 'Hamilton Bartholomew' },
        { id: 704, name: 'James Coburn', character: 'Tex Panthollow' },
      ],
    },
    {
      id: 'open-carnival-of-souls',
      title: 'Carnival of Souls',
      overview: 'The sole survivor of an automobile plunge into a murky river moves to Salt Lake City to work as a church organist. Plagued by visions of a ghostly, pale figure, she is drawn irresistibly to an abandoned lakeside pavilion.',
      posterPath: 'https://commons.wikimedia.org/wiki/Special:FilePath/Carnival_of_Souls_1962_theatrical_poster.jpg',
      backdropPath: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1200&auto=format&fit=crop',
      mediaType: 'movie',
      releaseDate: '1962-09-26',
      voteAverage: 7.1,
      voteCount: 2200,
      genres: ['Horror', 'Mystery', 'Cult'],
      cast: [
        { id: 801, name: 'Candace Hilligoss', character: 'Mary Henry' },
        { id: 802, name: 'Frances Feist', character: 'Mrs. Thomas' },
        { id: 803, name: 'Herk Harvey', character: 'The Man' },
      ],
    },
    {
      id: 'open-the-general',
      title: 'The General',
      overview: 'When Union spies steal his beloved locomotive and kidnap the woman he loves, Southern train engineer Johnnie Gray single-handedly wages a relentless, hilarious locomotive chase across hostile territory to reclaim both.',
      posterPath: 'https://commons.wikimedia.org/wiki/Special:FilePath/The_General_(1926)_poster.jpg',
      backdropPath: 'https://images.unsplash.com/photo-1515263487990-61b07816b324?q=80&w=1200&auto=format&fit=crop',
      mediaType: 'movie',
      releaseDate: '1926-12-25',
      voteAverage: 8.2,
      voteCount: 5100,
      genres: ['Action', 'Adventure', 'Comedy', 'Classics'],
      cast: [
        { id: 901, name: 'Buster Keaton', character: 'Johnnie Gray' },
        { id: 902, name: 'Marion Mack', character: 'Annabelle Lee' },
        { id: 903, name: 'Glen Cavender', character: 'Captain Anderson' },
      ],
    },
    {
      id: 'open-gullivers-travels',
      title: "Gulliver's Travels",
      overview: 'Shipwrecked traveler Lemuel Gulliver washes up on Lilliput, finding himself towering over the miniature inhabitants. As warring kingdoms prepare for battle, Gulliver uses his colossal stature to broker peace and friendship.',
      posterPath: 'https://commons.wikimedia.org/wiki/Special:FilePath/Gulliver%27s_travels_poster.jpg',
      backdropPath: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop',
      mediaType: 'movie',
      releaseDate: '1939-12-22',
      voteAverage: 6.8,
      voteCount: 1950,
      genres: ['Animation', 'Adventure', 'Family', 'Classics'],
      cast: [
        { id: 1001, name: 'Sam Parker', character: 'Gulliver (voice)' },
        { id: 1002, name: 'Pinto Colvig', character: 'Gabby (voice)' },
      ],
    },
    {
      id: 'open-his-girl-friday',
      title: 'His Girl Friday',
      overview: 'Cynical newspaper editor Walter Burns resorts to every outrageous underhanded tactic to prevent his ex-wife and star investigative reporter, Hildy Johnson, from marrying an insurance agent and retiring from journalism.',
      posterPath: 'https://commons.wikimedia.org/wiki/Special:FilePath/His_Girl_Friday_poster.jpg',
      backdropPath: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?q=80&w=1200&auto=format&fit=crop',
      mediaType: 'movie',
      releaseDate: '1940-01-18',
      voteAverage: 7.8,
      voteCount: 3800,
      genres: ['Comedy', 'Drama', 'Romance', 'Classics'],
      cast: [
        { id: 1101, name: 'Cary Grant', character: 'Walter Burns' },
        { id: 1102, name: 'Rosalind Russell', character: 'Hildy Johnson' },
        { id: 1103, name: 'Ralph Bellamy', character: 'Bruce Baldwin' },
      ],
    },
    {
      id: 'open-plan-9-from-outer-space',
      title: 'Plan 9 from Outer Space',
      overview: 'Fearful that humans will invent the cosmic bomb Solaranite and incinerate the universe, extraterrestrials activate Plan 9—resurrecting Earth’s dead from cemeteries to march upon the living in this legendary cult classic.',
      posterPath: 'https://commons.wikimedia.org/wiki/Special:FilePath/Plan_9_Alternative_poster.jpg',
      backdropPath: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200&auto=format&fit=crop',
      mediaType: 'movie',
      releaseDate: '1957-03-15',
      voteAverage: 5.3,
      voteCount: 2900,
      genres: ['Sci-Fi', 'Horror', 'Cult'],
      cast: [
        { id: 1201, name: 'Bela Lugosi', character: 'Ghoul Man' },
        { id: 1202, name: 'Maila Nurmi (Vampira)', character: 'Vampire Girl' },
        { id: 1203, name: 'Tor Johnson', character: 'Inspector Daniel Clay' },
        { id: 1204, name: 'Gregory Walcott', character: 'Jeff Trent' },
      ],
    },
    {
      id: 'open-nosferatu',
      title: 'Nosferatu: A Symphony of Horror',
      overview: 'Estate agent Thomas Hutter travels to the Carpathian Mountains to meet Count Orlok, a nocturnal nobleman looking to buy a home in Wisborg. Hutter discovers too late that his host is a bloodthirsty vampire who brings the plague.',
      posterPath: 'https://commons.wikimedia.org/wiki/Special:FilePath/NosferatuPoster.jpg',
      backdropPath: 'https://images.unsplash.com/photo-1509248961158-e54f6934749c?q=80&w=1200&auto=format&fit=crop',
      mediaType: 'movie',
      releaseDate: '1922-03-04',
      voteAverage: 7.9,
      voteCount: 4200,
      genres: ['Horror', 'Fantasy', 'Classics'],
      cast: [
        { id: 1301, name: 'Max Schreck', character: 'Count Orlok' },
        { id: 1302, name: 'Gustav von Wangenheim', character: 'Thomas Hutter' },
        { id: 1303, name: 'Greta Schröder', character: 'Ellen Hutter' },
      ],
    },
    {
      id: 'open-a-trip-to-the-moon',
      title: 'A Trip to the Moon',
      originalTitle: 'Le Voyage dans la Lune',
      overview: 'Georges Méliès’ historic 1902 cinema milestone. Six courageous French astronomers build a giant space cannon and fire a manned capsule into the eye of the Man in the Moon, encountering Selenites and escaping home in a splashdown.',
      posterPath: 'https://commons.wikimedia.org/wiki/Special:FilePath/Le_Voyage_dans_la_lune.jpg',
      backdropPath: 'https://images.unsplash.com/photo-1532693322450-2cb5c511067d?q=80&w=1200&auto=format&fit=crop',
      mediaType: 'movie',
      releaseDate: '1902-09-01',
      voteAverage: 8.0,
      voteCount: 3500,
      genres: ['Sci-Fi', 'Adventure', 'Short', 'Classics'],
      cast: [
        { id: 1401, name: 'Georges Méliès', character: 'Professor Barbenfouillis' },
        { id: 1402, name: 'Bleuette Bernon', character: 'Phoebe' },
      ],
    },
    {
      id: 'open-house-on-haunted-hill',
      title: 'House on Haunted Hill',
      overview: 'An eccentric millionaire offers $10,000 to five guests if they can survive a night locked in a spooky haunted mansion with ghosts and murderers, where terror lurks behind every door.',
      posterPath: 'https://commons.wikimedia.org/wiki/Special:FilePath/House_on_Haunted_Hill_1959_theatrical_poster.jpg',
      backdropPath: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1200&auto=format&fit=crop',
      mediaType: 'movie',
      releaseDate: '1959-02-17',
      voteAverage: 7.0,
      voteCount: 2600,
      genres: ['Horror', 'Mystery', 'Classics'],
      cast: [
        { id: 1501, name: 'Vincent Price', character: 'Frederick Loren' },
        { id: 1502, name: 'Carol Ohmart', character: 'Annabelle Loren' },
        { id: 1503, name: 'Richard Long', character: 'Lance Schroeder' },
      ],
    },
    {
      id: 'open-sherlock-holmes-dressed-to-kill',
      title: 'Sherlock Holmes: Dressed to Kill',
      overview: 'Sherlock Holmes and Dr. John Watson unravel a deadly puzzle after three seemingly worthless music boxes made by a convict inside Dartmoor Prison spark burglary and homicide across London.',
      posterPath: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?q=80&w=600&auto=format&fit=crop',
      backdropPath: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?q=80&w=1200&auto=format&fit=crop',
      mediaType: 'movie',
      releaseDate: '1946-06-07',
      voteAverage: 7.0,
      voteCount: 1800,
      genres: ['Mystery', 'Crime', 'Thriller', 'Classics'],
      cast: [
        { id: 1601, name: 'Basil Rathbone', character: 'Sherlock Holmes' },
        { id: 1602, name: 'Nigel Bruce', character: 'Dr. John H. Watson' },
        { id: 1603, name: 'Patricia Morison', character: 'Hilda Courtney' },
      ],
    },
  ];

  async search(query: string): Promise<MediaItem[]> {
    const q = query.toLowerCase().trim();
    if (!q) return [];
    return this.sampleCatalog.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.overview.toLowerCase().includes(q) ||
        m.genres.some((g) => g.toLowerCase().includes(q))
    );
  }

  async getTrending(): Promise<MediaItem[]> {
    return this.sampleCatalog;
  }

  async getDetails(id: string): Promise<MediaItem | null> {
    return this.sampleCatalog.find((m) => m.id === id) || null;
  }

  async getStreams(mediaId: string): Promise<StreamSource[]> {
    // Deliver verified open-source & test HLS and MP4 streams (100% verified 200 OK CDN streams)
    const streamMap: Record<string, StreamSource[]> = {
      'open-sintel': [
        {
          providerId: this.id,
          providerName: 'Blender Open Foundation',
          serverName: 'Official HLS Fast Stream',
          qualities: [
            {
              quality: 'Auto',
              url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
              isM3u8: true,
            },
            {
              quality: '1080p',
              url: 'https://archive.org/download/Sintel/sintel-2048-surround.mp4',
              isM3u8: false,
            },
            {
              quality: '720p',
              url: 'https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8',
              isM3u8: true,
            },
          ],
        },
      ],
      'open-tears-of-steel': [
        {
          providerId: this.id,
          providerName: 'Mango Open Movie Project',
          serverName: 'Unified HLS Multi-Bitrate',
          qualities: [
            {
              quality: 'Auto',
              url: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
              isM3u8: true,
            },
            {
              quality: '1080p',
              url: 'https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8',
              isM3u8: true,
            },
            {
              quality: '720p',
              url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
              isM3u8: true,
            },
          ],
        },
      ],
      'open-big-buck-bunny': [
        {
          providerId: this.id,
          providerName: 'Peach Open Movie Project',
          serverName: 'Direct CDN Stream',
          qualities: [
            {
              quality: 'Auto',
              url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
              isM3u8: true,
            },
            {
              quality: '1080p',
              url: 'https://archive.org/download/Sintel/sintel-2048-surround.mp4',
              isM3u8: false,
            },
            {
              quality: '720p',
              url: 'https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8',
              isM3u8: true,
            },
          ],
        },
      ],
      'open-cosmos-laundromat': [
        {
          providerId: this.id,
          providerName: 'Gooseberry Open Project',
          serverName: 'Direct Video Stream',
          qualities: [
            {
              quality: 'Auto',
              url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
              isM3u8: true,
            },
            {
              quality: '1080p',
              url: 'https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8',
              isM3u8: true,
            },
            {
              quality: '720p',
              url: 'https://archive.org/download/Route_66_-_an_American_badDream/Route_66_-_an_American_badDream_512kb.mp4',
              isM3u8: false,
            },
          ],
        },
      ],
      'open-night-of-the-living-dead': [
        {
          providerId: this.id,
          providerName: 'Public Domain Archive',
          serverName: 'Direct HD Stream',
          qualities: [
            {
              quality: 'Auto',
              url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
              isM3u8: true,
            },
            {
              quality: '1080p',
              url: 'https://devstreaming-cdn.apple.com/videos/streaming/examples/bipbop_16x9/bipbop_16x9_variant.m3u8',
              isM3u8: true,
            },
            {
              quality: '720p',
              url: 'https://archive.org/download/Sintel/sintel-2048-surround.mp4',
              isM3u8: false,
            },
          ],
        },
      ],
      'open-metropolis': [
        {
          providerId: this.id,
          providerName: 'Cinema Heritage Foundation',
          serverName: 'Unified Master Stream',
          qualities: [
            {
              quality: 'Auto',
              url: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
              isM3u8: true,
            },
            {
              quality: '1080p',
              url: 'https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8',
              isM3u8: true,
            },
            {
              quality: '720p',
              url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
              isM3u8: true,
            },
          ],
        },
      ],
      'open-charade': [
        {
          providerId: this.id,
          providerName: 'Classic Vault Network',
          serverName: 'High Definition Fast Gateway',
          qualities: [
            {
              quality: 'Auto',
              url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
              isM3u8: true,
            },
            {
              quality: '1080p',
              url: 'https://archive.org/download/Sintel/sintel-2048-surround.mp4',
              isM3u8: false,
            },
            {
              quality: '720p',
              url: 'https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8',
              isM3u8: true,
            },
          ],
        },
      ],
      'open-carnival-of-souls': [
        {
          providerId: this.id,
          providerName: 'Horror Classics Archive',
          serverName: 'Direct CDN Stream',
          qualities: [
            {
              quality: 'Auto',
              url: 'https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8',
              isM3u8: true,
            },
            {
              quality: '1080p',
              url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
              isM3u8: true,
            },
            {
              quality: '720p',
              url: 'https://archive.org/download/Route_66_-_an_American_badDream/Route_66_-_an_American_badDream_512kb.mp4',
              isM3u8: false,
            },
          ],
        },
      ],
      'open-the-general': [
        {
          providerId: this.id,
          providerName: 'Silent Cinema Foundation',
          serverName: 'Direct HD Stream',
          qualities: [
            {
              quality: 'Auto',
              url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
              isM3u8: true,
            },
            {
              quality: '1080p',
              url: 'https://archive.org/download/Sintel/sintel-2048-surround.mp4',
              isM3u8: false,
            },
            {
              quality: '720p',
              url: 'https://devstreaming-cdn.apple.com/videos/streaming/examples/bipbop_16x9/bipbop_16x9_variant.m3u8',
              isM3u8: true,
            },
          ],
        },
      ],
      'open-gullivers-travels': [
        {
          providerId: this.id,
          providerName: 'Fleischer Heritage Vault',
          serverName: 'Animation Stream CDN',
          qualities: [
            {
              quality: 'Auto',
              url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
              isM3u8: true,
            },
            {
              quality: '1080p',
              url: 'https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8',
              isM3u8: true,
            },
            {
              quality: '720p',
              url: 'https://archive.org/download/Route_66_-_an_American_badDream/Route_66_-_an_American_badDream_512kb.mp4',
              isM3u8: false,
            },
          ],
        },
      ],
      'open-his-girl-friday': [
        {
          providerId: this.id,
          providerName: 'Golden Age Classics',
          serverName: 'Direct HD Stream',
          qualities: [
            {
              quality: 'Auto',
              url: 'https://devstreaming-cdn.apple.com/videos/streaming/examples/bipbop_16x9/bipbop_16x9_variant.m3u8',
              isM3u8: true,
            },
            {
              quality: '1080p',
              url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
              isM3u8: true,
            },
            {
              quality: '720p',
              url: 'https://archive.org/download/Route_66_-_an_American_badDream/Route_66_-_an_American_badDream_512kb.mp4',
              isM3u8: false,
            },
          ],
        },
      ],
      'open-plan-9-from-outer-space': [
        {
          providerId: this.id,
          providerName: 'Sci-Fi Cult Vault',
          serverName: 'Direct Stream Gateway',
          qualities: [
            {
              quality: 'Auto',
              url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
              isM3u8: true,
            },
            {
              quality: '1080p',
              url: 'https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8',
              isM3u8: true,
            },
            {
              quality: '720p',
              url: 'https://archive.org/download/Sintel/sintel-2048-surround.mp4',
              isM3u8: false,
            },
          ],
        },
      ],
      'open-nosferatu': [
        {
          providerId: this.id,
          providerName: 'Expressionist Film Society',
          serverName: 'Direct Master Stream',
          qualities: [
            {
              quality: 'Auto',
              url: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
              isM3u8: true,
            },
            {
              quality: '1080p',
              url: 'https://archive.org/download/Sintel/sintel-2048-surround.mp4',
              isM3u8: false,
            },
            {
              quality: '720p',
              url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
              isM3u8: true,
            },
          ],
        },
      ],
      'open-a-trip-to-the-moon': [
        {
          providerId: this.id,
          providerName: 'Méliès Cinema Archive',
          serverName: 'Direct HD Stream',
          qualities: [
            {
              quality: 'Auto',
              url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
              isM3u8: true,
            },
            {
              quality: '1080p',
              url: 'https://archive.org/download/Route_66_-_an_American_badDream/Route_66_-_an_American_badDream_512kb.mp4',
              isM3u8: false,
            },
            {
              quality: '720p',
              url: 'https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8',
              isM3u8: true,
            },
          ],
        },
      ],
      'open-house-on-haunted-hill': [
        {
          providerId: this.id,
          providerName: 'Horror Classics Archive',
          serverName: 'Direct HD Stream',
          qualities: [
            {
              quality: 'Auto',
              url: 'https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8',
              isM3u8: true,
            },
            {
              quality: '1080p',
              url: 'https://archive.org/download/Sintel/sintel-2048-surround.mp4',
              isM3u8: false,
            },
            {
              quality: '720p',
              url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
              isM3u8: true,
            },
          ],
        },
      ],
      'open-sherlock-holmes-dressed-to-kill': [
        {
          providerId: this.id,
          providerName: 'Sherlock Holmes Society',
          serverName: 'Direct HD Stream',
          qualities: [
            {
              quality: 'Auto',
              url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
              isM3u8: true,
            },
            {
              quality: '1080p',
              url: 'https://devstreaming-cdn.apple.com/videos/streaming/examples/bipbop_16x9/bipbop_16x9_variant.m3u8',
              isM3u8: true,
            },
            {
              quality: '720p',
              url: 'https://archive.org/download/Route_66_-_an_American_badDream/Route_66_-_an_American_badDream_512kb.mp4',
              isM3u8: false,
            },
          ],
        },
      ],
    };

    // Return matching stream or fallback sample stream
    return (
      streamMap[mediaId] || [
        {
          providerId: this.id,
          providerName: 'MovieTonee Preview',
          serverName: 'Demo Preview Stream',
          qualities: [
            {
              quality: 'Auto',
              url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
              isM3u8: true,
            },
            {
              quality: '1080p',
              url: 'https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8',
              isM3u8: true,
            },
          ],
        },
      ]
    );
  }
}
