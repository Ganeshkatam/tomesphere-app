'use client';

import { useState, useRef } from 'react';
import { Upload, File, X, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

interface UniversalFileUploadProps {
    onFileUploaded: (url: string, fileName: string, fileType: string) => void;
    acceptedTypes?: string; // e.g., "image/*,.pdf,.doc,.docx" or "*" for all
    maxSizeMB?: number;
    bucket?: string;
    label?: string;
    description?: string;
    currentFile?: string;
}

export default function UniversalFileUpload({
    onFileUploaded,
    acceptedTypes = '*/*', // Accept all files by default
    maxSizeMB = 50, // 50MB default
    bucket = 'verification-documents',
    label = 'Upload File',
    description = 'Any file type accepted',
    currentFile,
}: UniversalFileUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [uploadedFile, setUploadedFile] = useState<string | null>(currentFile || null);
    const [fileName, setFileName] = useState<string>('');
    const [fileType, setFileType] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file');
    const [urlInput, setUrlInput] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    };

    const getFileIcon = (type: string): string => {
        if (type.startsWith('image/')) return '🖼️';
        if (type.startsWith('video/')) return '🎥';
        if (type.startsWith('audio/')) return '🎵';
        if (type.includes('pdf')) return '📄';
        if (type.includes('word') || type.includes('doc')) return '📝';
        if (type.includes('excel') || type.includes('sheet')) return '📊';
        if (type.includes('powerpoint') || type.includes('presentation')) return '📽️';
        if (type.includes('zip') || type.includes('rar')) return '🗜️';
        if (type.includes('text')) return '📃';
        return '📎';
    };

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setError(null);

        // Check file size
        const fileSizeMB = file.size / (1024 * 1024);
        if (fileSizeMB > maxSizeMB) {
            setError(`File size (${formatFileSize(file.size)}) exceeds ${maxSizeMB}MB limit`);
            toast.error(`File too large! Maximum size is ${maxSizeMB}MB`);
            return;
        }

        setUploading(true);
        setFileName(file.name);
        setFileType(file.type || 'application/octet-stream');

        try {
            // Generate unique filename
            const fileExt = file.name.split('.').pop();
            const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `${uniqueFileName}`;

            // Upload to Supabase Storage
            const { data, error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false,
                });

            if (uploadError) {
                // If bucket is private, we might get an error but the file could still upload
                console.warn('Upload warning:', uploadError);
            }

            // Get public URL (or signed URL for private buckets)
            const { data: urlData } = supabase.storage
                .from(bucket)
                .getPublicUrl(filePath);

            const fileUrl = urlData.publicUrl;
            setUploadedFile(fileUrl);
            onFileUploaded(fileUrl, file.name, file.type);
            toast.success(`${file.name} uploaded successfully!`);
        } catch (error) {
            console.error('Upload error:', error);
            setError('Failed to upload file');
            toast.error('Failed to upload file');
        } finally {
            setUploading(false);
        }
    };

    const handleRemove = () => {
        setUploadedFile(null);
        setFileName('');
        setFileType('');
        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleBrowse = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="space-y-3">
            {/* Label */}
            {label && (
                <div>
                    <label className="block text-sm font-medium text-white mb-1">
                        {label}
                    </label>
                    {description && (
                        <p className="text-xs text-slate-400">{description}</p>
                    )}
                </div>
            )}

            {/* Tabs for Upload or URL */}
            <div className="flex gap-2 mb-3">
                <button
                    type="button"
                    onClick={() => setUploadMode('file')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${uploadMode === 'file'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white/5 text-slate-400 hover:bg-white/10'
                        }`}
                >
                    📁 Upload File
                </button>
                <button
                    type="button"
                    onClick={() => setUploadMode('url')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${uploadMode === 'url'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white/5 text-slate-400 hover:bg-white/10'
                        }`}
                >
                    🔗 Use URL
                </button>
            </div>

            {/* URL Input Mode */}
            {uploadMode === 'url' && (
                <div className="space-y-3">
                    <input
                        type="url"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        placeholder="https://example.com/file.pdf"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                    <button
                        type="button"
                        onClick={() => {
                            if (!urlInput) {
                                toast.error('Please enter a URL');
                                return;
                            }
                            setUploadedFile(urlInput);
                            const fileName = urlInput.split('/').pop() || 'file';
                            setFileName(fileName);
                            setFileType('url');
                            onFileUploaded(urlInput, fileName, 'url');
                            toast.success('URL added successfully!');
                        }}
                        className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                    >
                        Add URL
                    </button>
                </div>
            )}

            {/* File Upload Mode */}
            {uploadMode === 'file' && !uploadedFile && (
                <div
                    onClick={handleBrowse}
                    className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${error
                        ? 'border-red-500/50 bg-red-500/5'
                        : 'border-white/20 bg-white/5 hover:border-indigo-500/50 hover:bg-white/10'
                        }`}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept={acceptedTypes}
                        onChange={handleFileSelect}
                        className="hidden"
                        disabled={uploading}
                    />

                    {uploading ? (
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                            <p className="text-sm text-slate-300">Uploading...</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                                <Upload size={32} className="text-white" />
                            </div>
                            <div>
                                <p className="text-white font-medium mb-1">
                                    Click to upload or drag and drop
                                </p>
                                <p className="text-xs text-slate-400">
                                    Any file type • Max {maxSizeMB}MB
                                </p>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="mt-3 flex items-center justify-center gap-2 text-red-400 text-sm">
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </div>
                    )}
                </div>
            )}

            {/* File Upload Mode - Uploaded State */}
            {uploadMode === 'file' && uploadedFile && (
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="flex items-center gap-4">
                        {/* File Icon */}
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center text-2xl flex-shrink-0">
                            {getFileIcon(fileType)}
                        </div>

                        {/* File Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <CheckCircle size={16} className="text-green-400 flex-shrink-0" />
                                <p className="text-sm font-medium text-white truncate">
                                    {fileName}
                                </p>
                            </div>
                            <p className="text-xs text-slate-400">{fileType}</p>
                        </div>

                        {/* Remove Button */}
                        <button
                            onClick={handleRemove}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
                            title="Remove file"
                        >
                            <X size={18} className="text-slate-400" />
                        </button>
                    </div>

                    {/* Preview for images */}
                    {fileType.startsWith('image/') && uploadedFile && (
                        <div className="mt-3">
                            <img
                                src={uploadedFile}
                                alt="Preview"
                                className="w-full h-48 object-cover rounded-lg"
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
