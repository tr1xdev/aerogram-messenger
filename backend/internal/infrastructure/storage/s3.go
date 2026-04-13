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
	cfg, err := config.LoadDefaultConfig(ctx,
		config.WithRegion("us-east-1"),
		config.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(accessKey, secretKey, "")),
	)
	if err != nil {
		return nil, fmt.Errorf("unable to load SDK config: %w", err)
	}

	client := s3.NewFromConfig(cfg, func(o *s3.Options) {
		o.BaseEndpoint = aws.String(endpoint)
		o.UsePathStyle = true
	})

	storage := &S3Storage{
		client:        client,
		presignClient: s3.NewPresignClient(client),
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

	if s.publicHost != "" {
		u, err := url.Parse(request.URL)
		if err != nil {
			return request.URL, nil
		}

		publicURL, _ := url.Parse(s.publicHost)
		u.Scheme = publicURL.Scheme
		u.Host = publicURL.Host

		newPath := strings.Replace(u.Path, "/"+s.bucket, "/media", 1)
		u.Path = newPath

		return u.String(), nil
	}

	return request.URL, nil
}
