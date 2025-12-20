package com.gaka.voice.controller;

import com.gaka.voice.service.VoiceSynthesisService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyEmitter;
import org.springframework.http.ResponseEntity;

@RestController
@RequestMapping("/api/voice")
@CrossOrigin(origins = "*") // Allow frontend access
public class VoiceController {

    private final VoiceSynthesisService voiceService;

    @Autowired
    public VoiceController(VoiceSynthesisService voiceService) {
        this.voiceService = voiceService;
    }

    /**
     * Synthesize text and return raw PCM audio as a stream.
     * We convert short[] PCM to byte[] for transmission.
     */
    @PostMapping(value = "/synthesize", produces = MediaType.APPLICATION_OCTET_STREAM_VALUE)
    public byte[] synthesizeText(@RequestBody String text) throws IOException {
        System.out.println("Synthesizing: " + text);

        // Synthesize using Orca
        short[] pcm = voiceService.synthesize(text);

        // Convert short[] to byte[] (Little Endian, standard for PCM)
        ByteBuffer buffer = ByteBuffer.allocate(pcm.length * 2);
        buffer.order(ByteOrder.LITTLE_ENDIAN);
        for (short sample : pcm) {
            buffer.putShort(sample);
        }

        return buffer.array();
    }

    // In a real "Streaming" scenario from LLM, we would accept a Flux<String>
    // and emit a streaming response. For now, this handles the basic TTS request.
}
