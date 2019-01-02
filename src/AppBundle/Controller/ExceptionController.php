<?php

namespace AppBundle\Controller;

use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Log\DebugLoggerInterface;
use Symfony\Component\Debug\Exception\FlattenException;
use Symfony\Bundle\TwigBundle\Controller\ExceptionController as BaseExceptionController;
use Twig_Environment;

class ExceptionController extends BaseExceptionController
{
    /**
     * @param Environment $twig
     * @param bool        $debug Show error (false) or exception (true) pages by default
     */
    public function __construct(Twig_Environment $twig, $debug)
    {
        parent::__construct($twig, $debug);
    }

    /**
     * {@inheritDoc}
     */
    public function showAction(Request $request, FlattenException $exception, DebugLoggerInterface $logger = null)
    {
        $showException = $request->attributes->get('showException', $this->debug);
        if ($showException) {
            return parent::showAction($request, $exception, $logger);
        }

        $code = $exception->getStatusCode();

        $response = new JsonResponse();
        $response->setData((Object)[
            'errorCode' => $code,
            'message' => $exception->getMessage()
        ]);
        $response->setStatusCode($code);

        return $response;
    }
}
