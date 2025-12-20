package com.gaka.controller;

import org.springframework.ai.chat.ChatClient;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.chat.prompt.PromptTemplate;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/gaka")
@CrossOrigin(origins = "*") // Allow all for demo
public class IntentController {

    private final ChatClient chatClient;
    private final GakaTools gakaTools;

    public IntentController(ChatClient.Builder chatClientBuilder, GakaTools gakaTools) {
        this.chatClient = chatClientBuilder
                .defaultSystem(
                        "You are Hey GaKa, an intelligent voice assistant. You have tools to navigate, search, and read content. Always use the appropriate tool to satisfy the user's request.")
                .defaultTools("gakaTools") // Register the bean name match
                .build();
        this.gakaTools = gakaTools;
    }

    @PostMapping("/intent")
    public IntentResponse processIntent(@RequestBody IntentRequest request) {
        String userQuery = request.query();
        System.out.println("Received Query: " + userQuery);

        try {
            String response = chatClient.prompt()
                    .user(userQuery)
                    .functions("navigate", "search", "read") // Explicitly listing if needed
                    .call()
                    .content();

            return new IntentResponse(response, null);

        } catch (Exception e) {
            e.printStackTrace();
            return new IntentResponse("I processed that, but encountered an error.", null);
        }
    }
}

record IntentRequest(String query) {
}

record IntentResponse(String tts_text, String nav_url) {
}
