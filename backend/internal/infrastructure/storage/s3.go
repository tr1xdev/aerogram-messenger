package storage

import (
	"context"
	"fmt"
	"io"
	"net/url"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

type S3Storage struct {
	client        *s3.Client
	presignClient *s3.PresignClient
	bucket        string
	publicHost    string
}

func NewS3Storage(ctx context.Context, endpoint, accessKey, secretKey, bucket, publicHost string) (*S3Storage, error) {
	creds := credentials.NewStaticCredentialsProvider(accessKey, secretKey, "")

	cfg, err := config.LoadDefaultConfig(ctx,
		config.WithRegion("us-east-1"),
		config.WithCredentialsProvider(creds),
	)
	if err != nil {
		return nil, fmt.Errorf("unable to load SDK config: %w", err)
	}

	client := s3.NewFromConfig(cfg, func(o *s3.Options) {
		o.BaseEndpoint = aws.String(endpoint)
		o.UsePathStyle = true
	})

	signEndpoint := endpoint
	if publicHost != "" {
		signEndpoint = publicHost
	}

	signClient := s3.NewFromConfig(cfg, func(o *s3.Options) {
		o.BaseEndpoint = aws.String(signEndpoint)
		o.UsePathStyle = true
	})

	storage := &S3Storage{
		client:        client,
		presignClient: s3.NewPresignClient(signClient),
		bucket:        bucket,
		publicHost:    publicHost,
	}

	if err := storage.ensureBucket(ctx); err != nil {
		return nil, err
	}

	return storage, nil
}

func (s *S3Storage) ensureBucket(ctx context.Context) error {
	_, err := s.client.HeadBucket(ctx, &s3.HeadBucketInput{
		Bucket: aws.String(s.bucket),
	})
	if err != nil {
		if strings.Contains(err.Error(), "404") || strings.Contains(err.Error(), "NotFound") {
			_, err = s.client.CreateBucket(ctx, &s3.CreateBucketInput{
				Bucket: aws.String(s.bucket),
			})
			if err != nil {
				return fmt.Errorf("failed to create bucket: %w", err)
			}
		} else {
			return fmt.Errorf("failed to check bucket existence: %w", err)
		}
	}
	return nil
}

func (s *S3Storage) UploadFile(ctx context.Context, key string, body io.Reader, contentType string) (string, error) {
	_, err := s.client.PutObject(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(s.bucket),
		Key:         aws.String(key),
		Body:        body,
		ContentType: aws.String(contentType),
	})
	if err != nil {
		return "", fmt.Errorf("failed to upload file: %w", err)
	}
	return key, nil
}

func (s *S3Storage) GetPresignedURL(ctx context.Context, key string, expires time.Duration) (string, error) {
	request, err := s.presignClient.PresignGetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(s.bucket),
		Key:    aws.String(key),
	}, func(opts *s3.PresignOptions) {
		opts.Expires = expires
	})
	if err != nil {
		return "", fmt.Errorf("failed to generate presigned url: %w", err)
	}

	finalURL := request.URL
	if s.publicHost != "" {
		u, _ := url.Parse(finalURL)
		u.Path = "/media" + u.Path
		u.Path = strings.ReplaceAll(u.Path, "//", "/")
		finalURL = u.String()
	}

	return finalURL, nil
}
