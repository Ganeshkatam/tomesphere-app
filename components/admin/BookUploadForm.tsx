'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { generateSimpleDescription } from '@/lib/pdf-description-generator';
import { Sparkles } from 'lucide-react';
import { logAdminAction } from '@/lib/audit';

interface BookUploadFormProps {
    onBookAdded: () => void;
}

export default function BookUploadForm({ onBookAdded }: BookUploadFormProps) {
    const [formData, setFormData] = useState({
        title: '',
        author: '',
        genre: '',
        description: '',
        release_date: '',
        cover_url: '',
        pdf_url: '',
        audio_url: '', // Added audiobook URL field
        isbn: '',
        pages: '',
        publisher: '',
        language: 'English',
    });
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [coverPreview, setCoverPreview] = useState<string>('');
    const [uploadProgress, setUploadProgress] = useState({ cover: 0, pdf: 0 });
    const [loading, setLoading] = useState(false);
    const [generatingDescription, setGeneratingDescription] = useState(false);

    const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('Please upload an image file');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image size must be less than 5MB');
            return;
        }

        setCoverFile(file);
        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setCoverPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handlePdfFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file size (max 100MB for any file type)
        if (file.size > 100 * 1024 * 1024) {
            toast.error('File size must be less than 100MB');
            return;
        }

        setPdfFile(file);
        toast.success(`Selected: ${file.name}`);
    };

    const uploadFile = async (file: File, bucket: string, folder: string): Promise<string> => {
        // Sanitize filename - remove special characters and spaces
        const originalName = file.name;
        const fileExt = originalName.split('.').pop()?.toLowerCase();
        let baseName = originalName.replace(/\.[^/.]+$/, ''); // Remove extension

        // Remove all special characters, keep only alphanumeric, spaces, and basic punctuation
        baseName = baseName
            .replace(/['"]/g, '')                      // Remove quotes and apostrophes
            .replace(/[()[\]{}]/g, '')                 // Remove brackets and parentheses
            .replace(/[^a-zA-Z0-9 _-]/g, '')          // Keep only alphanumeric, space, underscore, hyphen
            .replace(/\s+/g, '_')                      // Replace spaces with underscores
            .replace(/[-_]+/g, '_')                    // Replace multiple hyphens/underscores with single underscore
            .toLowerCase()                             // Convert to lowercase
            .trim();

        // Limit filename length (max 50 chars for base name)
        if (baseName.length > 50) {
            baseName = baseName.substring(0, 50);
        }

        // Remove trailing underscores
        baseName = baseName.replace(/_+$/, '');

        // Create unique filename with timestamp
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 8);
        const fileName = `${folder}/${baseName}_${timestamp}_${randomStr}.${fileExt}`;

        console.log('📤 Uploading:', originalName);
        console.log('💾 As:', fileName);

        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false,
            });

        if (error) {
            console.error('❌ Upload error:', error);
            throw new Error(`Upload failed: ${error.message}`);
        }

        console.log('✅ Upload successful!');

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(fileName);

        return publicUrl;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            let coverUrl = formData.cover_url;
            let pdfUrl = formData.pdf_url;

            // Upload cover image if file is selected
            if (coverFile) {
                setUploadProgress({ ...uploadProgress, cover: 50 });
                coverUrl = await uploadFile(coverFile, 'book-covers', 'covers');
                setUploadProgress({ ...uploadProgress, cover: 100 });
                toast.success('Cover uploaded!');
            }

            // Upload PDF/EPUB if file is selected
            if (pdfFile) {
                setUploadProgress({ ...uploadProgress, pdf: 50 });
                pdfUrl = await uploadFile(pdfFile, 'book-pdfs', 'files');
                setUploadProgress({ ...uploadProgress, pdf: 100 });
                toast.success('File uploaded!');
            }

            // Create book record
            const { data: book, error } = await supabase
                .from('books')
                .insert({
                    title: formData.title,
                    author: formData.author,
                    genre: formData.genre,
                    description: formData.description,
                    release_date: formData.release_date || null,
                    cover_url: coverUrl,
                    pdf_url: pdfUrl,
                    epub_url: pdfFile?.name.endsWith('.epub') ? pdfUrl : null,
                    isbn: formData.isbn,
                    pages: formData.pages ? parseInt(formData.pages) : null,
                    publisher: formData.publisher,
                    language: formData.language,
                })
                .select()
                .single();

            if (error) {
                console.error('Database insert error:', error);
                throw new Error(`Database error: ${error.message}`);
            }

            // Create audiobook record if URL provided
            if (formData.audio_url && book) {
                const { error: audioError } = await supabase
                    .from('audiobooks')
                    .insert({
                        book_id: book.id,
                        title: book.title,
                        audio_url: formData.audio_url,
                        duration_seconds: 0 // Will be updated when played
                    });

                if (audioError) console.error('Error adding audiobook:', audioError);
            }

            toast.success('Book added successfully!');

            // Reset form
            setFormData({
                title: '',
                author: '',
                genre: '',
                description: '',
                release_date: '',
                cover_url: '',
                pdf_url: '',
                audio_url: '',
                isbn: '',
                pages: '',
                publisher: '',
                language: 'English',
            });
            setCoverPreview('');
            setUploadProgress({ cover: 0, pdf: 0 });

            await logAdminAction('CREATE_BOOK', `Added new book: ${formData.title} by ${formData.author}`);

            onBookAdded();
        } catch (error: any) {
            console.error('Upload error:', error);
            toast.error(error.message || 'Failed to add book');
        } finally {
            setLoading(false);
        }
    };

    const generateDescription = async () => {
        if (!formData.title) {
            toast.error('Please enter a title first');
            return;
        }

        setGeneratingDescription(true);
        try {
            // Generate description based on title and author
            const description = generateSimpleDescription(
                formData.title,
                formData.author || undefined
            );

            setFormData({ ...formData, description });
            toast.success('Description generated!');
        } catch (error) {
            toast.error('Failed to generate description');
        } finally {
            setGeneratingDescription(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-2 text-slate-300">
                        Title *
                    </label>
                    <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                        className="w-full"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2 text-slate-300">
                        Author *
                    </label>
                    <input
                        type="text"
                        value={formData.author}
                        onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                        required
                        className="w-full"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2 text-slate-300">
                        Genre *
                    </label>
                    <input
                        type="text"
                        value={formData.genre}
                        onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                        required
                        placeholder="e.g., Fiction, Science Fiction"
                        className="w-full"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2 text-slate-300">
                        Release Date
                    </label>
                    <input
                        type="date"
                        value={formData.release_date}
                        onChange={(e) => setFormData({ ...formData, release_date: e.target.value })}
                        className="w-full"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2 text-slate-300">
                        ISBN
                    </label>
                    <input
                        type="text"
                        value={formData.isbn}
                        onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                        className="w-full"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2 text-slate-300">
                        Pages
                    </label>
                    <input
                        type="number"
                        value={formData.pages}
                        onChange={(e) => setFormData({ ...formData, pages: e.target.value })}
                        className="w-full"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2 text-slate-300">
                        Publisher
                    </label>
                    <input
                        type="text"
                        value={formData.publisher}
                        onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                        className="w-full"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2 text-slate-300">
                        Language
                    </label>
                    <select
                        value={formData.language}
                        onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                        className="w-full"
                    >
                        <option>English</option>
                        <option>Spanish</option>
                        <option>French</option>
                        <option>German</option>
                        <option>Other</option>
                    </select>
                </div>
            </div>

            <div>
                <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-slate-300">
                        Description
                    </label>
                    <button
                        type="button"
                        onClick={generateDescription}
                        disabled={generatingDescription || !formData.title}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        <Sparkles size={14} className={generatingDescription ? 'animate-spin' : ''} />
                        {generatingDescription ? 'Generating...' : 'Auto-Generate'}
                    </button>
                </div>
                <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className="w-full"
                    placeholder="Brief description of the book..."
                />
            </div>

            {/* File Uploads Section */}
            <div className="border-t border-white/10 pt-6">
                <h3 className="text-lg font-semibold text-white mb-4">📁 File Uploads</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Cover Image Upload */}
                    <div>
                        <label className="block text-sm font-medium mb-2 text-slate-300">
                            📷 Book Cover Image
                        </label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleCoverFileChange}
                            className="hidden"
                            id="cover-upload"
                        />
                        <label
                            htmlFor="cover-upload"
                            className="block w-full p-4 border-2 border-dashed border-slate-600 rounded-lg cursor-pointer hover:border-primary transition-colors text-center"
                        >
                            {coverPreview ? (
                                <img src={coverPreview} alt="Preview" className="mx-auto h-48 object-contain rounded" />
                            ) : (
                                <div className="text-slate-400">
                                    <div className="text-4xl mb-2">📸</div>
                                    <div>Click to upload cover</div>
                                    <div className="text-xs mt-1">Max 5MB</div>
                                </div>
                            )}
                        </label>
                        {uploadProgress.cover > 0 && uploadProgress.cover < 100 && (
                            <div className="mt-2 bg-slate-700 rounded-full h-2">
                                <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${uploadProgress.cover}%` }} />
                            </div>
                        )}
                    </div>

                    {/* PDF/EPUB Upload */}
                    <div>
                        <label className="block text-sm font-medium mb-2 text-slate-300">
                            📖 Book File (Any Format)
                        </label>
                        <input
                            type="file"
                            accept="*/*"
                            onChange={handlePdfFileChange}
                            className="hidden"
                            id="pdf-upload"
                        />
                        <label
                            htmlFor="pdf-upload"
                            className="block w-full p-4 border-2 border-dashed border-slate-600 rounded-lg cursor-pointer hover:border-purple-500 transition-colors text-center"
                        >
                            <div className="text-slate-400">
                                <div className="text-4xl mb-2">📄</div>
                                <div>{pdfFile ? pdfFile.name : 'Click to upload file'}</div>
                                <div className="text-xs mt-1">Any format, Max 100MB</div>
                            </div>
                        </label>
                        {uploadProgress.pdf > 0 && uploadProgress.pdf < 100 && (
                            <div className="mt-2 bg-slate-700 rounded-full h-2">
                                <div className="bg-purple-600 h-2 rounded-full transition-all" style={{ width: `${uploadProgress.pdf}%` }} />
                            </div>
                        )}
                    </div>
                </div>

                <p className="text-xs text-slate-500 mt-3">
                    💡 Tip: You can either upload files directly or provide URLs below
                </p>
            </div>

            {/* Optional URL inputs */}
            <div className="border-t border-white/10 pt-6">
                <h3 className="text-sm font-medium text-slate-400 mb-3">Or use URLs:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-2 text-slate-300">
                            Cover Image URL
                        </label>
                        <input
                            type="url"
                            value={formData.cover_url}
                            onChange={(e) => setFormData({ ...formData, cover_url: e.target.value })}
                            placeholder="https://..."
                            className="w-full"
                            disabled={!!coverFile}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2 text-slate-300">
                            PDF/EPUB URL
                        </label>
                        <input
                            type="url"
                            value={formData.pdf_url}
                            onChange={(e) => setFormData({ ...formData, pdf_url: e.target.value })}
                            placeholder="https://..."
                            className="w-full"
                            disabled={!!pdfFile}
                        />
                    </div>
                </div>
            </div>

            <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2"
            >
                {loading ? (
                    <>
                        <div className="spinner w-5 h-5 border-2 border-white border-t-transparent" />
                        <span>Uploading & Adding Book...</span>
                    </>
                ) : (
                    <>➕ Add Book</>
                )}
            </button>
        </form>
    );
}
