package com.gaka.voice.controller;

import com.gaka.voice.service.VoiceSynthesisService;
import org.springframework.ai.chat.ChatClient;
import org.springframework.ai.chat.StreamingChatClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyEmitter;
import reactor.core.publisher.Flux;

import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@RestController
@RequestMapping("/api/gemini-voice")
@CrossOrigin(origins = "*")
public class GeminiVoiceController {

    private final StreamingChatClient chatClient;
    private final VoiceSynthesisService voiceService;
    private final ExecutorService executor = Executors.newCachedThreadPool();

    @Autowired
    public GeminiVoiceController(StreamingChatClient chatClient, VoiceSynthesisService voiceService) {
        this.chatClient = chatClient;
        this.voiceService = voiceService;
    }

    /**
     * Streams audio bytes generated from Gemini's response to the prompt.
     */
    @PostMapping(value = "/chat-stream", produces = MediaType.APPLICATION_OCTET_STREAM_VALUE)
    public ResponseBodyEmitter chatAndSpeak(@RequestBody String prompt) {
        ResponseBodyEmitter emitter = new ResponseBodyEmitter();

        executor.submit(() -> {
            try {
                // Buffer to accumulate sentence fragments for better TTS quality
                StringBuilder sentenceBuffer = new StringBuilder();

                chatClient.stream(prompt)
                        .subscribe(
                                response -> {
                                    String token = response; // content
                                    if (token != null) {
                                        sentenceBuffer.append(token);
                                        // Simple punctuation splitter for "Rough" Streaming
                                        if (token.matches(".*[.!?\\n].*")) {
                                            synthesizeAndEmit(emitter, sentenceBuffer.toString());
                                            sentenceBuffer.setLength(0);
                                        }
                                    }
                                },
                                error -> {
                                    System.err.println("Gemini Error: " + error.getMessage());
                                    emitter.completeWithError(error);
                                },
                                () -> {
                                    // Flush remaining
                                    if (sentenceBuffer.length() > 0) {
                                        synthesizeAndEmit(emitter, sentenceBuffer.toString());
                                    }
                                    emitter.complete();
                                });
            } catch (Exception e) {
                emitter.completeWithError(e);
            }
        });

        return emitter;
    }

    private void synthesizeAndEmit(ResponseBodyEmitter emitter, String text) {
        try {
            short[] pcm = voiceService.synthesize(text.trim());
            if (pcm.length > 0) {
                ByteBuffer buffer = ByteBuffer.allocate(pcm.length * 2);
                buffer.order(ByteOrder.LITTLE_ENDIAN);
                for (short sample : pcm) {
                    buffer.putShort(sample);
                }
                emitter.send(buffer.array(), MediaType.APPLICATION_OCTET_STREAM);
            }
        } catch (IOException e) {
            System.err.println("Emitter failed: " + e.getMessage());
        }
    }
}
