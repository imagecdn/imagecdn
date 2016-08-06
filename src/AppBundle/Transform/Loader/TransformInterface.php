<?php

namespace AppBundle\Transform\Loader;

use AppBundle\Http\RequestInterface;

interface TransformInterface
{
    /**
     * Whether or not this loader can be applied to this Request.
     *
     * @param RequestInterface $request
     *
     * @return bool
     */
    public function supports(RequestInterface $request);

    /**
     * Applies transformation logic to a Request.
     *
     * @param RequestInterface $request
     *
     * @return mixed
     */
    public function transform(RequestInterface $request);
}
