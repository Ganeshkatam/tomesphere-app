'use client';

import { useState, useEffect } from 'react';
import { Download, Monitor, Smartphone, Tablet, Apple, Play } from 'lucide-react';
import Navbar from '@/components/Navbar';

export default function DownloadClient() {
    const [deviceType, setDeviceType] = useState<'windows' | 'mac' | 'android' | 'ios' | 'unknown'>('unknown');

    useEffect(() => {
        const userAgent = navigator.userAgent.toLowerCase();
        if (userAgent.includes('win')) setDeviceType('windows');
        else if (userAgent.includes('mac')) setDeviceType('mac');
        else if (userAgent.includes('android')) setDeviceType('android');
        else if (userAgent.includes('iphone') || userAgent.includes('ipad')) setDeviceType('ios');
    }, []);

    const getRecommendedDownload = () => {
        switch (deviceType) {
            case 'windows':
                return {
                    label: 'Download for Windows',
                    icon: Monitor,
                    url: '/downloads/tomesphere-setup.exe',
                    subtext: 'Windows 10/11 (64-bit)'
                };
            case 'mac':
                return {
                    label: 'Download for Mac',
                    icon: Apple,
                    url: '/downloads/tomesphere-installer.dmg',
                    subtext: 'macOS 11.0 or later'
                };
            case 'android':
                return {
                    label: 'Get it on Google Play',
                    icon: Play,
                    url: 'https://play.google.com/store/apps/details?id=com.tomesphere.app',
                    subtext: 'Android 8.0+'
                };
            case 'ios':
                return {
                    label: 'Download on App Store',
                    icon: Apple,
                    url: 'https://apps.apple.com/app/tomesphere',
                    subtext: 'iOS 15.0+'
                };
            default:
                return {
                    label: 'Use PWA / Web Version',
                    icon: Download,
                    url: '/',
                    subtext: 'Works on all devices'
                };
        }
    };

    const recommendation = getRecommendedDownload();
    const Icon = recommendation.icon;

    return (
        <div className="min-h-screen bg-gradient-page">
            <Navbar role="user" currentPage="/download" />

            <div className="max-w-4xl mx-auto px-4 py-16 text-center">
                <div className="mb-12 animate-fadeIn">
                    <h1 className="text-5xl font-display font-bold mb-4">
                        Download <span className="gradient-text">TomeSphere</span>
                    </h1>
                    <p className="text-xl text-slate-400">
                        Experience the library on any device, anywhere.
                    </p>
                </div>

                {/* Recommended Download */}
                <div className="max-w-md mx-auto mb-16 relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
                    <div className="relative glass-strong p-8 rounded-2xl border border-white/10 flex flex-col items-center">
                        <div className="p-4 bg-white/5 rounded-full mb-4">
                            <Icon size={48} className="text-primary-light" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Recommended for you</h2>
                        <p className="text-slate-400 mb-6">{recommendation.subtext}</p>
                        <a
                            href={recommendation.url}
                            className="btn btn-primary w-full py-4 text-lg flex items-center justify-center gap-2"
                        >
                            <Download size={24} />
                            {recommendation.label}
                        </a>
                    </div>
                </div>

                {/* All Platforms */}
                <h3 className="text-2xl font-bold mb-8">Available on all platforms</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <PlatformCard
                        icon={Monitor}
                        name="Windows"
                        link="/downloads/windows"
                        active={deviceType === 'windows'}
                    />
                    <PlatformCard
                        icon={Apple}
                        name="macOS"
                        link="/downloads/mac"
                        active={deviceType === 'mac'}
                    />
                    <PlatformCard
                        icon={Smartphone}
                        name="Android"
                        link="https://play.google.com"
                        active={deviceType === 'android'}
                    />
                    <PlatformCard
                        icon={Tablet}
                        name="iOS"
                        link="https://apps.apple.com"
                        active={deviceType === 'ios'}
                    />
                </div>
            </div>
        </div>
    );
}

function PlatformCard({ icon: Icon, name, link, active }: any) {
    return (
        <a
            href={link}
            className={`glass p-6 rounded-xl border flex flex-col items-center gap-4 transition-all hover:scale-105 ${active ? 'border-primary bg-primary/10' : 'border-white/5 hover:border-white/20'
                }`}
        >
            <Icon size={32} className={active ? 'text-primary' : 'text-slate-400'} />
            <span className="font-medium">{name}</span>
            {active && <span className="text-xs text-primary bg-primary/10 px-2 py-1 rounded-full">Detected</span>}
        </a>
    );
}
