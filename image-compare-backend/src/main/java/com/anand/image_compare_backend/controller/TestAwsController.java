package com.anand.image_compare_backend.controller;

import com.anand.image_compare_backend.dto.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import software.amazon.awssdk.services.rekognition.RekognitionClient;

@RestController
@RequestMapping("/api")
public class TestAwsController {

    private final RekognitionClient rekClient;

    public TestAwsController(RekognitionClient rekClient){
        this.rekClient = rekClient;
    }

    // GET : /api/aws-check
    @GetMapping(value = "aws-check")
    public ResponseEntity<ApiResponse<String>> checkAwsConnection(){
        try{
            rekClient.listCollections();

            return ResponseEntity.ok(ApiResponse.success(null, "AWS Credentials working"));
        }catch (Exception e){
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error(null, "AWS Credentials NOT working : " + e.getMessage()));
        }
    }
}
