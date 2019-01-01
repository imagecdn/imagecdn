<?php

namespace AppBundle\Controller;

use Sensio\Bundle\FrameworkExtraBundle\Configuration\Route;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use DateTime;

class HealthController extends Controller
{
    /**
     * @Route("/v1/health", name="health")
     */
    public function imageAction()
    {
        $date = new DateTime();

        $response = new Response("OK: {$date->format(DateTime::ISO8601)}");
        $response->setPrivate();
        $response->setMaxAge(0);
        $response->setVary('Accept-Encoding');

        return $response;
    }
}
