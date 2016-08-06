<?php

namespace AppBundle\Transform;

use AppBundle\Http\RequestInterface;
use AppBundle\Transform\Loader\TransformInterface;
use Liip\ImagineBundle\Binary\BinaryInterface;
use Liip\ImagineBundle\Imagine\Filter\FilterConfiguration;

class TransformLoader
{
    /**
     * @var TransformInterface[]
     */
    private $transforms;

    /**
     * @var FilterConfiguration
     */
    private $filterConfiguration;

    /**
     * Constructor.
     *
     * @param FilterConfiguration $liipImagineFilterConfiguration liip_imagine.filter.configuration
     *
     * @return void
     */
    public function __construct(
        FilterConfiguration $liipImagineFilterConfiguration,
        FilterManager $liipImagineFilterManager,
        DataManager $liipImagineDataManager
    ) {
        $this->filterConfiguration = $liipImagineFilterConfiguration;
        $this->filterManager = $liipImagineFilterManager;
        $this->dataManager = $liipImagineDataManager;
    }

    /**
     * Adds a transform, used as a service call.
     *
     * @param TransformInterface $transform
     */
    public function addTransform(TransformInterface $transform)
    {
        $this->transforms[] = $transform;
    }

    /**
     * Applies any compatible transforms to this Request and returns a BinaryInterface.
     *
     * @param RequestInterface $request
     *
     * @return BinaryInterface BinaryInterface with compatible Transforms applied.
     */
    public function transform(RequestInterface $request)
    {
        $applicableTransforms = array_filter(
            $this->transforms,
            function ($transform) use ($request) {
                return $transform->supports($request);
            }
        );

        $transformConfig = array_map(function ($transform) use ($request) {
            return $transform->transform($request);
        }, $applicableTransforms);

        $transformConfig[] = [
            'data_loader'     => 'stream_loader',
            'post_processors' => [
                'mozjpeg' => [
                    'qual' => 80,
                ],
                'pngquant' => [],
            ],
        ];

        $this->filterConfiguration->set(
            'responsive_image',
            call_user_func_array('array_replace_recursive', $transformConfig)
        );
    }
}
