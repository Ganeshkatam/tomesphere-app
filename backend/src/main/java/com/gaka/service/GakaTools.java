package com.gaka.service;

import org.springframework.ai.tool.annotation.Tool;
import org.springframework.stereotype.Service;

@Service
public class GakaTools {

    private final SupabaseService supabaseService;

    public GakaTools(SupabaseService supabaseService) {
        this.supabaseService = supabaseService;
    }

    @Tool(description = "Navigate to a specific page or feature in the application")
    public ToolResponse navigate(String featureName) {
        System.out.println("Tool executed: navigate to " + featureName);
        supabaseService.broadcastAction("NAVIGATE", featureName);
        return new ToolResponse("NAVIGATE", featureName, "Navigating to " + featureName);
    }

    @Tool(description = "Search for books, users, or content")
    public ToolResponse search(String query) {
        System.out.println("Tool executed: search for " + query);
        supabaseService.broadcastAction("SEARCH", query);
        return new ToolResponse("SEARCH", query, "Searching for " + query);
    }

    @Tool(description = "Read or play a book/content")
    public ToolResponse read(String contentName) {
        System.out.println("Tool executed: read " + contentName);
        supabaseService.broadcastAction("READ", contentName);
        return new ToolResponse("READ", contentName, "Opening " + contentName + " for reading");
    }

    public record ToolResponse(String action, String target, String ttsText) {
    }
}
