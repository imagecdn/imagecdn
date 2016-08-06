<?php

namespace AppBundle\Http;

use Symfony\Component\HttpFoundation\Request as SymfonyRequest;

interface RequestInterface
{
    /**
     * Returns an instance of this Request, from a Symfony request.
     *
     * @param SymfonyRequest $request Current Symfony request.
     *
     * @return $this
     */
    public static function fromRequest(SymfonyRequest $request);

    /**
     * Determines whether or not this Request is supported.
     *
     * @param string $type
     *
     * @return bool
     */
    public function supports($type);
}
