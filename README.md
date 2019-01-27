# ImageCDN

A free image resizing service and CDN.

### Why?
This started out out of a repeated frustration that optimising images between multiple
projects was a constantly moving target, requiring large amounts of boilerplate. Image
libraries existed but went about solving the same problems in different ways to varying
degress of success.

This is completely open-source under the ISC license, so all contributions are welcomed.
You are free to run this yourself however you wish: Historically this has been deployed
either via Docker (AWS ECS/Kubernetes) or directly via Node.

The public instance of this service is available here: https://imagecdn.app/

### Rough Architecture
- HTTP Request comes in, specifying image source.
- Image Source is streamed.
- Format determined by QueryString parameter, falling back to Accept header.
- Image is streamed to libvips orchestration layer for conversion and manipulation.
- Image is run through image optimisation pipeline.
- Image served with a Vary on Accept and Accept-Encoding.
