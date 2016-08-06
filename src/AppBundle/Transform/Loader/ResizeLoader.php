<?php

namespace AppBundle\Transform\Loader;

use AppBundle\Http\RequestInterface;

class ResizeLoader implements TransformInterface
{
    /**
     * Whether or not this loader can be applied to this Request.
     *
     * @param  RequestInterface $request
     *
     * @return boolean
     */
    public function supports(RequestInterface $request)
    {
        return (!is_null($request->width) || !is_null($request->height));
    }

    /**
     * Applies transformation logic to a Request.
     *
     * @param  RequestInterface $request
     *
     * @return mixed
     */
    public function transform(RequestInterface $request)
    {
        return [
            'filters'     => [
                'thumbnail' => [
                    'size' => [$request->height, $request->width],
                ],
            ]
        ];
    }
}
