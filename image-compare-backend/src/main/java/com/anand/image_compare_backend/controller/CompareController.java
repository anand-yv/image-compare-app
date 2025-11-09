package com.anand.image_compare_backend.controller;

import com.anand.image_compare_backend.config.AwsConfig;
import com.anand.image_compare_backend.dto.ApiResponse;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.SdkBytes;
import software.amazon.awssdk.core.exception.SdkClientException;
import software.amazon.awssdk.services.rekognition.RekognitionClient;
import software.amazon.awssdk.services.rekognition.model.*;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class CompareController {
    private static final Logger log = LogManager.getLogger(CompareController.class);
    private final RekognitionClient rekognitionClient = AwsConfig.rekognitionClient();

//    public CompareController(RekognitionClient rekognitionClient) {
//        this.rekognitionClient = rekognitionClient;
//    }

    // POST: /api/compare
    @PostMapping(value = "/compare", consumes = "multipart/form-data")
    public ResponseEntity<?> compare(@RequestParam("image1") MultipartFile sourceImage,
                                     @RequestParam("image2") MultipartFile targetImage) {

        if (sourceImage == null || targetImage == null) {
            return ResponseEntity.status(HttpStatus.NOT_ACCEPTABLE)
                                 .body(ApiResponse.error(null, "Please provide both image"));
        }
        Float similarityThreshold = 0F;

        SdkBytes sourceImageBytes = null;
        SdkBytes targetImageBytes = null;
        try {
            System.out.println(Arrays.toString(sourceImage.getBytes()));
            System.out.println(Arrays.toString(targetImage.getBytes()));
            sourceImageBytes = SdkBytes.fromByteArray(sourceImage.getBytes());
            targetImageBytes = SdkBytes.fromByteArray(targetImage.getBytes());
        } catch (Exception e) {
            log.error(e.toString());
            return ResponseEntity.status(HttpStatus.CONFLICT)
                                 .body(ApiResponse.error(null, "Some error occurred while processing file. Please try with different images. " + e.getMessage()));
        }
        try {
            Image souImage = Image.builder()
                                  .bytes(sourceImageBytes)
                                  .build();

            Image tarImage = Image.builder()
                                  .bytes(targetImageBytes)
                                  .build();
            CompareFacesRequest facesRequest = CompareFacesRequest.builder()
                                                                  .sourceImage(souImage)
                                                                  .targetImage(tarImage)
                                                                  .similarityThreshold(similarityThreshold)
                                                                  .build();

            CompareFacesResponse compareFacesResult = rekognitionClient.compareFaces(facesRequest);
            List<CompareFacesMatch> matches = compareFacesResult.faceMatches();


            if (matches != null && !matches.isEmpty()) {
                for (CompareFacesMatch match : matches) {
                    if (match.similarity() > similarityThreshold) {
                        similarityThreshold = match.similarity();
                    }
                }
            }

            Map<String, Float> responseData = new HashMap<>();
            responseData.put("percentageMatched", similarityThreshold);

            String message = similarityThreshold > 0 ? "Face matched with " + similarityThreshold + "%" : "No faces matched";

            return ResponseEntity.ok(ApiResponse.success(responseData, message));

        } catch (RekognitionException re) {
            // AWS service returned an error (invalid params, etc.). Log full details.
            log.error("Rekognition error code: {}", re.awsErrorDetails().errorCode());
            log.error("Rekognition error message: {}", re.awsErrorDetails().errorMessage());
            log.error("Rekognition request id: {}", re.requestId());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                 .body(ApiResponse.error(null, "Rekognition error: " + re.awsErrorDetails()
                                                                                         .errorMessage()));
        } catch (SdkClientException sce) {
            // Client-side issue (network, credentials, serialization)
            log.error("SDK client error: {}", sce.getMessage(), sce);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                 .body(ApiResponse.error(null, "SDK client error: " + sce.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                 .body(ApiResponse.error(null, "Some issue occurred: " + e.getMessage()));
        }
    }

}
