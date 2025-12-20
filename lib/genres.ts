// Comprehensive list of all book genres
// Most popular genres first for better UX
export const ALL_GENRES = [
    // Most Popular & Well-Known Genres (First 15 shown by default)
    'Fiction',
    'Non-Fiction',
    'Romance',
    'Mystery',
    'Thriller',
    'Fantasy',
    'Science Fiction',
    'Horror',
    'Biography',
    'Self-Help',
    'History',
    'Comedy',
    'Drama',
    'Adventure',
    'Children',

    // More Fiction Categories
    'Thriller',
    'Suspense',
    'Crime',
    'Detective',
    'Noir',
    'Cozy Mystery',
    'Legal Thriller',
    'Medical Thriller',
    'Psychological Thriller',

    // Science Fiction & Fantasy
    'Science Fiction',
    'Fantasy',
    'High Fantasy',
    'Urban Fantasy',
    'Epic Fantasy',
    'Dark Fantasy',
    'Space Opera',
    'Cyberpunk',
    'Steampunk',
    'Dystopian',
    'Post-Apocalyptic',
    'Time Travel',
    'Alternate History',

    // Horror & Supernatural
    'Horror',
    'Gothic',
    'Paranormal',
    'Supernatural',
    'Occult',

    // Young Adult & Children's
    'Young Adult (YA)',
    'New Adult',
    'Middle Grade',
    'Children\'s Fiction',
    'Picture Books',

    // Action & Adventure
    'Action',
    'Adventure',
    'War',
    'Military',
    'Spy',
    'Western',

    // Historical
    'Historical Fiction',
    'Historical Romance',
    'Biographical Fiction',

    // Non-Fiction Categories
    'Biography',
    'Autobiography',
    'Memoir',
    'True Crime',
    'History',
    'Philosophy',
    'Religion',
    'Spirituality',
    'Self-Help',
    'Personal Development',
    'Motivational',
    'Business',
    'Economics',
    'Finance',
    'Management',
    'Leadership',
    'Marketing',
    'Entrepreneurship',

    // Educational & Academic
    'Education',
    'Academic',
    'Science',
    'Mathematics',
    'Technology',
    'Computer Science',
    'Programming',
    'Engineering',
    'Medicine',
    'Psychology',
    'Sociology',
    'Anthropology',

    // Arts & Culture
    'Art',
    'Music',
    'Photography',
    'Film',
    'Theater',
    'Architecture',
    'Design',

    // Lifestyle & Home
    'Cooking',
    'Food & Wine',
    'Health & Fitness',
    'Diet & Nutrition',
    'Parenting',
    'Relationships',
    'Travel',
    'Home & Garden',
    'Crafts & Hobbies',

    // Sports & Recreation
    'Sports',
    'Fitness',
    'Outdoor',
    'Nature',

    // Poetry & Drama
    'Poetry',
    'Drama',
    'Plays',
    'Screenplay',

    // Comics & Graphic Novels
    'Comics',
    'Graphic Novels',
    'Manga',
    'Anime',

    // Humor & Satire
    'Humor',
    'Satire',
    'Parody',

    // Essays & Journalism
    'Essays',
    'Journalism',
    'Current Affairs',
    'Politics',

    // Reference
    'Reference',
    'Dictionary',
    'Encyclopedia',
    'Atlas',
    'Guide',

    // Specialized
    'Law',
    'Medical',
    'Military',
    'Aviation',
    'Maritime',
    'Agriculture',

    // Regional & Cultural
    'African Literature',
    'Asian Literature',
    'European Literature',
    'Latin American Literature',
    'Middle Eastern Literature',
    'Indigenous Literature',

    // Other Popular Genres
    'Coming of Age',
    'Family Saga',
    'Magical Realism',
    'Fairy Tale',
    'Mythology',
    'Folk Tales',
    'Classics',
    'Short Stories',
    'Anthology',
    'Collection',
];

// Genre icons mapping
const GENRE_ICONS: Record<string, string> = {
    'Fiction': '📚',
    'Non-Fiction': '📖',
    'Romance': '❤️',
    'Mystery': '🔍',
    'Thriller': '😱',
    'Fantasy': '🧙',
    'Science Fiction': '🚀',
    'Horror': '👻',
    'Biography': '👤',
    'Self-Help': '💪',
    'History': '📜',
    'Comedy': '😂',
    'Drama': '🎭',
    'Adventure': '🗺️',
    'Children': '🧒',
    'Computer Science': '💻',
    'Programming': '⌨️',
    'Mathematics': '📐',
    'Science': '🔬',
    'Engineering': '⚙️',
    'Business': '💼',
    'Economics': '📊',
    'Psychology': '🧠',
    'Medicine': '🏥',
    'Law': '⚖️',
    'Philosophy': '🤔',
    'Technology': '🖥️',
    'Finance': '💰',
    'Marketing': '📣',
    'Leadership': '👑',
    'Entrepreneurship': '🚀',
};

// Get genre config with icon and label
export function getGenreConfig(genre: string): { icon: string; label: string } {
    return {
        icon: GENRE_ICONS[genre] || '📖',
        label: genre
    };
}

// Get all genres
export function getAllGenres(): string[] {
    return ALL_GENRES;
}

// Export deduplicated array to prevent React duplicate key warnings
export default [...new Set(ALL_GENRES)] as string[];
