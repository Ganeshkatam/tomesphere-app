export interface SearchFilters {
    search: string;
    genres: string[];
    yearFrom?: number;
    yearTo?: number;
    minPages?: number;
    maxPages?: number;
    languages: string[];
    minRating?: number;
    sortBy: 'newest' | 'oldest' | 'title-asc' | 'title-desc' | 'rating' | 'popular';
}

export const defaultFilters: SearchFilters = {
    search: '',
    genres: [],
    languages: [],
    sortBy: 'newest',
};

export const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
    { value: 'it', label: 'Italian' },
    { value: 'pt', label: 'Portuguese' },
    { value: 'ru', label: 'Russian' },
    { value: 'ja', label: 'Japanese' },
    { value: 'zh', label: 'Chinese' },
    { value: 'ko', label: 'Korean' },
    { value: 'ar', label: 'Arabic' },
    { value: 'hi', label: 'Hindi' },
];

export const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'title-asc', label: 'Title (A-Z)' },
    { value: 'title-desc', label: 'Title (Z-A)' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'popular', label: 'Most Popular' },
];

export function getCurrentYear(): number {
    return new Date().getFullYear();
}

export function getYearRange(): number[] {
    const currentYear = getCurrentYear();
    const startYear = 1900;
    const years: number[] = [];

    for (let year = currentYear; year >= startYear; year--) {
        years.push(year);
    }

    return years;
}

export function filtersToUrl(filters: SearchFilters): string {
    const params = new URLSearchParams();

    if (filters.search) params.set('search', filters.search);
    if (filters.genres.length > 0) params.set('genres', filters.genres.join(','));
    if (filters.yearFrom) params.set('yearFrom', filters.yearFrom.toString());
    if (filters.yearTo) params.set('yearTo', filters.yearTo.toString());
    if (filters.minPages) params.set('minPages', filters.minPages.toString());
    if (filters.maxPages) params.set('maxPages', filters.maxPages.toString());
    if (filters.languages.length > 0) params.set('languages', filters.languages.join(','));
    if (filters.minRating) params.set('minRating', filters.minRating.toString());
    if (filters.sortBy !== 'newest') params.set('sortBy', filters.sortBy);

    return params.toString();
}

export function urlToFilters(searchParams: URLSearchParams): SearchFilters {
    return {
        search: searchParams.get('search') || '',
        genres: searchParams.get('genres')?.split(',').filter(Boolean) || [],
        yearFrom: searchParams.get('yearFrom') ? parseInt(searchParams.get('yearFrom')!) : undefined,
        yearTo: searchParams.get('yearTo') ? parseInt(searchParams.get('yearTo')!) : undefined,
        minPages: searchParams.get('minPages') ? parseInt(searchParams.get('minPages')!) : undefined,
        maxPages: searchParams.get('maxPages') ? parseInt(searchParams.get('maxPages')!) : undefined,
        languages: searchParams.get('languages')?.split(',').filter(Boolean) || [],
        minRating: searchParams.get('minRating') ? parseFloat(searchParams.get('minRating')!) : undefined,
        sortBy: (searchParams.get('sortBy') as SearchFilters['sortBy']) || 'newest',
    };
}
