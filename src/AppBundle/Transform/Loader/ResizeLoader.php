<?php

namespace AppBundle\Transform\Loader;

use AppBundle\Http\RequestInterface;

class ResizeLoader implements TransformInterface
{
    /**
     * Whether or not this loader can be applied to this Request.
     *
     * @param RequestInterface $request
     *
     * @return bool
     */
    public function supports(RequestInterface $request)
    {
        return !is_null($request->width) || !is_null($request->height);
    }

    /**
     * Applies transformation logic to a Request.
     *
     * @param RequestInterface $request
     *
     * @return array
     */
    public function transform(RequestInterface $request)
    {
        return [
            'filters' => $this->generateFiltersFromRequest($request)
        ];
    }

    /**
     * Generates a list of filters from a given Request.
     *
     * @param  RequestInterface $request Current Request.
     *
     * @return array
     */
    protected function generateFiltersFromRequest(RequestInterface $request)
    {
        /**
         * Cover   (default)  - Fit image within both dimensions specified in request
         * Contain / Scale-up - Image scaled as large as possible within dimensions specified in request.
         * Scale-Down / Inset - Image scaled as small as possible within dimensions specified in request
         * Stretch            - Image will be "stretched" to meet output format exactly.
         */

        switch (strtolower($request->fill)) {
            case 'outbound':
            case 'contain':
            case 'scale-up':
                return $this->generateOutboundFilter($request);
                break;

            case 'inset':
            case 'scale-down':
                return $this->generateInsetFilter($request);
                break;

            case 'stretch':
            case 'resize':
                return $this->generateStretchFilter($request);
                break;

            case 'cover':
            default:
                return $this->generateCoverFilter($request);
                break;
        }
    }

    protected function generateInsetFilter(RequestInterface $request)
    {
        return [
            'thumbnail' => [
                'mode' => 'inset',
                'size' => [$request->width, $request->height],
            ]
        ];
    }

    protected function generateCoverFilter(RequestInterface $request)
    {
        return $this->generateOutboundFilter($request);
    }

    protected function generateOutboundFilter(RequestInterface $request)
    {
        return [
            'thumbnail' => [
                'size' => [$request->width, $request->height],
            ]
        ];
    }

    protected function generateStretchFilter(RequestInterface $request)
    {
        return [
            'resize' => [
                'size' => [$request->width, $request->height],
            ]
        ];
    }
}
