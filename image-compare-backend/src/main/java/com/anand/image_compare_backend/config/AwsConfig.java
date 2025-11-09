package com.anand.image_compare_backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.ProfileCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.rekognition.RekognitionClient;

@Configuration
public class AwsConfig {

    @Bean
    public static RekognitionClient rekognitionClient(){
        // Creating the AWS rekognition client
        return RekognitionClient
                .builder()
                .region(Region.of(System.getenv().getOrDefault("AWS_REGION","ap-south-1")))
                .build();
    }
//    private BasicAWSCredentials getBasicAWSCredentials() {
//        return new BasicAWSCredentials(aws.getAccessKey(), aws.getSecretKey());
//    }
}
