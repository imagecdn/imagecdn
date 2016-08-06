<?php

namespace AppBundle\Http;

use Symfony\Component\HttpFoundation\Request as SymfonyRequest;

class ImageRequest implements RequestInterface
{
    /**
     * URI from which to download image.
     *
     * @var string
     */
    protected $uri;

    /**
     * Width to generate.
     *
     * @var int
     */
    protected $width;

    /**
     * Height of image.
     *
     * @var int
     */
    protected $height;

    /**
     * Device pixel ratio to generate with.
     *
     * @var int
     */
    protected $dpr;

    /**
     * How to fill the image.
     *
     * @var string
     */
    protected $fill;

    /**
     * Quality of image.
     *
     * @var string
     */
    protected $quality;

    /**
     * Level of compression.
     *
     * @var string
     */
    protected $compression;

    /**
     * {@inheritdoc}
     *
     * @param SymfonyRequest $request
     *
     * @return $this
     */
    public static function fromRequest(SymfonyRequest $request)
    {
        $imageRequest = new self();
        $imageParams = array_keys(get_object_vars($imageRequest));
        foreach ($imageParams as $imageParam) {
            $imageRequest->{$imageParam} = $request->get($imageParam, null);
        }

        return $imageRequest;
    }

    /**
     * @param string $uri
     */
    public function setUri($uri)
    {
        $this->uri = $uri;
    }

    /**
     * {@inheritdoc}
     *
     * @param string $format
     *
     * @return bool
     */
    public function supports($format)
    {
        // For now always return true.
        return true;
    }

    /**
     * Magical getter!
     *
     * @param string $value
     *
     * @return mixed
     */
    public function __get($value)
    {
        return $this->{$value};
    }
}
