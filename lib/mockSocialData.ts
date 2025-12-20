// Mock data for social showcase
export const mockUsers = [
    { id: 1, name: "Sarah Chen", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah", booksRead: 47, streak: 23 },
    { id: 2, name: "Mike Johnson", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mike", booksRead: 32, streak: 15 },
    { id: 3, name: "Emma Wilson", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emma", booksRead: 61, streak: 45 },
    { id: 4, name: "Jake Martinez", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jake", booksRead: 28, streak: 12 },
    { id: 5, name: "Lisa Anderson", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa", booksRead: 39, streak: 28 },
    { id: 6, name: "David Kim", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=David", booksRead: 44, streak: 19 },
    { id: 7, name: "Rachel Green", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rachel", booksRead: 25, streak: 8 },
    { id: 8, name: "Tom Harris", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Tom", booksRead: 53, streak: 31 },
];

export const mockActivities = [
    { id: 1, user: "Sarah Chen", action: "finished", book: "Project Hail Mary", rating: 5, time: "2 min ago" },
    { id: 2, user: "Mike Johnson", action: "added", book: "Dune", list: "Want to Read", time: "5 min ago" },
    { id: 3, user: "Emma Wilson", action: "joined", club: "Sci-Fi Lovers", time: "12 min ago" },
    { id: 4, user: "Jake Martinez", action: "completed", challenge: "Summer Reading Challenge", time: "18 min ago" },
    { id: 5, user: "Lisa Anderson", action: "reviewed", book: "Fourth Wing", rating: 4, time: "23 min ago" },
    { id: 6, user: "David Kim", action: "started", book: "The Three-Body Problem", time: "35 min ago" },
    { id: 7, user: "Rachel Green", action: "added", book: "Atomic Habits", list: "Currently Reading", time: "42 min ago" },
    { id: 8, user: "Tom Harris", action: "finished", book: "1984", rating: 5, time: "1 hour ago" },
];

export const mockReviews = [
    {
        id: 1,
        user: "Emma Wilson",
        userAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emma",
        book: "Fourth Wing",
        bookCover: "https://images-na.ssl-images-amazon.com/images/I/91n8z7vVYuL.jpg",
        rating: 5,
        text: "Absolutely captivating! The dragon bonding scenes were breathtaking. Rebecca Yarros has created a world I never want to leave. Can't wait for the sequel!",
        likes: 234,
        time: "2 days ago"
    },
    {
        id: 2,
        user: "Mike Johnson",
        userAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mike",
        book: "Project Hail Mary",
        bookCover: "https://m.media-amazon.com/images/I/91aOT0SYNJL._AC_UF1000,1000_QL80_.jpg",
        rating: 5,
        text: "Andy Weir does it again! Perfect blend of hard sci-fi and humor. Rocky is my new favorite alien. A masterpiece of problem-solving and friendship.",
        likes: 189,
        time: "3 days ago"
    },
    {
        id: 3,
        user: "Sarah Chen",
        userAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
        book: "The Song of Achilles",
        bookCover: "https://m.media-amazon.com/images/I/81gLNKHu-UL._AC_UF1000,1000_QL80_.jpg",
        rating: 5,
        text: "Madeline Miller's prose is poetry. This retelling broke my heart in the best way. A must-read for lovers of Greek mythology and beautiful writing.",
        likes: 312,
        time: "5 days ago"
    },
    {
        id: 4,
        user: "Tom Harris",
        userAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Tom",
        book: "Tomorrow, and Tomorrow, and Tomorrow",
        bookCover: "https://m.media-amazon.com/images/I/91HeW1QiOoL._AC_UF1000,1000_QL80_.jpg",
        rating: 4,
        text: "A beautiful exploration of friendship, creativity, and game design. Zevin captures the complexity of relationships with incredible depth.",
        likes: 156,
        time: "1 week ago"
    },
];

export const mockClubs = [
    {
        id: 1,
        name: "Sci-Fi Enthusiasts",
        icon: "🚀",
        members: 2431,
        currentlyReading: "Dune",
        description: "Exploring universes beyond imagination"
    },
    {
        id: 2,
        name: "Mystery & Thriller Fans",
        icon: "🔍",
        members: 1847,
        currentlyReading: "The Silent Patient",
        description: "Page-turners and plot twists galore"
    },
    {
        id: 3,
        name: "Classic Literature",
        icon: "📖",
        members: 956,
        currentlyReading: "Pride and Prejudice",
        description: "Timeless stories that shaped literature"
    },
    {
        id: 4,
        name: "Fantasy Realm",
        icon: "⚔️",
        members: 3214,
        currentlyReading: "The Name of the Wind",
        description: "Magic, dragons, and epic quests"
    },
    {
        id: 5,
        name: "Romance Readers",
        icon: "💕",
        members: 2108,
        currentlyReading: "Beach Read",
        description: "Love stories that make us swoon"
    },
    {
        id: 6,
        name: "Non-Fiction Nerds",
        icon: "🧠",
        members: 1423,
        currentlyReading: "Sapiens",
        description: "Learning and growing through facts"
    },
];

export const topReaders = mockUsers
    .sort((a, b) => b.booksRead - a.booksRead)
    .slice(0, 5);
