package com.gaka.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class SupabaseService {

    @Value("${spring.datasource.url}")
    private String dbUrl;

    @Value("${supabase.url}")
    private String supabaseUrl;

    @Value("${supabase.key}")
    private String supabaseKey;

    public void broadcastAction(String action, String target) {
        System.out.println("Broadcasting: " + action + " -> " + target);

        try {
            // Using Unirest/HTTP to hit Supabase Edge Function or Table
            // Sending a POST request to the 'gaka_events' table via PostgREST

            String endpoint = supabaseUrl + "/rest/v1/gaka_events";

            com.konghq.unirest.java.Unirest
                    .post(endpoint)
                    .header("apikey", supabaseKey)
                    .header("Authorization", "Bearer " + supabaseKey)
                    .header("Content-Type", "application/json")
                    .header("Prefer", "return=minimal")
                    .body("{\"action\": \"" + action + "\", \"target\": \"" + target + "\"}")
                    .asString();

        } catch (Exception e) {
            System.err.println("Failed to broadcast to Supabase: " + e.getMessage());
            // e.printStackTrace(); // Keep logs clean
        }
    }
}
