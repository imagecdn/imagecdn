# responsive-image-service

## Architecture

1. HTTP Request comes in, specifying image source.
 - Image Source is streamed.
 - Format determined by QueryString parameter, falling back to Accept header.
2. Image is streamed, and buffered, into an ImageMagick call.
 - ImageMagick operations are performed by ImageMagick.
3. Image is streamed, and buffered, into image optimisation pipeline.
4. Image served, as a stream, with a Vary on Accept and Accept-Encoding.