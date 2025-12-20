package com.gaka.voice.service;

import ai.picovoice.orca.Orca;
import ai.picovoice.orca.OrcaException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;

@Service
public class VoiceSynthesisService {

    @Value("${picovoice.accessKey}")
    private String accessKey;

    private Orca orca;

    @PostConstruct
    public void init() {
        try {
            // Initialize Orca with AccessKey
            // Assuming standard initialization. If model path is custom, we'd pass it.
            orca = new Orca.Builder()
                    .setAccessKey(accessKey)
                    .build();
            System.out.println("Orca Voice Engine Initialized Successfully.");
        } catch (OrcaException e) {
            System.err.println("Failed to initialize Orca: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Synthesize text to PCM audio.
     * 
     * @param text The text to speak.
     * @return short[] array of PCM samples.
     */
    public short[] synthesize(String text) {
        if (orca == null) {
            throw new IllegalStateException("Orca engine is not initialized.");
        }
        try {
            return orca.synthesize(text);
        } catch (OrcaException e) {
            System.err.println("Synthesis failed: " + e.getMessage());
            return new short[0];
        }
    }

    // For streaming token-by-token, implementation depends on Orca streaming
    // support.
    // Standard Orca is usually sentence-based.
    // If OrcaStream is available in the specific SDK version, we would use it here.
    // For now, wrapping the basic synthesize.

    @PreDestroy
    public void cleanup() {
        if (orca != null) {
            orca.delete();
        }
    }
}
